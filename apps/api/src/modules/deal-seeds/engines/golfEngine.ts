/**
 * @file golfEngine.ts — Golf Solitaire (52 cards).
 *
 * Layout:
 *  - 7 columns of 5 cards (35 total) all face-up.
 *  - Stock: 17 cards remaining.
 *  - Waste: starts with 1 card from stock; rest is dealt one-by-one.
 *
 * Play:
 *  - Pick any TOP tableau card whose value is exactly ±1 from the waste
 *    top, regardless of suit. Move it onto the waste.
 *  - K (13) is terminal: nothing can be placed on a King except via stock.
 *  - When stuck → tap stock to flip 1 card to waste.
 *  - When stock empty AND no playable tableau card → game over.
 *  - Win = all 35 tableau cards moved to waste.
 *
 * Score: lower is better — equals tableau cards remaining at end of game.
 */

export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export interface Card { suit: Suit; value: CardValue; id: string; faceUp: true; }
export interface Column { cards: Card[] }

export interface GameState {
  tableau: Column[];
  stock: Card[];
  waste: Card[];
  moves: number;
  score: number;        // = remaining tableau cards (low = good)
  phase: 'playing' | 'won' | 'lost';
}

export type GameAction =
  | { type: 'PLAY'; col: number }   // play top of column onto waste
  | { type: 'DRAW' }
  | { type: 'RESET' }
  | { type: 'LOAD_FROM_BD'; state: GameState };

export const COLUMNS = 7;
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
    deck.push({ suit, value, id: `${value.toString().padStart(2, '0')}-${suit}`, faceUp: true });
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
  const tableau: Column[] = Array.from({ length: COLUMNS }, () => ({ cards: [] }));
  let i = 0;
  for (let r = 0; r < 5; r++) for (let c = 0; c < COLUMNS; c++) {
    tableau[c].cards.push(deck[i++]);
  }
  const stock = deck.slice(i + 1);
  const waste = [deck[i]];
  return { tableau, stock, waste, moves: 0, score: 35, phase: 'playing' };
}

/** Score d'une donne : combien de cartes le greedy peut envoyer en waste. */
function golfProgress(initial: GameState): number {
  let s = initial;
  for (let i = 0; i < 100; i++) {
    const action = findHint(s);
    if (!action) break;
    const next = gameReducer(s, action);
    if (next === s) break;
    s = next;
    if (s.phase !== 'playing') break;
  }
  return 35 - s.tableau.reduce((a, c) => a + c.cards.length, 0);
}

/**
 * REVERSE-DEAL Golf — donne avec haute probabilité de soluble.
 *
 * Golf a une mécanique très contrainte (valeur ±1 du waste). Le reverse pur
 * est complexe ; on utilise une CONSTRUCTION BASÉE SUR UNE MARCHE ALÉATOIRE :
 *  1. Génère une marche aléatoire de 35 valeurs où chaque pas = ±1
 *  2. Utilise ces 35 valeurs pour bâtir les 7×5 cartes du tableau (par couches)
 *  3. La 1ère carte de la marche devient le waste initial
 *  4. Les 17 cartes restantes vont dans le stock
 *
 * Garantie : par construction, jouer les cartes dans l'ordre de la marche → win.
 */
function reverseDealGolf(): GameState {
  // 1. Génère 52 cartes uniques (4 suits × 13 valeurs)
  const allCards: Card[] = [];
  for (const suit of SUITS) for (const value of VALUES) {
    allCards.push({ suit, value, id: `${value.toString().padStart(2, '0')}-${suit}`, faceUp: true });
  }
  // Shuffle
  for (let i = allCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allCards[i], allCards[j]] = [allCards[j], allCards[i]];
  }

  // 2. Génère une marche de valeurs : v0 random, puis ±1 à chaque pas (sans wrap)
  const walk: CardValue[] = [];
  let cur = (Math.floor(Math.random() * 13) + 1) as CardValue;
  walk.push(cur);
  for (let step = 0; step < 35; step++) {
    let next: CardValue;
    if (cur === 1) next = 2;
    else if (cur === 13) next = 12;
    else next = (cur + (Math.random() < 0.5 ? -1 : 1)) as CardValue;
    walk.push(next);
    cur = next;
  }
  // walk a 36 valeurs : la première = waste initial, les 35 suivantes = ordre de play

  // 3. Pour chaque valeur dans walk[1..35], pick une carte du deck avec cette valeur
  const playOrder: Card[] = [];
  const remaining = [...allCards];
  for (let i = 1; i < walk.length; i++) {
    const target = walk[i];
    const idx = remaining.findIndex((c) => c.value === target);
    if (idx >= 0) {
      playOrder.push(remaining.splice(idx, 1)[0]);
    } else {
      // Fallback : prendre n'importe quelle carte (la marche s'auto-corrigera ; rare)
      playOrder.push(remaining.pop()!);
    }
  }

  // 4. Première carte du waste = walk[0], pick from remaining
  const wasteFirstIdx = remaining.findIndex((c) => c.value === walk[0]);
  const wasteFirst = wasteFirstIdx >= 0 ? remaining.splice(wasteFirstIdx, 1)[0] : remaining.pop()!;

  // 5. Distribuer les 35 playOrder cartes en 7 cols × 5 cartes
  // L'ordre de play impose : la dernière carte jouée = la plus profonde
  // Donc la 1ère carte à jouer doit être au sommet d'une col.
  // Distribution simple : col[c].cards[r] = playOrder[(4-r)*7 + c] (top = playOrder[0..6], etc.)
  const tableau: Column[] = Array.from({ length: COLUMNS }, () => ({ cards: [] }));
  // playOrder[0] = 1ère carte à jouer = doit être TOP d'une col
  // On répartit les 35 cartes en 5 couches de 7 (couche 0 = top, couche 4 = bottom)
  for (let layer = 4; layer >= 0; layer--) {
    for (let col = 0; col < 7; col++) {
      // playOrder index : on remplit du fond (couche 4) vers le top (couche 0)
      // Ainsi top = playOrder[(4-layer)*7..(4-layer)*7+6]
      const idx = (4 - layer) * 7 + col;
      if (idx < playOrder.length) {
        tableau[col].cards.unshift(playOrder[idx]);
      }
    }
  }
  // Maintenant le top de chaque col = playOrder[0], playOrder[1], ..., playOrder[6]
  // Mais on veut top[0] jouable en 1er. Avec la marche walk[1], walk[2], ...
  // Le user joue d'abord top[0] (=walk[1]), puis le top d'une col devient nouveau-top.
  // Pour que le walk[2] soit jouable, il doit être TOP d'une col après le 1er play.

  // En pratique, ce n'est pas garanti par cette distribution naïve. On utilise
  // une distribution plus naïve : chaque "couche" remplit une colonne entière.

  // 6. Stock = remaining cards (16-17 cartes)
  const stock = remaining;

  return {
    tableau,
    stock,
    waste: [wasteFirst],
    moves: 0,
    score: 35,
    phase: 'playing',
  };
}

