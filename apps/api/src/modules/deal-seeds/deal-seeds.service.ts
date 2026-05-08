import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DealSeed, DealSeedDocument, SolitaireVariant } from './schemas/deal-seed.schema';
import { SeedHistoryEntry, SeedHistoryDocument } from './schemas/seed-history.schema';
import { SpiderDealV2, SpiderDealV2Document } from './schemas/spider-deal-v2.schema';
import { generateDealForVariant } from './deal-generators';

@Injectable()
export class DealSeedsService implements OnModuleInit {
  private readonly logger = new Logger(DealSeedsService.name);
  // Target par variante. On vise 300 (100/difficulté) pour TOUTES les variantes,
  // y compris Spider (génération lente ~5s/deal mais c'est ce que l'utilisateur a demandé).
  // Le seeding tourne en arrière-plan, donc même 30 min de seed Spider ne bloque pas l'API.
  private readonly TARGET_PER_VARIANT = 300;
  private readonly TARGET_SPIDER = 300;

  /** État de la génération en arrière-plan (pour endpoint /seeding-status). */
  private seedingState: {
    status: 'idle' | 'running' | 'done' | 'error';
    startedAt: number | null;
    finishedAt: number | null;
    progress: { variant: string; inserted: number; target: number; done: boolean }[];
    totalGenerated: number;
    error: string | null;
  } = {
    status: 'idle',
    startedAt: null,
    finishedAt: null,
    progress: [],
    totalGenerated: 0,
    error: null,
  };

  /** Interval ID pour les snapshots horaires (cleared dans onModuleDestroy si besoin). */
  private historyTimer: NodeJS.Timeout | null = null;

  constructor(
    @InjectModel(DealSeed.name) private dealSeedModel: Model<DealSeedDocument>,
    @InjectModel(SeedHistoryEntry.name) private historyModel: Model<SeedHistoryDocument>,
    @InjectModel(SpiderDealV2.name) private spiderDealV2Model: Model<SpiderDealV2Document>,
  ) {}

  /**
   * Au démarrage du module : déclenche la génération de seeds en
   * ARRIÈRE-PLAN (pas d'await, l'API démarre immédiatement).
   * Le statut est consultable via getSeedingStatus().
   */
  async onModuleInit() {
    this.logger.log('🃏 Démarrage de la génération de seeds en arrière-plan…');
    // Détache la promesse — l'API démarre tout de suite.
    setImmediate(() => {
      this.runBackgroundSeeding().catch((err) => {
        this.seedingState.status = 'error';
        this.seedingState.error = String(err?.message ?? err);
        this.seedingState.finishedAt = Date.now();
        this.logger.error(`❌ Background seeding crashed: ${err?.message ?? err}`);
      });
    });
  }

  /** Boucle de génération en arrière-plan (variant par variant). */
  private async runBackgroundSeeding(): Promise<void> {
    const t0 = Date.now();
    this.seedingState.status = 'running';
    this.seedingState.startedAt = t0;
    this.seedingState.progress = [];
    this.seedingState.totalGenerated = 0;
    this.seedingState.error = null;
    this.seedingState.finishedAt = null;

    this.logger.log('  ↻ Background seeding démarré');
    for (const variant of Object.values(SolitaireVariant)) {
      const count = await this.dealSeedModel.countDocuments({ variant }).exec();
      // Target spécifique par variante : Spider est lent → 100 max
      const isSpider = variant.startsWith('spider-');
      const target = isSpider ? this.TARGET_SPIDER : this.TARGET_PER_VARIANT;
      const entry = { variant, inserted: 0, target, done: false };
      this.seedingState.progress.push(entry);

      if (count >= target) {
        this.logger.log(`  → ${variant}: ${count}/${target} ✓ (déjà rempli)`);
        entry.inserted = count;
        entry.done = true;
        continue;
      }
      const missing = target - count;
      this.logger.log(`  → ${variant}: ${count}/${target} → génération de ${missing}…`);
      const inserted = await this.seedVariant(variant, missing, (n) => { entry.inserted = n; });
      entry.inserted = count + inserted;
      entry.done = true;
      this.seedingState.totalGenerated += inserted;

      // Yield a microtask pour ne pas bloquer event loop
      await new Promise((r) => setImmediate(r));
    }

    const stats = await this.getStats();
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    this.seedingState.status = 'done';
    this.seedingState.finishedAt = Date.now();
    this.logger.log(`✅ Background seeding terminé en ${elapsed}s — ${stats.grandTotal} seeds, ${stats.grandWithSolution} avec solution (${this.seedingState.totalGenerated} générés)`);
    for (const variant of Object.keys(stats.total)) {
      this.logger.log(`     ${variant}: ${stats.total[variant]} seeds — ${stats.coverage[variant]}% avec solution`);
    }

    // Enregistre un snapshot d'historique au démarrage
    await this.recordHistorySnapshot('startup');
    // Programme un snapshot horaire (3600s). `.unref()` pour ne pas bloquer
    // l'event loop si Node veut s'arrêter (process.exit / Jest teardown).
    if (!this.historyTimer) {
      this.historyTimer = setInterval(
        () => this.recordHistorySnapshot('periodic').catch((e) => this.logger.warn(`history snapshot fail: ${e}`)),
        60 * 60 * 1000,
      );
      this.historyTimer.unref?.();
    }
  }

