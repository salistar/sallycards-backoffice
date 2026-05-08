// Preflop GTO hand ranges for Texas Hold'em poker bot

import { Card } from '@sally/shared/types';

export type HandCategory = 'premium' | 'strong' | 'playable' | 'marginal' | 'trash';

/**
 * All 169 distinct starting hands mapped to categories.
 * "s" = suited, "o" = offsuit, pairs have no suffix.
 */
export const PREFLOP_RANGES: Record<string, HandCategory> = {
  // Premium (top ~3%)
  'AA': 'premium', 'KK': 'premium', 'QQ': 'premium', 'JJ': 'premium', 'AKs': 'premium',

  // Strong (top ~10%)
  'AKo': 'strong', 'TT': 'strong', 'AQs': 'strong', 'AQo': 'strong', 'AJs': 'strong',
  'KQs': 'strong', '99': 'strong', 'ATs': 'strong',

  // Playable (top ~25%)
  'AJo': 'playable', 'KQo': 'playable', 'KJs': 'playable', 'QJs': 'playable',
  '88': 'playable', '77': 'playable', 'ATo': 'playable', 'KTs': 'playable',
  'QTs': 'playable', 'JTs': 'playable', 'A9s': 'playable', 'A8s': 'playable',
  'A7s': 'playable', 'A6s': 'playable', 'A5s': 'playable', 'A4s': 'playable',
  'A3s': 'playable', 'A2s': 'playable', 'KJo': 'playable', '66': 'playable',

  // Marginal (top ~45%)
  'QJo': 'marginal', 'KTo': 'marginal', 'QTo': 'marginal', 'JTo': 'marginal',
  '55': 'marginal', '44': 'marginal', '33': 'marginal', '22': 'marginal',
  'K9s': 'marginal', 'K8s': 'marginal', 'K7s': 'marginal', 'K6s': 'marginal',
  'K5s': 'marginal', 'K4s': 'marginal', 'K3s': 'marginal', 'K2s': 'marginal',
  'Q9s': 'marginal', 'Q8s': 'marginal', 'J9s': 'marginal', 'J8s': 'marginal',
  'T9s': 'marginal', 'T8s': 'marginal', '98s': 'marginal', '97s': 'marginal',
  '87s': 'marginal', '76s': 'marginal', '65s': 'marginal', '54s': 'marginal',
  'A9o': 'marginal', 'A8o': 'marginal', 'A7o': 'marginal',

  // Everything else is trash
};

const VALUE_MAP: Record<number, string> = {
  14: 'A', 13: 'K', 12: 'Q', 11: 'J', 10: 'T',
  9: '9', 8: '8', 7: '7', 6: '6', 5: '5', 4: '4', 3: '3', 2: '2',
  1: 'A', // Ace can be 1 in some systems
};

/**
 * Determine if two cards are the same suit.
 */
function isSuited(card1: Card, card2: Card): boolean {
  return card1.suit === card2.suit;
}

/**
 * Normalize a card value to the 2-14 range (Ace = 14).
 */
function normalizeValue(value: number): number {
  if (value === 1) return 14;
  return value;
}

/**
 * Get the standard hand notation (e.g., "AKs", "72o", "TT").
 */
export function getHandNotation(card1: Card, card2: Card): string {
  const v1 = normalizeValue(card1.value);
  const v2 = normalizeValue(card2.value);

  const high = Math.max(v1, v2);
  const low = Math.min(v1, v2);

  const highStr = VALUE_MAP[high] || String(high);
  const lowStr = VALUE_MAP[low] || String(low);

  if (high === low) {
    return `${highStr}${lowStr}`;
  }

  const suffix = isSuited(card1, card2) ? 's' : 'o';
  return `${highStr}${lowStr}${suffix}`;
}

/**
 * Get the hand category for two hole cards.
 */
export function getHandCategory(card1: Card, card2: Card): HandCategory {
  const notation = getHandNotation(card1, card2);
  return PREFLOP_RANGES[notation] || 'trash';
}

/**
 * Determine if a hand should be played preflop, based on position and player count.
 * position: 0 = early, higher = later (button = numPlayers - 1)
 */
export function shouldPlayPreflop(
  hand: HandCategory,
  position: number,
  numPlayers: number,
): boolean {
  // Relative position: 0 = earliest, 1 = latest (button)
  const relativePosition = numPlayers > 1 ? position / (numPlayers - 1) : 1;

  switch (hand) {
    case 'premium':
      return true; // Always play
    case 'strong':
      return true; // Always play
    case 'playable':
      // Play from middle position onwards
      return relativePosition >= 0.3;
    case 'marginal':
      // Only play from late position
      return relativePosition >= 0.65;
    case 'trash':
      // Only play from the button/cutoff with very late position
      return relativePosition >= 0.9 && numPlayers <= 4;
    default:
      return false;
  }
}

/**
 * Get the recommended raise size multiplier based on hand strength.
 */
export function getPreflopRaiseSize(hand: HandCategory): number {
  switch (hand) {
    case 'premium': return 3.5;
    case 'strong': return 3.0;
    case 'playable': return 2.5;
    case 'marginal': return 2.0;
    case 'trash': return 2.0;
    default: return 2.5;
  }
}
