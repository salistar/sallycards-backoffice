/**
 * Reverse-deal generators portés depuis le mobile.
 *
 * Ces générateurs produisent des donnes 100% solvables par construction
 * (chemin inverse depuis l'état gagné).
 *
 * Couverts ici : Spider, Klondike, Accordion. Les autres variantes utilisent
 * encore les générateurs basiques de deal-generators.ts (TODO: porter le reste).
 */

import { createHash } from 'crypto';

// Engines portés (1:1 avec le mobile) pour pouvoir calculer une solution greedy.
import * as Klondike from './engines/klondikeEngine';
import * as Spider from './engines/spiderEngine';
import * as Yukon from './engines/yukonEngine';
import * as FreeCell from './engines/freecellEngine';
import * as Golf from './engines/golfEngine';
import * as Pyramid from './engines/pyramidEngine';
import * as TriPeaks from './engines/tripeaksEngine';
import * as FortyThieves from './engines/fortyThievesEngine';
import * as Accordion from './engines/accordionEngine';

const SUITS = ['spades', 'hearts', 'diamonds', 'clubs'] as const;
type Suit = typeof SUITS[number];
const VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] as const;

interface SimpleCard { suit: Suit; value: number; id: string; faceUp: boolean; }

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

export interface GeneratedDeal {
  initialState: any;
  solution: any[];
  difficulty: string;
  dealHash: string;
  metadata?: any;
}

/**
 * Solveur greedy générique : applique findHint() en boucle jusqu'à
 * convergence. Limite à `maxMoves` coups pour éviter les boucles infinies.
 * Retourne la liste des actions à dispatcher pour résoudre le deal.
 */
function greedySolve<S, A>(
  state: S,
  reducer: (s: S, a: A) => S,
  findHint: (s: S) => A | null,
  maxMoves: number,
): A[] {
  const moves: A[] = [];
  let s = state;
  for (let i = 0; i < maxMoves; i++) {
    const action = findHint(s);
    if (!action) break;
    const next = reducer(s, action);
    if (next === s) break; // no-op : abandon
    moves.push(action);
    s = next;
    const phase = (s as any)?.phase;
    if (phase && phase !== 'playing') break;
  }
  return moves;
}

