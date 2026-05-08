import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subject, Observable, filter, map } from 'rxjs';
import {
  PokerMatch, PokerMatchDocument, PokerPlayerProgress, PokerVariant, PokerFormat,
} from './schemas/poker-match.schema';

function genCode(): string {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += A[Math.floor(Math.random() * A.length)];
  return s;
}

function makePlayer(userId: string, displayName: string, chips: number, position: number): PokerPlayerProgress {
  return {
    userId, displayName,
    chips, currentBet: 0, totalBetThisHand: 0,
    lastAction: null, folded: false, allIn: false,
    position, joinedAt: Date.now(),
  };
}

const VALID_ACTIONS = new Set(['check', 'bet', 'call', 'raise', 'fold', 'allin']);

@Injectable()
export class PokerMatchesService {
  private readonly logger = new Logger(PokerMatchesService.name);
  private readonly events$ = new Subject<{ code: string; match: PokerMatch }>();

  constructor(
    @InjectModel(PokerMatch.name) private matchModel: Model<PokerMatchDocument>,
  ) {}

  streamMatch(code: string): Observable<{ data: PokerMatch }> {
    return this.events$.pipe(filter((e) => e.code === code), map((e) => ({ data: e.match })));
  }

  private emit(code: string, match: PokerMatch) {
    this.events$.next({ code, match });
  }

  async create(opts: {
    variant: PokerVariant; format?: PokerFormat;
    smallBlind?: number; bigBlind?: number; buyIn?: number; maxPlayers?: number;
    hostUserId: string; hostDisplayName: string;
  }): Promise<PokerMatch> {
    let code = genCode();
    for (let tries = 0; tries < 10; tries++) {
      const exists = await this.matchModel.exists({ code });
      if (!exists) break;
      code = genCode();
    }
    const buyIn = opts.buyIn ?? 1000;
    const doc = new this.matchModel({
      code,
      variant: opts.variant,
      format: opts.format ?? 'cashGame',
      smallBlind: opts.smallBlind ?? 10,
      bigBlind: opts.bigBlind ?? 20,
      buyIn,
      maxPlayers: opts.maxPlayers ?? 9,
      status: 'waiting',
      players: [makePlayer(opts.hostUserId, opts.hostDisplayName, buyIn, 0)],
    });
    await doc.save();
    this.logger.log(`🃏 Poker match créé : ${code} (${opts.variant}/${opts.format ?? 'cashGame'})`);
    return doc.toObject();
  }

  async join(code: string, userId: string, displayName: string): Promise<PokerMatch> {
    const m = await this.matchModel.findOne({ code }).exec();
    if (!m) throw new NotFoundException(`Match ${code} introuvable`);
    if (m.status !== 'waiting') throw new BadRequestException(`Match ${code} status=${m.status}`);
    if (m.players.length >= m.maxPlayers) throw new BadRequestException(`Match ${code} plein`);
    if (m.players.some((p) => p.userId === userId)) return m.toObject();
    const newPos = m.players.length;
    m.players.push(makePlayer(userId, displayName, m.buyIn, newPos));
    if (m.players.length >= 2) {
      m.status = 'preflop';
      m.handNumber = 1;
      m.startedAt = Date.now();
    }
    await m.save();
    const obj = m.toObject();
    this.emit(code, obj);
    return obj;
  }

