// Full Texas Hold'em hand evaluator - evaluates 5-7 card hands

import { Card } from '@sally/shared/types';

export type HandRank =
  | 'royal_flush'
  | 'straight_flush'
  | 'four_of_a_kind'
  | 'full_house'
  | 'flush'
  | 'straight'
  | 'three_of_a_kind'
  | 'two_pair'
  | 'one_pair'
  | 'high_card';

export interface HandEvaluation {
  rank: HandRank;
  rankValue: number;   // 1 (high card) to 10 (royal flush)
  tiebreaker: number[];
  bestCards: Card[];
  description: string;
}

const RANK_VALUES: Record<HandRank, number> = {
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

const VALUE_NAMES: Record<number, string> = {
  14: 'Ace', 13: 'King', 12: 'Queen', 11: 'Jack', 10: 'Ten',
  9: 'Nine', 8: 'Eight', 7: 'Seven', 6: 'Six', 5: 'Five',
  4: 'Four', 3: 'Three', 2: 'Two',
};

const PLURAL_NAMES: Record<number, string> = {
  14: 'Aces', 13: 'Kings', 12: 'Queens', 11: 'Jacks', 10: 'Tens',
  9: 'Nines', 8: 'Eights', 7: 'Sevens', 6: 'Sixes', 5: 'Fives',
  4: 'Fours', 3: 'Threes', 2: 'Twos',
};

/**
 * Normalize a card value: Ace = 14, everything else stays.
 */
function normalizeValue(value: number): number {
  return value === 1 ? 14 : value;
}

/**
 * Get all 5-card combinations from a set of cards.
 */
function getCombinations(cards: Card[], k: number): Card[][] {
  if (k === 0) return [[]];
  if (cards.length < k) return [];

  const results: Card[][] = [];
  for (let i = 0; i <= cards.length - k; i++) {
    const rest = getCombinations(cards.slice(i + 1), k - 1);
    for (const combo of rest) {
      results.push([cards[i], ...combo]);
    }
  }
  return results;
}

/**
 * Evaluate exactly 5 cards and return the hand evaluation.
 */
function evaluate5Cards(cards: Card[]): HandEvaluation {
  const values = cards.map((c) => normalizeValue(c.value)).sort((a, b) => b - a);
  const suits = cards.map((c) => c.suit);

  // Count occurrences of each value
  const valueCounts = new Map<number, number>();
  for (const v of values) {
    valueCounts.set(v, (valueCounts.get(v) || 0) + 1);
  }

  // Sort by count desc, then value desc
  const groups = Array.from(valueCounts.entries()).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return b[0] - a[0];
  });

  // Check flush
  const isFlush = suits.every((s) => s === suits[0]);

  // Check straight
  let isStraight = false;
  let straightHigh = 0;
  const uniqueValues = [...new Set(values)].sort((a, b) => b - a);

  if (uniqueValues.length >= 5) {
    // Normal straight check
    for (let i = 0; i <= uniqueValues.length - 5; i++) {
      if (uniqueValues[i] - uniqueValues[i + 4] === 4) {
        isStraight = true;
        straightHigh = uniqueValues[i];
        break;
      }
    }
    // Wheel (A-2-3-4-5)
    if (!isStraight && uniqueValues.includes(14) && uniqueValues.includes(2) &&
        uniqueValues.includes(3) && uniqueValues.includes(4) && uniqueValues.includes(5)) {
      isStraight = true;
      straightHigh = 5; // 5-high straight
    }
  }

  // Royal flush
  if (isFlush && isStraight && straightHigh === 14) {
    return {
      rank: 'royal_flush',
      rankValue: RANK_VALUES['royal_flush'],
      tiebreaker: [14],
      bestCards: [...cards],
      description: 'Royal Flush',
    };
  }

  // Straight flush
  if (isFlush && isStraight) {
    return {
      rank: 'straight_flush',
      rankValue: RANK_VALUES['straight_flush'],
      tiebreaker: [straightHigh],
      bestCards: [...cards],
      description: `Straight Flush, ${VALUE_NAMES[straightHigh]} high`,
    };
  }

  // Four of a kind
  if (groups[0][1] === 4) {
    const quadValue = groups[0][0];
    const kicker = groups[1][0];
    return {
      rank: 'four_of_a_kind',
      rankValue: RANK_VALUES['four_of_a_kind'],
      tiebreaker: [quadValue, kicker],
      bestCards: [...cards],
      description: `Four of a Kind, ${PLURAL_NAMES[quadValue]}`,
    };
  }

  // Full house
  if (groups[0][1] === 3 && groups[1][1] === 2) {
    const tripValue = groups[0][0];
    const pairValue = groups[1][0];
    return {
      rank: 'full_house',
      rankValue: RANK_VALUES['full_house'],
      tiebreaker: [tripValue, pairValue],
      bestCards: [...cards],
      description: `Full House, ${PLURAL_NAMES[tripValue]} over ${PLURAL_NAMES[pairValue]}`,
    };
  }

  // Flush
  if (isFlush) {
    return {
      rank: 'flush',
      rankValue: RANK_VALUES['flush'],
      tiebreaker: values,
      bestCards: [...cards],
      description: `Flush, ${VALUE_NAMES[values[0]]} high`,
    };
  }

  // Straight
  if (isStraight) {
    return {
      rank: 'straight',
      rankValue: RANK_VALUES['straight'],
      tiebreaker: [straightHigh],
      bestCards: [...cards],
      description: `Straight, ${VALUE_NAMES[straightHigh]} high`,
    };
  }

  // Three of a kind
  if (groups[0][1] === 3) {
    const tripValue = groups[0][0];
    const kickers = groups.slice(1).map((g) => g[0]);
    return {
      rank: 'three_of_a_kind',
      rankValue: RANK_VALUES['three_of_a_kind'],
      tiebreaker: [tripValue, ...kickers],
      bestCards: [...cards],
      description: `Three of a Kind, ${PLURAL_NAMES[tripValue]}`,
    };
  }

  // Two pair
  if (groups[0][1] === 2 && groups[1][1] === 2) {
    const highPair = Math.max(groups[0][0], groups[1][0]);
    const lowPair = Math.min(groups[0][0], groups[1][0]);
    const kicker = groups[2][0];
    return {
      rank: 'two_pair',
      rankValue: RANK_VALUES['two_pair'],
      tiebreaker: [highPair, lowPair, kicker],
      bestCards: [...cards],
      description: `Two Pair, ${PLURAL_NAMES[highPair]} and ${PLURAL_NAMES[lowPair]}`,
    };
  }

  // One pair
  if (groups[0][1] === 2) {
    const pairValue = groups[0][0];
    const kickers = groups.slice(1).map((g) => g[0]).sort((a, b) => b - a);
    return {
      rank: 'one_pair',
      rankValue: RANK_VALUES['one_pair'],
      tiebreaker: [pairValue, ...kickers],
      bestCards: [...cards],
      description: `Pair of ${PLURAL_NAMES[pairValue]}`,
    };
  }

  // High card
  return {
    rank: 'high_card',
    rankValue: RANK_VALUES['high_card'],
    tiebreaker: values,
    bestCards: [...cards],
    description: `${VALUE_NAMES[values[0]]} High`,
  };
}

