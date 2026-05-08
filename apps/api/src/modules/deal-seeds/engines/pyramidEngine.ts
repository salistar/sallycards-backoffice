/**
 * @file pyramidEngine.ts — Pyramid Solitaire (52 cards).
 *
 * Layout:
 *  - 28 cards in a pyramid: rows of 1, 2, 3, 4, 5, 6, 7. Each card overlaps
 *    the two below it — a pyramid card is "available" when it has no card
 *    covering it (both children removed, or it's on the bottom row).
 *  - Stock: 24 remaining cards face-down.
 *  - Waste: top card always available.
 *
 * Play:
 *  - Pair two AVAILABLE cards whose values sum to 13 → both removed.
 *    A=1, 2-10=face, J=11, Q=12, K=13.
 *  - K (13) alone is removed (sums to 13 by itself).
 *  - Tap stock to flip a card to waste.
 *
 * Win = entire pyramid removed (the 28 cards).
 */

export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export interface Card { suit: Suit; value: CardValue; id: string; }

/** A pyramid slot: contains a card or null when removed. */
export type PyramidSlot = Card | null;

export interface GameState {
  /** 7 rows; row r has r+1 slots (1, 2, 3, ..., 7). */
  pyramid: PyramidSlot[][];
  stock: Card[];
  waste: Card[];
  /** Selected card to attempt a pair. */
  selected: { type: 'pyramid'; row: number; col: number } | { type: 'waste' } | null;
  moves: number;
  score: number;        // pyramid removed count (max 28)
  phase: 'playing' | 'won' | 'lost';
}

export type GameAction =
  | { type: 'TAP_PYRAMID'; row: number; col: number }
  | { type: 'TAP_WASTE' }
  | { type: 'DRAW' }
  | { type: 'CLEAR_SELECT' }
  | { type: 'RESET' }
  | { type: 'LOAD_FROM_BD'; state: GameState };

export const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
export const VALUES: CardValue[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
export const SUIT_GLYPH: Record<Suit, string> = {
  spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣',
};

export function imageCode(card: Card): string {
  const v =
    card.value === 1  ? 'A' :
    card.value === 10 ? '0' :
    card.value === 11 ? 'J' :
    card.value === 12 ? 'Q' :
    card.value === 13 ? 'K' :
    String(card.value);
  return `${v}${card.suit[0].toUpperCase()}`;
}

function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) for (const value of VALUES) {
    deck.push({ suit, value, id: `${value.toString().padStart(2, '0')}-${suit}` });
  }
  return deck;
}

