// Abstract base class for all bot engines

import { BotConfig, getBotThinkDelay } from './bot-personality';

export interface BotMoveResult<TMove> {
  move: TMove;
  thinkTimeMs: number;
}

export abstract class BotEngine<TState, TMove> {
  constructor(
    protected config: BotConfig,
    protected playerId: string,
  ) {}

  /**
   * Choose the best move given the current state and list of valid moves.
   * Subclasses implement their own strategy here.
   */
  abstract selectMove(state: TState, validMoves: TMove[]): Promise<TMove>;

  /**
   * Adds a human-like delay before returning the selected move.
   * The total time will be at least the configured think delay,
   * minus any time already spent computing.
   */
  async thinkAndSelect(state: TState, validMoves: TMove[]): Promise<BotMoveResult<TMove>> {
    const startTime = Date.now();
    const move = await this.selectMove(state, validMoves);
    const elapsed = Date.now() - startTime;
    const targetDelay = getBotThinkDelay(this.config);
    const remaining = Math.max(0, targetDelay - elapsed);
    await new Promise((resolve) => setTimeout(resolve, remaining));
    return { move, thinkTimeMs: Date.now() - startTime };
  }
}