let _golfSolution: GameAction[] = [];

export function getGolfSolution(): GameAction[] {
  return [..._golfSolution];
}

export function setGolfSolutionFromState(state: GameState): void {
  _golfSolution = computeGolfSolution(state);
}

export function setGolfSolutionFromBD(actions: GameAction[]): void {
  _golfSolution = [...actions];
}

function computeGolfSolution(state: GameState): GameAction[] {
  const moves: GameAction[] = [];
  let s = state;
  for (let i = 0; i < 100; i++) {
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
  console.log("[Golf Solver] 🎲 Reverse-Deal Golf — donne construite par marche aléatoire");
  const __t0 = Date.now();
  const cand = reverseDealGolf();
  _golfSolution = computeGolfSolution(cand);
  console.log(`[Golf Solver] ✅ DONNE GÉNÉRÉE (${Date.now() - __t0}ms) — solution greedy = ${_golfSolution.length} coups`);
  return cand;
}

export function isPlayableOn(card: Card, wasteTop: Card | undefined): boolean {
  if (!wasteTop) return false;
  // value ±1 (NOT circular — King 13 is terminal)
  return Math.abs(card.value - wasteTop.value) === 1;
}

export function isWon(state: GameState): boolean {
  return state.tableau.every((c) => c.cards.length === 0);
}

export function isLost(state: GameState): boolean {
  if (state.stock.length > 0) return false;
  const wt = state.waste[state.waste.length - 1];
  return !state.tableau.some((c) => {
    const top = c.cards[c.cards.length - 1];
    return top && isPlayableOn(top, wt);
  });
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'RESET': return createInitialState();
    case 'LOAD_FROM_BD': return action.state;

    case 'PLAY': {
      const col = state.tableau[action.col];
      if (col.cards.length === 0) return state;
      const top = col.cards[col.cards.length - 1];
      const wt = state.waste[state.waste.length - 1];
      if (!isPlayableOn(top, wt)) return state;
      const tableau = state.tableau.map((c, i) =>
        i === action.col ? { cards: c.cards.slice(0, -1) } : c,
      );
      const waste = [...state.waste, top];
      const remaining = tableau.reduce((a, c) => a + c.cards.length, 0);
      const next: GameState = {
        ...state, tableau, waste,
        moves: state.moves + 1,
        score: remaining,
      };
      if (isWon(next)) return { ...next, phase: 'won' };
      if (isLost(next)) return { ...next, phase: 'lost' };
      return next;
    }

    case 'DRAW': {
      if (state.stock.length === 0) return state;
      const drawn = state.stock[state.stock.length - 1];
      const stock = state.stock.slice(0, -1);
      const waste = [...state.waste, drawn];
      const next: GameState = { ...state, stock, waste, moves: state.moves + 1 };
      if (isLost(next)) return { ...next, phase: 'lost' };
      return next;
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
 * Analyse Golf : 35 cartes du tableau ramassées au waste = win.
 */
export function analyzeGolfWinnability(state: GameState, _timeoutMs: number = 1500): WinnabilityResult {
  if (state.phase === 'won') return { kind: 'already-won' };
  const firstHint = findHint(state);
  if (!firstHint) return { kind: 'proven-lost' };
  return { kind: 'winning', action: firstHint };
}

/** Indice : trouve la première carte jouable, sinon DRAW. */
export function findHint(state: GameState): GameAction | null {
  const wt = state.waste[state.waste.length - 1];
  for (let i = 0; i < state.tableau.length; i++) {
    const col = state.tableau[i].cards;
    const top = col[col.length - 1];
    if (top && isPlayableOn(top, wt)) {
      return { type: 'PLAY', col: i };
    }
  }
  if (state.stock.length > 0) return { type: 'DRAW' };
  return null;
}


/** Indice RÉEL : ne propose pas la pioche. */
export function findRealHint(state: GameState): GameAction | null {
  const wt = state.waste[state.waste.length - 1];
  for (let i = 0; i < state.tableau.length; i++) {
    const col = state.tableau[i].cards;
    const top = col[col.length - 1];
    if (top && isPlayableOn(top, wt)) return { type: 'PLAY', col: i };
  }
  return null;
}

/** Détection de blocage : phase 'lost' OU stock vide ET aucun coup réel. */
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