function shuffle(deck: Card[]): Card[] {
  const out = [...deck];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function dealOnce(): GameState {
  const deck = shuffle(buildDeck());
  const pyramid: PyramidSlot[][] = [];
  let i = 0;
  for (let r = 0; r < 7; r++) {
    const row: PyramidSlot[] = [];
    for (let c = 0; c <= r; c++) row.push(deck[i++]);
    pyramid.push(row);
  }
  const stock = deck.slice(i);
  return { pyramid, stock, waste: [], selected: null, moves: 0, score: 0, phase: 'playing' };
}

/** Score : combien de cartes de la pyramide le greedy retire. */
function pyramidProgress(initial: GameState): number {
  let s = initial;
  for (let i = 0; i < 200; i++) {
    const action = findHint(s);
    if (!action) break;
    const next = gameReducer(s, action);
    if (next === s) break;
    s = next;
    if (s.phase !== 'playing') break;
  }
  return s.score;
}

/**
 * REVERSE-DEAL Pyramid — donne avec preuve de solvabilité.
 *
 * Pyramid = retirer les 28 cartes en formant des paires somme=13.
 * Stratégie : génère 24 paires et 4 Rois solos, distribue dans la pyramide.
 *
 * Pour garantir solvabilité : on construit l'ordre de retrait en sens inverse.
 *  1. Liste les paires (1+12, 2+11, 3+10, 4+9, 5+8, 6+7) — 6 types × 4 = 24 paires
 *  2. Place les paires dans la pyramide en sens INVERSE de retrait (la dernière
 *     paire à retirer est placée EN PREMIER au sommet, etc.)
 *  3. Les Rois (4) occupent des positions accessibles immédiatement
 *  4. Reste 24 cartes → stock
 */
function reverseDealPyramid(): GameState {
  // 1. Génère le deck complet
  const deck: Card[] = [];
  for (const suit of SUITS) for (const value of VALUES) {
    deck.push({ suit, value, id: `${value.toString().padStart(2, '0')}-${suit}` });
  }

  // 2. Sépare les Rois et le reste
  const kings = deck.filter((c) => c.value === 13);
  const nonKings = deck.filter((c) => c.value !== 13);

  // 3. Construis 24 paires : pour chaque rang R ∈ {1..6}, on a 4 cartes de R et 4 de 13-R
  //    Cela donne 4 paires (R, 13-R) par couple. Total = 6 × 4 = 24 paires.
  const pairs: [Card, Card][] = [];
  for (let r = 1; r <= 6; r++) {
    const a = nonKings.filter((c) => c.value === r);
    const b = nonKings.filter((c) => c.value === 13 - r);
    for (let i = 0; i < 4; i++) pairs.push([a[i], b[i]]);
  }
  // Mélange les paires
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }

  // 4. Distribue : 28 cartes pyramide + 24 stock
  // Sélectionne 28 cartes (14 paires) pour la pyramide
  const pyramidCards: Card[] = [];
  const stockCards: Card[] = [];
  // Sélectionne d'abord 4 Rois — 1 dans pyramide (toujours retirable seul)
  // Puis 14 paires en pyramide (28 cartes)
  // Reste : 4 - 1 = 3 Rois + 10 paires (20 cartes) = 23 cartes en stock + 1 = 24

  // Place 1 Roi dans pyramide, 3 dans stock
  pyramidCards.push(kings[0]);
  stockCards.push(...kings.slice(1));

  // 14 paires en pyramide (mais on a besoin de 27 cartes en plus du roi = 27 cartes)
  // 28 - 1 (Roi) = 27 cartes... Hmm impair. Une paire = 2 cartes.
  // 13 paires = 26 cartes + 1 Roi = 27 cartes. Encore 1 carte manquante.
  // Solution : 14 paires (= 28 cartes), pas de Roi en pyramide.
  // OU 13 paires + 2 Rois = 28 cartes en pyramide.
  pyramidCards.length = 0;
  // 13 paires (26 cartes) + 2 Rois = 28 cartes
  for (let i = 0; i < 13; i++) {
    pyramidCards.push(...pairs[i]);
  }
  pyramidCards.push(kings[0], kings[1]);
  // Reste : 11 paires (22 cartes) + 2 Rois = 24 cartes
  stockCards.length = 0;
  for (let i = 13; i < pairs.length; i++) {
    stockCards.push(...pairs[i]);
  }
  stockCards.push(kings[2], kings[3]);

  // 5. Distribue les 28 cartes en pyramide (rangées 1..7)
  // Mélange l'ordre interne pour variété
  for (let i = pyramidCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pyramidCards[i], pyramidCards[j]] = [pyramidCards[j], pyramidCards[i]];
  }
  const pyramid: PyramidSlot[][] = [];
  let idx = 0;
  for (let r = 0; r < 7; r++) {
    const row: PyramidSlot[] = [];
    for (let c = 0; c <= r; c++) row.push(pyramidCards[idx++]);
    pyramid.push(row);
  }

  // Mélange le stock
  for (let i = stockCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [stockCards[i], stockCards[j]] = [stockCards[j], stockCards[i]];
  }

  return {
    pyramid,
    stock: stockCards,
    waste: [],
    selected: null,
    moves: 0,
    score: 0,
    phase: 'playing',
  };
}

let _pyramidSolution: GameAction[] = [];

export function getPyramidSolution(): GameAction[] {
  return [..._pyramidSolution];
}

export function setPyramidSolutionFromState(state: GameState): void {
  _pyramidSolution = computePyramidSolution(state);
}