  /**
   * Action joueur (check/bet/call/raise/fold/allin). Anti-cheat :
   * - chips ≥ 0 toujours
   * - bet ≤ chips disponibles
   * - currentBet ne peut décroître que par fold
   */
  async action(code: string, userId: string, p: {
    action: string; amount?: number;
  }): Promise<PokerMatch> {
    const m = await this.matchModel.findOne({ code }).exec();
    if (!m) throw new NotFoundException(`Match ${code} introuvable`);
    if (!VALID_ACTIONS.has(p.action)) throw new BadRequestException(`Action invalide : ${p.action}`);
    const player = m.players.find((x) => x.userId === userId);
    if (!player) throw new BadRequestException(`Joueur pas dans le match`);
    if (player.folded) throw new BadRequestException(`Joueur déjà fold`);
    const amount = Math.max(0, p.amount ?? 0);
    if (amount > player.chips) throw new BadRequestException(`Anti-cheat : amount > chips`);

    switch (p.action) {
      case 'fold':
        player.folded = true;
        break;
      case 'check':
        // pas de mise nécessaire
        break;
      case 'bet':
      case 'call':
      case 'raise':
        player.chips -= amount;
        player.currentBet += amount;
        player.totalBetThisHand += amount;
        m.pot += amount;
        break;
      case 'allin':
        m.pot += player.chips;
        player.totalBetThisHand += player.chips;
        player.currentBet += player.chips;
        player.chips = 0;
        player.allIn = true;
        break;
    }
    player.lastAction = p.action;
    m.markModified('players');
    await m.save();
    const obj = m.toObject();
    this.emit(code, obj);
    return obj;
  }

  /**
   * Distribue le pot au gagnant déclaré (côté client après showdown).
   * Anti-cheat soft : on accepte juste le winnerId déclaré ; les hands sont
   * en clair côté client (à minima il faut un hand evaluator côté serveur
   * pour un vrai anti-cheat — hors scope v1).
   */
  async settleHand(code: string, opts: {
    winnerId: string; biggestPot: number; royalFlush?: boolean;
  }): Promise<PokerMatch> {
    const m = await this.matchModel.findOne({ code }).exec();
    if (!m) throw new NotFoundException(`Match ${code} introuvable`);
    const winner = m.players.find((p) => p.userId === opts.winnerId);
    if (!winner) throw new BadRequestException(`Gagnant ${opts.winnerId} pas dans le match`);
    winner.chips += m.pot;
    m.winnerId = opts.winnerId;
    m.pot = 0;
    // Reset round state
    for (const p of m.players) {
      p.currentBet = 0;
      p.totalBetThisHand = 0;
      p.folded = false;
      p.allIn = false;
      p.lastAction = null;
    }
    m.handNumber += 1;
    m.status = 'preflop';
    m.markModified('players');
    await m.save();
    this.logger.log(`🏆 Poker ${code} : ${winner.displayName} remporte ${m.pot} (main #${m.handNumber - 1})`);
    const obj = m.toObject();
    this.emit(code, obj);
    return obj;
  }

  /** Quitter la table : passe au statut finished si plus assez de joueurs. */
  async leave(code: string, userId: string): Promise<PokerMatch> {
    const m = await this.matchModel.findOne({ code }).exec();
    if (!m) throw new NotFoundException(`Match ${code} introuvable`);
    m.players = m.players.filter((p) => p.userId !== userId);
    if (m.players.length < 2) {
      m.status = 'finished';
      m.finishedAt = Date.now();
      m.winnerId = m.players[0]?.userId ?? null;
    }
    m.markModified('players');
    await m.save();
    const obj = m.toObject();
    this.emit(code, obj);
    return obj;
  }

  async getByCode(code: string): Promise<PokerMatch> {
    const m = await this.matchModel.findOne({ code }).lean().exec();
    if (!m) throw new NotFoundException(`Match ${code} introuvable`);
    return m;
  }

  async listWaiting(variant?: string, format?: string, limit = 10): Promise<PokerMatch[]> {
    const filter: any = { status: 'waiting' };
    if (variant) filter.variant = variant;
    if (format) filter.format = format;
    return this.matchModel.find(filter).sort({ createdAt: -1 }).limit(limit).lean().exec();
  }

  async quickMatch(opts: {
    variant: PokerVariant; format?: PokerFormat;
    hostUserId: string; hostDisplayName: string;
  }): Promise<PokerMatch> {
    const cutoff = new Date(Date.now() - 60_000);
    const existing = await this.matchModel.findOne({
      status: 'waiting', variant: opts.variant, format: opts.format ?? 'cashGame',
      createdAt: { $gt: cutoff },
    }).sort({ createdAt: 1 }).exec();
    if (existing && (existing.players.length === 0 || existing.players[0].userId !== opts.hostUserId)) {
      return this.join(existing.code, opts.hostUserId, opts.hostDisplayName);
    }
    return this.create(opts);
  }
}