// =====================================================================
// SPIDER reverse-deal
// =====================================================================
export function reverseDealSpiderBackend(suitMode: 1 | 2 | 4): GeneratedDeal {
  const allowedSuits: Suit[] =
    suitMode === 1 ? ['spades'] :
    suitMode === 2 ? ['spades', 'hearts'] :
    ['spades', 'hearts', 'diamonds', 'clubs'];
  const seqsPerSuit = 8 / allowedSuits.length;

  // 1. Build 8 complete K→A runs
  const runs: SimpleCard[][] = [];
  let counter = 0;
  for (const suit of allowedSuits) {
    for (let i = 0; i < seqsPerSuit; i++) {
      const run: SimpleCard[] = [];
      for (let v = 13; v >= 1; v--) {
        run.push({ suit, value: v, id: `${v.toString().padStart(2, '0')}-${suit}-${counter++}`, faceUp: true });
      }
      runs.push(run);
    }
  }
  const shuffledRuns = shuffle(runs);

  // 2. Place each run on a different column
  const colIdx = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const tableau: { cards: SimpleCard[] }[] = Array.from({ length: 10 }, () => ({ cards: [] }));
  for (let i = 0; i < 8; i++) {
    tableau[colIdx[i]].cards.push(...shuffledRuns[i]);
  }

  // 3. Apply 80 random valid moves to mix
  const NUM_MIXES = 80;
  for (let m = 0; m < NUM_MIXES; m++) {
    const moves: { from: number; to: number; count: number }[] = [];
    for (let from = 0; from < 10; from++) {
      const src = tableau[from].cards;
      if (src.length === 0) continue;
      let seqStart = src.length - 1;
      while (seqStart > 0 &&
             src[seqStart - 1].suit === src[seqStart].suit &&
             src[seqStart - 1].value === src[seqStart].value + 1) {
        seqStart--;
      }
      for (let start = seqStart; start < src.length; start++) {
        const head = src[start];
        const count = src.length - start;
        for (let to = 0; to < 10; to++) {
          if (to === from) continue;
          const dst = tableau[to].cards;
          const top = dst[dst.length - 1];
          if (!top) {
            if (start > 0) moves.push({ from, to, count });
          } else if (top.value === head.value + 1) {
            moves.push({ from, to, count });
          }
        }
      }
    }
    if (moves.length === 0) break;
    const move = moves[Math.floor(Math.random() * moves.length)];
    const moved = tableau[move.from].cards.splice(tableau[move.from].cards.length - move.count, move.count);
    tableau[move.to].cards.push(...moved);
  }

  // 4. Pop 50 cards to stock
  const stock: SimpleCard[] = [];
  let cardsToStock = 50;
  while (cardsToStock > 0) {
    let movedRound = 0;
    for (let col = 9; col >= 0 && cardsToStock > 0; col--) {
      if (tableau[col].cards.length > 1) {
        const c = tableau[col].cards.pop()!;
        stock.push({ ...c, faceUp: false });
        cardsToStock--;
        movedRound++;
      }
    }
    if (movedRound === 0) break;
  }

  // 5. Mark face-down except top
  for (const col of tableau) {
    for (let i = 0; i < col.cards.length - 1; i++) {
      col.cards[i] = { ...col.cards[i], faceUp: false };
    }
    if (col.cards.length > 0) {
      col.cards[col.cards.length - 1] = { ...col.cards[col.cards.length - 1], faceUp: true };
    }
  }

  const state = { tableau, stock, completed: [], moves: 0, score: 500, phase: 'playing', suitMode };
  const solution = greedySolve(state as any, Spider.gameReducer, (s) => Spider.findHint(s), 800);
  return { initialState: state, solution, difficulty: 'medium', dealHash: hashDeal(state) };
}

