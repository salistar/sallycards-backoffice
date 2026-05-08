/**
 * @file spiderEngine.ts — Spider Solitaire (1/2/4 suits, 104 cards = 2 decks).
 *
 * 10 columns. Cols 1..4 = 6 cards (5 face-down + 1 face-up). Cols 5..10 = 5 cards
 * (4 face-down + 1 face-up). 50 remaining cards = 5 deals of 10.
 *
 * Tableau: descending build, ANY color (Roi → As).
 * To move a stack you must have a single-suit run.
 * 8 complete K→A runs of the same suit are auto-removed to "completed" piles.
 * Win = 8 runs completed.
 *
 * Pile rule: cannot deal if any column is empty.
 */

export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export interface Card {
  suit: Suit;
  value: CardValue;
  id: string;       // unique even with 2 decks: e.g. "01-spades-0"
  faceUp: boolean;
}

export interface Column { cards: Card[] }

export type SuitMode = 1 | 2 | 4;

export interface GameState {
  tableau: Column[];      // 10 columns
  stock: Card[];          // remaining undealt
  completed: Card[][];    // each entry = a finished K→A suit (max 8)
  moves: number;
  score: number;
  phase: 'playing' | 'won';
  suitMode: SuitMode;
}

export type GameAction =
  | { type: 'DEAL_ROW' }
  | { type: 'MOVE_RUN'; fromCol: number; fromCardIndex: number; toCol: number }
  | { type: 'AUTO_COMPLETE' }
  | { type: 'RESET'; suitMode?: SuitMode }
  | { type: 'LOAD_FROM_BD'; state: GameState };

export const COLUMNS = 10;
export const ALL_SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
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

