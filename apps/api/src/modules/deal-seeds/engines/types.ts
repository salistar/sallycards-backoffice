/**
 * Types de carte partagés par les engines portés depuis le mobile.
 * Compatibles 1:1 avec les types mobiles `src/game/card.ts`.
 */

export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
export type CardColor = 'red' | 'black';

export interface Card {
  suit: Suit;
  value: number;
  id: string;
  faceUp?: boolean;
}

export const SUIT_COLOR: Record<Suit, CardColor> = {
  spades: 'black',
  clubs: 'black',
  hearts: 'red',
  diamonds: 'red',
};

export const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
export const VALUES: CardValue[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