// =====================================================================
// KLONDIKE reverse-deal
// =====================================================================
export function reverseDealKlondikeBackend(): GeneratedDeal {
  // 1. Win state : 4 fondations complètes
  const tableau: { cards: SimpleCard[] }[] = Array.from({ length: 7 }, () => ({ cards: [] }));
  const stock: SimpleCard[] = [];
  const waste: SimpleCard[] = [];
  const foundations: { suit: Suit; cards: SimpleCard[] }[] = SUITS.map((s) => {
    const cards: SimpleCard[] = [];
    for (let v = 1; v <= 13; v++) {
      cards.push({ suit: s, value: v, id: `${v.toString().padStart(2, '0')}-${s}`, faceUp: true });
    }
    return { suit: s, cards };
  });

  const canStackTableau = (a: SimpleCard, b: SimpleCard): boolean => {
    const aRed = a.suit === 'hearts' || a.suit === 'diamonds';
    const bRed = b.suit === 'hearts' || b.suit === 'diamonds';
    return a.value === b.value - 1 && aRed !== bRed;
  };

  // 2. 250 inverse moves
  for (let step = 0; step < 250; step++) {
    type IM =
      | { type: 'F_TO_T'; from: number; to: number }
      | { type: 'F_TO_W'; from: number }
      | { type: 'T_TO_T'; from: number; to: number; count: number }
      | { type: 'T_TO_W'; from: number }
      | { type: 'W_TO_S' };
    const moves: IM[] = [];

    for (let f = 0; f < 4; f++) {
      const fp = foundations[f];
      if (fp.cards.length === 0) continue;
      const card = fp.cards[fp.cards.length - 1];
      for (let to = 0; to < 7; to++) {
        const top = tableau[to].cards[tableau[to].cards.length - 1];
        if (!top) {
          if (card.value === 13) moves.push({ type: 'F_TO_T', from: f, to });
        } else if (top.faceUp && canStackTableau(card, top)) {
          moves.push({ type: 'F_TO_T', from: f, to });
        }
      }
      moves.push({ type: 'F_TO_W', from: f });
    }
    for (let from = 0; from < 7; from++) {
      const src = tableau[from].cards;
      if (src.length === 0) continue;
      let seqStart = src.length - 1;
      while (seqStart > 0 && src[seqStart - 1].faceUp && canStackTableau(src[seqStart], src[seqStart - 1])) {
        seqStart--;
      }
      for (let start = seqStart; start < src.length; start++) {
        const head = src[start];
        const count = src.length - start;
        for (let to = 0; to < 7; to++) {
          if (to === from) continue;
          const top = tableau[to].cards[tableau[to].cards.length - 1];
          if (!top) {
            if (head.value === 13 && start > 0) moves.push({ type: 'T_TO_T', from, to, count });
          } else if (top.faceUp && canStackTableau(head, top)) {
            moves.push({ type: 'T_TO_T', from, to, count });
          }
        }
      }
      moves.push({ type: 'T_TO_W', from });
    }
    if (waste.length > 0) moves.push({ type: 'W_TO_S' });

    if (moves.length === 0) break;
    const m = moves[Math.floor(Math.random() * moves.length)];
    switch (m.type) {
      case 'F_TO_T': {
        const c = foundations[m.from].cards.pop()!;
        tableau[m.to].cards.push({ ...c, faceUp: true });
        break;
      }
      case 'F_TO_W': {
        const c = foundations[m.from].cards.pop()!;
        waste.push({ ...c, faceUp: true });
        break;
      }
      case 'T_TO_T': {
        const moved = tableau[m.from].cards.splice(tableau[m.from].cards.length - m.count, m.count);
        tableau[m.to].cards.push(...moved);
        break;
      }
      case 'T_TO_W': {
        const c = tableau[m.from].cards.pop()!;
        waste.push({ ...c, faceUp: true });
        break;
      }
      case 'W_TO_S': {
        const c = waste.pop()!;
        stock.push({ ...c, faceUp: false });
        break;
      }
    }
  }

  // 3. Mark face-down
  for (const col of tableau) {
    for (let i = 0; i < col.cards.length - 1; i++) col.cards[i] = { ...col.cards[i], faceUp: false };
    if (col.cards.length > 0) col.cards[col.cards.length - 1] = { ...col.cards[col.cards.length - 1], faceUp: true };
  }
  for (let i = 0; i < stock.length; i++) stock[i] = { ...stock[i], faceUp: false };

  const state = {
    tableau, stock, waste, foundations,
    moves: 0, score: 0, phase: 'playing', stockCycles: 0, movesSinceLastProgress: 0,
  };
  const solution = greedySolve(state as any, Klondike.gameReducer, Klondike.findHint, 600);
  return { initialState: state, solution, difficulty: 'medium', dealHash: hashDeal(state) };
}