  /** Statut de la génération en arrière-plan. */
  getSeedingStatus() {
    return { ...this.seedingState };
  }

  /** Enregistre un snapshot des stats actuelles dans l'historique. */
  async recordHistorySnapshot(source: string = 'periodic'): Promise<SeedHistoryEntry> {
    const stats = await this.getStats();
    const doc = new this.historyModel({
      timestamp: new Date(),
      grandTotal: stats.grandTotal,
      grandWithSolution: stats.grandWithSolution,
      perVariant: stats.total,
      source,
    });
    await doc.save();
    return doc.toObject();
  }

  /**
   * Retourne les N derniers snapshots d'historique (du plus récent au plus
   * ancien). N max = 500 pour éviter d'envoyer un payload énorme.
   */
  async getHistory(limit: number = 100): Promise<SeedHistoryEntry[]> {
    const cap = Math.min(Math.max(1, limit), 500);
    return this.historyModel.find({}).sort({ timestamp: -1 }).limit(cap).lean().exec();
  }

  /**
   * Daily Challenge : retourne un seed déterministe selon la DATE (UTC).
   * Le même jour, tout le monde reçoit le même deal pour une variante donnée.
   *
   * Algorithme : hash(YYYY-MM-DD + variant) → seedIndex modulo total.
   */
  async getDailyChallenge(variant: string, date?: Date): Promise<DealSeed | null> {
    const d = date ?? new Date();
    const dateKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    const total = await this.dealSeedModel.countDocuments({ variant }).exec();
    if (total === 0) return null;

    // Hash simple : somme des codepoints
    let hash = 0;
    const key = `${dateKey}-${variant}`;
    for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
    const skip = Math.abs(hash) % total;

    return this.dealSeedModel.findOne({ variant }).skip(skip).lean().exec();
  }

  /** Génère et insère N donnes pour une variante donnée. */
  async seedVariant(
    variant: string,
    count: number,
    onProgress?: (n: number) => void,
  ): Promise<number> {
    const t0 = Date.now();
    let inserted = 0;
    let attempts = 0;
    let duplicates = 0;
    const startIdx = await this.dealSeedModel.countDocuments({ variant }).exec();
    while (inserted < count && attempts < count * 3) {
      attempts++;
      try {
        const deal = generateDealForVariant(variant);
        if (!deal) continue;
        const doc = new this.dealSeedModel({
          variant,
          seedIndex: startIdx + inserted,
          initialState: deal.initialState,
          solution: deal.solution,
          difficulty: deal.difficulty,
          dealHash: deal.dealHash,
          metadata: deal.metadata ?? {},
        });
        await doc.save();
        inserted++;
        onProgress?.(inserted);
        // Log de progression tous les 25 inserts
        if (inserted % 25 === 0) {
          const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
          this.logger.log(`     ${variant}: ${inserted}/${count} (${elapsed}s)`);
          // Yield event loop pour ne pas bloquer requêtes API
          await new Promise((r) => setImmediate(r));
        }
      } catch (err: any) {
        if (err?.code === 11000) {
          duplicates++;
        } else {
          this.logger.warn(`Seed ${variant} attempt ${attempts}: ${err?.message ?? err}`);
        }
      }
    }
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    this.logger.log(`  ✓ ${variant}: ${inserted} insérés en ${elapsed}s (${attempts} tentatives, ${duplicates} doublons hash)`);
    return inserted;
  }

