import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

interface GameResult {
  gameType: string;
  gameId?: string;
  players: { userId: string; username?: string; placement: number; score?: number; isBot?: boolean }[];
  durationMs?: number;
  mode?: string;
}

@Injectable()
export class GamesService {
  private readonly logger = new Logger(GamesService.name);

  constructor(@InjectConnection() private readonly conn: Connection) {}

  async makeMove(gameId: string, userId: string, move: any) {
    if (!gameId || !userId || !move) {
      throw new BadRequestException('Missing required move parameters');
    }
    this.logger.log(`Move in game ${gameId} by ${userId}`);
    return {
      gameId, move, result: 'accepted',
      nextTurn: 'opponent',
      timestamp: new Date().toISOString(),
    };
  }

  async getGame(gameId: string) {
    return {
      id: gameId, status: 'in_progress',
      players: [], currentTurn: null, state: {},
      createdAt: new Date().toISOString(),
    };
  }

  async getHistory(gameId: string) {
    return { gameId, moves: [], totalMoves: 0 };
  }

  /**
   * Called by the client (or by the socket-server on game-end) to persist
   * results + bump ELO / stats / achievements for each human player.
   *
   * Returns per-player delta so the UI can animate the ELO change.
   */
  async completeGame(result: GameResult) {
    const { gameType, players, durationMs = 0, mode = 'online' } = result;
    const col = `${gameType}_users`;
    const now = new Date();
    const { ObjectId } = require('mongodb');

    // Simple ELO-light: winner +12, loser -8, draw/middle -2 to +2
    const humans = players.filter((p) => !p.isBot);
    const deltas: Record<string, number> = {};
    humans.forEach((p) => {
      if (p.placement === 1) deltas[p.userId] = +12;
      else if (p.placement === 2) deltas[p.userId] = +4;
      else if (p.placement === 3) deltas[p.userId] = -4;
      else deltas[p.userId] = -8;
    });

    const out: any = { updated: [] };
    for (const p of humans) {
      const _id = (() => { try { return new ObjectId(p.userId); } catch { return p.userId; } })();
      const didWin = p.placement === 1;
      const inc: any = {
        'stats.gamesPlayed': 1,
        'stats.gamesWon': didWin ? 1 : 0,
        'stats.gamesLost': didWin ? 0 : 1,
        'stats.elo': deltas[p.userId],
        'stats.totalPlayTimeMs': durationMs,
      };
      // win streak bookkeeping handled in second pass
      await (this.conn.collection(col) as any).updateOne(
        { _id },
        { $inc: inc, $set: { 'stats.lastGameAt': now, updatedAt: now } },
      );

      // Win-streak logic
      if (didWin) {
        await (this.conn.collection(col) as any).updateOne(
          { _id },
          { $inc: { 'stats.winStreak': 1 } },
        );
        const userNow = await this.conn.collection(col).findOne({ _id }, { projection: { stats: 1 } });
        if (userNow && userNow.stats?.winStreak > (userNow.stats?.bestWinStreak || 0)) {
          await (this.conn.collection(col) as any).updateOne(
            { _id },
            { $set: { 'stats.bestWinStreak': userNow.stats.winStreak } },
          );
        }
      } else {
        await (this.conn.collection(col) as any).updateOne(
          { _id },
          { $set: { 'stats.winStreak': 0 } },
        );
      }

      // Push recent game entry (cap at 10)
      await (this.conn.collection(col) as any).updateOne(
        { _id },
        {
          $push: {
            recentGames: {
              $each: [{
                gameId: result.gameId || ('g-' + Date.now()),
                opponent: humans.find((o) => o.userId !== p.userId)?.username || 'Bot',
                result: didWin ? 'win' : 'loss',
                eloChange: deltas[p.userId],
                playedAt: now,
                durationMs,
              }],
              $slice: -10,
            },
          },
        },
      );

      out.updated.push({ userId: p.userId, eloDelta: deltas[p.userId], won: didWin });
    }

    // Persist full history record
    await this.conn.collection('gamehistories').insertOne({
      gameId: result.gameId || 'g-' + Date.now(),
      gameType,
      players,
      durationMs,
      mode,
      endedAt: now,
      startedAt: new Date(now.getTime() - durationMs),
    });

    this.logger.log(`Game completed: ${gameType} (${players.length}p, ${mode}) → ${humans.length} human stats bumped`);
    return out;
  }

