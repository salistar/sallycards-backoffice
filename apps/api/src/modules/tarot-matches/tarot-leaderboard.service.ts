import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TarotScore, TarotScoreDocument } from './schemas/tarot-score.schema';

export interface TarotLeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  totalScore: number;        // somme des scores positifs sur la période
  contractsTaken: number;
  contractsWon: number;
  chelemsSucceeded: number;
}

@Injectable()
export class TarotLeaderboardService {
  private readonly logger = new Logger(TarotLeaderboardService.name);

  constructor(
    @InjectModel(TarotScore.name) private scoreModel: Model<TarotScoreDocument>,
  ) {}

  async submitScore(payload: {
    userId: string; displayName: string;
    variant: string; contract?: string;
    score: number; boutsCaptured: number; pointsCaptured: number;
    chelemAnnounced?: boolean; petitAuBout?: boolean;
    durationMs: number; won?: boolean;
  }): Promise<TarotScore> {
    if (!payload.userId || !payload.variant) throw new Error('userId et variant requis');
    const doc = new this.scoreModel({
      userId: payload.userId,
      displayName: payload.displayName,
      variant: payload.variant,
      contract: payload.contract ?? 'petite',
      score: payload.score,
      boutsCaptured: payload.boutsCaptured,
      pointsCaptured: payload.pointsCaptured,
      chelemAnnounced: !!payload.chelemAnnounced,
      petitAuBout: !!payload.petitAuBout,
      durationMs: payload.durationMs,
      won: payload.won ?? true,
    });
    await doc.save();
    return doc.toObject();
  }

  async getLeaderboard(variant: string, limit = 100): Promise<TarotLeaderboardEntry[]> {
    const cap = Math.min(Math.max(1, limit), 500);
    const docs = await this.scoreModel.aggregate([
      { $match: { variant } },
      {
        $group: {
          _id: '$userId',
          displayName: { $last: '$displayName' },
          totalScore: { $sum: '$score' },
          contractsTaken: { $sum: 1 },
          contractsWon: { $sum: { $cond: ['$won', 1, 0] } },
          chelemsSucceeded: {
            $sum: { $cond: [{ $and: ['$chelemAnnounced', '$won'] }, 1, 0] },
          },
        },
      },
      { $sort: { totalScore: -1, contractsWon: -1 } },
      { $limit: cap },
    ]).exec();

    return docs.map((d, i) => ({
      rank: i + 1,
      userId: d._id,
      displayName: d.displayName,
      totalScore: d.totalScore ?? 0,
      contractsTaken: d.contractsTaken ?? 0,
      contractsWon: d.contractsWon ?? 0,
      chelemsSucceeded: d.chelemsSucceeded ?? 0,
    }));
  }

  async getUserRank(userId: string, variant: string): Promise<{
    rank: number; total: number; entry: TarotLeaderboardEntry | null;
  }> {
    const all = await this.getLeaderboard(variant, 500);
    const idx = all.findIndex((e) => e.userId === userId);
    return {
      rank: idx >= 0 ? idx + 1 : -1,
      total: all.length,
      entry: idx >= 0 ? all[idx] : null,
    };
  }

  /** Top des champions de Chelem. */
  async getChelemLeaderboard(variant: string, limit = 100): Promise<TarotLeaderboardEntry[]> {
    const cap = Math.min(Math.max(1, limit), 500);
    const docs = await this.scoreModel.aggregate([
      { $match: { variant, chelemAnnounced: true, won: true } },
      {
        $group: {
          _id: '$userId',
          displayName: { $last: '$displayName' },
          totalScore: { $sum: '$score' },
          contractsTaken: { $sum: 1 },
          contractsWon: { $sum: 1 },
          chelemsSucceeded: { $sum: 1 },
        },
      },
      { $sort: { chelemsSucceeded: -1, totalScore: -1 } },
      { $limit: cap },
    ]).exec();

    return docs.map((d, i) => ({
      rank: i + 1,
      userId: d._id,
      displayName: d.displayName,
      totalScore: d.totalScore ?? 0,
      contractsTaken: d.contractsTaken ?? 0,
      contractsWon: d.contractsWon ?? 0,
      chelemsSucceeded: d.chelemsSucceeded ?? 0,
    }));
  }
}
