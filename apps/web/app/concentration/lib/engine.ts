/**
 * @file apps/web/app/concentration/lib/engine.ts
 * @description Moteur Concentration (jeu de mémoire) — tour par tour, 1-4
 *   joueurs. Grille de cartes face cachée par paires de symboles. À ton tour :
 *   retourne 2 cartes ; si elles forment une paire tu la gardes et tu REJOUES,
 *   sinon elles se retournent et c'est au joueur suivant. Le plus de paires à la
 *   fin gagne. Les bots ont une mémoire (selon difficulté). Logique propre.
 */
export interface Slot { id: string; group: string; symbol: string; faceUp: boolean; matched: boolean; owner: number | null }
export interface CPlayer { id: string; name: string; isBot: boolean; pairs: number }
export type CStep = 'flip1' | 'flip2' | 'reveal';
export type CPhase = 'playing' | 'over';
export interface CState {
  rows: number; cols: number;
  grid: Slot[];
  players: CPlayer[];
  turn: number;
  step: CStep;
  flipped: number[];
  seen: Record<number, string>; // mémoire publique : index → group (cartes déjà vues)
  phase: CPhase;
  winner: number | null;
  totalPairs: number;
  lastEvent: string;
  log: string[];
}

export const SYMBOLS = [
  '🍎', '🍌', '🍇', '🍊', '🍓', '🍒', '🍑', '🍐', '🥝', '🍍',
  '🥑', '🌽', '🥕', '🌶️', '🥦', '🍆', '🐶', '🐱', '🐭', '🐹',
  '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '⚽', '🏀', '🏈', '⚾',
  '🚗', '🚕', '🚙', '🚌', '🌹', '🌻', '🌷', '🌸', '🌼', '🪷',
];
export const CARD_BACK = '/cards/french52/back.png';

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

export function buildConcentration(seats: { id: string; name: string; isBot: boolean }[], rows = 4, cols = 6): CState {
  const total = rows * cols; // doit être pair
  const pairCount = Math.floor(total / 2);
  const picked = shuffle(SYMBOLS).slice(0, pairCount);
  let cards: Slot[] = [];
  picked.forEach((sym, gi) => {
    const group = `g${gi}`;
    for (let k = 0; k < 2; k++) cards.push({ id: `${group}-${k}`, group, symbol: sym, faceUp: false, matched: false, owner: null });
  });
  cards = shuffle(cards);
  const players: CPlayer[] = (seats.length ? seats : [{ id: 'p0', name: 'Vous', isBot: false }]).slice(0, 4).map((s) => ({ ...s, pairs: 0 }));
  return {
    rows, cols, grid: cards, players, turn: 0, step: 'flip1', flipped: [], seen: {},
    phase: 'playing', winner: null, totalPairs: pairCount, lastEvent: 'À toi de jouer.', log: ['Nouvelle partie.'],
  };
}

export function newGame(rows = 4, cols = 6): CState {
  return buildConcentration([
    { id: 'p0', name: 'Vous', isBot: false },
    { id: 'p1', name: 'Mia', isBot: true },
  ], rows, cols);
}

function push(log: string[], line: string): string[] { return [line, ...log].slice(0, 30); }
function winnerOf(players: CPlayer[]): number {
  let best = 0; for (let i = 1; i < players.length; i++) if (players[i].pairs > players[best].pairs) best = i; return best;
}

/** Retourne la carte à l'index donné (1ʳᵉ ou 2ᵉ du tour). */
export function flip(st: CState, index: number): CState {
  if (st.phase !== 'playing' || st.step === 'reveal') return st;
  const slot = st.grid[index];
  if (!slot || slot.matched || slot.faceUp) return st;
  const grid = st.grid.map((s, i) => (i === index ? { ...s, faceUp: true } : s));
  const flipped = [...st.flipped, index];
  const seen = { ...st.seen, [index]: slot.group };

  if (flipped.length < 2) {
    return { ...st, grid, flipped, seen, step: 'flip2' };
  }
  // 2ᵉ carte → évaluation
  const [a, b] = flipped;
  const match = grid[a].group === grid[b].group;
  const cur = st.players[st.turn];
  if (match) {
    const ng = grid.map((s, i) => (i === a || i === b ? { ...s, matched: true, owner: st.turn } : s));
    const players = st.players.map((p, i) => (i === st.turn ? { ...p, pairs: p.pairs + 1 } : p));
    const got = players[st.turn].pairs;
    const done = players.reduce((t, p) => t + p.pairs, 0) >= st.totalPairs;
    const base: CState = { ...st, grid: ng, players, flipped: [], seen, step: 'flip1', lastEvent: `${cur.name} trouve une paire ${grid[a].symbol} (rejoue) !`, log: push(st.log, `${cur.name} ✓ paire ${grid[a].symbol} (${got})`) };
    if (done) { const w = winnerOf(players); return { ...base, phase: 'over', winner: w, lastEvent: `Partie terminée — ${players[w].name} gagne avec ${players[w].pairs} paires !` }; }
    return base;
  }
  // pas de paire → phase reveal (le board/serveur cachera puis passera la main)
  return { ...st, grid, flipped, seen, step: 'reveal', lastEvent: `${cur.name} : pas de paire.` };
}

/** Après le délai de révélation : recache les 2 cartes et passe au joueur suivant. */
export function resolveReveal(st: CState): CState {
  if (st.step !== 'reveal') return st;
  const grid = st.grid.map((s, i) => (st.flipped.includes(i) && !s.matched ? { ...s, faceUp: false } : s));
  const nextTurn = (st.turn + 1) % st.players.length;
  return { ...st, grid, flipped: [], step: 'flip1', turn: nextTurn, lastEvent: `Au tour de ${st.players[nextTurn].name}.` };
}

// ── Bot à mémoire ─────────────────────────────────────────────────────────────
/** skill ∈ [0,1] : probabilité d'exploiter la mémoire. */
function botChoose(st: CState, skill = 0.75): number {
  const hidden = st.grid.map((s, i) => i).filter((i) => !st.grid[i].matched && !st.grid[i].faceUp);
  // paire connue ?
  if (Math.random() < skill) {
    const known: Record<string, number[]> = {};
    for (const i of hidden) { const g = st.seen[i]; if (g) (known[g] ??= []).push(i); }
    if (st.flipped.length === 1) {
      // on cherche la jumelle de la 1ʳᵉ carte
      const firstGroup = st.grid[st.flipped[0]].group;
      const mate = hidden.find((i) => st.seen[i] === firstGroup);
      if (mate !== undefined) return mate;
    } else {
      // début de tour : si une paire entière est connue, retourne-la
      const pair = Object.values(known).find((arr) => arr.length >= 2);
      if (pair) return pair[0];
    }
  }
  // sinon : carte inconnue au hasard (préfère non vue)
  const unknown = hidden.filter((i) => !st.seen[i]);
  const pool = unknown.length ? unknown : hidden;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Avance d'un cran si c'est à un bot d'agir (ou résout une révélation). */
export function botStep(st: CState, skill = 0.75): CState {
  if (st.phase !== 'playing') return st;
  if (st.step === 'reveal') return resolveReveal(st);
  if (!st.players[st.turn].isBot) return st;
  const idx = botChoose(st, skill);
  if (idx === undefined) return st;
  return flip(st, idx);
}