// =====================================================================
// ACCORDION reverse-deal
// =====================================================================
export function reverseDealAccordionBackend(): GeneratedDeal {
  const deck: SimpleCard[] = [];
  for (const suit of SUITS) for (const value of VALUES) {
    deck.push({ suit, value, id: `${value.toString().padStart(2, '0')}-${suit}`, faceUp: true });
  }
  const sh = shuffle(deck);
  let piles: { cards: SimpleCard[] }[] = [{ cards: sh }];

  let safety = 200;
  while (piles.length < 52 && safety-- > 0) {
    type Opt = { idx: number; insertAt: number };
    const options: Opt[] = [];
    for (let i = 0; i < piles.length; i++) {
      const p = piles[i];
      if (p.cards.length < 2) continue;
      const top = p.cards[p.cards.length - 1];
      const beneath = p.cards[p.cards.length - 2];
      if (top.value !== beneath.value && top.suit !== beneath.suit) continue;
      options.push({ idx: i, insertAt: i + 1 });
      if (i + 3 <= piles.length) options.push({ idx: i, insertAt: i + 3 });
    }
    if (options.length === 0) {
      let largest = 0;
      for (let i = 1; i < piles.length; i++) if (piles[i].cards.length > piles[largest].cards.length) largest = i;
      if (piles[largest].cards.length < 2) break;
      options.push({ idx: largest, insertAt: largest + 1 });
    }
    const opt = options[Math.floor(Math.random() * options.length)];
    const top = piles[opt.idx].cards.pop()!;
    piles = [...piles.slice(0, opt.insertAt), { cards: [top] }, ...piles.slice(opt.insertAt)];
  }
  while (piles.length < 52) {
    const idx = piles.findIndex((p) => p.cards.length >= 2);
    if (idx < 0) break;
    const top = piles[idx].cards.pop()!;
    piles = [...piles.slice(0, idx + 1), { cards: [top] }, ...piles.slice(idx + 1)];
  }

  const state = { piles, selected: null, moves: 0, score: 0, phase: 'playing' };
  const solution = greedySolve(state as any, Accordion.gameReducer, Accordion.findHint, 200);
  return { initialState: state, solution, difficulty: 'medium', dealHash: hashDeal(state) };
}

// =====================================================================
// Helpers couleur (red/black) pour Klondike-like
// =====================================================================
const SUIT_COLOR: Record<Suit, 'red' | 'black'> = {
  spades: 'black', clubs: 'black', hearts: 'red', diamonds: 'red',
};
function canStackTableauAlt(a: SimpleCard, b: SimpleCard): boolean {
  return a.value === b.value - 1 && SUIT_COLOR[a.suit] !== SUIT_COLOR[b.suit];
}

// =====================================================================
// YUKON reverse-deal
// =====================================================================
const YUKON_COL_FACEUP = [1, 5, 6, 6, 6, 6, 6];
export function reverseDealYukonBackend(): GeneratedDeal {
  const tableau: { cards: SimpleCard[] }[] = Array.from({ length: 7 }, () => ({ cards: [] }));
  const foundations: { suit: Suit; cards: SimpleCard[] }[] = SUITS.map((s) => {
    const cards: SimpleCard[] = [];
    for (let v = 1; v <= 13; v++) {
      cards.push({ suit: s, value: v, id: `${v.toString().padStart(2, '0')}-${s}`, faceUp: true });
    }
    return { suit: s, cards };
  });

  const NUM_INVERSE = 200;
  for (let step = 0; step < NUM_INVERSE; step++) {
    type IM =
      | { type: 'F_TO_T'; from: number; to: number }
      | { type: 'T_TO_T'; from: number; to: number; count: number };
    const moves: IM[] = [];

    for (let f = 0; f < 4; f++) {
      const fp = foundations[f];
      if (fp.cards.length === 0) continue;
      const card = fp.cards[fp.cards.length - 1];
      for (let to = 0; to < 7; to++) {
        const top = tableau[to].cards[tableau[to].cards.length - 1];
        if (!top) {
          if (card.value === 13) moves.push({ type: 'F_TO_T', from: f, to });
        } else if (canStackTableauAlt(card, top)) {
          moves.push({ type: 'F_TO_T', from: f, to });
        }
      }
    }
    for (let from = 0; from < 7; from++) {
      const src = tableau[from].cards;
      for (let i = 0; i < src.length; i++) {
        const head = src[i];
        const count = src.length - i;
        for (let to = 0; to < 7; to++) {
          if (to === from) continue;
          const top = tableau[to].cards[tableau[to].cards.length - 1];
          if (!top) {
            if (head.value === 13 && i > 0) moves.push({ type: 'T_TO_T', from, to, count });
          } else if (canStackTableauAlt(head, top)) {
            moves.push({ type: 'T_TO_T', from, to, count });
          }
        }
      }
    }
    if (moves.length === 0) break;
    const m = moves[Math.floor(Math.random() * moves.length)];
    if (m.type === 'F_TO_T') {
      const c = foundations[m.from].cards.pop()!;
      tableau[m.to].cards.push({ ...c });
    } else {
      const moved = tableau[m.from].cards.splice(tableau[m.from].cards.length - m.count, m.count);
      tableau[m.to].cards.push(...moved);
    }
  }
  for (let c = 0; c < 7; c++) {
    const col = tableau[c].cards;
    const visibleCount = YUKON_COL_FACEUP[c];
    const hiddenCount = Math.max(0, col.length - visibleCount);
    for (let i = 0; i < col.length; i++) col[i] = { ...col[i], faceUp: i >= hiddenCount };
  }

  const state = { tableau, foundations, moves: 0, score: 0, phase: 'playing' };
  const solution = greedySolve(state as any, Yukon.gameReducer, Yukon.findHint, 500);
  return { initialState: state, solution, difficulty: 'medium', dealHash: hashDeal(state) };
}