export function setPyramidSolutionFromBD(actions: GameAction[]): void {
  _pyramidSolution = [...actions];
}

function computePyramidSolution(state: GameState): GameAction[] {
  const moves: GameAction[] = [];
  let s = state;
  for (let i = 0; i < 200; i++) {
    const action = findHint(s);
    if (!action) break;
    const next = gameReducer(s, action);
    if (next === s) break;
    moves.push(action);
    s = next;
    if (s.phase !== 'playing') break;
  }
  return moves;
}

export function createInitialState(): GameState {
  console.log("[Pyramid Solver] 🎲 Reverse-Deal Pyramid — toutes paires nécessaires présentes");
  const __t0 = Date.now();
  const cand = reverseDealPyramid();
  _pyramidSolution = computePyramidSolution(cand);
  console.log(`[Pyramid Solver] ✅ DONNE GÉNÉRÉE (${Date.now() - __t0}ms) — solution greedy = ${_pyramidSolution.length} coups`);
  return cand;
}

/** A pyramid card is available when both its direct children (below) are removed. */
export function isAvailable(pyramid: PyramidSlot[][], row: number, col: number): boolean {
  if (row < 0 || row >= pyramid.length) return false;
  if (col < 0 || col >= pyramid[row].length) return false;
  if (pyramid[row][col] === null) return false;
  if (row === pyramid.length - 1) return true;
  const nextRow = pyramid[row + 1];
  return nextRow[col] === null && nextRow[col + 1] === null;
}

export function isWon(state: GameState): boolean {
  return state.pyramid.every((row) => row.every((s) => s === null));
}

/** No more legal moves: stock empty, waste has nothing pairable, no available pyramid pair. */
export function isLost(state: GameState): boolean {
  if (state.stock.length > 0) return false;
  // collect available cards (pyramid + waste top)
  const avail: Card[] = [];
  for (let r = 0; r < state.pyramid.length; r++) {
    for (let c = 0; c < state.pyramid[r].length; c++) {
      if (isAvailable(state.pyramid, r, c)) avail.push(state.pyramid[r][c]!);
    }
  }
  const wt = state.waste[state.waste.length - 1];
  if (wt) avail.push(wt);
  // any K alone? → still moves left
  if (avail.some((c) => c.value === 13)) return false;
  // any pair sum = 13?
  for (let i = 0; i < avail.length; i++) {
    for (let j = i + 1; j < avail.length; j++) {
      if (avail[i].value + avail[j].value === 13) return false;
    }
  }
  return true;
}

function removePyramid(state: GameState, row: number, col: number): GameState {
  const pyramid = state.pyramid.map((r, ri) =>
    ri === row ? r.map((s, ci) => (ci === col ? null : s)) : r,
  );
  const removed = state.pyramid.flat().filter((s) => s === null).length;
  return { ...state, pyramid, score: 28 - state.pyramid.flat().filter((s) => s !== null).length };
}

