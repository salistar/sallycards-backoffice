// Anti-cheat system for SallyCards - server-side move validation and suspicious pattern detection

export interface MoveRecord {
  playerId: string;
  moveType: string;
  timestamp: number;
  isValid: boolean;
  gameId: string;
}

export interface PlayerStats {
  playerId: string;
  totalGames: number;
  totalWins: number;
  recentMoves: MoveRecord[];
  suspicionScore: number;      // 0-100, higher = more suspicious
  flagged: boolean;
  flagReasons: string[];
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

export interface AntiCheatConfig {
  /** Minimum time between moves in ms (below this = suspicious) */
  minMoveIntervalMs: number;
  /** How many consecutive fast moves trigger a flag */
  fastMoveThreshold: number;
  /** Win rate above this over minGamesForWinRate games triggers flag */
  suspiciousWinRate: number;
  /** Minimum games before win rate check applies */
  minGamesForWinRate: number;
  /** Maximum suspicion score before auto-flag */
  autoFlagThreshold: number;
  /** How many recent moves to keep per player */
  moveHistorySize: number;
}

const DEFAULT_CONFIG: AntiCheatConfig = {
  minMoveIntervalMs: 150,
  fastMoveThreshold: 5,
  suspiciousWinRate: 0.85,
  minGamesForWinRate: 10,
  autoFlagThreshold: 75,
  moveHistorySize: 200,
};

export class AntiCheat {
  private players: Map<string, PlayerStats> = new Map();
  private config: AntiCheatConfig;