// =====================================================================
// FREECELL reverse-deal
// =====================================================================
export function reverseDealFreeCellBackend(): GeneratedDeal {
  const COLS = 8;
  const FREE = 4;
  const tableau: { cards: SimpleCard[] }[] = Array.from({ length: COLS }, () => ({ cards: [] }));
  const freeCells: (SimpleCard | null)[] = Array(FREE).fill(null);
  const foundations: { suit: Suit; cards: SimpleCard[] }[] = SUITS.map((s) => {
    const cards: SimpleCard[] = [];
    for (let v = 1; v <= 13; v++) {
      cards.push({ suit: s, value: v, id: `${v.toString().padStart(2, '0')}-${s}`, faceUp: true });
    }
    return { suit: s, cards };
  });

  const NUM_INVERSE = 200;
  for (let step = 0; step < NUM_INVERSE; step++) {
    type IM =
      | { type: 'F_TO_T'; from: number; to: number }
      | { type: 'F_TO_FC'; from: number; cellIdx: number }
      | { type: 'T_TO_T'; from: number; to: number }
      | { type: 'T_TO_FC'; from: number; cellIdx: number }
      | { type: 'FC_TO_T'; cellIdx: number; to: number };
    const moves: IM[] = [];

    for (let f = 0; f < 4; f++) {
      const fp = foundations[f];
      if (fp.cards.length === 0) continue;
      const card = fp.cards[fp.cards.length - 1];
      for (let to = 0; to < COLS; to++) {
        const top = tableau[to].cards[tableau[to].cards.length - 1];
        if (!top || canStackTableauAlt(card, top)) moves.push({ type: 'F_TO_T', from: f, to });
      }
      const emptyCell = freeCells.findIndex((c) => c === null);
      if (emptyCell >= 0) moves.push({ type: 'F_TO_FC', from: f, cellIdx: emptyCell });
    }
    for (let from = 0; from < COLS; from++) {
      const src = tableau[from].cards;
      if (src.length === 0) continue;
      const head = src[src.length - 1];
      for (let to = 0; to < COLS; to++) {
        if (to === from) continue;
        const top = tableau[to].cards[tableau[to].cards.length - 1];
        if (!top || canStackTableauAlt(head, top)) moves.push({ type: 'T_TO_T', from, to });
      }
      const emptyCell = freeCells.findIndex((c) => c === null);
      if (emptyCell >= 0) moves.push({ type: 'T_TO_FC', from, cellIdx: emptyCell });
    }
    for (let i = 0; i < FREE; i++) {
      if (!freeCells[i]) continue;
      const card = freeCells[i]!;
      for (let to = 0; to < COLS; to++) {
        const top = tableau[to].cards[tableau[to].cards.length - 1];
        if (!top || canStackTableauAlt(card, top)) moves.push({ type: 'FC_TO_T', cellIdx: i, to });
      }
    }
    if (moves.length === 0) break;
    const m = moves[Math.floor(Math.random() * moves.length)];
    switch (m.type) {
      case 'F_TO_T': { const c = foundations[m.from].cards.pop()!; tableau[m.to].cards.push(c); break; }
      case 'F_TO_FC': { const c = foundations[m.from].cards.pop()!; freeCells[m.cellIdx] = c; break; }
      case 'T_TO_T': { const c = tableau[m.from].cards.pop()!; tableau[m.to].cards.push(c); break; }
      case 'T_TO_FC': { const c = tableau[m.from].cards.pop()!; freeCells[m.cellIdx] = c; break; }
      case 'FC_TO_T': { const c = freeCells[m.cellIdx]!; freeCells[m.cellIdx] = null; tableau[m.to].cards.push(c); break; }
    }
  }
  // Évacue les freecells
  for (let i = 0; i < FREE; i++) {
    if (freeCells[i]) {
      let best = 0, bestLen = Infinity;
      for (let to = 0; to < COLS; to++) {
        if (tableau[to].cards.length < bestLen) { best = to; bestLen = tableau[to].cards.length; }
      }
      tableau[best].cards.push(freeCells[i]!);
      freeCells[i] = null;
    }
  }

  const state = { tableau, freeCells, foundations, moves: 0, score: 0, phase: 'playing' };
  const solution = greedySolve(state as any, FreeCell.gameReducer, FreeCell.findHint, 500);
  return { initialState: state, solution, difficulty: 'medium', dealHash: hashDeal(state) };
}

