import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subject, Observable, filter, map } from 'rxjs';
import {
  SolitaireMatch, SolitaireMatchDocument, PlayerProgress,
} from './schemas/solitaire-match.schema';
import { DealSeedsService } from '../deal-seeds/deal-seeds.service';
import * as Klondike from '../deal-seeds/engines/klondikeEngine';
import * as Spider from '../deal-seeds/engines/spiderEngine';
import * as Yukon from '../deal-seeds/engines/yukonEngine';
import * as FreeCell from '../deal-seeds/engines/freecellEngine';
import * as Golf from '../deal-seeds/engines/golfEngine';
import * as Pyramid from '../deal-seeds/engines/pyramidEngine';
import * as TriPeaks from '../deal-seeds/engines/tripeaksEngine';
import * as FortyThieves from '../deal-seeds/engines/fortyThievesEngine';
import * as Accordion from '../deal-seeds/engines/accordionEngine';

/** Mappe variant → engine porté pour anti-cheat. */
function engineFor(variant: string): { gameReducer: (s: any, a: any) => any } | null {
  if (variant.startsWith('klondike')) return Klondike;
  if (variant.startsWith('spider')) return Spider;
  if (variant === 'yukon') return Yukon;
  if (variant === 'freecell') return FreeCell;
  if (variant === 'golf') return Golf;
  if (variant === 'pyramid') return Pyramid;
  if (variant === 'tripeaks') return TriPeaks;
  if (variant === 'forty-thieves') return FortyThieves;
  if (variant === 'accordion') return Accordion;
  return null;
}

function genCode(): string {
  // Code court 6 caractères, lettres + chiffres
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += A[Math.floor(Math.random() * A.length)];
  return s;
}

@Injectable()
export class SolitaireMatchesService {
  private readonly logger = new Logger(SolitaireMatchesService.name);

  /** Bus d'événements pour le streaming SSE — push des updates de match. */
  private readonly events$ = new Subject<{ code: string; match: SolitaireMatch }>();

  constructor(
    @InjectModel(SolitaireMatch.name) private matchModel: Model<SolitaireMatchDocument>,
    private readonly dealSeedsService: DealSeedsService,
  ) {}

  /**
   * Stream SSE pour un code de match donné. Émet à chaque updateProgress /
   * join / win, depuis ce serveur. Les clients web utilisent EventSource ;
   * les clients mobile peuvent utiliser fetch streaming (ou polling 500ms).
   */
  streamMatch(code: string): Observable<{ data: SolitaireMatch }> {
    return this.events$.pipe(
      filter((e) => e.code === code),
      map((e) => ({ data: e.match })),
    );
  }

  private emit(code: string, match: SolitaireMatch) {
    this.events$.next({ code, match });
  }

  /** Crée une nouvelle partie en attente d'un 2nd joueur. */
  async create(opts: {
    variant: string;
    difficulty?: string;
    hostUserId: string;
    hostDisplayName: string;
  }): Promise<SolitaireMatch> {
    // Récupère un deal BD pour la variante (sinon error)
    const seed = await this.dealSeedsService.getRandomSeed(opts.variant, opts.difficulty);
    if (!seed) {
      throw new BadRequestException(`Aucun deal disponible pour ${opts.variant}`);
    }

    // Génère un code unique
    let code = genCode();
    for (let tries = 0; tries < 10; tries++) {
      const exists = await this.matchModel.exists({ code });
      if (!exists) break;
      code = genCode();
    }

    const host: PlayerProgress = {
      userId: opts.hostUserId,
      displayName: opts.hostDisplayName,
      score: 0,
      moves: 0,
      finished: false,
      finishedAt: null,
      joinedAt: Date.now(),
    };
    const doc = new this.matchModel({
      code,
      variant: opts.variant,
      difficulty: opts.difficulty ?? 'medium',
      initialState: seed.initialState,
      dealHash: seed.dealHash,
      status: 'waiting',
      players: [host],
    });
    await doc.save();
    this.logger.log(`🎮 Match créé : ${code} (${opts.variant}) par ${opts.hostDisplayName}`);
    return doc.toObject();
  }

  /** Rejoint une partie existante via son code. */
  async join(code: string, userId: string, displayName: string): Promise<SolitaireMatch> {
    const m = await this.matchModel.findOne({ code }).exec();
    if (!m) throw new NotFoundException(`Match ${code} introuvable`);
    if (m.status !== 'waiting') {
      throw new BadRequestException(`Match ${code} n'accepte plus de joueur (status=${m.status})`);
    }
    if (m.players.length >= 2) {
      throw new BadRequestException(`Match ${code} déjà plein`);
    }
    if (m.players.some((p) => p.userId === userId)) {
      // Déjà rejoint, idempotent
      return m.toObject();
    }
    m.players.push({
      userId, displayName,
      score: 0, moves: 0,
      finished: false, finishedAt: null,
      joinedAt: Date.now(),
    });
    m.status = 'playing';
    m.startedAt = Date.now();
    await m.save();
    this.logger.log(`🎮 Match ${code} : ${displayName} a rejoint → playing`);
    const obj = m.toObject();
    this.emit(code, obj);
    return obj;
  }

