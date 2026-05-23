/**
 * @file apps/socket-server/src/game/okey-engine.ts
 * @description Moteur Okey autoritatif serveur (4 sièges). Pioche/défausse,
 *   détection de groupes valides (suites/brelans, jokers), terminer.
 */
export type OColor = 'R' | 'Y' | 'B' | 'K';
export interface Tile { id: string; color?: OColor; value?: number; joker?: boolean }
export interface OPlayer { id: string; name: string; isBot: boolean; hand: Tile[] }
export interface OkeyState { players: OPlayer[]; drawPile: Tile[]; discardPile: Tile[]; turn: number; phase: 'draw' | 'discard' | 'over'; winner: number | null; lastEvent: string }
const OCOLORS: OColor[] = ['R', 'Y', 'B', 'K'];

function buildDeck(): Tile[] {
  const d: Tile[] = []; let n = 0;
  for (let c = 0; c < 2; c++) for (const col of OCOLORS) for (let v = 1; v <= 13; v++) d.push({ id: `t${n++}`, color: col, value: v });
  d.push({ id: 'j0', joker: true }); d.push({ id: 'j1', joker: true });
  for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; }
  return d;
}
export function buildOkey(seats: { id: string; name: string; isBot: boolean }[]): OkeyState {
  const deck = buildDeck();
  const players: OPlayer[] = [];
  for (let i = 0; i < 4; i++) { const s = seats[i] || { id: `bot-${i}`, name: `Bot ${i}`, isBot: true }; players.push({ ...s, hand: deck.splice(0, 14) }); }
  return { players, drawPile: deck, discardPile: [deck.shift()!], turn: 0, phase: 'draw', winner: null, lastEvent: 'Distribution' };
}

function solve(count: Record<string, number>, jokers: number): boolean {
  let lc: OColor | null = null, lv = 0;
  outer: for (const c of OCOLORS) { for (let v = 1; v <= 13; v++) { if (count[c + v] > 0) { lc = c; lv = v; break outer; } } }
  if (!lc) return jokers === 0;
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
  for (let len = 3; lv + len - 1 <= 13; len++) {
    let jkUsed = 0, ok = true; const used: number[] = [];
    for (let k = 0; k < len; k++) { const v = lv + k; if (count[lc + v] > 0) used.push(v); else if (jkUsed < jokers) jkUsed++; else { ok = false; break; } }
    if (!ok) break; if (used[0] !== lv) continue;
    used.forEach((v) => count[lc + v]--);
    if (solve(count, jokers - jkUsed)) { used.forEach((v) => count[lc + v]++); return true; }
    used.forEach((v) => count[lc + v]++);
  }
  return false;
}
export function canMeld(tiles: Tile[]): boolean {
  const count: Record<string, number> = {}; for (const c of OCOLORS) for (let v = 1; v <= 13; v++) count[c + v] = 0;
  let jokers = 0; for (const t of tiles) { if (t.joker) jokers++; else count[t.color! + t.value!]++; }
  return solve(count, jokers);
}
function finishDiscard(hand15: Tile[]): string | null {
  for (const t of hand15) { const rest = hand15.filter((x) => x.id !== t.id); if (rest.length === 14 && canMeld(rest)) return t.id; }
  return null;
}
function leastUseful(hand: Tile[]): string {
  const score: Record<string, number> = {};
  for (const t of hand) { if (t.joker) { score[t.id] = 100; continue; } let s = 0; for (const o of hand) { if (o.id === t.id || o.joker) continue; if (o.value === t.value && o.color !== t.color) s += 2; if (o.color === t.color && Math.abs((o.value || 0) - (t.value || 0)) === 1) s += 2; } score[t.id] = s; }
  return hand.slice().sort((a, b) => score[a.id] - score[b.id])[0].id;
}
function drawTile(st: OkeyState, from: 'pile' | 'discard'): OkeyState {
  if (st.phase !== 'draw') return st;
  let drawPile = st.drawPile, discardPile = st.discardPile, tile: Tile | undefined;
  if (from === 'discard' && discardPile.length > 0) { discardPile = [...discardPile]; tile = discardPile.pop(); }
  else { drawPile = [...drawPile]; tile = drawPile.shift(); if (!tile) return { ...st, phase: 'over', winner: null, lastEvent: 'Pioche vide' }; }
  const players = st.players.map((p, i) => i === st.turn ? { ...p, hand: [...p.hand, tile!] } : p);
  return { ...st, players, drawPile, discardPile, phase: 'discard' };
}
function discardTile(st: OkeyState, tileId: string): OkeyState {
  if (st.phase !== 'discard') return st;
  const p = st.players[st.turn]; const tile = p.hand.find((t) => t.id === tileId); if (!tile) return st;
  const players = st.players.map((pp, i) => i === st.turn ? { ...pp, hand: pp.hand.filter((t) => t.id !== tileId) } : pp);
  return { ...st, players, discardPile: [...st.discardPile, tile], phase: 'draw', turn: (st.turn + 1) % 4 };
}
function doFinish(st: OkeyState): OkeyState {
  const p = st.players[st.turn]; if (st.phase !== 'discard') return st;
  const disc = finishDiscard(p.hand); if (!disc) return st;
  const players = st.players.map((pp, i) => i === st.turn ? { ...pp, hand: pp.hand.filter((t) => t.id !== disc) } : pp);
  return { ...st, players, discardPile: [...st.discardPile, p.hand.find((t) => t.id === disc)!], phase: 'over', winner: st.turn, lastEvent: `${p.name} termine — Okey !` };
}

export function okeyApply(st: OkeyState, seatId: string, a: any): OkeyState {
  const pi = st.players.findIndex((p) => p.id === seatId);
  if (pi < 0 || pi !== st.turn) return st;
  if (a?.type === 'DRAW') return drawTile(st, a.from === 'discard' ? 'discard' : 'pile');
  if (a?.type === 'DISCARD') return discardTile(st, a.tileId);
  if (a?.type === 'FINISH') return doFinish(st);
  return st;
}
export function okeyAdvance(st: OkeyState): { next: OkeyState; delay: number } | null {
  if (st.phase === 'over') return null;
  const p = st.players[st.turn]; if (!p.isBot) return null;
  if (st.phase === 'draw') {
    const top = st.discardPile[st.discardPile.length - 1];
    const useful = top && !top.joker && p.hand.some((h) => !h.joker && ((h.value === top.value && h.color !== top.color) || (h.color === top.color && Math.abs((h.value || 0) - (top.value || 0)) <= 1)));
    return { next: drawTile(st, useful ? 'discard' : 'pile'), delay: 800 };
  }
  const fin = finishDiscard(p.hand);
  return { next: fin ? doFinish(st) : discardTile(st, leastUseful(p.hand)), delay: 800 };
}
export function okeyCurrentId(st: OkeyState): string | null { return st.players[st.turn]?.id ?? null; }
export function okeyIsOver(st: OkeyState): boolean { return st.phase === 'over'; }
export function okeyView(st: OkeyState, youId: string) {
  return {
    game: 'okey', youId, phase: st.phase, turn: st.turn, currentId: okeyCurrentId(st), winner: st.winner, lastEvent: st.lastEvent,
    drawCount: st.drawPile.length, discardTop: st.discardPile[st.discardPile.length - 1] || null,
    players: st.players.map((p) => ({ id: p.id, name: p.name, isBot: p.isBot, count: p.hand.length, hand: p.id === youId ? p.hand : undefined })),
  };
}