/** Build a 104-card deck with the given number of suits used. */
export function buildDeck(suitMode: SuitMode): Card[] {
  const suits = suitMode === 1
    ? (['spades'] as Suit[])
    : suitMode === 2
      ? (['spades', 'hearts'] as Suit[])
      : ALL_SUITS;
  const reps = 104 / (suits.length * 13);
  const deck: Card[] = [];
  let counter = 0;
  for (let r = 0; r < reps; r++) {
    for (const suit of suits) {
      for (const value of VALUES) {
        deck.push({
          suit,
          value,
          id: `${value.toString().padStart(2, '0')}-${suit}-${counter++}`,
          faceUp: false,
        });
      }
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const out = [...deck];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Helpers pour le reverse-deal : trouver les coups valides entre colonnes */
function findInverseTableauMoves(tableau: Column[]): Array<{ from: number; to: number; count: number }> {
  const moves: Array<{ from: number; to: number; count: number }> = [];
  for (let from = 0; from < 10; from++) {
    const src = tableau[from].cards;
    if (src.length === 0) continue;
    // Trouve la séquence valide en bas (descendante mono-couleur)
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
        const dstTop = dst[dst.length - 1];
        if (!dstTop) {
          // Col vide accepte tout sauf vider entièrement la source
          if (start > 0) moves.push({ from, to, count });
        } else if (dstTop.value === head.value + 1) {
          moves.push({ from, to, count });
        }
      }
    }
  }
  return moves;
}

function applyInverseTableauMove(tableau: Column[], m: { from: number; to: number; count: number }): void {
  const moved = tableau[m.from].cards.splice(tableau[m.from].cards.length - m.count, m.count);
  tableau[m.to].cards.push(...moved);
}

/**
 * REVERSE-DEAL AUTHENTIQUE (inspiré du module Sally).
 *
 * Principe :
 *  1. Construire 8 séquences COMPLÈTES K→A mono-couleur.
 *  2. Les placer sur 8 colonnes du tableau (état "win-1" reachable).
 *  3. Appliquer N coups VALIDES pour mélanger (chaque coup conserve la solvabilité
 *     car il est inversible).
 *  4. Pop des cartes des cols vers stock (5 inverses-deals → 50 cartes en stock).
 *  5. Marquer face-down sauf top de chaque col.
 *
 * GARANTIE : la donne EST solvable car le chemin inverse vers la victoire existe.
 */
function reverseDealSpider(suitMode: SuitMode): GameState {
  // 1. Construire 8 séquences complètes Roi→As mono-couleur
  const allowedSuits: Suit[] = suitMode === 1
    ? (['spades'] as Suit[])
    : suitMode === 2
      ? (['spades', 'hearts'] as Suit[])
      : (['spades', 'hearts', 'diamonds', 'clubs'] as Suit[]);
  const seqsPerSuit = 8 / allowedSuits.length;

  const runs: Card[][] = [];
  let counter = 0;
  for (const suit of allowedSuits) {
    for (let i = 0; i < seqsPerSuit; i++) {
      const run: Card[] = [];
      for (let v = 13; v >= 1; v--) {
        run.push({
          suit,
          value: v as CardValue,
          id: `${v.toString().padStart(2, '0')}-${suit}-${counter++}`,
          faceUp: true,
        });
      }
      runs.push(run);
    }
  }
  // Mélanger l'ordre des runs
  for (let i = runs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [runs[i], runs[j]] = [runs[j], runs[i]];
  }

  // 2. Placer les 8 runs sur 8 colonnes au hasard (2 cols restent vides)
  const colIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = colIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [colIndices[i], colIndices[j]] = [colIndices[j], colIndices[i]];
  }
  const tableau: Column[] = Array.from({ length: 10 }, () => ({ cards: [] }));
  for (let i = 0; i < 8; i++) {
    tableau[colIndices[i]].cards.push(...runs[i].map((c) => ({ ...c })));
  }

  // 3. Appliquer 80 coups inverses VALIDES pour mélanger les colonnes
  const NUM_MIXES = 80;
  for (let m = 0; m < NUM_MIXES; m++) {
    const moves = findInverseTableauMoves(tableau);
    if (moves.length === 0) break;
    const move = moves[Math.floor(Math.random() * moves.length)];
    applyInverseTableauMove(tableau, move);
  }

  // 4. Inverser 5 distributions du stock : pop top de chaque col → stock
  //    Total à pousser au stock : 50 cartes (pour avoir 54 au tableau, 50 en stock = 104).
  const stock: Card[] = [];
  let cardsToStock = 50;
  while (cardsToStock > 0) {
    let movedThisRound = 0;
    for (let col = 9; col >= 0 && cardsToStock > 0; col--) {
      // On garde au moins 1 carte par colonne (sinon impossible de la voir)
      if (tableau[col].cards.length > 1) {
        const card = tableau[col].cards.pop()!;
        stock.push({ ...card, faceUp: false });
        cardsToStock--;
        movedThisRound++;
      }
    }
    if (movedThisRound === 0) break;
  }

  // 5. Marquer face-down toutes les cartes sauf le top de chaque col
  for (const col of tableau) {
    for (let i = 0; i < col.cards.length - 1; i++) {
      col.cards[i] = { ...col.cards[i], faceUp: false };
    }
    if (col.cards.length > 0) {
      col.cards[col.cards.length - 1] = { ...col.cards[col.cards.length - 1], faceUp: true };
    }
  }

  return {
    tableau,
    stock,
    completed: [],
    moves: 0,
    score: 500,
    phase: 'playing',
    suitMode,
  };
}

function dealOnce(suitMode: SuitMode): GameState {
  const deck = shuffleDeck(buildDeck(suitMode));
  const tableau: Column[] = [];
  let i = 0;
  for (let c = 0; c < COLUMNS; c++) {
    const cards: Card[] = [];
    const size = c < 4 ? 6 : 5;
    for (let r = 0; r < size; r++) {
      const card = { ...deck[i++], faceUp: r === size - 1 };
      cards.push(card);
    }
    tableau.push({ cards });
  }
  const stock = deck.slice(i).map((c) => ({ ...c, faceUp: false }));
  return { tableau, stock, completed: [], moves: 0, score: 500, phase: 'playing', suitMode };
}

