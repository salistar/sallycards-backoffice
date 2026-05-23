/**
 * @file apps/web/app/solitaire/lib/spider.ts
 * @description Spider authentique (1/2/4 couleurs). 2 jeux = 104 cartes, 10
 *   colonnes (54 distribuées, 50 au talon = 5 donnes de 10). On déplace des
 *   suites décroissantes de MÊME couleur ; on pose sur une carte de rang +1
 *   (toute couleur) ou colonne vide. Une suite Roi→As de même couleur part en
 *   fondation. 8 suites complètes = gagné. Cartes french52 réelles.
 */
import type { Suit, Rank, Card } from './engines/_genericTableau';

export interface SpiderState {
  suitMode: 1 | 2 | 4;
  columns: Card[][];
  stock: Card[][];      // donnes restantes (chaque = 10 cartes)
  completed: number;     // suites terminées (fondations)
  moveCount: number;
  won: boolean;
}
export type SpiderAction =
  | { type: 'DEAL' }
  | { type: 'MOVE'; from: number; cardIdx: number; to: number };

function buildDeck(suitMode: 1 | 2 | 4, rng: () => number): Card[] {
  const suits: Suit[] = suitMode === 1 ? ['S'] : suitMode === 2 ? ['S', 'H'] : ['S', 'H', 'D', 'C'];
  const copiesPerSuit = 104 / (suits.length * 13); // 1→8, 2→4, 4→2
  const out: Card[] = [];
  let n = 0;
  for (let c = 0; c < copiesPerSuit; c++) for (const s of suits) for (let r = 1 as Rank; r <= 13; r = (r + 1) as Rank) out.push({ id: `${r}${s}#${n++}`, suit: s, rank: r, faceUp: false });
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}
function mulberry32(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export function createSpider(suitMode: 1 | 2 | 4, seed?: number): SpiderState {
  const rng = seed != null ? mulberry32(seed) : Math.random;
  const deck = buildDeck(suitMode, rng);
  const columns: Card[][] = Array.from({ length: 10 }, () => []);
  let i = 0;
  for (let col = 0; col < 10; col++) { const n = col < 4 ? 6 : 5; for (let k = 0; k < n; k++) columns[col].push({ ...deck[i++] }); }
  columns.forEach((c) => { if (c.length) c[c.length - 1].faceUp = true; });
  const stock: Card[][] = [];
  while (i < deck.length) { stock.push(deck.slice(i, i + 10)); i += 10; }
  return { suitMode, columns, stock, completed: 0, moveCount: 0, won: false };
}

export function isRun(cards: Card[]): boolean {
  for (let i = 1; i < cards.length; i++) { if (!cards[i - 1].faceUp || cards[i].suit !== cards[0].suit || cards[i].rank !== cards[i - 1].rank - 1) return false; }
  return cards.length > 0 && cards[0].faceUp;
}
function canPlace(moving: Card, destTop: Card | null): boolean {
  if (!destTop) return true; // colonne vide accepte tout
  return destTop.rank === moving.rank + 1;
}

/** Retire les suites K→A complètes de même couleur en bas de colonne. */
function collect(st: SpiderState): SpiderState {
  let completed = st.completed;
  const columns = st.columns.map((c) => c.slice());
  for (let col = 0; col < 10; col++) {
    const pile = columns[col];
    if (pile.length >= 13) {
      const last13 = pile.slice(pile.length - 13);
      if (last13[0].rank === 13 && isRun(last13) && last13[12].rank === 1) {
        columns[col] = pile.slice(0, pile.length - 13);
        if (columns[col].length) columns[col][columns[col].length - 1].faceUp = true;
        completed++;
      }
    }
  }
  return { ...st, columns, completed, won: completed >= 8 };
}

export function spiderReducer(st: SpiderState, a: SpiderAction): SpiderState {
  if (st.won) return st;
  if (a.type === 'DEAL') {
    if (st.stock.length === 0) return st;
    if (st.columns.some((c) => c.length === 0)) return st; // règle : pas de colonne vide
    const deal = st.stock[0];
    const columns = st.columns.map((c, i) => [...c, { ...deal[i], faceUp: true }]);
    return collect({ ...st, columns, stock: st.stock.slice(1), moveCount: st.moveCount + 1 });
  }
  if (a.type === 'MOVE') {
    const from = st.columns[a.from], to = st.columns[a.to];
    if (!from || !to || a.from === a.to) return st;
    const moving = from.slice(a.cardIdx);
    if (!isRun(moving)) return st;
    if (!canPlace(moving[0], to[to.length - 1] ?? null)) return st;
    const columns = st.columns.map((c) => c.slice());
    columns[a.from] = from.slice(0, a.cardIdx);
    if (columns[a.from].length) columns[a.from][columns[a.from].length - 1].faceUp = true;
    columns[a.to] = [...to, ...moving];
    return collect({ ...st, columns, moveCount: st.moveCount + 1 });
  }
  return st;
}
