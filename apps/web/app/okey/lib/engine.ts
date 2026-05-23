/**
 * @file apps/web/app/okey/lib/engine.ts
 * @description Moteur Okey (rami turc) simplifié — 106 tuiles (4 couleurs × 1-13
 *   ×2 + 2 jokers), 4 joueurs, 14 tuiles. Tour : piocher (pioche ou défausse) →
 *   défausser. On termine quand ses 14 tuiles forment des groupes valides
 *   (suites même couleur / brelans même valeur, jokers libres). Logique propre.
 */

export type OColor = 'R' | 'Y' | 'B' | 'K';
export interface Tile { id: string; color?: OColor; value?: number; joker?: boolean }
export interface OPlayer { id: string; name: string; isBot: boolean; hand: Tile[] }
export type OPhase = 'draw' | 'discard' | 'over';
export interface OkeyState {
  players: OPlayer[]; drawPile: Tile[]; discardPile: Tile[]; turn: number;
  phase: OPhase; winner: number | null; lastEvent: string;
}

export const OCOLORS: OColor[] = ['R', 'Y', 'B', 'K'];
export const COLOR_HEX: Record<OColor, string> = { R: '#EF4444', Y: '#EAB308', B: '#3B82F6', K: '#111827' };

function buildDeck(): Tile[] {
  const d: Tile[] = []; let n = 0;
  for (let copy = 0; copy < 2; copy++) for (const c of OCOLORS) for (let v = 1; v <= 13; v++) d.push({ id: `t${n++}`, color: c, value: v });
  d.push({ id: 'j0', joker: true }); d.push({ id: 'j1', joker: true });
  for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; }
  return d;
}

export function buildOkey(seats: { id: string; name: string; isBot: boolean }[]): OkeyState {
  const deck = buildDeck();
  const players: OPlayer[] = seats.slice(0, 4).map((s) => ({ ...s, hand: deck.splice(0, 14) }));
  while (players.length < 4) players.push({ id: `bot-${players.length}`, name: `Bot ${players.length}`, isBot: true, hand: deck.splice(0, 14) });
  const discardPile = [deck.shift()!];
  return { players, drawPile: deck, discardPile, turn: 0, phase: 'draw', winner: null, lastEvent: 'Distribution' };
}

export function newGame(): OkeyState {
  return buildOkey([{ id: 'p0', name: 'Vous', isBot: false }, { id: 'p1', name: 'Bot 1', isBot: true }, { id: 'p2', name: 'Bot 2', isBot: true }, { id: 'p3', name: 'Bot 3', isBot: true }]);
}

// ── Détection de groupes valides (suites / brelans, jokers libres) ──────────
function solve(count: Record<string, number>, jokers: number): boolean {
  // trouve la plus petite tuile présente
  let lc: OColor | null = null, lv = 0;
  for (const c of OCOLORS) for (let v = 1; v <= 13; v++) if (count[c + v] > 0) { lc = c; lv = v; break; } // eslint-disable-line
  // (boucle ci-dessus s'arrête au 1er trouvé via le break interne sur v ; on re-vérifie)
  outer: for (const c of OCOLORS) { for (let v = 1; v <= 13; v++) { if (count[c + v] > 0) { lc = c; lv = v; break outer; } } }
  if (!lc) return jokers === 0; // plus de tuiles : jokers restants = invalide
  // BRELAN : même valeur lv, couleurs distinctes (+ jokers), taille 3-4
  const others = OCOLORS.filter((c) => c !== lc && count[c + lv] > 0);
  for (let mask = 0; mask < (1 << others.length); mask++) {
    const pick: OColor[] = []; for (let i = 0; i < others.length; i++) if (mask & (1 << i)) pick.push(others[i]);
    for (let jk = 0; jk <= jokers; jk++) {
      const size = 1 + pick.length + jk;
      if (size >= 3 && size <= 4) {
        count[lc + lv]--; pick.forEach((c) => count[c + lv]--);
        if (solve(count, jokers - jk)) { count[lc + lv]++; pick.forEach((c) => count[c + lv]++); return true; }
        count[lc + lv]++; pick.forEach((c) => count[c + lv]++);
      }
    }
  }
  // SUITE : couleur lc, à partir de lv, longueur >=3 (jokers comblent)
  for (let len = 3; lv + len - 1 <= 13; len++) {
    let jkUsed = 0; let ok = true; const used: number[] = [];
    for (let k = 0; k < len; k++) { const v = lv + k; if (count[lc + v] > 0) used.push(v); else if (jkUsed < jokers) jkUsed++; else { ok = false; break; } }
    if (!ok) break;
    if (used[0] !== lv) continue; // la plus petite tuile doit être réelle
    used.forEach((v) => count[lc + v]--);
    if (solve(count, jokers - jkUsed)) { used.forEach((v) => count[lc + v]++); return true; }
    used.forEach((v) => count[lc + v]++);
  }
  return false;
}