  /**
   * Persist a SOLO game result (no opponents — Solitaire, etc.).
   * Updates the user's per-game stats (gamesPlayed, gamesWon, bestScore,
   * bestTimeMs, bestMoves, winStreak) and inserts a `solohistories` record.
   *
   * Variant-aware: each variant has its own bestScore/bestTimeMs.
   */
  async saveSoloGame(input: {
    userId: string;
    gameType: string;
    variant: string;
    score: number;
    moves: number;
    durationMs: number;
    won: boolean;
    difficulty?: 'easy' | 'medium' | 'hard';
    hintsUsed?: number;
  }) {
    const { userId, gameType, variant, score, moves, durationMs, won, difficulty, hintsUsed = 0 } = input;
    if (!userId || !gameType || !variant) {
      throw new BadRequestException('Missing userId / gameType / variant');
    }
    const col = `${gameType}_users`;
    const now = new Date();
    const { ObjectId } = require('mongodb');
    const _id = (() => { try { return new ObjectId(userId); } catch { return userId; } })();

    const inc: any = {
      'stats.gamesPlayed': 1,
      'stats.gamesWon': won ? 1 : 0,
      'stats.gamesLost': won ? 0 : 1,
      'stats.totalPlayTimeMs': durationMs,
      'stats.totalHintsUsed': hintsUsed,
      [`stats.byVariant.${variant}.played`]: 1,
      [`stats.byVariant.${variant}.won`]: won ? 1 : 0,
      [`stats.byVariant.${variant}.hintsUsed`]: hintsUsed,
    };
    if (difficulty) {
      inc[`stats.byDifficulty.${difficulty}.played`] = 1;
      inc[`stats.byDifficulty.${difficulty}.won`] = won ? 1 : 0;
      inc[`stats.byVariant.${variant}.byDifficulty.${difficulty}.played`] = 1;
      inc[`stats.byVariant.${variant}.byDifficulty.${difficulty}.won`] = won ? 1 : 0;
    }
    await (this.conn.collection(col) as any).updateOne(
      { _id },
      { $inc: inc, $set: { 'stats.lastGameAt': now, updatedAt: now } },
      { upsert: false },
    );

    // Win-streak bookkeeping for solo
    if (won) {
      await (this.conn.collection(col) as any).updateOne(
        { _id },
        { $inc: { 'stats.winStreak': 1 } },
      );
      const u = await this.conn.collection(col).findOne({ _id }, { projection: { stats: 1 } });
      if (u && u.stats?.winStreak > (u.stats?.bestWinStreak || 0)) {
        await (this.conn.collection(col) as any).updateOne(
          { _id },
          { $set: { 'stats.bestWinStreak': u.stats.winStreak } },
        );
      }
    } else {
      await (this.conn.collection(col) as any).updateOne(
        { _id },
        { $set: { 'stats.winStreak': 0 } },
      );
    }

    // Per-variant best-score / best-time / best-moves (only on win)
    if (won) {
      const u = await this.conn.collection(col).findOne(
        { _id },
        { projection: { stats: 1 } },
      );
      const cur = u?.stats?.byVariant?.[variant] || {};
      const set: any = {};
      if (score > (cur.bestScore || 0)) set[`stats.byVariant.${variant}.bestScore`] = score;
      if (!cur.bestTimeMs || durationMs < cur.bestTimeMs) set[`stats.byVariant.${variant}.bestTimeMs`] = durationMs;
      if (!cur.bestMoves || moves < cur.bestMoves) set[`stats.byVariant.${variant}.bestMoves`] = moves;
      if (Object.keys(set).length > 0) {
        await (this.conn.collection(col) as any).updateOne({ _id }, { $set: set });
      }
    }

    // Recent solo game entry (cap at 10)
    await (this.conn.collection(col) as any).updateOne(
      { _id },
      {
        $push: {
          recentGames: {
            $each: [{
              gameId: 's-' + Date.now(),
              variant, mode: 'solo',
              result: won ? 'win' : 'loss',
              score, moves, durationMs,
              difficulty, hintsUsed,
              playedAt: now,
            }],
            $slice: -10,
          },
        },
      },
    );

    // Persist a dedicated solo history record (good for analytics)
    await this.conn.collection('solohistories').insertOne({
      userId, gameType, variant,
      score, moves, durationMs, won,
      difficulty, hintsUsed,
      playedAt: now,
    });

    this.logger.log(`Solo ${gameType}/${variant}: u=${userId} score=${score} moves=${moves} won=${won}`);
    return { success: true, gameType, variant, won, score };
  }
}
