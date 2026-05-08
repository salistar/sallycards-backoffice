// MCTS-based bot engine

import { BotConfig } from '../bot-personality';
import { BotEngine } from '../bot-engine.base';
import { MCTS, MCTSGameAdapter } from './mcts';

export class MCTSBot<TState, TMove> extends BotEngine<TState, TMove> {
  constructor(
    config: BotConfig,
    playerId: string,
    private adapter: MCTSGameAdapter<TState, TMove>,
  ) {
    super(config, playerId);
  }

  async selectMove(state: TState, validMoves: TMove[]): Promise<TMove> {
    if (validMoves.length === 0) {
      throw new Error('MCTSBot: No valid moves provided');
    }
    if (validMoves.length === 1) {
      return validMoves[0];
    }

    // Adjust simulation count based on difficulty
    const simCount =
      this.config.difficulty === 'easy'
        ? 100
        : this.config.difficulty === 'medium'
          ? 500
          : 2000;

    // Adjust exploration constant based on personality
    let explorationConstant = 1.414;
    switch (this.config.personality) {
      case 'aggressive':
        explorationConstant = 1.0; // less exploration, more exploitation
        break;
      case 'cautious':
        explorationConstant = 2.0; // more exploration, safer plays
        break;
      case 'trickster':
        explorationConstant = 1.8; // more exploration, surprising moves
        break;
      case 'beginner':
        explorationConstant = 2.5; // very exploratory (less optimal)
        break;
      case 'balanced':
      default:
        explorationConstant = 1.414;
        break;
    }

    const mcts = new MCTS<TState, TMove>(
      this.adapter,
      this.playerId,
      simCount,
      explorationConstant,
    );

    const bestMove = mcts.findBestMove(state);

    // For easy/beginner: sometimes pick a random move instead (mistake simulation)
    if (this.config.difficulty === 'easy' && Math.random() < 0.3) {
      return validMoves[Math.floor(Math.random() * validMoves.length)];
    }

    // For trickster personality: occasionally pick 2nd best move for unpredictability
    if (this.config.personality === 'trickster' && Math.random() < this.config.bluffRate) {
      const otherMoves = validMoves.filter((m) => m !== bestMove);
      if (otherMoves.length > 0) {
        return otherMoves[Math.floor(Math.random() * otherMoves.length)];
      }
    }

    return bestMove;
  }
}
