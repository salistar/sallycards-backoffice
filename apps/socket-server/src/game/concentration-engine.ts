/**
 * @file apps/socket-server/src/game/concentration-engine.ts
 * @description Moteur Concentration autoritatif serveur (jeu de mémoire, tour par
 *   tour, jusqu'à 4 sièges). Grille de cartes face cachée par paires de symboles.
 *   Retourne 2 cartes : paire → garde + rejoue, sinon recache + joueur suivant.
 *   Le serveur ne révèle JAMAIS le symbole des cartes face cachée (anti-triche).
 *   Le plus de paires gagne.
 */
export interface Slot { id: string; group: string; symbol: string; faceUp: boolean; matched: boolean; owner: number | null }
export interface CPlayer { id: string; name: string; isBot: boolean; pairs: number }
export type CStep = 'flip1' | 'flip2' | 'reveal';
export type CPhase = 'playing' | 'over';
export interface CState {
  rows: number; cols: number; grid: Slot[]; players: CPlayer[];
  turn: number; step: CStep; flipped: number[]; seen: Record<number, string>;
  phase: CPhase; winner: number | null; totalPairs: number; lastEvent: string; log: string[];
}

const SYMBOLS = [
  '🍎', '🍌', '🍇', '🍊', '🍓', '🍒', '🍑', '🍐', '🥝', '🍍',
  '🥑', '🌽', '🥕', '🌶️', '🥦', '🍆', '🐶', '🐱', '🐭', '🐹',
  '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '⚽', '🏀', '🏈', '⚾',
  '🚗', '🚕', '🚙', '🚌', '🌹', '🌻', '🌷', '🌸', '🌼', '🪷',
];

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}
function push(log: string[], line: string): string[] { return [line, ...log].slice(0, 30); }
function winnerOf(players: CPlayer[]): number { let b = 0; for (let i = 1; i < players.length; i++) if (players[i].pairs > players[b].pairs) b = i; return b; }

export function buildConcentration(seats: { id: string; name: string; isBot: boolean }[], rows = 4, cols = 6): CState {
  const total = rows * cols;
  const pairCount = Math.floor(total / 2);
  const picked = shuffle(SYMBOLS).slice(0, pairCount);
  let cards: Slot[] = [];
  picked.forEach((sym, gi) => { const group = `g${gi}`; for (let k = 0; k < 2; k++) cards.push({ id: `${group}-${k}`, group, symbol: sym, faceUp: false, matched: false, owner: null }); });
  cards = shuffle(cards);
  const players: CPlayer[] = seats.slice(0, 4).map((s) => ({ ...s, pairs: 0 }));
  while (players.length < 2) players.push({ id: `bot-${players.length}`, name: `Bot ${players.length}`, isBot: true, pairs: 0 });
  return { rows, cols, grid: cards, players, turn: 0, step: 'flip1', flipped: [], seen: {}, phase: 'playing', winner: null, totalPairs: pairCount, lastEvent: 'Début de partie.', log: ['Nouvelle partie.'] };
}

function flip(st: CState, index: number): CState {
  if (st.phase !== 'playing' || st.step === 'reveal') return st;
  const slot = st.grid[index];
  if (!slot || slot.matched || slot.faceUp) return st;
  const grid = st.grid.map((s, i) => (i === index ? { ...s, faceUp: true } : s));
  const flipped = [...st.flipped, index];
  const seen = { ...st.seen, [index]: slot.group };
  if (flipped.length < 2) return { ...st, grid, flipped, seen, step: 'flip2' };
  const [a, b] = flipped;
  const cur = st.players[st.turn];
  if (grid[a].group === grid[b].group) {
    const ng = grid.map((s, i) => (i === a || i === b ? { ...s, matched: true, owner: st.turn } : s));
    const players = st.players.map((p, i) => (i === st.turn ? { ...p, pairs: p.pairs + 1 } : p));
    const done = players.reduce((t, p) => t + p.pairs, 0) >= st.totalPairs;
    const base: CState = { ...st, grid: ng, players, flipped: [], seen, step: 'flip1', lastEvent: `${cur.name} trouve une paire ${grid[a].symbol} (rejoue) !`, log: push(st.log, `${cur.name} ✓ ${grid[a].symbol}`) };
    if (done) { const w = winnerOf(players); return { ...base, phase: 'over', winner: w, lastEvent: `Terminé — ${players[w].name} gagne (${players[w].pairs} paires) !` }; }
    return base;
  }
  return { ...st, grid, flipped, seen, step: 'reveal', lastEvent: `${cur.name} : pas de paire.` };
}

function resolveReveal(st: CState): CState {
  if (st.step !== 'reveal') return st;
  const grid = st.grid.map((s, i) => (st.flipped.includes(i) && !s.matched ? { ...s, faceUp: false } : s));
  const nextTurn = (st.turn + 1) % st.players.length;
  return { ...st, grid, flipped: [], step: 'flip1', turn: nextTurn, lastEvent: `Au tour de ${st.players[nextTurn].name}.` };
}

function botChoose(st: CState, skill = 0.78): number {
  const hidden = st.grid.map((_, i) => i).filter((i) => !st.grid[i].matched && !st.grid[i].faceUp);
  if (Math.random() < skill) {
    if (st.flipped.length === 1) {
      const firstGroup = st.grid[st.flipped[0]].group;
      const mate = hidden.find((i) => st.seen[i] === firstGroup);
      if (mate !== undefined) return mate;
    } else {
      const known: Record<string, number[]> = {};
      for (const i of hidden) { const g = st.seen[i]; if (g) (known[g] ??= []).push(i); }
      const pair = Object.values(known).find((arr) => arr.length >= 2);
      if (pair) return pair[0];
    }
  }
  const unknown = hidden.filter((i) => !st.seen[i]);
  const pool = unknown.length ? unknown : hidden;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Interface adaptateur ──────────────────────────────────────────────────
export function concentrationApply(st: CState, seatId: string, a: any): CState {
  if (st.phase !== 'playing' || st.step === 'reveal') return st;
  if (a?.type !== 'FLIP' || typeof a.index !== 'number') return st;
  if (st.players[st.turn]?.id !== seatId) return st;
  return flip(st, a.index);
}
export function concentrationAdvance(st: CState): { next: CState; delay: number } | null {
  if (st.phase === 'over') return null;
  if (st.step === 'reveal') return { next: resolveReveal(st), delay: 1300 };
  if (!st.players[st.turn]?.isBot) return null;
  const idx = botChoose(st);
  if (idx === undefined) return null;
  return { next: flip(st, idx), delay: 850 };
}
export function concentrationCurrentId(st: CState): string | null { return st.players[st.turn]?.id ?? null; }
export function concentrationIsOver(st: CState): boolean { return st.phase === 'over'; }
export function concentrationView(st: CState, youId: string) {
  void youId;
  return {
    game: 'concentration', youId, phase: st.phase, step: st.step, turn: st.turn, currentId: concentrationCurrentId(st),
    rows: st.rows, cols: st.cols, totalPairs: st.totalPairs, winner: st.winner, lastEvent: st.lastEvent, log: st.log,
    players: st.players.map((p) => ({ id: p.id, name: p.name, isBot: p.isBot, pairs: p.pairs })),
    // anti-triche : symbole seulement si la carte est visible (retournée ou appariée)
    grid: st.grid.map((s) => ({ id: s.id, faceUp: s.faceUp, matched: s.matched, owner: s.owner, symbol: s.faceUp || s.matched ? s.symbol : null })),
  };
}
