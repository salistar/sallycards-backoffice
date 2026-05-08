// @sally/social - Game Replay System (Prompt #72)
// Record, store, and playback completed games move-by-move.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReplayPlayer {
  id: string;
  name: string;
}

export interface ReplayMove {
  playerId: string;
  move: any;
  timestamp: number;
  stateAfter: any;
}

export interface GameReplay {
  gameId: string;
  gameType: string;
  players: ReplayPlayer[];
  moves: ReplayMove[];
  duration: number;
  result: {
    winnerId: string | null;
    scores: Record<string, number>;
  };
  createdAt: number;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class ReplayService {
  /**
   * Build a GameReplay from a completed game's history object.
   *
   * Expects `gameHistory` to carry at minimum:
   *  - gameId, gameType, players[], moves[], startTime, endTime, result
   */
  createReplay(gameHistory: any): GameReplay {
    const startTime: number = gameHistory.startTime ?? 0;
    const endTime: number = gameHistory.endTime ?? Date.now();

    return {
      gameId: gameHistory.gameId ?? '',
      gameType: gameHistory.gameType ?? 'unknown',
      players: (gameHistory.players ?? []).map((p: any) => ({
        id: p.id,
        name: p.name ?? p.id,
      })),
      moves: (gameHistory.moves ?? []).map((m: any) => ({
        playerId: m.playerId,
        move: m.move ?? m.action ?? null,
        timestamp: m.timestamp ?? 0,
        stateAfter: m.stateAfter ?? null,
      })),
      duration: endTime - startTime,
      result: {
        winnerId: gameHistory.result?.winnerId ?? null,
        scores: gameHistory.result?.scores ?? {},
      },
      createdAt: Date.now(),
    };
  }

  /**
   * Return the move and resulting state at a specific index.
   * Returns `null` fields when the index is out of range.
   */
  getMoveAtIndex(
    replay: GameReplay,
    index: number,
  ): { move: any; state: any } {
    if (index < 0 || index >= replay.moves.length) {
      return { move: null, state: null };
    }
    const entry = replay.moves[index];
    return { move: entry.move, state: entry.stateAfter };
  }

  /** Total number of moves in the replay. */
  getReplayLength(replay: GameReplay): number {
    return replay.moves.length;
  }

  /** Get the state at a specific percentage of the game (0-100). */
  getStateAtPercentage(
    replay: GameReplay,
    percentage: number,
  ): { move: any; state: any } {
    const clamped = Math.max(0, Math.min(100, percentage));
    const index = Math.floor((clamped / 100) * (replay.moves.length - 1));
    return this.getMoveAtIndex(replay, index);
  }

  /** Return an array of timestamps (ms since game start) for each move. */
  getTimeline(replay: GameReplay): number[] {
    if (replay.moves.length === 0) return [];
    const start = replay.moves[0].timestamp;
    return replay.moves.map((m) => m.timestamp - start);
  }

  /** Get moves filtered by a specific player. */
  getMovesForPlayer(replay: GameReplay, playerId: string): ReplayMove[] {
    return replay.moves.filter((m) => m.playerId === playerId);
  }
}
