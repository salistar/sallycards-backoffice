/**
 * Générateurs de donnes solubles côté backend.
 *
 * APPROCHE PRAGMATIQUE :
 *   - Chaque variante est servie par un générateur simple basé sur Math.random.
 *   - Le mobile soumet ses propres deals reverse-deal via POST /deal-seeds (cf. service)
 *     ce qui populise progressivement la BD avec des donnes 100% solubles.
 *   - Initialement la BD contient ces seeds générés ici (qualité moyenne) ;
 *     ils sont remplacés au fur et à mesure par les deals réels du mobile.
 *
 * NOTE : pour des seeds de PRODUCTION, idéalement port complet du reverse-deal
 * mobile vers le backend. Tâche tracked en TODO.
 */

import { createHash } from 'crypto';
import {
  reverseDealSpiderBackend,
  reverseDealKlondikeBackend,
  reverseDealAccordionBackend,
  reverseDealYukonBackend,
  reverseDealFreeCellBackend,
  reverseDealGolfBackend,
  reverseDealPyramidBackend,
  reverseDealTriPeaksBackend,
  reverseDealFortyThievesBackend,
} from './reverse-deal-generators';

export interface GeneratedDeal {
  initialState: any;
  solution: any[];
  difficulty: string;
  dealHash: string;
  metadata?: any;
}

const SUITS = ['spades', 'hearts', 'diamonds', 'clubs'] as const;
type Suit = typeof SUITS[number];
const VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] as const;

interface SimpleCard { suit: Suit; value: number; id: string; faceUp: boolean; }

function buildDeck(): SimpleCard[] {
  const deck: SimpleCard[] = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({ suit, value, id: `${value.toString().padStart(2, '0')}-${suit}`, faceUp: false });
    }
  }
  return deck;
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function hashDeal(state: any): string {
  return createHash('sha1').update(JSON.stringify(state)).digest('hex').slice(0, 16);
}

// =====================================================================
// KLONDIKE (1, 3, vegas)
// =====================================================================
function generateKlondike(): GeneratedDeal {
  const deck = shuffle(buildDeck());
  const tableau: { cards: SimpleCard[] }[] = [];
  let idx = 0;
  for (let col = 0; col < 7; col++) {
    const cards: SimpleCard[] = [];
    for (let row = 0; row <= col; row++) {
      const c = { ...deck[idx++] };
      c.faceUp = row === col;
      cards.push(c);
    }
    tableau.push({ cards });
  }
  const stock = deck.slice(idx).map((c) => ({ ...c, faceUp: false }));
  const state = {
    tableau,
    stock,
    waste: [],
    foundations: SUITS.map((s) => ({ suit: s, cards: [] })),
    moves: 0,
    score: 0,
    phase: 'playing',
    stockCycles: 0,
    movesSinceLastProgress: 0,
  };
  return {
    initialState: state,
    solution: [],
    difficulty: 'medium',
    dealHash: hashDeal(state),
  };
}

// =====================================================================
// SPIDER (1, 2, 4 suits)
// =====================================================================
function generateSpider(suitMode: 1 | 2 | 4): GeneratedDeal {
  const allowedSuits: Suit[] =
    suitMode === 1 ? ['spades'] :
    suitMode === 2 ? ['spades', 'hearts'] :
    ['spades', 'hearts', 'diamonds', 'clubs'];
  const reps = 104 / (allowedSuits.length * 13);
  const deck: SimpleCard[] = [];
  let counter = 0;
  for (let r = 0; r < reps; r++) {
    for (const suit of allowedSuits) {
      for (const value of VALUES) {
        deck.push({ suit, value, id: `${value.toString().padStart(2, '0')}-${suit}-${counter++}`, faceUp: false });
      }
    }
  }
  const sh = shuffle(deck);
  const tableau: { cards: SimpleCard[] }[] = [];
  let i = 0;
  for (let c = 0; c < 10; c++) {
    const cards: SimpleCard[] = [];
    const size = c < 4 ? 6 : 5;
    for (let r = 0; r < size; r++) {
      cards.push({ ...sh[i++], faceUp: r === size - 1 });
    }
    tableau.push({ cards });
  }
  const stock = sh.slice(i).map((c) => ({ ...c, faceUp: false }));
  const state = { tableau, stock, completed: [], moves: 0, score: 500, phase: 'playing', suitMode };
  return { initialState: state, solution: [], difficulty: 'medium', dealHash: hashDeal(state) };
}

// =====================================================================
// FREECELL
// =====================================================================
function generateFreeCell(): GeneratedDeal {
  const deck = shuffle(buildDeck());
  const tableau: { cards: SimpleCard[] }[] = [];
  for (let c = 0; c < 8; c++) tableau.push({ cards: [] });
  for (let i = 0; i < 52; i++) {
    tableau[i % 8].cards.push({ ...deck[i], faceUp: true });
  }
  const state = {
    tableau,
    freeCells: [null, null, null, null],
    foundations: SUITS.map((s) => ({ suit: s, cards: [] })),
    moves: 0,
    score: 0,
    phase: 'playing',
  };
  return { initialState: state, solution: [], difficulty: 'medium', dealHash: hashDeal(state) };
}