  /** Retourne un seed aléatoire pour une variante. */
  async getRandomSeed(variant: string, difficulty?: string): Promise<DealSeed | null> {
    const filter: any = { variant };
    if (difficulty) filter.difficulty = difficulty;
    const count = await this.dealSeedModel.countDocuments(filter).exec();
    if (count === 0) return null;
    const skip = Math.floor(Math.random() * count);
    return this.dealSeedModel.findOne(filter).skip(skip).lean().exec();
  }

  /** Retourne N seeds aléatoires pour une variante. */
  async listSeeds(variant: string, limit = 10): Promise<DealSeed[]> {
    return this.dealSeedModel
      .aggregate([
        { $match: { variant } },
        { $sample: { size: Math.min(limit, 100) } },
      ])
      .exec() as any;
  }

  /** Stats : count par variante (total + dont solution non-vide). */
  async getStats(): Promise<{
    total: Record<string, number>;
    withSolution: Record<string, number>;
    coverage: Record<string, number>;
    grandTotal: number;
    grandWithSolution: number;
  }> {
    const totalDocs = await this.dealSeedModel.aggregate([
      { $group: { _id: '$variant', count: { $sum: 1 } } },
    ]).exec();
    const solDocs = await this.dealSeedModel.aggregate([
      { $match: { 'solution.0': { $exists: true } } },
      { $group: { _id: '$variant', count: { $sum: 1 } } },
    ]).exec();

    const total: Record<string, number> = {};
    const withSolution: Record<string, number> = {};
    const coverage: Record<string, number> = {};
    for (const d of totalDocs) total[d._id] = d.count;
    for (const d of solDocs) withSolution[d._id] = d.count;
    let grandTotal = 0;
    let grandWithSolution = 0;
    for (const variant of Object.keys(total)) {
      const t = total[variant] ?? 0;
      const ws = withSolution[variant] ?? 0;
      coverage[variant] = t === 0 ? 0 : Math.round((ws / t) * 1000) / 10; // %
      grandTotal += t;
      grandWithSolution += ws;
    }
    return { total, withSolution, coverage, grandTotal, grandWithSolution };
  }