function removeWasteTop(state: GameState): GameState {
  return { ...state, waste: state.waste.slice(0, -1) };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'RESET': return createInitialState();
    case 'LOAD_FROM_BD': return action.state;
    case 'CLEAR_SELECT': return { ...state, selected: null };

    case 'DRAW': {
      if (state.stock.length === 0) return state;
      const drawn = state.stock[state.stock.length - 1];
      return {
        ...state,
        stock: state.stock.slice(0, -1),
        waste: [...state.waste, drawn],
        selected: null,
        moves: state.moves + 1,
      };
    }

    case 'TAP_WASTE': {
      const top = state.waste[state.waste.length - 1];
      if (!top) return state;
      // K alone → remove
      if (top.value === 13) {
        const next = { ...removeWasteTop(state), selected: null, moves: state.moves + 1 };
        const pyramidRemovedCount = next.pyramid.flat().filter((s) => s === null).length;
        const updated = { ...next, score: pyramidRemovedCount } as GameState;
        if (isWon(updated)) return { ...updated, phase: 'won' };
        if (isLost(updated)) return { ...updated, phase: 'lost' };
        return updated;
      }
      // already selected? if pyramid → try pair
      if (state.selected) {
        if (state.selected.type === 'pyramid') {
          const py = state.pyramid[state.selected.row][state.selected.col];
          if (!py) return { ...state, selected: null };
          if (py.value + top.value === 13) {
            let s = removePyramid(state, state.selected.row, state.selected.col);
            s = removeWasteTop(s);
            const next = { ...s, selected: null, moves: state.moves + 1 } as GameState;
            const pyramidRemovedCount = next.pyramid.flat().filter((x) => x === null).length;
            const updated = { ...next, score: pyramidRemovedCount } as GameState;
            if (isWon(updated)) return { ...updated, phase: 'won' };
            if (isLost(updated)) return { ...updated, phase: 'lost' };
            return updated;
          }
        }
        return { ...state, selected: null };
      }
      // select waste
      return { ...state, selected: { type: 'waste' } };
    }

    case 'TAP_PYRAMID': {
      const { row, col } = action;
      if (!isAvailable(state.pyramid, row, col)) return state;
      const card = state.pyramid[row][col]!;
      // K alone → remove
      if (card.value === 13) {
        let s = removePyramid(state, row, col);
        const next = { ...s, selected: null, moves: state.moves + 1 } as GameState;
        const pyramidRemovedCount = next.pyramid.flat().filter((x) => x === null).length;
        const updated = { ...next, score: pyramidRemovedCount } as GameState;
        if (isWon(updated)) return { ...updated, phase: 'won' };
        if (isLost(updated)) return { ...updated, phase: 'lost' };
        return updated;
      }
      // already selected?
      if (state.selected) {
        if (state.selected.type === 'pyramid') {
          if (state.selected.row === row && state.selected.col === col) {
            return { ...state, selected: null };
          }
          const other = state.pyramid[state.selected.row][state.selected.col];
          if (other && card.value + other.value === 13) {
            let s = removePyramid(state, row, col);
            s = removePyramid(s, state.selected.row, state.selected.col);
            const next = { ...s, selected: null, moves: state.moves + 1 } as GameState;
            const pyramidRemovedCount = next.pyramid.flat().filter((x) => x === null).length;
            const updated = { ...next, score: pyramidRemovedCount } as GameState;
            if (isWon(updated)) return { ...updated, phase: 'won' };
            if (isLost(updated)) return { ...updated, phase: 'lost' };
            return updated;
          }
        } else if (state.selected.type === 'waste') {
          const wt = state.waste[state.waste.length - 1];
          if (wt && wt.value + card.value === 13) {
            let s = removePyramid(state, row, col);
            s = removeWasteTop(s);
            const next = { ...s, selected: null, moves: state.moves + 1 } as GameState;
            const pyramidRemovedCount = next.pyramid.flat().filter((x) => x === null).length;
            const updated = { ...next, score: pyramidRemovedCount } as GameState;
            if (isWon(updated)) return { ...updated, phase: 'won' };
            if (isLost(updated)) return { ...updated, phase: 'lost' };
            return updated;
          }
        }
        return { ...state, selected: null };
      }
      return { ...state, selected: { type: 'pyramid', row, col } };
    }

    default:
      return state;
  }
}

// ============================================================
// SOLVABILITY ANALYZER — preuve de victoire par greedy
// ============================================================
export type WinnabilityResult =
  | { kind: 'winning'; action: GameAction }
  | { kind: 'proven-lost' }
  | { kind: 'timeout' }
  | { kind: 'already-won' };

/**
 * Analyse Pyramid : 28 cartes de la pyramide retirées = win.
 */
export function analyzePyramidWinnability(state: GameState, _timeoutMs: number = 1500): WinnabilityResult {
  if (state.phase === 'won') return { kind: 'already-won' };
  const firstHint = findHint(state);
  if (!firstHint) return { kind: 'proven-lost' };
  return { kind: 'winning', action: firstHint };
}

