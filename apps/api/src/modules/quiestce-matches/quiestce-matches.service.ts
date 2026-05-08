import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subject, Observable, filter, map } from 'rxjs';
import {
  QuiestceMatch, QuiestceMatchDocument, QuiestcePlayerProgress,
} from './schemas/quiestce-match.schema';

function genCode(): string {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += A[Math.floor(Math.random() * A.length)];
  return s;
}

const POOL_SIZE: Record<string, number> = {
  easy: 24,
  medium: 36,
  hard: 50,
};

/** Génère un pool d'IDs déterministe pour la variante + difficulté. */
function generateCharacterPool(variant: string, difficulty: string): string[] {
  const n = POOL_SIZE[difficulty] ?? 24;
  const pool: string[] = [];
  for (let i = 1; i <= n; i++) pool.push(`${variant}-${i}`);
  return pool;
}

@Injectable()
export class QuiestceMatchesService {
  private readonly logger = new Logger(QuiestceMatchesService.name);
  private readonly events$ = new Subject<{ code: string; match: QuiestceMatch }>();

  constructor(
    @InjectModel(QuiestceMatch.name) private matchModel: Model<QuiestceMatchDocument>,
  ) {}

  streamMatch(code: string): Observable<{ data: QuiestceMatch }> {
    return this.events$.pipe(
      filter((e) => e.code === code),
      map((e) => ({ data: e.match })),
    );
  }

  private emit(code: string, match: QuiestceMatch) {
    this.events$.next({ code, match });
  }

  async create(opts: {
    variant: string;
    difficulty?: string;
    hostUserId: string;
    hostDisplayName: string;
  }): Promise<QuiestceMatch> {
    const difficulty = opts.difficulty ?? 'medium';
    const pool = generateCharacterPool(opts.variant, difficulty);
    if (pool.length === 0) {
      throw new BadRequestException(`Aucun personnage disponible pour ${opts.variant}/${difficulty}`);
    }

    let code = genCode();
    for (let tries = 0; tries < 10; tries++) {
      const exists = await this.matchModel.exists({ code });
      if (!exists) break;
      code = genCode();
    }

    const host: QuiestcePlayerProgress = {
      userId: opts.hostUserId,
      displayName: opts.hostDisplayName,
      questionsAsked: 0,
      finished: false,
      finishedAt: null,
      joinedAt: Date.now(),
      secretCharacterId: null,
    };
    const doc = new this.matchModel({
      code,
      variant: opts.variant,
      difficulty,
      characterPool: pool,
      status: 'waiting',
      players: [host],
    });
    await doc.save();
    this.logger.log(`🎮 Quiestce match créé : ${code} (${opts.variant}) par ${opts.hostDisplayName}`);
    return doc.toObject();
  }

  async join(code: string, userId: string, displayName: string): Promise<QuiestceMatch> {
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
    // Distribution des personnages secrets : chaque joueur tire le secret de
    // l'autre dans le pool partagé. Sélection aléatoire.
    const pool = m.characterPool;
    const hostSecret = pool[Math.floor(Math.random() * pool.length)];
    const guestSecret = pool[Math.floor(Math.random() * pool.length)];
    m.players[0].secretCharacterId = hostSecret;
    m.players.push({
      userId, displayName,
      questionsAsked: 0,
      finished: false, finishedAt: null,
      joinedAt: Date.now(),
      secretCharacterId: guestSecret,
    });
    m.status = 'playing';
    m.startedAt = Date.now();
    m.markModified('players');
    await m.save();
    this.logger.log(`🎮 Quiestce match ${code} : ${displayName} a rejoint → playing`);
    const obj = m.toObject();
    this.emit(code, obj);
    return obj;
  }

  /**
   * Met à jour le compteur de questions ou marque le joueur comme ayant deviné.
   * - Anti-cheat : questionsAsked ne peut qu'augmenter, +1 par tour normalement.
   * - finished=true : le joueur a tenté la devinette finale. Si guessId == secret
   *   adverse, le joueur gagne. Sinon il perd immédiatement (l'autre gagne).
   */
  async updateProgress(code: string, userId: string, p: {
    questionsAsked: number;
    finished?: boolean;
    guessId?: string;
  }): Promise<QuiestceMatch> {
    const m = await this.matchModel.findOne({ code }).exec();
    if (!m) throw new NotFoundException(`Match ${code} introuvable`);
    const player = m.players.find((x) => x.userId === userId);
    if (!player) throw new BadRequestException(`Joueur ${userId} pas dans le match`);

    if (typeof p.questionsAsked !== 'number') {
      throw new BadRequestException(`questionsAsked requis`);
    }
    if (p.questionsAsked < player.questionsAsked) {
      throw new BadRequestException(`Anti-cheat : questions ne peut pas décroître`);
    }
    if (p.questionsAsked - player.questionsAsked > 5) {
      throw new BadRequestException(`Anti-cheat : trop de questions d'un coup`);
    }

    player.questionsAsked = p.questionsAsked;

    if (p.finished && !player.finished) {
      const opponent = m.players.find((x) => x.userId !== userId);
      const correct = !!opponent && p.guessId === opponent.secretCharacterId;
      player.finished = true;
      player.finishedAt = Date.now();
      if (m.status === 'playing' && !m.winnerId) {
        m.winnerId = correct ? userId : (opponent?.userId ?? null);
        m.status = 'finished';
        m.finishedAt = Date.now();
        this.logger.log(`🏆 Quiestce ${code} : ${correct ? player.displayName : opponent?.displayName} a gagné (devinette ${correct ? 'juste' : 'fausse'})`);
      }
    }
    m.markModified('players');
    await m.save();
    const obj = m.toObject();
    this.emit(code, obj);
    return obj;
  }

  async getByCode(code: string): Promise<QuiestceMatch> {
    const m = await this.matchModel.findOne({ code }).lean().exec();
    if (!m) throw new NotFoundException(`Match ${code} introuvable`);
    return m;
  }

  async listWaiting(variant?: string, limit = 10): Promise<QuiestceMatch[]> {
    const filter: any = { status: 'waiting' };
    if (variant) filter.variant = variant;
    return this.matchModel.find(filter).sort({ createdAt: -1 }).limit(limit).lean().exec();
  }

  async quickMatch(opts: {
    variant: string; difficulty?: string;
    hostUserId: string; hostDisplayName: string;
  }): Promise<QuiestceMatch> {
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
