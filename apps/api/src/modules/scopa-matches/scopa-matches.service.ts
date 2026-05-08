import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subject, Observable, filter, map } from 'rxjs';
import {
  ScopaMatch, ScopaMatchDocument, ScopaPlayerProgress,
} from './schemas/scopa-match.schema';

function genCode(): string {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += A[Math.floor(Math.random() * A.length)];
  return s;
}

function makePlayer(userId: string, displayName: string): ScopaPlayerProgress {
  return {
    userId, displayName,
    capturedCount: 0, scopas: 0, denariCount: 0,
    settebello: false, primieraScore: 0, score: 0,
    finished: false, finishedAt: null,
    joinedAt: Date.now(),
  };
}

@Injectable()
export class ScopaMatchesService {
  private readonly logger = new Logger(ScopaMatchesService.name);
  private readonly events$ = new Subject<{ code: string; match: ScopaMatch }>();

  constructor(
    @InjectModel(ScopaMatch.name) private matchModel: Model<ScopaMatchDocument>,
  ) {}

  streamMatch(code: string): Observable<{ data: ScopaMatch }> {
    return this.events$.pipe(filter((e) => e.code === code), map((e) => ({ data: e.match })));
  }

  private emit(code: string, match: ScopaMatch) {
    this.events$.next({ code, match });
  }

  async create(opts: {
    variant: string; difficulty?: string; targetScore?: number;
    hostUserId: string; hostDisplayName: string;
  }): Promise<ScopaMatch> {
    let code = genCode();
    for (let tries = 0; tries < 10; tries++) {
      const exists = await this.matchModel.exists({ code });
      if (!exists) break;
      code = genCode();
    }
    const doc = new this.matchModel({
      code,
      variant: opts.variant,
      difficulty: opts.difficulty ?? 'medium',
      targetScore: opts.targetScore ?? 11,
      status: 'waiting',
      players: [makePlayer(opts.hostUserId, opts.hostDisplayName)],
    });
    await doc.save();
    this.logger.log(`🎮 Scopa match créé : ${code} (${opts.variant})`);
    return doc.toObject();
  }

  async join(code: string, userId: string, displayName: string): Promise<ScopaMatch> {
    const m = await this.matchModel.findOne({ code }).exec();
    if (!m) throw new NotFoundException(`Match ${code} introuvable`);
    if (m.status !== 'waiting') throw new BadRequestException(`Match ${code} status=${m.status}`);
    if (m.players.length >= 4) throw new BadRequestException(`Match ${code} plein`);
    if (m.players.some((p) => p.userId === userId)) return m.toObject();
    m.players.push(makePlayer(userId, displayName));
    if (m.players.length >= 2) {
      m.status = 'playing';
      m.startedAt = Date.now();
    }
    await m.save();
    const obj = m.toObject();
    this.emit(code, obj);
    return obj;
  }

  /**
   * Update progression d'un joueur. Anti-cheat : capturedCount/scopas ne peuvent
   * qu'augmenter ; settebello bool ne peut être annulé une fois capturé.
   */
  async updateProgress(code: string, userId: string, p: {
    capturedCount: number;
    scopas: number;
    denariCount: number;
    settebello: boolean;
    primieraScore: number;
    score: number;
    finished?: boolean;
  }): Promise<ScopaMatch> {
    const m = await this.matchModel.findOne({ code }).exec();
    if (!m) throw new NotFoundException(`Match ${code} introuvable`);
    const player = m.players.find((x) => x.userId === userId);
    if (!player) throw new BadRequestException(`Joueur ${userId} pas dans le match`);
    if (p.capturedCount < player.capturedCount) {
      throw new BadRequestException(`Anti-cheat: capturedCount ne peut décroître`);
    }
    if (p.scopas < player.scopas) {
      throw new BadRequestException(`Anti-cheat: scopas ne peut décroître`);
    }
    if (player.settebello && !p.settebello) {
      throw new BadRequestException(`Anti-cheat: settebello ne peut être annulé`);
    }
    player.capturedCount = p.capturedCount;
    player.scopas = p.scopas;
    player.denariCount = p.denariCount;
    player.settebello = p.settebello;
    player.primieraScore = p.primieraScore;
    player.score = p.score;
    if (p.finished && !player.finished) {
      player.finished = true;
      player.finishedAt = Date.now();
      // Gagnant = premier joueur à atteindre targetScore
      const everyone = m.players.every((x) => x.finished);
      if (player.score >= m.targetScore || everyone) {
        const ranked = [...m.players].sort((a, b) => b.score - a.score);
        m.winnerId = ranked[0]?.userId ?? null;
        m.status = 'finished';
        m.finishedAt = Date.now();
        this.logger.log(`🏆 Scopa ${code} : ${ranked[0]?.displayName} gagne (${ranked[0]?.score} pts)`);
      }
    }
    m.markModified('players');
    await m.save();
    const obj = m.toObject();
    this.emit(code, obj);
    return obj;
  }

  async getByCode(code: string): Promise<ScopaMatch> {
    const m = await this.matchModel.findOne({ code }).lean().exec();
    if (!m) throw new NotFoundException(`Match ${code} introuvable`);
    return m;
  }

  async listWaiting(variant?: string, limit = 10): Promise<ScopaMatch[]> {
    const filter: any = { status: 'waiting' };
    if (variant) filter.variant = variant;
    return this.matchModel.find(filter).sort({ createdAt: -1 }).limit(limit).lean().exec();
  }

  async quickMatch(opts: {
    variant: string; difficulty?: string;
    hostUserId: string; hostDisplayName: string;
  }): Promise<ScopaMatch> {
    const cutoff = new Date(Date.now() - 60_000);
    const existing = await this.matchModel.findOne({
      status: 'waiting', variant: opts.variant, createdAt: { $gt: cutoff },
    }).sort({ createdAt: 1 }).exec();
    if (existing && (existing.players.length === 0 || existing.players[0].userId !== opts.hostUserId)) {
      return this.join(existing.code, opts.hostUserId, opts.hostDisplayName);
    }
    return this.create(opts);
  }
}
