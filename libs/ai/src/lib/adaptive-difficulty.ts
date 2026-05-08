// Adaptive difficulty system - adjusts bot challenge level based on player performance

export interface DifficultyAdjustments {
  memoryAccuracy: number;   // modifier to bot's memory (-0.3 to +0.3)
  bluffRate: number;        // modifier to bot's bluff rate (-0.15 to +0.15)
  simulationBonus: number;  // extra MCTS simulations (-500 to +500)
}

export class AdaptiveDifficulty {
  private hiddenLevel: number;
  private recentResults: boolean[] = [];
  private readonly maxHistory = 20;

  constructor(initialLevel: number = 50) {
    this.hiddenLevel = Math.max(0, Math.min(100, initialLevel));
  }

  /**
   * Adjust difficulty after a game based on result.
   * @param playerWon - Whether the human player won
   * @param margin - How decisive the victory was (0-1, 1 = total domination)
   */
  adjustAfterGame(playerWon: boolean, margin: number = 0.5): void {
    const clampedMargin = Math.max(0, Math.min(1, margin));

    this.recentResults.push(playerWon);
    if (this.recentResults.length > this.maxHistory) {
      this.recentResults.shift();
    }

    let delta: number;

    if (playerWon) {
      // Player won: increase difficulty
      // Larger margin = bigger increase, but capped at 5
      delta = 1 + clampedMargin * 4; // 1-5
    } else {
      // Player lost: decrease difficulty
      delta = -(1 + clampedMargin * 4); // -1 to -5
    }

    // Check for streaks - accelerate adjustment during streaks
    const streakLength = this.getCurrentStreak();
    if (streakLength >= 3) {
      delta *= 1.2;
    }
    if (streakLength >= 5) {
      delta *= 1.5;
    }

    // Smooth: max change per game is +-5
    delta = Math.max(-5, Math.min(5, delta));

    this.hiddenLevel = Math.max(0, Math.min(100, this.hiddenLevel + delta));
  }

  /**
   * Get bot config adjustments based on current hidden level.
   */
  getAdjustments(): DifficultyAdjustments {
    // Map 0-100 to adjustment ranges
    const normalized = this.hiddenLevel / 100; // 0 to 1

    return {
      // Memory accuracy: -0.3 at level 0, +0.3 at level 100
      memoryAccuracy: (normalized - 0.5) * 0.6,

      // Bluff rate: -0.15 at level 0, +0.15 at level 100
      bluffRate: (normalized - 0.5) * 0.3,

      // Simulation bonus: -500 at level 0, +500 at level 100
      simulationBonus: Math.round((normalized - 0.5) * 1000),
    };
  }

  /**
   * Get the current hidden difficulty level (0-100).
   */
  getLevel(): number {
    return Math.round(this.hiddenLevel);
  }

  /**
   * Get the player's win rate from recent games.
   */
  getWinRate(): number {
    if (this.recentResults.length === 0) return 0.5;
    const wins = this.recentResults.filter((r) => r).length;
    return wins / this.recentResults.length;
  }

  /**
   * Get the current win/loss streak length.
   * Positive = winning streak, negative = losing streak.
   */
  getCurrentStreak(): number {
    if (this.recentResults.length === 0) return 0;

    const lastResult = this.recentResults[this.recentResults.length - 1];
    let streak = 0;

    for (let i = this.recentResults.length - 1; i >= 0; i--) {
      if (this.recentResults[i] === lastResult) {
        streak++;
      } else {
        break;
      }
    }

    return lastResult ? streak : -streak;
  }

  /**
   * Reset the adaptive difficulty to its initial state.
   */
  reset(level: number = 50): void {
    this.hiddenLevel = Math.max(0, Math.min(100, level));
    this.recentResults = [];
  }

  /**
   * Serialize the state for persistence.
   */
  serialize(): { level: number; results: boolean[] } {
    return {
      level: this.hiddenLevel,
      results: [...this.recentResults],
    };
  }

  /**
   * Restore from serialized state.
   */
  static deserialize(data: { level: number; results: boolean[] }): AdaptiveDifficulty {
    const ad = new AdaptiveDifficulty(data.level);
    ad.recentResults = [...data.results];
    return ad;
  }
}