  constructor(config: Partial<AntiCheatConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ─── Server-Side Move Validation ──────────────────────────────

  /**
   * Validate that a move is legal in the current game state.
   * This is a generic validator - game-specific rules are passed as a callback.
   */
  validateMove<TState, TMove>(
    state: TState,
    move: TMove,
    playerId: string,
    gameId: string,
    isLegalMove: (state: TState, move: TMove, playerId: string) => boolean,
  ): ValidationResult {
    // Check if it is a legal move according to game rules
    if (!isLegalMove(state, move, playerId)) {
      this.recordSuspiciousActivity(playerId, 'illegal_move', 15);
      return { valid: false, reason: 'Illegal move for the current game state' };
    }

    // Record the move and check timing
    const stats = this.getOrCreateStats(playerId);
    const now = Date.now();

    // Check for impossibly fast moves
    if (stats.recentMoves.length > 0) {
      const lastMove = stats.recentMoves[stats.recentMoves.length - 1];
      const interval = now - lastMove.timestamp;

      if (interval < this.config.minMoveIntervalMs) {
        this.recordSuspiciousActivity(playerId, 'too_fast_move', 5);
      }
    }

    // Record the move
    const record: MoveRecord = {
      playerId,
      moveType: String(move),
      timestamp: now,
      isValid: true,
      gameId,
    };

    stats.recentMoves.push(record);
    if (stats.recentMoves.length > this.config.moveHistorySize) {
      stats.recentMoves.shift();
    }

    return { valid: true };
  }

  // ─── Suspicious Pattern Detection ─────────────────────────────

  /**
   * Analyze a player's recent activity for suspicious patterns.
   * Returns true if player should be flagged.
   */
  analyzePlayer(playerId: string): {
    suspicious: boolean;
    score: number;
    reasons: string[];
  } {
    const stats = this.getOrCreateStats(playerId);
    const reasons: string[] = [];

    // Check for consecutive fast moves
    const fastMoveCount = this.countConsecutiveFastMoves(stats);
    if (fastMoveCount >= this.config.fastMoveThreshold) {
      reasons.push(`${fastMoveCount} consecutive moves faster than ${this.config.minMoveIntervalMs}ms`);
      this.recordSuspiciousActivity(playerId, 'fast_move_streak', 10);
    }

    // Check for impossible win rate
    if (stats.totalGames >= this.config.minGamesForWinRate) {
      const winRate = stats.totalWins / stats.totalGames;
      if (winRate > this.config.suspiciousWinRate) {
        reasons.push(`Win rate ${(winRate * 100).toFixed(1)}% over ${stats.totalGames} games`);
        this.recordSuspiciousActivity(playerId, 'high_win_rate', 20);
      }
    }

    // Check for perfectly consistent timing (bot-like)
    const timingVariance = this.calculateTimingVariance(stats);
    if (timingVariance < 50 && stats.recentMoves.length >= 20) {
      reasons.push('Suspiciously consistent move timing');
      this.recordSuspiciousActivity(playerId, 'consistent_timing', 10);
    }

    // Check for rapid game completions
    const rapidGames = this.countRapidGames(stats);
    if (rapidGames >= 3) {
      reasons.push(`${rapidGames} games completed in under 30 seconds`);
      this.recordSuspiciousActivity(playerId, 'rapid_games', 15);
    }

    const suspicious = stats.suspicionScore >= this.config.autoFlagThreshold;
    if (suspicious && !stats.flagged) {
      stats.flagged = true;
      stats.flagReasons = reasons;
    }

    return {
      suspicious,
      score: stats.suspicionScore,
      reasons,
    };
  }

  /**
   * Record the result of a completed game.
   */
  recordGameResult(playerId: string, won: boolean): void {
    const stats = this.getOrCreateStats(playerId);
    stats.totalGames++;
    if (won) {
      stats.totalWins++;
    }
  }

  /**
   * Get a player's current suspicion score.
   */
  getSuspicionScore(playerId: string): number {
    return this.getOrCreateStats(playerId).suspicionScore;
  }

  /**
   * Check if a player is flagged.
   */
  isFlagged(playerId: string): boolean {
    return this.getOrCreateStats(playerId).flagged;
  }

  /**
   * Manually clear a player's flag (admin action).
   */
  clearFlag(playerId: string): void {
    const stats = this.getOrCreateStats(playerId);
    stats.flagged = false;
    stats.flagReasons = [];
    stats.suspicionScore = Math.max(0, stats.suspicionScore - 30);
  }

  /**
   * Reset all data for a player.
   */
  resetPlayer(playerId: string): void {
    this.players.delete(playerId);
  }

  /**
   * Get stats for a player (read-only copy).
   */
  getPlayerStats(playerId: string): Readonly<PlayerStats> | undefined {
    const stats = this.players.get(playerId);
    return stats ? { ...stats, recentMoves: [...stats.recentMoves], flagReasons: [...stats.flagReasons] } : undefined;
  }

  // ─── Internal Helpers ─────────────────────────────────────────

  private getOrCreateStats(playerId: string): PlayerStats {
    let stats = this.players.get(playerId);
    if (!stats) {
      stats = {
        playerId,
        totalGames: 0,
        totalWins: 0,
        recentMoves: [],
        suspicionScore: 0,
        flagged: false,
        flagReasons: [],
      };
      this.players.set(playerId, stats);
    }
    return stats;
  }

  private recordSuspiciousActivity(playerId: string, _type: string, points: number): void {
    const stats = this.getOrCreateStats(playerId);
    stats.suspicionScore = Math.min(100, stats.suspicionScore + points);
  }

  /**
   * Count how many consecutive recent moves were faster than the minimum interval.
   */
  private countConsecutiveFastMoves(stats: PlayerStats): number {
    const moves = stats.recentMoves;
    if (moves.length < 2) return 0;

    let count = 0;
    for (let i = moves.length - 1; i > 0; i--) {
      const interval = moves[i].timestamp - moves[i - 1].timestamp;
      if (interval < this.config.minMoveIntervalMs) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  /**
   * Calculate timing variance across recent moves.
   * Low variance = suspiciously consistent (bot-like).
   */
  private calculateTimingVariance(stats: PlayerStats): number {
    const moves = stats.recentMoves;
    if (moves.length < 3) return Infinity;

    const intervals: number[] = [];
    for (let i = 1; i < moves.length; i++) {
      intervals.push(moves[i].timestamp - moves[i - 1].timestamp);
    }

    const mean = intervals.reduce((sum, v) => sum + v, 0) / intervals.length;
    const variance = intervals.reduce((sum, v) => sum + (v - mean) ** 2, 0) / intervals.length;
    return Math.sqrt(variance);
  }

  /**
   * Count games that were completed in under 30 seconds (based on move timestamps).
   */
  private countRapidGames(stats: PlayerStats): number {
    const moves = stats.recentMoves;
    if (moves.length < 2) return 0;

    // Group moves by gameId
    const gameTimestamps = new Map<string, { first: number; last: number; count: number }>();
    for (const move of moves) {
      const entry = gameTimestamps.get(move.gameId);
      if (!entry) {
        gameTimestamps.set(move.gameId, { first: move.timestamp, last: move.timestamp, count: 1 });
      } else {
        entry.last = Math.max(entry.last, move.timestamp);
        entry.count++;
      }
    }

    let rapidCount = 0;
    for (const [, entry] of gameTimestamps) {
      const duration = entry.last - entry.first;
      // Game with multiple moves completed in under 30 seconds
      if (duration < 30000 && entry.count >= 5) {
        rapidCount++;
      }
    }

    return rapidCount;
  }

  /**
   * Decay suspicion scores over time (call periodically, e.g. every hour).
   * Reduces scores by the given percentage (0-1).
   */
  decaySuspicionScores(decayRate: number = 0.1): void {
    for (const [, stats] of this.players) {
      if (!stats.flagged) {
        stats.suspicionScore = Math.max(0, stats.suspicionScore * (1 - decayRate));
      }
    }
  }
}