/**
 * Evaluate a poker hand of 5-7 cards.
 * For 6 or 7 cards, finds the best 5-card combination.
 */
export function evaluateHand(cards: Card[]): HandEvaluation {
  if (cards.length < 5) {
    throw new Error(`Need at least 5 cards to evaluate, got ${cards.length}`);
  }

  if (cards.length === 5) {
    return evaluate5Cards(cards);
  }

  // For 6 or 7 cards, try all 5-card combinations and pick the best
  const combos = getCombinations(cards, 5);
  let bestEval: HandEvaluation | null = null;

  for (const combo of combos) {
    const evaluation = evaluate5Cards(combo);
    if (!bestEval || compareHands(evaluation, bestEval) > 0) {
      bestEval = evaluation;
    }
  }

  return bestEval!;
}

/**
 * Compare two hand evaluations.
 * Returns 1 if hand1 wins, -1 if hand2 wins, 0 if tie.
 */
export function compareHands(hand1: HandEvaluation, hand2: HandEvaluation): -1 | 0 | 1 {
  // Compare rank value first
  if (hand1.rankValue > hand2.rankValue) return 1;
  if (hand1.rankValue < hand2.rankValue) return -1;

  // Same rank - compare tiebreakers
  const len = Math.max(hand1.tiebreaker.length, hand2.tiebreaker.length);
  for (let i = 0; i < len; i++) {
    const a = hand1.tiebreaker[i] ?? 0;
    const b = hand2.tiebreaker[i] ?? 0;
    if (a > b) return 1;
    if (a < b) return -1;
  }

  return 0;
}

/**
 * Calculate hand strength as a percentage (0-1).
 * Useful for bot decision making.
 */
export function getHandStrength(evaluation: HandEvaluation): number {
  // Base strength from rank
  const baseStrength = (evaluation.rankValue - 1) / 9; // 0 to 1

  // Fine-tune with tiebreaker (high card value)
  const tiebreakerBonus = evaluation.tiebreaker.length > 0
    ? (evaluation.tiebreaker[0] - 2) / 12 * 0.05
    : 0;

  return Math.min(1, baseStrength + tiebreakerBonus);
}
