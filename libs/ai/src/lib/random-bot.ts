// Random bot for easy difficulty - simple move selection

import { BotConfig } from './bot-personality';
import { BotEngine } from './bot-engine.base';

/**
 * A simple bot that selects moves with varying degrees of randomness.
 * - Easy: pure random selection
 * - Medium: 50% random, 50% prefers capture/high-value moves
 * - Hard: should not be used (use MCTSBot instead)
 */
export class RandomBot<TState, TMove> extends BotEngine<TState, TMove> {
  private moveScorer?: (state: TState, move: TMove) => number;

  constructor(
    config: BotConfig,
    playerId: string,
    moveScorer?: (state: TState, move: TMove) => number,
  ) {
    super(config, playerId);
    this.moveScorer = moveScorer;
  }

  async selectMove(state: TState, validMoves: TMove[]): Promise<TMove> {
    if (validMoves.length === 0) {
      throw new Error('RandomBot: No valid moves provided');
    }
    if (validMoves.length === 1) {
      return validMoves[0];
    }

    // Easy difficulty: pure random
    if (this.config.difficulty === 'easy') {
      return validMoves[Math.floor(Math.random() * validMoves.length)];
    }

    // Medium difficulty: 50% random, 50% greedy (if scorer available)
    if (this.config.difficulty === 'medium') {
      if (Math.random() < 0.5 || !this.moveScorer) {
        return validMoves[Math.floor(Math.random() * validMoves.length)];
      }
      return this.selectGreedy(state, validMoves);
    }

    // Hard: use greedy if scorer available, otherwise random
    if (this.moveScorer) {
      return this.selectGreedy(state, validMoves);
    }
    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }

  /**
   * Select the move with the highest score.
   * Adds some noise based on the bot's memory accuracy (lower accuracy = more noise).
   */
  private selectGreedy(state: TState, validMoves: TMove[]): TMove {
    if (!this.moveScorer) {
      return validMoves[Math.floor(Math.random() * validMoves.length)];
    }

    let bestMove = validMoves[0];
    let bestScore = -Infinity;

    for (const move of validMoves) {
      let score = this.moveScorer(state, move);
      // Add noise inversely proportional to memory accuracy
      const noise = (1 - this.config.memoryAccuracy) * (Math.random() * 2 - 1) * 10;
      score += noise;

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }
}
