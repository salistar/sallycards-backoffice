import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SolitaireScore, SolitaireScoreDocument } from './schemas/solitaire-score.schema';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  bestScore: number;
  bestMoves: number;
  bestDurationMs: number;
  totalWins: number;
}

@Injectable()
export class SolitaireLeaderboardService {
  private readonly logger = new Logger(SolitaireLeaderboardService.name);

  constructor(
    @InjectModel(SolitaireScore.name) private scoreModel: Model<SolitaireScoreDocument>,
  ) {}

  /** Soumet un score (idempotent : on accepte les doublons, on aggrège côté lecture). */
  async submitScore(payload: {
    userId: string;
    displayName: string;
    variant: string;
    difficulty?: string;
    score: number;
    moves: number;
    durationMs: number;
    won?: boolean;
  }): Promise<SolitaireScore> {
    if (!payload.userId || !payload.variant) {
      throw new Error('userId et variant requis');
    }
    const doc = new this.scoreModel({
      userId: payload.userId,
      displayName: payload.displayName,
      variant: payload.variant,
      difficulty: payload.difficulty ?? 'medium',
      score: payload.score,
      moves: payload.moves,
      durationMs: payload.durationMs,
      won: payload.won ?? true,
    });
    await doc.save();
    return doc.toObject();
  }

  /**
   * Top N joueurs pour une variante donnée.
   * Tri : score DESC d'abord, puis durée ASC (meilleur temps), puis moves ASC.
   * Aggrège par userId pour 1 entrée par joueur (best score / fewest moves / fastest).
   */
  async getLeaderboard(variant: string, limit = 100): Promise<LeaderboardEntry[]> {
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

  /** Rang d'un user spécifique pour une variante. */
  async getUserRank(userId: string, variant: string): Promise<{
    rank: number; total: number; entry: LeaderboardEntry | null;
  }> {
    const all = await this.getLeaderboard(variant, 500);
    const idx = all.findIndex((e) => e.userId === userId);
    return {
      rank: idx >= 0 ? idx + 1 : -1,
      total: all.length,
      entry: idx >= 0 ? all[idx] : null,
    };
  }

  /**
   * Time-attack leaderboard : tri par durée ASC (plus rapide d'abord).
   * Toujours filtré sur won=true et durationMs > 0.
   */
  async getTimeLeaderboard(variant: string, limit = 100): Promise<LeaderboardEntry[]> {
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

  /** Fewest-moves leaderboard. */
  async getMovesLeaderboard(variant: string, limit = 100): Promise<LeaderboardEntry[]> {
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
