import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConcentrationScore, ConcentrationScoreDocument } from './schemas/concentration-score.schema';

export interface ConcentrationLeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  bestScore: number;
  bestMoves: number;
  bestDurationMs: number;
  totalWins: number;
}

@Injectable()
export class ConcentrationLeaderboardService {
  private readonly logger = new Logger(ConcentrationLeaderboardService.name);

  constructor(
    @InjectModel(ConcentrationScore.name) private scoreModel: Model<ConcentrationScoreDocument>,
  ) {}

  /**
   * Score formula: pairs trouvées * 100 - moves * 5 - durée(s) * 2.
   * Plus de paires = mieux ; moins de moves et de temps = mieux.
   */
  static computeScore(pairsFound: number, moves: number, durationMs: number): number {
    const sec = durationMs / 1000;
    return Math.max(0, Math.round(pairsFound * 100 - moves * 5 - sec * 2));
  }

  async submitScore(payload: {
    userId: string;
    displayName: string;
    variant: string;
    difficulty?: string;
    pairsFound: number;
    moves: number;
    durationMs: number;
    won?: boolean;
  }): Promise<ConcentrationScore> {
    if (!payload.userId || !payload.variant) {
      throw new Error('userId et variant requis');
    }
    const score = ConcentrationLeaderboardService.computeScore(
      payload.pairsFound, payload.moves, payload.durationMs,
    );
    const doc = new this.scoreModel({
      userId: payload.userId,
      displayName: payload.displayName,
      variant: payload.variant,
      difficulty: payload.difficulty ?? 'medium',
      score,
      pairsFound: payload.pairsFound,
      moves: payload.moves,
      durationMs: payload.durationMs,
      won: payload.won ?? true,
    });
    await doc.save();
    return doc.toObject();
  }

  async getLeaderboard(variant: string, limit = 100): Promise<ConcentrationLeaderboardEntry[]> {
    const cap = Math.min(Math.max(1, limit), 500);
    const docs = await this.scoreModel.aggregate([
      { $match: { variant, won: true } },
      {
        $group: {
          _id: '$userId',
          displayName: { $last: '$displayName' },
          bestScore: { $max: '$score' },
          bestMoves: { $min: '$moves' },
          bestDurationMs: { $min: '$durationMs' },
          totalWins: { $sum: 1 },
        },
      },
      { $sort: { bestScore: -1, bestDurationMs: 1, bestMoves: 1 } },
      { $limit: cap },
    ]).exec();

    return docs.map((d, i) => ({
      rank: i + 1,
      userId: d._id,
      displayName: d.displayName,
      bestScore: d.bestScore ?? 0,
      bestMoves: d.bestMoves ?? 0,
      bestDurationMs: d.bestDurationMs ?? 0,
      totalWins: d.totalWins ?? 0,
    }));
  }

  async getUserRank(userId: string, variant: string): Promise<{
    rank: number; total: number; entry: ConcentrationLeaderboardEntry | null;
  }> {
    const all = await this.getLeaderboard(variant, 500);
    const idx = all.findIndex((e) => e.userId === userId);
    return {
      rank: idx >= 0 ? idx + 1 : -1,
      total: all.length,
      entry: idx >= 0 ? all[idx] : null,
    };
  }

  async getTimeLeaderboard(variant: string, limit = 100): Promise<ConcentrationLeaderboardEntry[]> {
    const cap = Math.min(Math.max(1, limit), 500);
    const docs = await this.scoreModel.aggregate([
      { $match: { variant, won: true, durationMs: { $gt: 0 } } },
      {
        $group: {
          _id: '$userId',
          displayName: { $last: '$displayName' },
          bestScore: { $max: '$score' },
          bestMoves: { $min: '$moves' },
          bestDurationMs: { $min: '$durationMs' },
          totalWins: { $sum: 1 },
        },
      },
      { $sort: { bestDurationMs: 1, bestMoves: 1, bestScore: -1 } },
      { $limit: cap },
    ]).exec();

    return docs.map((d, i) => ({
      rank: i + 1,
      userId: d._id,
      displayName: d.displayName,
      bestScore: d.bestScore ?? 0,
      bestMoves: d.bestMoves ?? 0,
      bestDurationMs: d.bestDurationMs ?? 0,
      totalWins: d.totalWins ?? 0,
    }));
  }

  async getMovesLeaderboard(variant: string, limit = 100): Promise<ConcentrationLeaderboardEntry[]> {
    const cap = Math.min(Math.max(1, limit), 500);
    const docs = await this.scoreModel.aggregate([
      { $match: { variant, won: true, moves: { $gt: 0 } } },
      {
        $group: {
          _id: '$userId',
          displayName: { $last: '$displayName' },
          bestScore: { $max: '$score' },
          bestMoves: { $min: '$moves' },
          bestDurationMs: { $min: '$durationMs' },
          totalWins: { $sum: 1 },
        },
      },
      { $sort: { bestMoves: 1, bestDurationMs: 1, bestScore: -1 } },
      { $limit: cap },
    ]).exec();

    return docs.map((d, i) => ({
      rank: i + 1,
      userId: d._id,
      displayName: d.displayName,
      bestScore: d.bestScore ?? 0,
      bestMoves: d.bestMoves ?? 0,
      bestDurationMs: d.bestDurationMs ?? 0,
      totalWins: d.totalWins ?? 0,
    }));
  }
}
