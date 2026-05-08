// Poker-specific bot with GTO-inspired decision making

import { Card } from '@sally/shared/types';
import { BotConfig } from '../bot-personality';
import { BotEngine } from '../bot-engine.base';
import { getHandCategory, shouldPlayPreflop, getPreflopRaiseSize, HandCategory } from './gto-ranges';
import { evaluateHand, getHandStrength, HandEvaluation } from './hand-evaluator';

export interface PokerState {
  phase: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
  holeCards: Card[];
  communityCards: Card[];
  pot: number;
  currentBet: number;
  myBet: number;
  myStack: number;
  position: number;       // 0-based seat position
  numPlayers: number;
  numActivePlayers: number;
  bigBlind: number;
  isHeadsUp: boolean;
}

export interface PokerMove {
  type: 'fold' | 'check' | 'call' | 'raise' | 'allIn';
  amount?: number;
}

export class PokerBot extends BotEngine<PokerState, PokerMove> {
  constructor(config: BotConfig, playerId: string) {
    super(config, playerId);
  }

  async selectMove(state: PokerState, validMoves: PokerMove[]): Promise<PokerMove> {
    if (validMoves.length === 0) {
      throw new Error('PokerBot: No valid moves');
    }
    if (validMoves.length === 1) {
      return validMoves[0];
    }

    switch (state.phase) {
      case 'preflop':
        return this.preflopDecision(state, validMoves);
      case 'flop':
      case 'turn':
      case 'river':
        return this.postflopDecision(state, validMoves);
      default:
        return this.findMove(validMoves, 'check') || this.findMove(validMoves, 'fold') || validMoves[0];
    }
  }

  // --------------- Preflop ---------------

  private preflopDecision(state: PokerState, validMoves: PokerMove[]): PokerMove {
    if (state.holeCards.length < 2) {
      return this.findMove(validMoves, 'check') || this.findMove(validMoves, 'fold') || validMoves[0];
    }

    const handCategory = getHandCategory(state.holeCards[0], state.holeCards[1]);
    const shouldPlay = shouldPlayPreflop(handCategory, state.position, state.numPlayers);

    // Apply personality modifiers to decision
    const adjustedShouldPlay = this.adjustPreflopDecision(shouldPlay, handCategory);

    if (!adjustedShouldPlay) {
      return this.findMove(validMoves, 'check') || this.findMove(validMoves, 'fold') || validMoves[0];
    }

    // Determine action: raise or call
    const raiseMove = this.findMove(validMoves, 'raise');
    const callMove = this.findMove(validMoves, 'call');

    // Premium/Strong hands: usually raise
    if (handCategory === 'premium' || handCategory === 'strong') {
      if (raiseMove) {
        const raiseMultiplier = getPreflopRaiseSize(handCategory);
        const raiseAmount = Math.round(state.bigBlind * raiseMultiplier);
        return { type: 'raise', amount: Math.max(raiseAmount, raiseMove.amount || 0) };
      }
      return callMove || this.findMove(validMoves, 'check') || validMoves[0];
    }

    // Playable hands: mix of raise and call
    if (handCategory === 'playable') {
      if (raiseMove && Math.random() < this.config.aggression) {
        const raiseAmount = Math.round(state.bigBlind * 2.5);
        return { type: 'raise', amount: Math.max(raiseAmount, raiseMove.amount || 0) };
      }
      return callMove || this.findMove(validMoves, 'check') || validMoves[0];
    }

    // Marginal hands: mostly call
    return callMove || this.findMove(validMoves, 'check') || this.findMove(validMoves, 'fold') || validMoves[0];
  }

  private adjustPreflopDecision(shouldPlay: boolean, handCategory: HandCategory): boolean {
    // Aggressive bots play more hands
    if (!shouldPlay && this.config.personality === 'aggressive') {
      if (handCategory === 'marginal' && Math.random() < this.config.aggression) {
        return true;
      }
      if (handCategory === 'trash' && Math.random() < this.config.bluffRate) {
        return true;
      }
    }

    // Cautious bots fold more marginal hands
    if (shouldPlay && this.config.personality === 'cautious') {
      if (handCategory === 'marginal' && Math.random() < 0.5) {
        return false;
      }
    }

    // Trickster bots occasionally play trash (bluff)
    if (!shouldPlay && this.config.personality === 'trickster') {
      if (Math.random() < this.config.bluffRate) {
        return true;
      }
    }

    // Beginner bots play too many hands
    if (!shouldPlay && this.config.personality === 'beginner') {
      if (handCategory !== 'trash' && Math.random() < 0.4) {
        return true;
      }
    }

    // Difficulty-based errors
    if (shouldPlay && this.config.difficulty === 'easy' && Math.random() < 0.15) {
      return false; // Occasionally fold good hands
    }

    return shouldPlay;
  }