  /**
   * Met à jour la progression d'un joueur (score / moves / finished).
   *
   * Anti-cheat (sanity checks) :
   *  - moves et score ne peuvent qu'augmenter (sauf score décroissant pour
   *    Golf/Pyramid qui ont une logique inverse — tolérance >= 0)
   *  - finished=true requiert un score positif et au moins 1 coup
   *  - si `actions` fourni, on rejoue via gameReducer pour valider
   *    que le score/moves rapportés correspondent à la simulation.
   */
  async updateProgress(code: string, userId: string, p: {
    score: number; moves: number; finished?: boolean; actions?: any[];
  }): Promise<SolitaireMatch> {
    const m = await this.matchModel.findOne({ code }).exec();
    if (!m) throw new NotFoundException(`Match ${code} introuvable`);
    const player = m.players.find((x) => x.userId === userId);
    if (!player) throw new BadRequestException(`Joueur ${userId} pas dans le match`);

    // === SANITY CHECKS ===
    if (typeof p.score !== 'number' || typeof p.moves !== 'number') {
      throw new BadRequestException(`Payload invalide : score/moves requis`);
    }
    if (p.moves < player.moves) {
      throw new BadRequestException(`Anti-cheat : moves ne peut pas décroître (${p.moves} < ${player.moves})`);
    }
    if (p.finished && p.moves <= 0) {
      throw new BadRequestException(`Anti-cheat : impossible de finir avec ${p.moves} coups`);
    }

    // === HARD CHECK (si actions fournis) : re-simulation ===
    if (Array.isArray(p.actions) && p.actions.length > 0) {
      const engine = engineFor(m.variant);
      if (engine) {
        try {
          let s: any = m.initialState;
          for (const a of p.actions) {
            s = engine.gameReducer(s, a);
          }
          // Vérifie cohérence
          const simMoves = s?.moves ?? 0;
          const simScore = s?.score ?? 0;
          if (simMoves !== p.moves) {
            this.logger.warn(`Anti-cheat ${code}/${userId} : moves mismatch (rapporté ${p.moves} vs simulé ${simMoves})`);
            throw new BadRequestException(`Anti-cheat : séquence d'actions ne reproduit pas le score`);
          }
          if (Math.abs(simScore - p.score) > 1) {
            this.logger.warn(`Anti-cheat ${code}/${userId} : score mismatch (rapporté ${p.score} vs simulé ${simScore})`);
            throw new BadRequestException(`Anti-cheat : score incohérent avec la simulation`);
          }
        } catch (err: any) {
          if (err instanceof BadRequestException) throw err;
          this.logger.warn(`Anti-cheat ${code}/${userId} : simulation a planté (${err?.message ?? err}) — rejet`);
          throw new BadRequestException(`Anti-cheat : simulation invalide`);
        }
      }
    }

    player.score = p.score;
    player.moves = p.moves;
    if (p.finished && !player.finished) {
      player.finished = true;
      player.finishedAt = Date.now();
      // Premier à finir = gagnant
      if (m.status === 'playing' && !m.winnerId) {
        m.winnerId = userId;
        m.status = 'finished';
        m.finishedAt = Date.now();
        this.logger.log(`🏆 Match ${code} : ${player.displayName} a gagné !`);
      }
    }
    m.markModified('players');
    await m.save();
    const obj = m.toObject();
    this.emit(code, obj);
    return obj;
  }

  /** Récupère un match par code. */
  async getByCode(code: string): Promise<SolitaireMatch> {
    const m = await this.matchModel.findOne({ code }).lean().exec();
    if (!m) throw new NotFoundException(`Match ${code} introuvable`);
    return m;
  }

  /** Liste les matches en attente pour la variante (Quick Match). */
  async listWaiting(variant?: string, limit = 10): Promise<SolitaireMatch[]> {
    const filter: any = { status: 'waiting' };
    if (variant) filter.variant = variant;
    return this.matchModel.find(filter).sort({ createdAt: -1 }).limit(limit).lean().exec();
  }

  /** Quick Match : trouve une partie en attente OU en crée une nouvelle. */
  async quickMatch(opts: {
    variant: string; difficulty?: string;
    hostUserId: string; hostDisplayName: string;
  }): Promise<SolitaireMatch> {
    // Cherche un match en attente compatible (même variante, créé < 60s)
    const cutoff = new Date(Date.now() - 60_000);
    const existing = await this.matchModel.findOne({
      status: 'waiting',
      variant: opts.variant,
      createdAt: { $gt: cutoff },
    }).sort({ createdAt: 1 }).exec();

    if (existing) {
      // S'assure qu'on n'est pas l'host
      if (existing.players.length === 0 || existing.players[0].userId !== opts.hostUserId) {
        return this.join(existing.code, opts.hostUserId, opts.hostDisplayName);
      }
    }
    // Sinon crée un nouveau match
    return this.create(opts);
  }
}