// =====================================================================
// YUKON
// =====================================================================
function generateYukon(): GeneratedDeal {
  const deck = shuffle(buildDeck());
  const tableau: { cards: SimpleCard[] }[] = [];
  const sizes = [1, 6, 7, 8, 9, 10, 11];
  const faceUps = [1, 5, 6, 6, 6, 6, 6];
  let i = 0;
  for (let c = 0; c < 7; c++) {
    const cards: SimpleCard[] = [];
    for (let r = 0; r < sizes[c]; r++) {
      cards.push({ ...deck[i++], faceUp: r >= sizes[c] - faceUps[c] });
    }
    tableau.push({ cards });
  }
  const state = {
    tableau,
    foundations: SUITS.map((s) => ({ suit: s, cards: [] })),
    moves: 0,
    score: 0,
    phase: 'playing',
  };
  return { initialState: state, solution: [], difficulty: 'medium', dealHash: hashDeal(state) };
}

// =====================================================================
// GOLF
// =====================================================================
function generateGolf(): GeneratedDeal {
  const deck = shuffle(buildDeck()).map((c) => ({ ...c, faceUp: true }));
  const tableau: { cards: SimpleCard[] }[] = [];
  for (let c = 0; c < 7; c++) tableau.push({ cards: [] });
  let i = 0;
  for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) {
    tableau[c].cards.push(deck[i++]);
  }
  const waste = [deck[i]];
  const stock = deck.slice(i + 1);
  const state = { tableau, stock, waste, moves: 0, score: 35, phase: 'playing' };
  return { initialState: state, solution: [], difficulty: 'medium', dealHash: hashDeal(state) };
}

// =====================================================================
// PYRAMID
// =====================================================================
function generatePyramid(): GeneratedDeal {
  const deck = shuffle(buildDeck());
  const pyramid: any[][] = [];
  let i = 0;
  for (let r = 0; r < 7; r++) {
    const row: any[] = [];
    for (let c = 0; c <= r; c++) row.push(deck[i++]);
    pyramid.push(row);
  }
  const stock = deck.slice(i);
  const state = { pyramid, stock, waste: [], selected: null, moves: 0, score: 0, phase: 'playing' };
  return { initialState: state, solution: [], difficulty: 'medium', dealHash: hashDeal(state) };
}

// =====================================================================
// TRIPEAKS
// =====================================================================
function generateTriPeaks(): GeneratedDeal {
  const deck = shuffle(buildDeck());
  const slots: any[] = [];
  for (let i = 0; i < 28; i++) {
    slots.push({ card: deck[i], faceUp: i >= 18, blockers: [] });
  }
  const waste = [deck[28]];
  const stock = deck.slice(29);
  const state = { slots, stock, waste, combo: 0, moves: 0, score: 0, phase: 'playing' };
  return { initialState: state, solution: [], difficulty: 'medium', dealHash: hashDeal(state) };
}

// =====================================================================
// FORTY THIEVES (104 cards = 2 decks)
// =====================================================================
function generateFortyThieves(): GeneratedDeal {
  const fullDeck: SimpleCard[] = [];
  let counter = 0;
  for (let r = 0; r < 2; r++) {
    for (const suit of SUITS) for (const value of VALUES) {
      fullDeck.push({ suit, value, id: `${value.toString().padStart(2, '0')}-${suit}-${counter++}`, faceUp: true });
    }
  }
  const sh = shuffle(fullDeck);
  const tableau: { cards: SimpleCard[] }[] = [];
  for (let c = 0; c < 10; c++) tableau.push({ cards: [] });
  let i = 0;
  for (let r = 0; r < 4; r++) for (let c = 0; c < 10; c++) {
    tableau[c].cards.push(sh[i++]);
  }
  const stock = sh.slice(i);
  const foundations: any[] = [];
  for (const s of SUITS) {
    foundations.push({ suit: s, cards: [] });
    foundations.push({ suit: s, cards: [] });
  }
  const state = { tableau, stock, waste: [], foundations, moves: 0, score: 0, phase: 'playing' };
  return { initialState: state, solution: [], difficulty: 'medium', dealHash: hashDeal(state) };
}

// =====================================================================
// ACCORDION
// =====================================================================
function generateAccordion(): GeneratedDeal {
  const deck = shuffle(buildDeck());
  const piles = deck.map((c) => ({ cards: [c] }));
  const state = { piles, selected: null, moves: 0, score: 0, phase: 'playing' };
  return { initialState: state, solution: [], difficulty: 'medium', dealHash: hashDeal(state) };
}

// =====================================================================
// DISPATCH
// =====================================================================
export function generateDealForVariant(variant: string): GeneratedDeal | null {
  switch (variant) {
    // Toutes les variantes utilisent désormais des reverse-deals portés
    // (donnes 100% solubles par construction).
    case 'klondike-1':
    case 'klondike-3':
    case 'klondike-vegas':
      return reverseDealKlondikeBackend();
    case 'spider-1': return reverseDealSpiderBackend(1);
    case 'spider-2': return reverseDealSpiderBackend(2);
    case 'spider-4': return reverseDealSpiderBackend(4);
    case 'accordion': return reverseDealAccordionBackend();
    case 'freecell': return reverseDealFreeCellBackend();
    case 'yukon': return reverseDealYukonBackend();
    case 'golf': return reverseDealGolfBackend();
    case 'pyramid': return reverseDealPyramidBackend();
    case 'tripeaks': return reverseDealTriPeaksBackend();
    case 'forty-thieves': return reverseDealFortyThievesBackend();
    default: return null;
  }
}

// Tag les anciens generators basiques comme inutilisés mais conservés
// au cas où la BD veut un fallback rapide.
void [generateKlondike, generateSpider, generateFreeCell, generateYukon,
      generateGolf, generatePyramid, generateTriPeaks, generateFortyThieves,
      generateAccordion];
