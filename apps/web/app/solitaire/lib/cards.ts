/**
 * @file apps/web/app/solitaire/lib/cards.ts
 * @description Mapping carte (suit S/H/D/C, rank 1-13) → image french52, +
 *   libellés. Partagé par tous les tableaux de solitaire.
 */
import type { Card, Suit, Rank } from './engines/_genericTableau';

const RANK_CODE: Record<number, string> = { 1: 'A', 10: '0', 11: 'J', 12: 'Q', 13: 'K' };
export function rankCode(r: Rank): string { return RANK_CODE[r] || String(r); }
export function cardImage(c: Card): string { return `/cards/french52/${rankCode(c.rank)}${c.suit}.png`; }
export const CARD_BACK = '/cards/french52/back.png';
export const SUIT_GLYPH: Record<Suit, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };
export function isRed(s: Suit): boolean { return s === 'H' || s === 'D'; }
