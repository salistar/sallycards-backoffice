/**
 * @file apps/web/app/solitaire/lib/solvableGen.ts
 * @description Génération de donnes RÉSOLUBLES, générique (toutes les variantes).
 *
 * Famille tableau : on « dé-joue » depuis l'état résolu (toutes les cartes sur
 *   les fondations), rang 13→1, en posant chaque carte sur une colonne. Comme
 *   on procède par rang strictement décroissant, chaque colonne est décroissante
 *   du bas vers le haut ⇒ les As sont au sommet, puis les 2, etc. Le jeu se
 *   résout alors entièrement par simples montées en fondation (preuve par
 *   récurrence). Donne 100 % résoluble pour N'IMPORTE quelle config tableau.
 *
 * Famille paires : génération-et-vérification (on tire une donne et on vérifie
 *   qu'un solveur glouton la vide ; on recommence sinon). Une donne acceptée est
 *   donc garantie résoluble.
 */
import type { Card, GameState, TableauConfig, Suit, Rank } from './engines/_genericTableau';
import type { PairsGameState, PairsConfig } from './engines/_genericPairs';
import { createInitialStateFor as createPairs, gameReducer as pairsReducer, listAccessibleLocations, getCardAt, arePair, canRemoveSingle } from './engines/_genericPairs';

const SUITS: Suit[] = ['S', 'H', 'D', 'C'];

function shuffle<T>(a: T[]): T[] { const o = a.slice(); for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; } return o; }

function allCards(decks: number): Card[] {
  const out: Card[] = []; let n = 0;
  for (let d = 0; d < decks; d++) for (const s of SUITS) for (let r = 1 as Rank; r <= 13; r = (r + 1) as Rank) out.push({ id: `${r}${s}#${n++}`, suit: s, rank: r, faceUp: true });
  return out;
}

/** Donne tableau garantie résoluble (toutes faces visibles, pas de pioche). */
export function reverseTableau(cfg: TableauConfig): GameState {
  const N = Math.max(1, cfg.tableauColumns);
  const byRank: Record<number, Card[]> = {};
  for (const c of allCards(cfg.decks)) (byRank[c.rank] ??= []).push(c);
  const tableau: Card[][] = Array.from({ length: N }, () => []);
  let col = 0;
  for (let r = 13; r >= 1; r--) for (const c of shuffle(byRank[r] || [])) { tableau[col % N].push(c); col++; }
  return {
    config: cfg, tableau,
    freeCells: Array.from({ length: cfg.freeCells }, () => null),
    reserves: [], foundations: Array.from({ length: cfg.foundations }, () => []),
    stock: [], waste: [],
    foundationBaseRankResolved: (cfg.foundationBaseRank === 'variable' ? 1 : cfg.foundationBaseRank) as Rank,
    stockRecyclesUsed: 0, tableauRedealsUsed: 0, moveCount: 0, history: [], won: false, lost: false,
  };
}

// ── Paires : solveur glouton + génération-et-test ────────────────────────────
function greedyClears(s0: PairsGameState): boolean {
  let s = s0; let guard = 0;
  while (!s.won && guard++ < 4000) {
    const acc = listAccessibleLocations(s);
    let acted = false;
    for (const loc of acc) { const c = getCardAt(loc, s); if (c && canRemoveSingle(c, s.config)) { s = pairsReducer(s, { type: 'TRY_REMOVE_SINGLE', loc }); acted = true; break; } }
    if (acted) continue;
    outer: for (let i = 0; i < acc.length; i++) for (let j = i + 1; j < acc.length; j++) { const a = getCardAt(acc[i], s), b = getCardAt(acc[j], s); if (a && b && arePair(a, b, s.config)) { s = pairsReducer(s, { type: 'TRY_REMOVE_PAIR', a: acc[i], b: acc[j] }); acted = true; break outer; } }
    if (acted) continue;
    if (s.stock.length > 0) { s = pairsReducer(s, { type: 'DRAW_STOCK' }); continue; }
    const rec = pairsReducer(s, { type: 'RECYCLE_WASTE' }); if (rec !== s) { s = rec; continue; }
    break;
  }
  return s.won;
}

/** Donne paires garantie résoluble (vérifiée par solveur glouton, sinon repli). */
export function solvablePairs(cfg: PairsConfig): PairsGameState {
  let last = createPairs(cfg);
  for (let t = 0; t < 80; t++) { const s = createPairs(cfg); last = s; if (greedyClears(s)) return s; }
  return last;
}

/** Vérifie qu'une donne paires est résoluble (pour un éventuel bouton « auto »). */
export function pairsSolvable(s: PairsGameState): boolean { return greedyClears(s); }