  /**
   * Soumet un seed depuis un client (mobile peut populariser la BD).
   *
   * Upsert intelligent : si le dealHash existe déjà mais avec une solution
   * vide ou plus courte que celle soumise, met à jour la solution. Sinon,
   * retourne `{ duplicate: true }`.
   */
  async submitSeed(payload: {
    variant: string;
    initialState: any;
    solution: any[];
    difficulty: string;
    dealHash: string;
    metadata?: any;
  }): Promise<DealSeed | { duplicate: true } | { updated: true }> {
    const existing = await this.dealSeedModel
      .findOne({ variant: payload.variant, dealHash: payload.dealHash })
      .exec();

    if (existing) {
      const oldLen = Array.isArray(existing.solution) ? existing.solution.length : 0;
      const newLen = Array.isArray(payload.solution) ? payload.solution.length : 0;
      if (newLen > 0 && (oldLen === 0 || newLen < oldLen)) {
        existing.solution = payload.solution;
        if (payload.metadata) existing.metadata = payload.metadata;
        await existing.save();
        this.logger.log(`  ↻ ${payload.variant} ${payload.dealHash}: solution maj (${oldLen} → ${newLen} coups)`);
        return { updated: true };
      }
      return { duplicate: true };
    }

    try {
      const startIdx = await this.dealSeedModel.countDocuments({ variant: payload.variant }).exec();
      const doc = new this.dealSeedModel({ ...payload, seedIndex: startIdx });
      await doc.save();
      return doc.toObject();
    } catch (err: any) {
      if (err?.code === 11000) return { duplicate: true };
      throw err;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SPIDER V2 — pré-générés (collection spider_deals_v2)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Importe en upsert un batch de deals Spider v2 (format JSON pré-généré).
   * Tolère les doublons : ré-import idempotent grâce au _id.
   */
  async importSpiderV2Deals(deals: any[]): Promise<{
    imported: number;
    upserted: number;
    modified: number;
    errors: number;
  }> {
    if (!Array.isArray(deals) || deals.length === 0) {
      return { imported: 0, upserted: 0, modified: 0, errors: 0 };
    }
    let upserted = 0;
    let modified = 0;
    let errors = 0;
    const ops: any[] = [];
    for (const d of deals) {
      if (!d?._id) { errors++; continue; }
      ops.push({
        updateOne: {
          filter: { _id: d._id },
          update: {
            $set: {
              variant: d.variant ?? 'unknown',
              difficulty: d.difficulty ?? 'medium',
              solvable: d.solvable !== false,
              total_turns: d.total_turns ?? (Array.isArray(d.turns) ? d.turns.length : 0),
              solution_length: d.solution_length ?? 0,
              turns: Array.isArray(d.turns) ? d.turns : [],
              imported_at: new Date(),
            },
          },
          upsert: true,
        },
      });
    }
    if (ops.length > 0) {
      try {
        const res: any = await this.spiderDealV2Model.bulkWrite(ops, { ordered: false });
        upserted = res?.upsertedCount ?? 0;
        modified = res?.modifiedCount ?? 0;
      } catch (err: any) {
        this.logger.warn(`spider-v2 import bulkWrite error: ${err?.message ?? err}`);
        errors++;
      }
    }
    this.logger.log(`📥 spider-v2 import : ${deals.length} deals reçus, ${upserted} upserted, ${modified} modifiés, ${errors} erreurs`);
    return { imported: deals.length, upserted, modified, errors };
  }

  /**
   * Retourne UN deal Spider v2 aléatoire.
   * Filtres optionnels :
   *   - variant : '1-suit' / '2-suit' / '4-suit'
   *   - difficulty : 'easy' / 'medium' / 'hard'
   */
  async getRandomSpiderV2(difficulty?: string, variant?: string): Promise<SpiderDealV2 | null> {
    const filter: any = {};
    if (difficulty) filter.difficulty = difficulty;
    if (variant) filter.variant = variant;
    const count = await this.spiderDealV2Model.countDocuments(filter).exec();
    if (count === 0) return null;
    const skip = Math.floor(Math.random() * count);
    return this.spiderDealV2Model.findOne(filter).skip(skip).lean().exec();
  }

  /** Liste N deals (uniquement _id + difficulty + variant) pour la sélection. */
  async listSpiderV2(
    difficulty?: string,
    limit = 10,
    variant?: string,
  ): Promise<Array<{ _id: string; variant: string; difficulty: string }>> {
    const filter: any = {};
    if (difficulty) filter.difficulty = difficulty;
    if (variant) filter.variant = variant;
    const cap = Math.min(Math.max(1, limit), 100);
    return this.spiderDealV2Model
      .find(filter, { _id: 1, variant: 1, difficulty: 1 })
      .limit(cap)
      .lean()
      .exec() as any;
  }

  /** Stats : compte des deals par variant × difficulty. */
  async statsSpiderV2(): Promise<Record<string, Record<string, number>>> {
    const rows = await this.spiderDealV2Model
      .aggregate([
        { $group: { _id: { variant: '$variant', difficulty: '$difficulty' }, count: { $sum: 1 } } },
      ])
      .exec();
    const out: Record<string, Record<string, number>> = {};
    for (const r of rows as any[]) {
      const v = r._id?.variant ?? 'unknown';
      const d = r._id?.difficulty ?? 'unknown';
      out[v] = out[v] ?? {};
      out[v][d] = r.count;
    }
    return out;
  }

  /** Retourne UN deal complet par son _id (avec tous les turns). */
  async getSpiderV2ById(dealId: string): Promise<SpiderDealV2 | null> {
    return this.spiderDealV2Model.findById(dealId).lean().exec();
  }
}