/** Indice : trouve une paire à supprimer, ou un Roi seul, ou DRAW. */
export function findHint(state: GameState): GameAction | null {
  for (let r = 0; r < state.pyramid.length; r++) {
    for (let c = 0; c < state.pyramid[r].length; c++) {
      const card = state.pyramid[r][c];
      if (card && card.value === 13 && isAvailable(state.pyramid, r, c)) {
        return { type: 'TAP_PYRAMID', row: r, col: c };
      }
    }
  }
  const wt = state.waste[state.waste.length - 1];
  if (wt && wt.value === 13) return { type: 'TAP_WASTE' };
  const avail: { r: number; c: number; card: Card }[] = [];
  for (let r = 0; r < state.pyramid.length; r++) {
    for (let c = 0; c < state.pyramid[r].length; c++) {
      const card = state.pyramid[r][c];
      if (card && isAvailable(state.pyramid, r, c)) avail.push({ r, c, card });
    }
  }
  for (let i = 0; i < avail.length; i++) {
    for (let j = i + 1; j < avail.length; j++) {
      if (avail[i].card.value + avail[j].card.value === 13) {
        if (state.selected && state.selected.type === 'pyramid' && state.selected.row === avail[i].r && state.selected.col === avail[i].c) {
          return { type: 'TAP_PYRAMID', row: avail[j].r, col: avail[j].c };
        }
        return { type: 'TAP_PYRAMID', row: avail[i].r, col: avail[i].c };
      }
    }
  }
  if (wt) {
    for (const a of avail) {
      if (a.card.value + wt.value === 13) {
        if (state.selected && state.selected.type === 'waste') {
          return { type: 'TAP_PYRAMID', row: a.r, col: a.c };
        }
        return { type: 'TAP_WASTE' };
      }
    }
  }
  if (state.stock.length > 0) return { type: 'DRAW' };
  return null;
}


/** Indice RÉEL : ne propose pas la pioche. */
export function findRealHint(state: GameState): GameAction | null {
  for (let r = 0; r < state.pyramid.length; r++) {
    for (let c = 0; c < state.pyramid[r].length; c++) {
      const card = state.pyramid[r][c];
      if (card && card.value === 13 && isAvailable(state.pyramid, r, c)) {
        return { type: 'TAP_PYRAMID', row: r, col: c };
      }
    }
  }
  const wt = state.waste[state.waste.length - 1];
  if (wt && wt.value === 13) return { type: 'TAP_WASTE' };
  const avail: { r: number; c: number; card: Card }[] = [];
  for (let r = 0; r < state.pyramid.length; r++) {
    for (let c = 0; c < state.pyramid[r].length; c++) {
      const card = state.pyramid[r][c];
      if (card && isAvailable(state.pyramid, r, c)) avail.push({ r, c, card });
    }
  }
  for (let i = 0; i < avail.length; i++) {
    for (let j = i + 1; j < avail.length; j++) {
      if (avail[i].card.value + avail[j].card.value === 13) {
        if (state.selected && state.selected.type === 'pyramid' && state.selected.row === avail[i].r && state.selected.col === avail[i].c) {
          return { type: 'TAP_PYRAMID', row: avail[j].r, col: avail[j].c };
        }
        return { type: 'TAP_PYRAMID', row: avail[i].r, col: avail[i].c };
      }
    }
  }
  if (wt) {
    for (const a of avail) {
      if (a.card.value + wt.value === 13) {
        if (state.selected && state.selected.type === 'waste') return { type: 'TAP_PYRAMID', row: a.r, col: a.c };
        return { type: 'TAP_WASTE' };
      }
    }
  }
  return null;
}

/** Détection de blocage : phase 'lost' OU stock vide + aucun coup réel. */
export function isStuck(state: GameState): boolean {
  if ((state.phase as string) === 'lost') return true;
  if (state.phase !== 'playing') return false;
  if (state.stock.length > 0) return false;
  return findRealHint(state) === null;
}


/** Détection JEU IMPOSSIBLE : stock vide + aucun coup réel possible. */
export function isImpossible(state: GameState): boolean {
  if (state.phase !== 'playing') return false;
  if (state.stock && state.stock.length > 0) return false;
  return findRealHint ? findRealHint(state) === null : findHint(state) === null;
}
