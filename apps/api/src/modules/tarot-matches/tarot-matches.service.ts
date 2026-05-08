import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subject, Observable, filter, map } from 'rxjs';
import {
  TarotMatch, TarotMatchDocument, TarotPlayerProgress, TarotContract,
  CONTRACT_MULTIPLIER,
} from './schemas/tarot-match.schema';

function genCode(): string {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += A[Math.floor(Math.random() * A.length)];
  return s;
}

function makePlayer(userId: string, displayName: string): TarotPlayerProgress {
  return {
    userId, displayName,
    trickCount: 0, pointsCaptured: 0, boutsCaptured: 0, totalScore: 0,
    finished: false, finishedAt: null, joinedAt: Date.now(),
  };
}

/** Objectif points selon nb de bouts (règle FFT). */
const TARGET_BY_BOUTS: Record<number, number> = { 0: 56, 1: 51, 2: 41, 3: 36 };

@Injectable()
export class TarotMatchesService {
  private readonly logger = new Logger(TarotMatchesService.name);
  private readonly events$ = new Subject<{ code: string; match: TarotMatch }>();

  constructor(
    @InjectModel(TarotMatch.name) private matchModel: Model<TarotMatchDocument>,
  ) {}

  streamMatch(code: string): Observable<{ data: TarotMatch }> {
    return this.events$.pipe(filter((e) => e.code === code), map((e) => ({ data: e.match })));
  }

  private emit(code: string, match: TarotMatch) {
    this.events$.next({ code, match });
  }

  async create(opts: {
    variant: string; playerCount?: number;
    hostUserId: string; hostDisplayName: string;
  }): Promise<TarotMatch> {
    let code = genCode();
    for (let tries = 0; tries < 10; tries++) {
      const exists = await this.matchModel.exists({ code });
      if (!exists) break;
      code = genCode();
    }
    const doc = new this.matchModel({
      code,
      variant: opts.variant,
      playerCount: opts.playerCount ?? 4,
      status: 'waiting',
      players: [makePlayer(opts.hostUserId, opts.hostDisplayName)],
    });
    await doc.save();
    this.logger.log(`🎮 Tarot match créé : ${code} (${opts.variant}, ${opts.playerCount ?? 4}p)`);
    return doc.toObject();
  }

  async join(code: string, userId: string, displayName: string): Promise<TarotMatch> {
    const m = await this.matchModel.findOne({ code }).exec();
    if (!m) throw new NotFoundException(`Match ${code} introuvable`);
    if (m.status !== 'waiting') throw new BadRequestException(`Match ${code} status=${m.status}`);
    if (m.players.length >= m.playerCount) throw new BadRequestException(`Match ${code} plein`);
    if (m.players.some((p) => p.userId === userId)) return m.toObject();
    m.players.push(makePlayer(userId, displayName));
    if (m.players.length === m.playerCount) {
      m.status = 'bidding';
      m.startedAt = Date.now();
    }
    await m.save();
    const obj = m.toObject();
    this.emit(code, obj);
    return obj;
  }

  /** Annonce d'un contrat pendant la phase bidding. */
  async bid(code: string, userId: string, contract: TarotContract, chelem: boolean): Promise<TarotMatch> {
    const m = await this.matchModel.findOne({ code }).exec();
    if (!m) throw new NotFoundException(`Match ${code} introuvable`);
    if (m.status !== 'bidding') throw new BadRequestException(`Match pas en phase bidding`);
    const player = m.players.find((x) => x.userId === userId);
    if (!player) throw new BadRequestException(`Joueur ${userId} pas dans le match`);
    if (contract === 'pass') {
      // skip — un autre joueur prendra
      this.emit(code, m.toObject());
      return m.toObject();
    }
    m.takerId = userId;
    m.contract = contract;
    m.contractMultiplier = CONTRACT_MULTIPLIER[contract];
    m.chelemAnnounced = chelem;
    m.status = 'playing';
    await m.save();
    this.logger.log(`🎲 Tarot ${code} : ${player.displayName} prend en ${contract}${chelem ? ' + chelem' : ''}`);
    const obj = m.toObject();
    this.emit(code, obj);
    return obj;
  }

  /**
   * Update progression. Anti-cheat : trickCount/pointsCaptured/boutsCaptured
   * ne peuvent que monter ; pointsCaptured ≤ 91 ; boutsCaptured ≤ 3.
   */
  async updateProgress(code: string, userId: string, p: {
    trickCount: number; pointsCaptured: number; boutsCaptured: number;
    petitAuBout?: boolean; finished?: boolean;
  }): Promise<TarotMatch> {
    const m = await this.matchModel.findOne({ code }).exec();
    if (!m) throw new NotFoundException(`Match ${code} introuvable`);
    const player = m.players.find((x) => x.userId === userId);
    if (!player) throw new BadRequestException(`Joueur ${userId} pas dans le match`);

    if (p.trickCount < player.trickCount) throw new BadRequestException(`Anti-cheat: trickCount`);
    if (p.pointsCaptured < player.pointsCaptured) throw new BadRequestException(`Anti-cheat: points`);
    if (p.pointsCaptured > 91) throw new BadRequestException(`Anti-cheat: points > 91`);
    if (p.boutsCaptured > 3) throw new BadRequestException(`Anti-cheat: bouts > 3`);

    player.trickCount = p.trickCount;
    player.pointsCaptured = p.pointsCaptured;
    player.boutsCaptured = p.boutsCaptured;

    if (p.finished && !player.finished && m.takerId === userId) {
      // Calcul score selon règle FFT (preneur uniquement)
      const target = TARGET_BY_BOUTS[p.boutsCaptured] ?? 56;
      const diff = p.pointsCaptured - target;
      const baseScore = (25 + Math.abs(diff)) * (m.contractMultiplier || 1);
      const petitBonus = p.petitAuBout ? 10 * (m.contractMultiplier || 1) : 0;
      const chelemBonus = m.chelemAnnounced ? 400 * (m.contractMultiplier || 1) : 0;
      const total = (diff >= 0 ? baseScore + petitBonus + chelemBonus : -(baseScore + chelemBonus));
      player.totalScore += total;
      player.finished = true;
      player.finishedAt = Date.now();
      m.status = 'finished';
      m.winnerId = diff >= 0 ? userId : null;
      m.finishedAt = Date.now();
      this.logger.log(`🏆 Tarot ${code} : ${player.displayName} ${diff >= 0 ? 'réussit' : 'chute'} (${diff} pts vs cible ${target})`);
    }
    m.markModified('players');
    await m.save();
    const obj = m.toObject();
    this.emit(code, obj);
    return obj;
  }

  async getByCode(code: string): Promise<TarotMatch> {
    const m = await this.matchModel.findOne({ code }).lean().exec();
    if (!m) throw new NotFoundException(`Match ${code} introuvable`);
    return m;
  }

  async listWaiting(variant?: string, limit = 10): Promise<TarotMatch[]> {
    const filter: any = { status: 'waiting' };
    if (variant) filter.variant = variant;
    return this.matchModel.find(filter).sort({ createdAt: -1 }).limit(limit).lean().exec();
  }

  async quickMatch(opts: {
    variant: string; playerCount?: number;
    hostUserId: string; hostDisplayName: string;
  }): Promise<TarotMatch> {
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
