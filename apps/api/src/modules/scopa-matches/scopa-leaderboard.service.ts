import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ScopaScore, ScopaScoreDocument } from './schemas/scopa-score.schema';

export interface ScopaLeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  bestScore: number;
  totalScopas: number;
  settebelloCount: number;
  totalWins: number;
}

@Injectable()
export class ScopaLeaderboardService {
  private readonly logger = new Logger(ScopaLeaderboardService.name);

  constructor(
    @InjectModel(ScopaScore.name) private scoreModel: Model<ScopaScoreDocument>,
  ) {}

  async submitScore(payload: {
    userId: string; displayName: string;
    variant: string; difficulty?: string;
    score: number; scopas: number; settebello: boolean;
    durationMs: number; won?: boolean;
  }): Promise<ScopaScore> {
    if (!payload.userId || !payload.variant) throw new Error('userId et variant requis');
    const doc = new this.scoreModel({
      userId: payload.userId,
      displayName: payload.displayName,
      variant: payload.variant,
      difficulty: payload.difficulty ?? 'medium',
      score: payload.score,
      scopas: payload.scopas,
      settebello: payload.settebello,
      durationMs: payload.durationMs,
      won: payload.won ?? true,
    });
    await doc.save();
    return doc.toObject();
  }

  async getLeaderboard(variant: string, limit = 100): Promise<ScopaLeaderboardEntry[]> {
    const cap = Math.min(Math.max(1, limit), 500);
    const docs = await this.scoreModel.aggregate([
      { $match: { variant, won: true } },
      {
        $group: {
          _id: '$userId',
          displayName: { $last: '$displayName' },
          bestScore: { $max: '$score' },
          totalScopas: { $sum: '$scopas' },
          settebelloCount: { $sum: { $cond: ['$settebello', 1, 0] } },
          totalWins: { $sum: 1 },
        },
      },
      { $sort: { bestScore: -1, totalScopas: -1, settebelloCount: -1 } },
      { $limit: cap },
    ]).exec();

    return docs.map((d, i) => ({
      rank: i + 1,
      userId: d._id,
      displayName: d.displayName,
      bestScore: d.bestScore ?? 0,
      totalScopas: d.totalScopas ?? 0,
      settebelloCount: d.settebelloCount ?? 0,
      totalWins: d.totalWins ?? 0,
    }));
  }

  async getUserRank(userId: string, variant: string): Promise<{
    rank: number; total: number; entry: ScopaLeaderboardEntry | null;
  }> {
    const all = await this.getLeaderboard(variant, 500);
    const idx = all.findIndex((e) => e.userId === userId);
    return {
      rank: idx >= 0 ? idx + 1 : -1,
      total: all.length,
      entry: idx >= 0 ? all[idx] : null,
    };
  }

  /** Top des « Scopa makers » : trie par totalScopas DESC. */
  async getScopasLeaderboard(variant: string, limit = 100): Promise<ScopaLeaderboardEntry[]> {
    const cap = Math.min(Math.max(1, limit), 500);
    const docs = await this.scoreModel.aggregate([
      { $match: { variant, won: true } },
      {
        $group: {
          _id: '$userId',
          displayName: { $last: '$displayName' },
          bestScore: { $max: '$score' },
          totalScopas: { $sum: '$scopas' },
          settebelloCount: { $sum: { $cond: ['$settebello', 1, 0] } },
          totalWins: { $sum: 1 },
        },
      },
      { $sort: { totalScopas: -1, bestScore: -1 } },
      { $limit: cap },
    ]).exec();

    return docs.map((d, i) => ({
      rank: i + 1,
      userId: d._id,
      displayName: d.displayName,
      bestScore: d.bestScore ?? 0,
      totalScopas: d.totalScopas ?? 0,
      settebelloCount: d.settebelloCount ?? 0,
      totalWins: d.totalWins ?? 0,
    }));
  }
}
