import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PokerScore, PokerScoreDocument } from './schemas/poker-score.schema';

export interface PokerLeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  totalProfit: number;
  biggestPot: number;
  handsPlayed: number;
  handsWon: number;
  winRate: number; // 0-100
  royalFlushes: number;
}

@Injectable()
export class PokerLeaderboardService {
  private readonly logger = new Logger(PokerLeaderboardService.name);

  constructor(
    @InjectModel(PokerScore.name) private scoreModel: Model<PokerScoreDocument>,
  ) {}

  async submitScore(payload: {
    userId: string; displayName: string;
    variant: string; format?: string;
    netProfit: number; biggestPot: number;
    handsPlayed: number; handsWon: number;
    royalFlushes?: number; bluffsWon?: number;
    durationMs: number;
  }): Promise<PokerScore> {
    if (!payload.userId || !payload.variant) throw new Error('userId et variant requis');
    const doc = new this.scoreModel({
      userId: payload.userId,
      displayName: payload.displayName,
      variant: payload.variant,
      format: payload.format ?? 'cashGame',
      netProfit: payload.netProfit,
      biggestPot: payload.biggestPot,
      handsPlayed: payload.handsPlayed,
      handsWon: payload.handsWon,
      royalFlushes: payload.royalFlushes ?? 0,
      bluffsWon: payload.bluffsWon ?? 0,
      durationMs: payload.durationMs,
    });
    await doc.save();
    return doc.toObject();
  }

  /** Top joueurs par profit cumulé (jetons virtuels). */
  async getLeaderboard(variant: string, limit = 100): Promise<PokerLeaderboardEntry[]> {
    const cap = Math.min(Math.max(1, limit), 500);
    const docs = await this.scoreModel.aggregate([
      { $match: { variant } },
      {
        $group: {
          _id: '$userId',
          displayName: { $last: '$displayName' },
          totalProfit: { $sum: '$netProfit' },
          biggestPot: { $max: '$biggestPot' },
          handsPlayed: { $sum: '$handsPlayed' },
          handsWon: { $sum: '$handsWon' },
          royalFlushes: { $sum: '$royalFlushes' },
        },
      },
      {
        $addFields: {
          winRate: {
            $cond: [
              { $gt: ['$handsPlayed', 0] },
              { $multiply: [{ $divide: ['$handsWon', '$handsPlayed'] }, 100] },
              0,
            ],
          },
        },
      },
      { $sort: { totalProfit: -1, biggestPot: -1 } },
      { $limit: cap },
    ]).exec();

    return docs.map((d, i) => ({
      rank: i + 1,
      userId: d._id,
      displayName: d.displayName,
      totalProfit: d.totalProfit ?? 0,
      biggestPot: d.biggestPot ?? 0,
      handsPlayed: d.handsPlayed ?? 0,
      handsWon: d.handsWon ?? 0,
      winRate: Math.round((d.winRate ?? 0) * 10) / 10,
      royalFlushes: d.royalFlushes ?? 0,
    }));
  }

  async getUserRank(userId: string, variant: string): Promise<{
    rank: number; total: number; entry: PokerLeaderboardEntry | null;
  }> {
    const all = await this.getLeaderboard(variant, 500);
    const idx = all.findIndex((e) => e.userId === userId);
    return {
      rank: idx >= 0 ? idx + 1 : -1,
      total: all.length,
      entry: idx >= 0 ? all[idx] : null,
    };
  }

  /** Top des plus gros pots. */
  async getBiggestPots(variant: string, limit = 100): Promise<PokerLeaderboardEntry[]> {
    const cap = Math.min(Math.max(1, limit), 500);
    const docs = await this.scoreModel.aggregate([
      { $match: { variant, biggestPot: { $gt: 0 } } },
      {
        $group: {
          _id: '$userId',
          displayName: { $last: '$displayName' },
          totalProfit: { $sum: '$netProfit' },
          biggestPot: { $max: '$biggestPot' },
          handsPlayed: { $sum: '$handsPlayed' },
          handsWon: { $sum: '$handsWon' },
          royalFlushes: { $sum: '$royalFlushes' },
        },
      },
      { $sort: { biggestPot: -1 } },
      { $limit: cap },
    ]).exec();

    return docs.map((d, i) => ({
      rank: i + 1,
      userId: d._id,
      displayName: d.displayName,
      totalProfit: d.totalProfit ?? 0,
      biggestPot: d.biggestPot ?? 0,
      handsPlayed: d.handsPlayed ?? 0,
      handsWon: d.handsWon ?? 0,
      winRate: d.handsPlayed ? Math.round((d.handsWon / d.handsPlayed) * 100 * 10) / 10 : 0,
      royalFlushes: d.royalFlushes ?? 0,
    }));
  }
}