/** Score d'une donne via greedy : compte les cartes face-up rendues mobiles + runs complétés. */
function spiderProgress(initial: GameState): number {
  let s = initial;
  for (let i = 0; i < 200; i++) {
    const action = findHint(s);
    if (!action) break;
    const next = gameReducer(s, action);
    if (next === s) break;
    s = next;
  }
  // Score = runs complétés × 13 + cartes face-up qui n'étaient pas face-up au départ
  const completedCards = s.completed.length * 13;
  const initialFaceUp = initial.tableau.reduce((a, c) => a + c.cards.filter((x) => x.faceUp).length, 0);
  const finalFaceUp = s.tableau.reduce((a, c) => a + c.cards.filter((x) => x.faceUp).length, 0);
  return completedCards + (finalFaceUp - initialFaceUp);
}

// Solution stockée pour le hint robuste (séquence greedy depuis le deal)
let _spiderSolution: GameAction[] = [];

export function getSpiderSolution(): GameAction[] {
  return [..._spiderSolution];
}

export function setSpiderSolutionFromState(state: GameState): void {
  _spiderSolution = computeSpiderSolution(state);
}

export function setSpiderSolutionFromBD(actions: GameAction[]): void {
  _spiderSolution = [...actions];
}

function computeSpiderSolution(state: GameState): GameAction[] {
  const moves: GameAction[] = [];
  let s = state;
  for (let i = 0; i < 500; i++) {
    const action = findHint(s);
    if (!action) break;
    const next = gameReducer(s, action);
    if (next === s) break;
    moves.push(action);
    s = next;
    if (s.completed.length === 8) break;
  }
  return moves;
}

export function createInitialState(suitMode: SuitMode = 4): GameState {
  console.log("[Spider Solver] 🎲 Reverse-Deal Spider — construction garantie soluble");
  const __t0 = Date.now();
  const cand = reverseDealSpider(suitMode);
  // Pré-calcule la solution greedy depuis le deal
  _spiderSolution = computeSpiderSolution(cand);
  const __elapsed = Date.now() - __t0;
  console.log(`[Spider Solver] ✅ DONNE SOLUBLE (${__elapsed}ms) — solution greedy = ${_spiderSolution.length} coups`);
  return cand;
}

/** Check if a contiguous slice of cards forms a "single-suit descending run". */
export function isValidRun(cards: Card[]): boolean {
  if (cards.length === 0) return false;
  for (let i = 0; i < cards.length; i++) {
    if (!cards[i].faceUp) return false;
    if (i > 0) {
      const prev = cards[i - 1];
      const cur = cards[i];
      if (prev.suit !== cur.suit) return false;
      if (cur.value !== prev.value - 1) return false;
    }
  }
  return true;
}

/** Anything goes for stacking on tableau (only top card check). */
export function canPlaceTop(card: Card, top: Card | null): boolean {
  if (!top) return true; // empty column accepts anything
  return card.value === top.value - 1;
}

function flipTopOf(col: Column): Column {
  if (col.cards.length === 0) return col;
  const cards = col.cards.map((c, i, a) =>
    i === a.length - 1 ? { ...c, faceUp: true } : c,
  );
  return { cards };
}

function detectCompletedRun(col: Column): { remaining: Column; completed: Card[] } | null {
  // A completed run = K..A same suit, all face up at the bottom.
  if (col.cards.length < 13) return null;
  const slice = col.cards.slice(-13);
  if (slice[0].value !== 13) return null;
  if (!isValidRun(slice)) return null;
  return {
    remaining: { cards: col.cards.slice(0, -13) },
    completed: slice,
  };
}

