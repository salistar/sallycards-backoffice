import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QuiestceScore, QuiestceScoreDocument } from './schemas/quiestce-score.schema';

export interface QuiestceLeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  bestScore: number;
  fewestQuestions: number;
  bestDurationMs: number;
  totalWins: number;
}

@Injectable()
export class QuiestceLeaderboardService {
  private readonly logger = new Logger(QuiestceLeaderboardService.name);

  constructor(
    @InjectModel(QuiestceScore.name) private scoreModel: Model<QuiestceScoreDocument>,
  ) {}

  async submitScore(payload: {
    userId: string;
    displayName: string;
    variant: string;
    difficulty?: string;
    questionsAsked: number;
    durationMs: number;
    won?: boolean;
  }): Promise<QuiestceScore> {
    if (!payload.userId || !payload.variant) {
      throw new Error('userId et variant requis');
    }
    const score = Math.max(0, 1000 - payload.questionsAsked * 10);
    const doc = new this.scoreModel({
      userId: payload.userId,
      displayName: payload.displayName,
      variant: payload.variant,
      difficulty: payload.difficulty ?? 'medium',
      score,
      questionsAsked: payload.questionsAsked,
      durationMs: payload.durationMs,
      won: payload.won ?? true,
    });
    await doc.save();
    return doc.toObject();
  }

  async getLeaderboard(variant: string, limit = 100): Promise<QuiestceLeaderboardEntry[]> {
    const cap = Math.min(Math.max(1, limit), 500);
    const docs = await this.scoreModel.aggregate([
      { $match: { variant, won: true } },
      {
        $group: {
          _id: '$userId',
          displayName: { $last: '$displayName' },
          bestScore: { $max: '$score' },
          fewestQuestions: { $min: '$questionsAsked' },
          bestDurationMs: { $min: '$durationMs' },
          totalWins: { $sum: 1 },
        },
      },
      { $sort: { bestScore: -1, fewestQuestions: 1, bestDurationMs: 1 } },
      { $limit: cap },
    ]).exec();

    return docs.map((d, i) => ({
      rank: i + 1,
      userId: d._id,
      displayName: d.displayName,
      bestScore: d.bestScore ?? 0,
      fewestQuestions: d.fewestQuestions ?? 0,
      bestDurationMs: d.bestDurationMs ?? 0,
      totalWins: d.totalWins ?? 0,
    }));
  }

  async getUserRank(userId: string, variant: string): Promise<{
    rank: number; total: number; entry: QuiestceLeaderboardEntry | null;
  }> {
    const all = await this.getLeaderboard(variant, 500);
    const idx = all.findIndex((e) => e.userId === userId);
    return {
      rank: idx >= 0 ? idx + 1 : -1,
      total: all.length,
      entry: idx >= 0 ? all[idx] : null,
    };
  }

  /** Fewest-questions leaderboard. */
  async getQuestionsLeaderboard(variant: string, limit = 100): Promise<QuiestceLeaderboardEntry[]> {
    const cap = Math.min(Math.max(1, limit), 500);
    const docs = await this.scoreModel.aggregate([
      { $match: { variant, won: true, questionsAsked: { $gt: 0 } } },
      {
        $group: {
          _id: '$userId',
          displayName: { $last: '$displayName' },
          bestScore: { $max: '$score' },
          fewestQuestions: { $min: '$questionsAsked' },
          bestDurationMs: { $min: '$durationMs' },
          totalWins: { $sum: 1 },
        },
      },
      { $sort: { fewestQuestions: 1, bestDurationMs: 1, bestScore: -1 } },
      { $limit: cap },
    ]).exec();

    return docs.map((d, i) => ({
      rank: i + 1,
      userId: d._id,
      displayName: d.displayName,
      bestScore: d.bestScore ?? 0,
      fewestQuestions: d.fewestQuestions ?? 0,
      bestDurationMs: d.bestDurationMs ?? 0,
      totalWins: d.totalWins ?? 0,
    }));
  }

  async getTimeLeaderboard(variant: string, limit = 100): Promise<QuiestceLeaderboardEntry[]> {
    const cap = Math.min(Math.max(1, limit), 500);
    const docs = await this.scoreModel.aggregate([
      { $match: { variant, won: true, durationMs: { $gt: 0 } } },
      {
        $group: {
          _id: '$userId',
          displayName: { $last: '$displayName' },
          bestScore: { $max: '$score' },
          fewestQuestions: { $min: '$questionsAsked' },
          bestDurationMs: { $min: '$durationMs' },
          totalWins: { $sum: 1 },
        },
      },
      { $sort: { bestDurationMs: 1, fewestQuestions: 1, bestScore: -1 } },
      { $limit: cap },
    ]).exec();

    return docs.map((d, i) => ({
      rank: i + 1,
      userId: d._id,
      displayName: d.displayName,
      bestScore: d.bestScore ?? 0,
      fewestQuestions: d.fewestQuestions ?? 0,
      bestDurationMs: d.bestDurationMs ?? 0,
      totalWins: d.totalWins ?? 0,
    }));
  }
}
