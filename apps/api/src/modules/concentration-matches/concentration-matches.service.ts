import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subject, Observable, filter, map } from 'rxjs';
import {
  ConcentrationMatch, ConcentrationMatchDocument, ConcentrationPlayerProgress,
} from './schemas/concentration-match.schema';

const GRID_PAIRS: Record<string, number> = {
  '4x4': 8,
  '6x6': 18,
  '8x8': 32,
  '10x10': 50,
};

function genCode(): string {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += A[Math.floor(Math.random() * A.length)];
  return s;
}

/** Génère un layout déterministe : 2 fois chaque carte mélangé Fisher-Yates. */
function generateLayout(variant: string): string[] {
  const pairs = GRID_PAIRS[variant] ?? 8;
  const cards: string[] = [];
  for (let i = 1; i <= pairs; i++) {
    cards.push(`c${i}`, `c${i}`);
  }
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

@Injectable()
export class ConcentrationMatchesService {
  private readonly logger = new Logger(ConcentrationMatchesService.name);
  private readonly events$ = new Subject<{ code: string; match: ConcentrationMatch }>();

  constructor(
    @InjectModel(ConcentrationMatch.name) private matchModel: Model<ConcentrationMatchDocument>,
  ) {}

  streamMatch(code: string): Observable<{ data: ConcentrationMatch }> {
    return this.events$.pipe(
      filter((e) => e.code === code),
      map((e) => ({ data: e.match })),
    );
  }

  private emit(code: string, match: ConcentrationMatch) {
    this.events$.next({ code, match });
  }

  async create(opts: {
    variant: string;
    difficulty?: string;
    hostUserId: string;
    hostDisplayName: string;
  }): Promise<ConcentrationMatch> {
    const layout = generateLayout(opts.variant);
    if (layout.length === 0) {
      throw new BadRequestException(`Variante grille inconnue : ${opts.variant}`);
    }

    let code = genCode();
    for (let tries = 0; tries < 10; tries++) {
      const exists = await this.matchModel.exists({ code });
      if (!exists) break;
      code = genCode();
    }

    const host: ConcentrationPlayerProgress = {
      userId: opts.hostUserId,
      displayName: opts.hostDisplayName,
      pairsFound: 0,
      moves: 0,
      finished: false,
      finishedAt: null,
      joinedAt: Date.now(),
    };
    const doc = new this.matchModel({
      code,
      variant: opts.variant,
      difficulty: opts.difficulty ?? 'medium',
      cardLayout: layout,
      status: 'waiting',
      players: [host],
    });
    await doc.save();
    this.logger.log(`🎮 Concentration match créé : ${code} (${opts.variant}) par ${opts.hostDisplayName}`);
    return doc.toObject();
  }

  async join(code: string, userId: string, displayName: string): Promise<ConcentrationMatch> {
    const m = await this.matchModel.findOne({ code }).exec();
    if (!m) throw new NotFoundException(`Match ${code} introuvable`);
    if (m.status !== 'waiting') {
      throw new BadRequestException(`Match ${code} n'accepte plus de joueur (status=${m.status})`);
    }
    if (m.players.length >= 2) {
      throw new BadRequestException(`Match ${code} déjà plein`);
    }
    if (m.players.some((p) => p.userId === userId)) {
      return m.toObject();
    }
    m.players.push({
      userId, displayName,
      pairsFound: 0, moves: 0,
      finished: false, finishedAt: null,
      joinedAt: Date.now(),
    });
    m.status = 'playing';
    m.startedAt = Date.now();
    await m.save();
    this.logger.log(`🎮 Concentration match ${code} : ${displayName} a rejoint → playing`);
    const obj = m.toObject();
    this.emit(code, obj);
    return obj;
  }

  /**
   * Update progression : pairsFound et moves ne peuvent qu'augmenter.
   * Le premier qui finit toutes les paires de sa moitié gagne ; en mode "vitesse"
   * (totalPairs partagés), c'est le premier à atteindre totalPairs/2.
   */
  async updateProgress(code: string, userId: string, p: {
    pairsFound: number; moves: number; finished?: boolean;
  }): Promise<ConcentrationMatch> {
    const m = await this.matchModel.findOne({ code }).exec();
    if (!m) throw new NotFoundException(`Match ${code} introuvable`);
    const player = m.players.find((x) => x.userId === userId);
    if (!player) throw new BadRequestException(`Joueur ${userId} pas dans le match`);

    if (typeof p.pairsFound !== 'number' || typeof p.moves !== 'number') {
      throw new BadRequestException(`pairsFound et moves requis`);
    }
    if (p.pairsFound < player.pairsFound) {
      throw new BadRequestException(`Anti-cheat : pairsFound ne peut pas décroître`);
    }
    if (p.moves < player.moves) {
      throw new BadRequestException(`Anti-cheat : moves ne peut pas décroître`);
    }
    const totalPairs = m.cardLayout.length / 2;
    if (p.pairsFound > totalPairs) {
      throw new BadRequestException(`Anti-cheat : plus de paires que possibles`);
    }
    // Anti-cheat soft : il faut au moins pairsFound retournements
    if (p.moves < p.pairsFound) {
      throw new BadRequestException(`Anti-cheat : impossible d'avoir ${p.pairsFound} paires en ${p.moves} coups`);
    }

    player.pairsFound = p.pairsFound;
    player.moves = p.moves;

    if (p.finished && !player.finished) {
      player.finished = true;
      player.finishedAt = Date.now();
      if (m.status === 'playing' && !m.winnerId) {
        m.winnerId = userId;
        m.status = 'finished';
        m.finishedAt = Date.now();
        this.logger.log(`🏆 Concentration ${code} : ${player.displayName} a gagné !`);
      }
    }
    m.markModified('players');
    await m.save();
    const obj = m.toObject();
    this.emit(code, obj);
    return obj;
  }

  async getByCode(code: string): Promise<ConcentrationMatch> {
    const m = await this.matchModel.findOne({ code }).lean().exec();
    if (!m) throw new NotFoundException(`Match ${code} introuvable`);
    return m;
  }

  async listWaiting(variant?: string, limit = 10): Promise<ConcentrationMatch[]> {
    const filter: any = { status: 'waiting' };
    if (variant) filter.variant = variant;
    return this.matchModel.find(filter).sort({ createdAt: -1 }).limit(limit).lean().exec();
  }

  async quickMatch(opts: {
    variant: string; difficulty?: string;
    hostUserId: string; hostDisplayName: string;
  }): Promise<ConcentrationMatch> {
    const cutoff = new Date(Date.now() - 60_000);
    const existing = await this.matchModel.findOne({
      status: 'waiting',
      variant: opts.variant,
      createdAt: { $gt: cutoff },
    }).sort({ createdAt: 1 }).exec();

    if (existing) {
      if (existing.players.length === 0 || existing.players[0].userId !== opts.hostUserId) {
        return this.join(existing.code, opts.hostUserId, opts.hostDisplayName);
      }
    }
    return this.create(opts);
  }
}