// =====================================================================
// GOLF reverse-deal (random walk in card-values)
// =====================================================================
export function reverseDealGolfBackend(): GeneratedDeal {
  const allCards: SimpleCard[] = [];
  for (const suit of SUITS) for (const v of VALUES) {
    allCards.push({ suit, value: v, id: `${v.toString().padStart(2, '0')}-${suit}`, faceUp: true });
  }
  // shuffle in-place
  for (let i = allCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allCards[i], allCards[j]] = [allCards[j], allCards[i]];
  }

  const walk: number[] = [];
  let cur = Math.floor(Math.random() * 13) + 1;
  walk.push(cur);
  for (let s = 0; s < 35; s++) {
    let next: number;
    if (cur === 1) next = 2;
    else if (cur === 13) next = 12;
    else next = cur + (Math.random() < 0.5 ? -1 : 1);
    walk.push(next);
    cur = next;
  }
  const playOrder: SimpleCard[] = [];
  const remaining = [...allCards];
  for (let i = 1; i < walk.length; i++) {
    const idx = remaining.findIndex((c) => c.value === walk[i]);
    if (idx >= 0) playOrder.push(remaining.splice(idx, 1)[0]);
    else playOrder.push(remaining.pop()!);
  }
  const wIdx = remaining.findIndex((c) => c.value === walk[0]);
  const wasteFirst = wIdx >= 0 ? remaining.splice(wIdx, 1)[0] : remaining.pop()!;

  const tableau: { cards: SimpleCard[] }[] = Array.from({ length: 7 }, () => ({ cards: [] }));
  for (let layer = 4; layer >= 0; layer--) {
    for (let col = 0; col < 7; col++) {
      const idx = (4 - layer) * 7 + col;
      if (idx < playOrder.length) tableau[col].cards.unshift(playOrder[idx]);
    }
  }

  const state = {
    tableau, stock: remaining, waste: [wasteFirst],
    moves: 0, score: 35, phase: 'playing',
  };
  const solution = greedySolve(state as any, Golf.gameReducer, Golf.findHint, 100);
  return { initialState: state, solution, difficulty: 'medium', dealHash: hashDeal(state) };
}