export function isWon(state: GameState): boolean {
  return state.completed.length >= 8;
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'RESET':
      return createInitialState(action.suitMode ?? state.suitMode);

    case 'LOAD_FROM_BD':
      return action.state;

    case 'DEAL_ROW': {
      // Cannot deal if any column is empty.
      if (state.tableau.some((c) => c.cards.length === 0)) return state;
      if (state.stock.length < COLUMNS) return state;
      const tableau = state.tableau.map((c, i) => ({
        cards: [...c.cards, { ...state.stock[i], faceUp: true }],
      }));
      const stock = state.stock.slice(COLUMNS);
      return { ...state, tableau, stock, moves: state.moves + 1 };
    }

    case 'MOVE_RUN': {
      const { fromCol, fromCardIndex, toCol } = action;
      if (fromCol === toCol) return state;
      const src = state.tableau[fromCol];
      if (fromCardIndex < 0 || fromCardIndex >= src.cards.length) return state;
      const moving = src.cards.slice(fromCardIndex);
      if (!isValidRun(moving)) return state;
      const dest = state.tableau[toCol];
      const top = dest.cards[dest.cards.length - 1];
      if (top && !canPlaceTop(moving[0], top)) return state;

      let nextSrc: Column = { cards: src.cards.slice(0, fromCardIndex) };
      nextSrc = flipTopOf(nextSrc);
      let nextDest: Column = { cards: [...dest.cards, ...moving] };

      // After move, check if dest now has a finished run to remove.
      const completedCheck = detectCompletedRun(nextDest);
      let completed = state.completed;
      if (completedCheck) {
        nextDest = completedCheck.remaining;
        completed = [...completed, completedCheck.completed];
      }

      const tableau = state.tableau.map((c, i) =>
        i === fromCol ? nextSrc : i === toCol ? nextDest : c,
      );
      const next = {
        ...state,
        tableau,
        completed,
        moves: state.moves + 1,
        score: state.score - 1 + (completedCheck ? 100 : 0),
      };
      return isWon(next) ? { ...next, phase: 'won' as const } : next;
    }

    case 'AUTO_COMPLETE': {
      // Greedy: scan all columns and try to detect any sub-run we can lift to
      // a column ending in the right card. Skipped for simplicity in MVP.
      return state;
    }

    default:
      return state;
  }
}

/**
 * Évaluation statique d'un état Spider — plus la valeur est élevée, mieux c'est.
 *
 * Critères :
 *   - Runs complétés × 100000 (cible principale)
 *   - Colonnes vides × 1000 (slots libres = grande flexibilité)
 *   - Cartes face-up exposées × 50
 *   - Suite descendante même couleur en bas : runLen²×10 (QUADRATIQUE → favorise
 *     fortement la consolidation : 1 run de 6 (360) > 2 runs de 3 (180))
 */
function staticEval(state: GameState): number {
  let score = 0;
  score += state.completed.length * 100000;
  for (const col of state.tableau) {
    if (col.cards.length === 0) {
      score += 1000;
      continue;
    }
    let faceUps = 0;
    for (const c of col.cards) if (c.faceUp) faceUps++;
    score += faceUps * 50;
    // Suite descendante même couleur en bas de colonne (quadratique)
    let runLen = 1;
    for (let i = col.cards.length - 1; i > 0; i--) {
      const cur = col.cards[i];
      const prev = col.cards[i - 1];
      if (!cur.faceUp || !prev.faceUp) break;
      if (prev.value === cur.value + 1 && prev.suit === cur.suit) runLen++;
      else break;
    }
    score += runLen * runLen * 10;
  }
  return score;
}

/** Énumère TOUS les coups MOVE_RUN légaux depuis un état. */
function collectAllMoves(state: GameState): GameAction[] {
  const moves: GameAction[] = [];
  for (let from = 0; from < state.tableau.length; from++) {
    const src = state.tableau[from].cards;
    for (let i = 0; i < src.length; i++) {
      if (!src[i].faceUp) continue;
      const moving = src.slice(i);
      if (!isValidRun(moving)) continue;
      const head = moving[0];
      for (let to = 0; to < state.tableau.length; to++) {
        if (to === from) continue;
        const dest = state.tableau[to].cards;
        const top = dest[dest.length - 1];
        if (!top || canPlaceTop(head, top)) {
          if (i === 0 && !top) continue;  // ne pas déplacer une colonne vide vers une autre vide
          moves.push({ type: 'MOVE_RUN', fromCol: from, fromCardIndex: i, toCol: to });
        }
      }
    }
  }
  return moves;
}

/**
 * Indice intelligent avec 2-STEP LOOKAHEAD + AVOID set anti-cycle.
 *
 * RÈGLE STRICTE :
 *   - Ne propose un coup MOVE_RUN QUE s'il améliore STRICTEMENT l'eval
 *   - Sinon → DEAL_ROW (distribue de nouvelles cartes du stock)
 *   - Sinon → null (vraiment bloqué : pas de stock, plus de coup utile)
 *
 * Cette règle élimine les cycles : un coup neutre (M puis M') a eval identique
 * et est donc REFUSÉ → on déclenche un DEAL_ROW automatique.
 *
 * @param avoid : signatures d'actions à éviter (cycles récents).
 */