export function canMeld(tiles: Tile[]): boolean {
  if (tiles.length === 0 || tiles.length % 1 !== 0) return false;
  const count: Record<string, number> = {};
  for (const c of OCOLORS) for (let v = 1; v <= 13; v++) count[c + v] = 0;
  let jokers = 0;
  for (const t of tiles) { if (t.joker) jokers++; else count[t.color! + t.value!]++; }
  return solve(count, jokers);
}

/** Le joueur (15 tuiles) peut-il terminer ? Renvoie la tuile à défausser, sinon null. */
export function finishDiscard(hand15: Tile[]): string | null {
  for (const t of hand15) { const rest = hand15.filter((x) => x.id !== t.id); if (rest.length === 14 && canMeld(rest)) return t.id; }
  return null;
}

export function drawTile(st: OkeyState, from: 'pile' | 'discard'): OkeyState {
  if (st.phase !== 'draw') return st;
  const p = st.players[st.turn];
  let tile: Tile | undefined;
  let drawPile = st.drawPile, discardPile = st.discardPile;
  if (from === 'discard' && discardPile.length > 0) { discardPile = [...discardPile]; tile = discardPile.pop(); }
  else { drawPile = [...drawPile]; tile = drawPile.shift(); if (!tile) { return { ...st, phase: 'over', winner: null, lastEvent: 'Pioche vide — nul' }; } }
  const players = st.players.map((pp, i) => i === st.turn ? { ...pp, hand: [...pp.hand, tile!] } : pp);
  return { ...st, players, drawPile, discardPile, phase: 'discard', lastEvent: `${p.name} pioche` };
}

export function discardTile(st: OkeyState, tileId: string): OkeyState {
  if (st.phase !== 'discard') return st;
  const p = st.players[st.turn];
  const tile = p.hand.find((t) => t.id === tileId); if (!tile) return st;
  const hand = p.hand.filter((t) => t.id !== tileId);
  const players = st.players.map((pp, i) => i === st.turn ? { ...pp, hand } : pp);
  return { ...st, players, discardPile: [...st.discardPile, tile], phase: 'draw', turn: (st.turn + 1) % 4, lastEvent: `${p.name} défausse` };
}

export function finish(st: OkeyState): OkeyState {
  const p = st.players[st.turn];
  if (st.phase !== 'discard') return st;
  const disc = finishDiscard(p.hand);
  if (!disc) return st;
  const hand = p.hand.filter((t) => t.id !== disc);
  const players = st.players.map((pp, i) => i === st.turn ? { ...pp, hand } : pp);
  return { ...st, players, discardPile: [...st.discardPile, p.hand.find((t) => t.id === disc)!], phase: 'over', winner: st.turn, lastEvent: `${p.name} termine — Okey !` };
}

/** Heuristique : tuile la moins « utile » à défausser. */
function leastUseful(hand: Tile[]): string {
  const score: Record<string, number> = {};
  for (const t of hand) {
    if (t.joker) { score[t.id] = 100; continue; }
    let s = 0;
    for (const o of hand) { if (o.id === t.id || o.joker) continue; if (o.value === t.value && o.color !== t.color) s += 2; if (o.color === t.color && Math.abs((o.value || 0) - (t.value || 0)) === 1) s += 2; }
    score[t.id] = s;
  }
  return hand.slice().sort((a, b) => score[a.id] - score[b.id])[0].id;
}

/** Avance : si tour bot, pioche + (termine | défausse). */
export function botStep(st: OkeyState): OkeyState {
  if (st.phase === 'over') return st;
  const p = st.players[st.turn];
  if (!p.isBot) return st;
  if (st.phase === 'draw') {
    // pioche la défausse si utile sinon la pioche
    const top = st.discardPile[st.discardPile.length - 1];
    const useful = top && !top.joker && p.hand.some((h) => !h.joker && ((h.value === top.value && h.color !== top.color) || (h.color === top.color && Math.abs((h.value || 0) - (top.value || 0)) <= 1)));
    return drawTile(st, useful ? 'discard' : 'pile');
  }
  // discard phase
  const fin = finishDiscard(p.hand);
  if (fin) return finish(st);
  return discardTile(st, leastUseful(p.hand));
}

export function tileLabel(t: Tile): string { return t.joker ? '★' : String(t.value); }

// ── Rendu avec de vraies cartes (jeu de 52 doublé + 2 jokers) ───────────────
// Okey = 4 couleurs × 13 valeurs ×2 + 2 jokers = 106 → mappe exactement sur un
// double jeu français. On associe chaque couleur Okey à une enseigne réelle.
const SUIT_OF: Record<OColor, string> = { R: 'H', Y: 'D', B: 'C', K: 'S' };
function rankLetter(v: number): string { return v === 1 ? 'A' : v === 10 ? '0' : v === 11 ? 'J' : v === 12 ? 'Q' : v === 13 ? 'K' : String(v); }
/** Chemin de l'image de carte réelle pour une tuile (joker → dos rouge). */
export function tileImage(t: Tile): string {
  if (t.joker) return '/cards/french52/back_red.svg';
  return `/cards/french52/${rankLetter(t.value!)}${SUIT_OF[t.color!]}.png`;
}