  // --------------- Postflop ---------------

  private postflopDecision(state: PokerState, validMoves: PokerMove[]): PokerMove {
    const allCards = [...state.holeCards, ...state.communityCards];

    if (allCards.length < 5) {
      // Not enough cards to evaluate, fall back to simple logic
      return this.simplePostflopDecision(state, validMoves);
    }

    const evaluation = evaluateHand(allCards);
    const strength = getHandStrength(evaluation);

    // Calculate pot odds
    const toCall = state.currentBet - state.myBet;
    const potOdds = toCall > 0 ? toCall / (state.pot + toCall) : 0;

    return this.makePostflopAction(state, validMoves, strength, potOdds, evaluation);
  }

  private simplePostflopDecision(state: PokerState, validMoves: PokerMove[]): PokerMove {
    // Without enough cards, use a simple strategy
    const checkMove = this.findMove(validMoves, 'check');
    if (checkMove) return checkMove;

    const callMove = this.findMove(validMoves, 'call');
    const foldMove = this.findMove(validMoves, 'fold');

    // Small bet: call; big bet: fold
    const toCall = state.currentBet - state.myBet;
    if (callMove && toCall <= state.bigBlind * 2) {
      return callMove;
    }

    return foldMove || callMove || validMoves[0];
  }

  private makePostflopAction(
    state: PokerState,
    validMoves: PokerMove[],
    strength: number,
    potOdds: number,
    evaluation: HandEvaluation,
  ): PokerMove {
    const checkMove = this.findMove(validMoves, 'check');
    const callMove = this.findMove(validMoves, 'call');
    const raiseMove = this.findMove(validMoves, 'raise');
    const foldMove = this.findMove(validMoves, 'fold');
    const allInMove = this.findMove(validMoves, 'allIn');

    // Apply personality adjustments to perceived strength
    let adjustedStrength = strength;
    if (this.config.personality === 'aggressive') {
      adjustedStrength += 0.1;
    } else if (this.config.personality === 'cautious') {
      adjustedStrength -= 0.05;
    }

    // Difficulty-based noise
    if (this.config.difficulty === 'easy') {
      adjustedStrength += (Math.random() - 0.5) * 0.3;
    } else if (this.config.difficulty === 'medium') {
      adjustedStrength += (Math.random() - 0.5) * 0.15;
    }

    adjustedStrength = Math.max(0, Math.min(1, adjustedStrength));

    // Monster hand (full house+): bet/raise big or go all-in
    if (evaluation.rankValue >= RANK_VALUES['full_house']) {
      if (allInMove && state.pot > state.myStack * 0.3) {
        return allInMove;
      }
      if (raiseMove) {
        const raiseAmount = Math.round(state.pot * 0.8);
        return { type: 'raise', amount: Math.max(raiseAmount, raiseMove.amount || 0) };
      }
      return callMove || checkMove || validMoves[0];
    }

    // Strong hand (three of a kind, flush, straight): bet/raise
    if (adjustedStrength > 0.6) {
      if (raiseMove && Math.random() < this.config.aggression) {
        const raiseAmount = Math.round(state.pot * (0.5 + this.config.aggression * 0.3));
        return { type: 'raise', amount: Math.max(raiseAmount, raiseMove.amount || 0) };
      }
      return callMove || checkMove || validMoves[0];
    }

    // Medium hand (two pair, one pair): check/call based on pot odds
    if (adjustedStrength > 0.3) {
      if (checkMove) return checkMove;
      if (callMove && adjustedStrength > potOdds) {
        return callMove;
      }
      // Bluff sometimes
      if (raiseMove && Math.random() < this.config.bluffRate) {
        const bluffAmount = Math.round(state.pot * 0.5);
        return { type: 'raise', amount: Math.max(bluffAmount, raiseMove.amount || 0) };
      }
      return foldMove || callMove || validMoves[0];
    }

    // Weak hand: check or fold
    if (checkMove) return checkMove;

    // Trickster may bluff with weak hands
    if (this.config.personality === 'trickster' && raiseMove && Math.random() < this.config.bluffRate) {
      const bluffAmount = Math.round(state.pot * 0.6);
      return { type: 'raise', amount: Math.max(bluffAmount, raiseMove.amount || 0) };
    }

    return foldMove || callMove || validMoves[0];
  }

  // --------------- Helpers ---------------

  private findMove(moves: PokerMove[], type: PokerMove['type']): PokerMove | undefined {
    return moves.find((m) => m.type === type);
  }
}

const RANK_VALUES: Record<string, number> = {
  'high_card': 1,
  'one_pair': 2,
  'two_pair': 3,
  'three_of_a_kind': 4,
  'straight': 5,
  'flush': 6,
  'full_house': 7,
  'four_of_a_kind': 8,
  'straight_flush': 9,
  'royal_flush': 10,
};