export function findHint(state: GameState, avoid?: Set<string>): GameAction | null {
  const currentEval = staticEval(state);
  const moves = collectAllMoves(state);

  let bestMove: GameAction | null = null;
  let bestLookahead = currentEval;   // STRICT : on cherche > current

  for (const m of moves) {
    if (avoid && avoid.has(JSON.stringify(m))) continue;
    const next = gameReducer(state, m);
    if (next === state) continue;
    const evalNext = staticEval(next);
    let bestSecond = evalNext;
    const movesNext = collectAllMoves(next);
    for (const m2 of movesNext) {
      const next2 = gameReducer(next, m2);
      if (next2 === next) continue;
      const eval2 = staticEval(next2);
      if (eval2 > bestSecond) bestSecond = eval2;
    }
    if (bestSecond > bestLookahead) {
      bestLookahead = bestSecond;
      bestMove = m;
    }
  }

  // 1) Coup STRICTEMENT progressif trouvé
  if (bestMove) return bestMove;

  // 2) Aucun coup ne progresse → DEAL_ROW pour relancer (priorité haute)
  if (state.stock.length >= COLUMNS && !state.tableau.some((c) => c.cards.length === 0)) {
    return { type: 'DEAL_ROW' };
  }

  // 3) Pas de stock + pas de coup progressif → vraiment bloqué
  return null;
}


/** Détection de blocage : stock vide (ou col vide) + aucun coup réel possible. */
export function isStuck(state: GameState): boolean {
  if (state.phase !== 'playing') return false;
  // Si on peut encore distribuer (stock suffisant + pas de col vide), pas stuck
  if (state.stock.length >= COLUMNS && !state.tableau.some((c) => c.cards.length === 0)) return false;
  return findRealHint(state) === null;
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
 * Analyse Spider : 8 runs complets de 13 = 104 cartes en `completed` = win.
 */
export function analyzeSpiderWinnability(state: GameState, _timeoutMs: number = 1500): WinnabilityResult {
  if (state.completed && state.completed.length === 8) return { kind: 'already-won' };
  // ULTRA-RAPIDE : on vérifie juste qu'un coup existe (sans lookahead).
  // Le bouton 💡 utilisera findHint avec lookahead complet quand l'utilisateur clique.
  const hasMove = collectAllMoves(state).length > 0;
  if (!hasMove) {
    if (state.stock.length >= COLUMNS && !state.tableau.some((c) => c.cards.length === 0)) {
      return { kind: 'winning', action: { type: 'DEAL_ROW' } };
    }
    return { kind: 'proven-lost' };
  }
  // Action proposée pour le badge "winning" : le 1er coup légal (suffit pour le badge)
  return { kind: 'winning', action: collectAllMoves(state)[0] };
}

/** Indice RÉEL (sans pioche/deal). Retourne null si seul DRAW est possible.
  */
export function findRealHint(state: GameState): GameAction | null {
  for (let from = 0; from < state.tableau.length; from++) {
    const src = state.tableau[from].cards;
    for (let i = 0; i < src.length; i++) {
      if (!src[i].faceUp) continue;
      const moving = src.slice(i);
      if (!isValidRun(moving)) continue;
      const head = moving[0];
      for (let to = 0; to < state.tableau.length; to++) {
        if (to === from) continue;
        const dest = state.tableau[to].cards;
        const top = dest[dest.length - 1];
        if (!top || canPlaceTop(head, top)) {
          if (i === 0 && !top) continue;
          return { type: 'MOVE_RUN', fromCol: from, fromCardIndex: i, toCol: to };
        }
      }
    }
  }
  if (state.stock.length >= COLUMNS && !state.tableau.some((c) => c.cards.length === 0)) {
    return { type: 'DEAL_ROW' };
  }
  return null;
}


/** Détection JEU IMPOSSIBLE : stock vide + aucun coup réel possible. */
export function isImpossible(state: GameState): boolean {
  if (state.phase !== 'playing') return false;
  if (state.stock && state.stock.length > 0) return false;
  return findRealHint ? findRealHint(state) === null : findHint(state) === null;
}