// =====================================================================
// PYRAMID reverse-deal (paires (R, 13-R) garanties)
// =====================================================================
export function reverseDealPyramidBackend(): GeneratedDeal {
  const deck: SimpleCard[] = [];
  for (const suit of SUITS) for (const v of VALUES) {
    deck.push({ suit, value: v, id: `${v.toString().padStart(2, '0')}-${suit}`, faceUp: true });
  }
  const kings = deck.filter((c) => c.value === 13);
  const nonKings = deck.filter((c) => c.value !== 13);
  const pairs: [SimpleCard, SimpleCard][] = [];
  for (let r = 1; r <= 6; r++) {
    const a = nonKings.filter((c) => c.value === r);
    const b = nonKings.filter((c) => c.value === 13 - r);
    for (let i = 0; i < 4; i++) pairs.push([a[i], b[i]]);
  }
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  const pyramidCards: SimpleCard[] = [];
  for (let i = 0; i < 13; i++) pyramidCards.push(...pairs[i]);
  pyramidCards.push(kings[0], kings[1]);
  const stockCards: SimpleCard[] = [];
  for (let i = 13; i < pairs.length; i++) stockCards.push(...pairs[i]);
  stockCards.push(kings[2], kings[3]);
  for (let i = pyramidCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pyramidCards[i], pyramidCards[j]] = [pyramidCards[j], pyramidCards[i]];
  }
  for (let i = stockCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [stockCards[i], stockCards[j]] = [stockCards[j], stockCards[i]];
  }
  const pyramid: SimpleCard[][] = [];
  let idx = 0;
  for (let r = 0; r < 7; r++) {
    const row: SimpleCard[] = [];
    for (let c = 0; c <= r; c++) row.push(pyramidCards[idx++]);
    pyramid.push(row);
  }
  const state = {
    pyramid, stock: stockCards, waste: [],
    selected: null, moves: 0, score: 0, phase: 'playing',
  };
  const solution = greedySolve(state as any, Pyramid.gameReducer, Pyramid.findHint, 200);
  return { initialState: state, solution, difficulty: 'medium', dealHash: hashDeal(state) };
}

// =====================================================================
// TRIPEAKS reverse-deal (random walk circular ±1)
// =====================================================================
const TRIPEAKS_BLOCKERS: number[][] = [
  [3, 4], [5, 6], [7, 8],
  [9, 10], [10, 11], [12, 13], [13, 14], [15, 16], [16, 17],
  [18, 19], [19, 20], [20, 21], [21, 22], [22, 23],
  [23, 24], [24, 25], [25, 26], [26, 27],
  [], [], [], [], [], [], [], [], [], [],
];
export function reverseDealTriPeaksBackend(): GeneratedDeal {
  const allCards: SimpleCard[] = [];
  for (const suit of SUITS) for (const v of VALUES) {
    allCards.push({ suit, value: v, id: `${v.toString().padStart(2, '0')}-${suit}`, faceUp: true });
  }
  for (let i = allCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allCards[i], allCards[j]] = [allCards[j], allCards[i]];
  }
  const wrap = (v: number): number => v < 1 ? 13 : v > 13 ? 1 : v;
  const walk: number[] = [];
  let cur = Math.floor(Math.random() * 13) + 1;
  walk.push(cur);
  for (let s = 0; s < 28; s++) {
    cur = wrap(cur + (Math.random() < 0.5 ? -1 : 1));
    walk.push(cur);
  }
  const remaining = [...allCards];
  const playOrder: SimpleCard[] = [];
  for (let i = 1; i < walk.length; i++) {
    const idx = remaining.findIndex((c) => c.value === walk[i]);
    if (idx >= 0) playOrder.push(remaining.splice(idx, 1)[0]);
    else playOrder.push(remaining.pop()!);
  }
  const wIdx = remaining.findIndex((c) => c.value === walk[0]);
  const wasteFirst = wIdx >= 0 ? remaining.splice(wIdx, 1)[0] : remaining.pop()!;
  const slots: { card: SimpleCard; faceUp: boolean; blockers: number[] }[] = [];
  for (let i = 0; i < 28; i++) {
    const card = playOrder[27 - i];
    slots.push({ card, faceUp: i >= 18, blockers: TRIPEAKS_BLOCKERS[i] });
  }
  const state = {
    slots, stock: remaining, waste: [wasteFirst],
    combo: 0, moves: 0, score: 0, phase: 'playing',
  };
  const solution = greedySolve(state as any, TriPeaks.gameReducer, TriPeaks.findHint, 100);
  return { initialState: state, solution, difficulty: 'medium', dealHash: hashDeal(state) };
}

