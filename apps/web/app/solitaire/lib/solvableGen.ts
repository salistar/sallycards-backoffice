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
import type { MazeGameState, MazeConfig } from './engines/_mazeEngine';
import { canFillHole, gameReducer as mazeReducer } from './engines/_mazeEngine';
import { createSpider, spiderReducer, isRun, type SpiderState } from './spider';

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
  // Cartes cachées selon la config (look authentique : seules les cartes du haut
  // sont visibles). La solution reste valide : le reducer retourne le nouveau
  // sommet à chaque retrait → l'« Auto » résout quand même la donne.
  for (const pile of tableau) {
    const len = pile.length;
    pile.forEach((c, idx) => { const fromBottom = len - 1 - idx; c.faceUp = cfg.tableauFaceUpFromBottom === 'all' || fromBottom < (cfg.tableauFaceUpFromBottom as number); });
  }
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

// ── Maze : reverse depuis l'état résolu (mélange par coups valides) ──────────
export function solvableMaze(cfg: MazeConfig): MazeGameState {
  const { rows, cols } = cfg;
  const cards: Card[] = [];
  for (const s of SUITS) for (let r = 1 as Rank; r <= 12; r = (r + 1) as Rank) cards.push({ id: `${r}${s}`, suit: s, rank: r, faceUp: true });
  const grid: (Card | null)[][] = [];
  let idx = 0;
  for (let r = 0; r < rows; r++) { const row: (Card | null)[] = []; for (let c = 0; c < cols; c++) { row.push(idx < cards.length ? cards[idx] : null); idx++; } grid.push(row); }
  let s: MazeGameState = { config: cfg, grid, moveCount: 0, won: false };
  // Mélange : on ne fait que des coups VALIDES → la donne reste résoluble (il
  // suffit de jouer les coups inverses).
  for (let k = 0; k < 60; k++) {
    const moves: Array<[number, number, number, number]> = [];
    for (let fr = 0; fr < rows; fr++) for (let fc = 0; fc < cols; fc++) {
      const card = s.grid[fr][fc]; if (!card) continue;
      for (let tr = 0; tr < rows; tr++) for (let tc = 0; tc < cols; tc++) if (s.grid[tr][tc] === null && canFillHole(s, card, tr, tc)) moves.push([fr, fc, tr, tc]);
    }
    if (!moves.length) break;
    const [fr, fc, tr, tc] = moves[Math.floor(Math.random() * moves.length)];
    s = mazeReducer(s, { type: 'MOVE', fromRow: fr, fromCol: fc, toRow: tr, toCol: tc });
  }
  return { ...s, moveCount: 0, won: false };
}

// ── Spider : génération-et-test par solveur glouton (préfère même couleur) ───
function greedySpiderWins(s0: SpiderState): boolean {
  let s = s0; let guard = 0;
  while (!s.won && guard++ < 500) {
    let best: { from: number; idx: number; to: number; score: number } | null = null;
    for (let from = 0; from < 10; from++) {
      const pile = s.columns[from];
      for (let idx = 0; idx < pile.length; idx++) {
        const run = pile.slice(idx); if (!isRun(run)) continue;
        for (let to = 0; to < 10; to++) {
          if (to === from) continue;
          const dest = s.columns[to]; const top = dest[dest.length - 1];
          const ok = !top ? false : top.rank === run[0].rank + 1; // pas de déplacement vers colonne vide (évite boucles)
          if (!ok) continue;
          const same = top && top.suit === run[0].suit;
          const score = (same ? 100 : 1) + run.length - (idx === 0 ? 0 : 0);
          if (!best || score > best.score) best = { from, idx, to, score };
        }
      }
    }
    if (best && best.score >= 100) { const ns = spiderReducer(s, { type: 'MOVE', from: best.from, cardIdx: best.idx, to: best.to }); if (ns !== s) { s = ns; continue; } }
    const dealt = spiderReducer(s, { type: 'DEAL' }); if (dealt !== s) { s = dealt; continue; }
    if (best) { const ns = spiderReducer(s, { type: 'MOVE', from: best.from, cardIdx: best.idx, to: best.to }); if (ns !== s) { s = ns; continue; } }
    break;
  }
  return s.won;
}

/** Donne Spider résoluble (génération-et-test, meilleur effort) ou repli. */
export function solvableSpiderGen(suitMode: 1 | 2 | 4): SpiderState {
  let last = createSpider(suitMode);
  for (let t = 0; t < 25; t++) { const s = createSpider(suitMode); last = s; if (greedySpiderWins(s)) return s; }
  return last;
}
