/**
 * @file apps/web/app/solitaire/lib/dealLoader.ts
 * @description Charge des donnes RÉSOLUBLES depuis l'API (collection deal_seeds :
 *   300 donnes/variante avec solution, pour les 13 variantes canoniques) et les
 *   convertit dans le format d'état de nos plateaux. Garantit que chaque partie
 *   proposée a une solution. Repli silencieux sur une donne aléatoire en cas
 *   d'échec réseau ou de variante non couverte.
 */
import type { Card, GameState, TableauConfig, Rank } from './engines/_genericTableau';
import type { SpiderState } from './spider';

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1').replace(/\/$/, '');

/** Variantes dont la donne API est COMPLÈTE & déjà distribuée (donc directement
 *  chargeable et résoluble). Les autres (Klondike, Spider 2/4…) stockent le
 *  paquet pré-distribution pour les moteurs mobiles → repli sur donne aléatoire. */
export const SOLVABLE_TABLEAU = new Set(['freecell', 'yukon']);
export const SOLVABLE_SPIDER = new Set(['spider-1']);

const SUIT_MAP: Record<string, 'S' | 'H' | 'D' | 'C'> = { spades: 'S', hearts: 'H', diamonds: 'D', clubs: 'C' };
function conv(c: any, faceUp?: boolean): Card { return { id: c.id || `${c.value}${SUIT_MAP[c.suit] || 'S'}`, suit: SUIT_MAP[c.suit] || (c.suit as any), rank: (c.value ?? c.rank) as Rank, faceUp: faceUp ?? !!c.faceUp }; }
function cardsOf(pile: any): any[] { if (!pile) return []; if (Array.isArray(pile)) return pile; if (Array.isArray(pile.cards)) return pile.cards; return []; }

async function fetchDeal(variant: string): Promise<any | null> {
  if (typeof window === 'undefined') return null;
  try {
    const r = await fetch(`${API}/deal-seeds/random/${variant}`, { cache: 'no-store' });
    if (!r.ok) return null;
    const j = await r.json();
    let d = j?.data ?? j; if (d?.data) d = d.data;
    return d?.initialState ?? null;
  } catch { return null; }
}

/** Rend tous les ids uniques (les jeux à 2 paquets ont des ids dupliqués). */
function uniquify(piles: (Card | null)[][]): void {
  let n = 0;
  for (const pile of piles) for (const c of pile) if (c) c.id = `${c.id}#${n++}`;
}

/** Donne résoluble convertie pour la famille tableau (FreeCell/Forty Thieves/Yukon…
 *  uniquement si la donne API est COMPLÈTE et DÉJÀ DISTRIBUÉE — sinon repli aléatoire). */
export async function solvableTableau(variant: string, cfg: TableauConfig): Promise<GameState | null> {
  if (!SOLVABLE_TABLEAU.has(variant)) return null;
  const api = await fetchDeal(variant);
  if (!api || !api.tableau) return null;
  try {
    const tableau: Card[][] = api.tableau.map((col: any) => cardsOf(col).map((c: any) => conv(c)));
    const foundations: Card[][] = Array.from({ length: cfg.foundations }, (_, i) => cardsOf(api.foundations?.[i]).map((c: any) => conv(c, true)));
    const freeCells: (Card | null)[] = Array.from({ length: cfg.freeCells }, (_, i) => { const c = (api.freeCells || [])[i]; return c ? conv(c, true) : null; });
    const stock: Card[] = cardsOf(api.stock).map((c: any) => conv(c, false));
    const waste: Card[] = cardsOf(api.waste).map((c: any) => conv(c, true));
    // Validation : la donne doit être DISTRIBUÉE (tableau non vide) et complète.
    const tabCount = tableau.reduce((n, c) => n + c.length, 0);
    const total = tabCount + stock.length + waste.length + freeCells.filter(Boolean).length + foundations.reduce((n, c) => n + c.length, 0);
    if (tabCount === 0 || total !== cfg.decks * 52) return null;
    uniquify([...tableau, foundations.flat(), stock, waste, freeCells.filter(Boolean) as Card[]]);
    return { config: cfg, tableau, freeCells, reserves: [], foundations, stock, waste, foundationBaseRankResolved: (cfg.foundationBaseRank === 'variable' ? 1 : cfg.foundationBaseRank) as Rank, stockRecyclesUsed: 0, tableauRedealsUsed: 0, moveCount: 0, history: [], won: false, lost: false };
  } catch { return null; }
}

/** Donne résoluble convertie pour Spider. */
export async function solvableSpider(variant: string, base: SpiderState): Promise<SpiderState | null> {
  if (!SOLVABLE_SPIDER.has(variant)) return null;
  const api = await fetchDeal(variant);
  if (!api) return null;
  try {
    const cols = api.columns || api.tableau;
    if (!Array.isArray(cols)) return null;
    const columns: Card[][] = cols.map((col: any) => cardsOf(col).map((c: any) => conv(c, c.faceUp)));
    columns.forEach((c) => { if (c.length && !c[c.length - 1].faceUp) c[c.length - 1].faceUp = true; });
    const stockFlat: Card[] = cardsOf(api.stock).map((c: any) => conv(c, false));
    const colCount = columns.reduce((n, c) => n + c.length, 0);
    if (colCount === 0 || colCount + stockFlat.length !== 104) return null; // donne non distribuée → repli aléatoire
    uniquify([...columns, stockFlat]);
    const stock: Card[][] = [];
    for (let i = 0; i < stockFlat.length; i += 10) stock.push(stockFlat.slice(i, i + 10));
    return { ...base, columns, stock, completed: 0, moveCount: 0, won: false };
  } catch { return null; }
}