// =====================================================================
// FORTY THIEVES reverse-deal (2 jeux × 4 fondations = 8 fondations)
// =====================================================================
function canStackFTBackend(a: SimpleCard, b: SimpleCard): boolean {
  return a.suit === b.suit && a.value === b.value - 1;
}
export function reverseDealFortyThievesBackend(): GeneratedDeal {
  const COLS = 10;
  const tableau: { cards: SimpleCard[] }[] = Array.from({ length: COLS }, () => ({ cards: [] }));
  const stock: SimpleCard[] = [];
  const waste: SimpleCard[] = [];
  const foundations: { suit: Suit; cards: SimpleCard[] }[] = [];
  let counter = 0;
  for (let r = 0; r < 2; r++) for (const s of SUITS) {
    const cards: SimpleCard[] = [];
    for (let v = 1; v <= 13; v++) {
      cards.push({ suit: s, value: v, id: `${v.toString().padStart(2, '0')}-${s}-${counter++}`, faceUp: true });
    }
    foundations.push({ suit: s, cards });
  }

  const NUM_INVERSE = 250;
  for (let step = 0; step < NUM_INVERSE; step++) {
    type IM =
      | { type: 'F_TO_T'; from: number; to: number }
      | { type: 'F_TO_W'; from: number }
      | { type: 'T_TO_T'; from: number; to: number }
      | { type: 'T_TO_W'; from: number }
      | { type: 'W_TO_S' };
    const moves: IM[] = [];

    for (let f = 0; f < 8; f++) {
      const fp = foundations[f];
      if (fp.cards.length === 0) continue;
      const card = fp.cards[fp.cards.length - 1];
      for (let to = 0; to < COLS; to++) {
        const top = tableau[to].cards[tableau[to].cards.length - 1];
        if (!top || canStackFTBackend(card, top)) moves.push({ type: 'F_TO_T', from: f, to });
      }
    }
    for (let f = 0; f < 8; f++) {
      if (foundations[f].cards.length > 0) moves.push({ type: 'F_TO_W', from: f });
    }
    for (let from = 0; from < COLS; from++) {
      const src = tableau[from].cards;
      if (src.length === 0) continue;
      const card = src[src.length - 1];
      for (let to = 0; to < COLS; to++) {
        if (to === from) continue;
        const top = tableau[to].cards[tableau[to].cards.length - 1];
        if (!top || canStackFTBackend(card, top)) moves.push({ type: 'T_TO_T', from, to });
      }
    }
    for (let from = 0; from < COLS; from++) {
      if (tableau[from].cards.length > 0) moves.push({ type: 'T_TO_W', from });
    }
    if (waste.length > 0) moves.push({ type: 'W_TO_S' });

    if (moves.length === 0) break;
    const m = moves[Math.floor(Math.random() * moves.length)];
    switch (m.type) {
      case 'F_TO_T': { const c = foundations[m.from].cards.pop()!; tableau[m.to].cards.push(c); break; }
      case 'F_TO_W': { const c = foundations[m.from].cards.pop()!; waste.push(c); break; }
      case 'T_TO_T': { const c = tableau[m.from].cards.pop()!; tableau[m.to].cards.push(c); break; }
      case 'T_TO_W': { const c = tableau[m.from].cards.pop()!; waste.push(c); break; }
      case 'W_TO_S': { const c = waste.pop()!; stock.push(c); break; }
    }
  }
  const state = { tableau, stock, waste, foundations, moves: 0, score: 0, phase: 'playing' };
  const solution = greedySolve(state as any, FortyThieves.gameReducer, FortyThieves.findHint, 600);
  return { initialState: state, solution, difficulty: 'medium', dealHash: hashDeal(state) };
}
