import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tournament, TournamentDocument, TournamentEntry } from './schemas/tournament.schema';
import { DealSeedsService } from '../deal-seeds/deal-seeds.service';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_WEEK_MS = 7 * ONE_DAY_MS;

function startOfDayUTC(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function isoWeek(d = new Date()): { year: number; week: number } {
  // Algorithme ISO 8601 (semaine commence lundi)
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  const week = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  return { year: d.getFullYear(), week };
}

@Injectable()
export class TournamentsService {
  private readonly logger = new Logger(TournamentsService.name);

  /** Paliers de prix par défaut (en gold virtuel). */
  private readonly DEFAULT_PRIZES = [
    { rank: 1, gold: 500 },
    { rank: 2, gold: 250 },
    { rank: 3, gold: 100 },
  ];

  constructor(
    @InjectModel(Tournament.name) private tournamentModel: Model<TournamentDocument>,
    private readonly dealSeedsService: DealSeedsService,
  ) {}

  /** Crée le tournoi du jour pour une variante (ou retourne s'il existe). */
  async getOrCreateDaily(variant: string): Promise<Tournament> {
    const day = startOfDayUTC();
    const code = `DAILY-${day.toISOString().slice(0, 10)}-${variant}`;

    const existing = await this.tournamentModel.findOne({ code }).lean().exec();
    if (existing) return existing;

    const seed = await this.dealSeedsService.getRandomSeed(variant);
    if (!seed) {
      throw new BadRequestException(`Aucun seed disponible pour ${variant}`);
    }

    const startsAt = day.getTime();
    const endsAt = startsAt + ONE_DAY_MS;
    const doc = new this.tournamentModel({
      code,
      type: 'daily',
      variant,
      difficulty: 'medium',
      initialState: seed.initialState,
      dealHash: seed.dealHash,
      entries: [],
      prizes: this.DEFAULT_PRIZES,
      status: 'open',
      startsAt,
      endsAt,
    });
    await doc.save();
    this.logger.log(`🏆 Daily tournament créé : ${code}`);
    return doc.toObject();
  }

  /** Crée le tournoi de la semaine pour une variante. */
  async getOrCreateWeekly(variant: string): Promise<Tournament> {
    const now = new Date();
    const w = isoWeek(now);
    const code = `WEEKLY-${w.year}-W${String(w.week).padStart(2, '0')}-${variant}`;

    const existing = await this.tournamentModel.findOne({ code }).lean().exec();
    if (existing) return existing;

    const seed = await this.dealSeedsService.getRandomSeed(variant);
    if (!seed) throw new BadRequestException(`Aucun seed disponible pour ${variant}`);

    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() - ((now.getUTCDay() + 6) % 7));
    monday.setUTCHours(0, 0, 0, 0);
    const startsAt = monday.getTime();
    const endsAt = startsAt + ONE_WEEK_MS;

    const doc = new this.tournamentModel({
      code,
      type: 'weekly',
      variant,
      difficulty: 'medium',
      initialState: seed.initialState,
      dealHash: seed.dealHash,
      entries: [],
      prizes: [
        { rank: 1, gold: 2000 },
        { rank: 2, gold: 1000 },
        { rank: 3, gold: 500 },
        { rank: 4, gold: 250 },
        { rank: 5, gold: 250 },
      ],
      status: 'open',
      startsAt,
      endsAt,
    });
    await doc.save();
    this.logger.log(`🏆 Weekly tournament créé : ${code}`);
    return doc.toObject();
  }

  /** Soumet un score à un tournoi (best of attempts). */
  async submitScore(code: string, userId: string, displayName: string, p: {
    score: number; moves: number; durationMs: number;
  }): Promise<Tournament> {
    const t = await this.tournamentModel.findOne({ code }).exec();
    if (!t) throw new NotFoundException(`Tournament ${code} introuvable`);
    if (t.status === 'closed') throw new BadRequestException('Tournoi terminé');
    if (Date.now() > t.endsAt) {
      t.status = 'closed';
      await t.save();
      throw new BadRequestException('Fenêtre fermée');
    }

    let entry = t.entries.find((e) => e.userId === userId);
    if (!entry) {
      entry = {
        userId, displayName,
        bestScore: p.score,
        bestMoves: p.moves,
        bestDurationMs: p.durationMs,
        attempts: 1,
        joinedAt: Date.now(),
      };
      t.entries.push(entry);
    } else {
      entry.attempts++;
      // Best score (max), best time (min), best moves (min)
      if (p.score > entry.bestScore) entry.bestScore = p.score;
      if (p.moves < entry.bestMoves || entry.bestMoves === 0) entry.bestMoves = p.moves;
      if (p.durationMs < entry.bestDurationMs || entry.bestDurationMs === 0) entry.bestDurationMs = p.durationMs;
    }
    t.markModified('entries');
    if (t.status === 'open') t.status = 'running';
    await t.save();
    return t.toObject();
  }

  /** Inscrit un joueur à un tournoi (entry sans score initial). Idempotent. */
  async join(code: string, userId: string, displayName: string): Promise<Tournament> {
    const t = await this.tournamentModel.findOne({ code }).exec();
    if (!t) throw new NotFoundException(`Tournament ${code} introuvable`);
    if (t.status === 'closed') throw new BadRequestException('Tournoi terminé');
    const already = t.entries.find((e) => e.userId === userId);
    if (!already) {
      t.entries.push({
        userId, displayName,
        bestScore: 0, bestMoves: 0, bestDurationMs: 0,
        attempts: 0, joinedAt: Date.now(),
      });
      t.markModified('entries');
      await t.save();
      this.logger.log(`➕ ${displayName} a rejoint le tournoi ${code}`);
    }
    return t.toObject();
  }

  /** Liste les tournois actifs (status open ou running, endsAt > now). */
  async listActive(): Promise<Tournament[]> {
    const now = Date.now();
    return this.tournamentModel.find({
      status: { $in: ['open', 'running'] },
      endsAt: { $gt: now },
    }).sort({ endsAt: 1 }).lean().exec();
  }

  /** Récupère un tournoi par code (avec entries triées par score). */
  async getByCode(code: string): Promise<Tournament & { ranking: TournamentEntry[] }> {
    const t = await this.tournamentModel.findOne({ code }).lean().exec();
    if (!t) throw new NotFoundException(`Tournament ${code} introuvable`);
    const ranking = [...(t.entries ?? [])].sort((a, b) => {
      if (b.bestScore !== a.bestScore) return b.bestScore - a.bestScore;
      if (a.bestDurationMs !== b.bestDurationMs) return a.bestDurationMs - b.bestDurationMs;
      return a.bestMoves - b.bestMoves;
    });
    return { ...t, ranking };
  }

  /** Ferme un tournoi (cron ou manuel) et distribue les prizes virtuels. */
  async closeTournament(code: string): Promise<Tournament> {
    const t = await this.tournamentModel.findOne({ code }).exec();
    if (!t) throw new NotFoundException(`Tournament ${code} introuvable`);
    if (t.status === 'closed') return t.toObject();

    t.status = 'closed';
    await t.save();

    // Distribue gold virtuel : on log juste, l'intégration shop est externe.
    const ranking = [...(t.entries ?? [])].sort((a, b) =>
      b.bestScore - a.bestScore || a.bestDurationMs - b.bestDurationMs || a.bestMoves - b.bestMoves
    );
    for (const prize of t.prizes) {
      const winner = ranking[prize.rank - 1];
      if (winner) {
        this.logger.log(`🎁 ${code} rank ${prize.rank} → ${winner.displayName} : ${prize.gold} gold`);
      }
    }
    return t.toObject();
  }
}
