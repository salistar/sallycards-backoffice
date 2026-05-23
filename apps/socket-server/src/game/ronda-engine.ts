/**
 * @file apps/socket-server/src/game/ronda-engine.ts
 * @description Moteur Ronda marocaine autoritatif serveur (capture, paquet
 *   espagnol 40 cartes, 2-4 sièges). 7 cartes/joueur, 4 au centre. Capture par
 *   valeur, ronda/tringa bonus, décompte (cartes, oros, settebello, 7s).
 *   Premier à 21. Le serveur ne révèle que la main du joueur concerné.
 */
export type Suit = 'B' | 'C' | 'E' | 'O';
export type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 10 | 11 | 12;
export interface Card { id: string; suit: Suit; value: CardValue }
export interface RPlayer { id: string; name: string; isBot: boolean; hand: Card[]; captures: Card[]; score: number; ronda: boolean; tringa: boolean }
export type RPhase = 'playing' | 'round_end' | 'over';
export interface RRoundScore { playerId: string; mostCards: boolean; mostOros: boolean; settebello: boolean; mostSevens: boolean; rondaBonus: number; tringaBonus: number; total: number }
export interface RState {
  players: RPlayer[]; table: Card[]; deck: Card[]; turn: number; phase: RPhase;
  roundNumber: number; lastCaptureBy: number | null; winner: number | null; target: number;
  lastEvent: string; log: string[]; roundScores: RRoundScore[] | null;
}

const SUITS: Suit[] = ['B', 'C', 'E', 'O'];
const VALUES: CardValue[] = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
export const VALUE_NAME: Record<CardValue, string> = { 1: 'As', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 10: 'Sota', 11: 'Caballo', 12: 'Rey' };
const CARDS_PER_PLAYER = 7, TABLE_CARDS = 4, TARGET = 21;

function buildDeck(): Card[] { const d: Card[] = []; for (const s of SUITS) for (const v of VALUES) d.push({ id: `${v}${s}`, suit: s, value: v }); for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; } return d; }
function push(log: string[], line: string): string[] { return [line, ...log].slice(0, 30); }
function detectFlags(hand: Card[]): { ronda: boolean; tringa: boolean } { const c: Record<number, number> = {}; for (const k of hand) c[k.value] = (c[k.value] || 0) + 1; let ronda = false, tringa = false; for (const v of Object.keys(c)) { if (c[+v] >= 3) tringa = true; else if (c[+v] >= 2) ronda = true; } return { ronda, tringa }; }
function dealInitial(players: RPlayer[], deck: Card[]) { let i = 0; const np = players.map((p) => { const hand = deck.slice(i, i + CARDS_PER_PLAYER); i += CARDS_PER_PLAYER; const f = detectFlags(hand); return { ...p, hand, captures: [], ronda: f.ronda, tringa: f.tringa }; }); const table = deck.slice(i, i + TABLE_CARDS); i += TABLE_CARDS; return { players: np, table, rest: deck.slice(i) }; }
function dealMore(players: RPlayer[], deck: Card[]) { const each = Math.min(CARDS_PER_PLAYER, Math.floor(deck.length / players.length)); if (each === 0) return { players, rest: deck }; let i = 0; const np = players.map((p) => { const nc = deck.slice(i, i + each); i += each; return { ...p, hand: [...p.hand, ...nc] }; }); return { players: np, rest: deck.slice(i) }; }

function computeScores(players: RPlayer[]): RRoundScore[] {
  const counts = players.map((p) => ({ playerId: p.id, total: p.captures.length, oros: p.captures.filter((c) => c.suit === 'O').length, sette: p.captures.some((c) => c.value === 7 && c.suit === 'O'), sevens: p.captures.filter((c) => c.value === 7).length, rondaBonus: p.ronda ? 1 : 0, tringaBonus: p.tringa ? 2 : 0 }));
  const maxCards = Math.max(...counts.map((c) => c.total)), maxOros = Math.max(...counts.map((c) => c.oros)), maxSevens = Math.max(...counts.map((c) => c.sevens));
  const cardsTied = counts.filter((c) => c.total === maxCards).length > 1, orosTied = counts.filter((c) => c.oros === maxOros).length > 1, sevensTied = counts.filter((c) => c.sevens === maxSevens).length > 1;
  return counts.map((c) => {
    const mostCards = !cardsTied && c.total === maxCards, mostOros = !orosTied && c.oros === maxOros && c.oros > 0, mostSevens = !sevensTied && c.sevens === maxSevens && c.sevens > 0;
    const total = (mostCards ? 1 : 0) + (mostOros ? 1 : 0) + (c.sette ? 1 : 0) + (mostSevens ? 1 : 0) + c.rondaBonus + c.tringaBonus;
    return { playerId: c.playerId, mostCards, mostOros, settebello: c.sette, mostSevens, rondaBonus: c.rondaBonus, tringaBonus: c.tringaBonus, total };
  });
}

export function buildRonda(seats: { id: string; name: string; isBot: boolean }[]): RState {
  const players: RPlayer[] = seats.slice(0, 4).map((s) => ({ ...s, hand: [], captures: [], score: 0, ronda: false, tringa: false }));
  while (players.length < 2) players.push({ id: `bot-${players.length}`, name: `Bot ${players.length}`, isBot: true, hand: [], captures: [], score: 0, ronda: false, tringa: false });
  const { players: dp, table, rest } = dealInitial(players, buildDeck());
  return { players: dp, table, deck: rest, turn: 0, phase: 'playing', roundNumber: 1, lastCaptureBy: null, winner: null, target: TARGET, lastEvent: 'Distribution', log: ['Nouvelle partie.'], roundScores: null };
}

function play(st: RState, cardId: string): RState {
  if (st.phase !== 'playing') return st;
  const pi = st.turn, player = st.players[pi];
  const card = player.hand.find((c) => c.id === cardId);
  if (!card) return st;
  const matches = st.table.filter((t) => t.value === card.value);
  let players = [...st.players]; let table = st.table; let lastCaptureBy = st.lastCaptureBy; let event = '';
  if (matches.length > 0) {
    players[pi] = { ...player, hand: player.hand.filter((c) => c.id !== cardId), captures: [...player.captures, card, ...matches] };
    table = st.table.filter((t) => !matches.some((m) => m.id === t.id)); lastCaptureBy = pi;
    event = `${player.name} capture ${matches.length + 1} carte(s)${table.length === 0 ? ' — Tringla !' : ''}`;
  } else { players[pi] = { ...player, hand: player.hand.filter((c) => c.id !== cardId) }; table = [...st.table, card]; event = `${player.name} pose ${VALUE_NAME[card.value]}`; }
  let deck = st.deck;
  if (players.every((p) => p.hand.length === 0)) {
    if (deck.length > 0) { const dm = dealMore(players, deck); players = dm.players; deck = dm.rest; }
    else {
      if (lastCaptureBy !== null && table.length > 0) { players[lastCaptureBy] = { ...players[lastCaptureBy], captures: [...players[lastCaptureBy].captures, ...table] }; table = []; }
      const scores = computeScores(players);
      const scored = players.map((p) => ({ ...p, score: p.score + (scores.find((s) => s.playerId === p.id)?.total || 0) }));
      const winIdx = scored.findIndex((p) => p.score >= st.target);
      if (winIdx >= 0) return { ...st, players: scored, table, deck, lastCaptureBy, phase: 'over', winner: winIdx, roundScores: scores, lastEvent: `${scored[winIdx].name} gagne la partie !`, log: push(st.log, event) };
      return { ...st, players: scored, table, deck, lastCaptureBy, phase: 'round_end', roundScores: scores, lastEvent: 'Fin de manche — décompte.', log: push(st.log, event) };
    }
  }
  return { ...st, players, table, deck, lastCaptureBy, turn: (pi + 1) % st.players.length, lastEvent: event, log: push(st.log, event) };
}
function nextRound(st: RState): RState {
  if (st.phase !== 'round_end') return st;
  const reset = st.players.map((p) => ({ ...p, hand: [], captures: [], ronda: false, tringa: false }));
  const { players, table, rest } = dealInitial(reset, buildDeck());
  return { ...st, players, table, deck: rest, turn: 0, phase: 'playing', roundNumber: st.roundNumber + 1, lastCaptureBy: null, roundScores: null, lastEvent: `Manche ${st.roundNumber + 1}` };
}
function botChoose(st: RState): string {
  const bot = st.players[st.turn]; let best: Card | null = null, bestScore = -1;
  for (const c of bot.hand) { const m = st.table.filter((t) => t.value === c.value); if (m.length > 0) { let s = 1 + m.length; if (m.some((x) => x.suit === 'O')) s += 3; if (m.some((x) => x.value === 7)) s += 2; if (m.some((x) => x.id === '7O')) s += 5; if (c.id === '7O') s -= 4; if (st.table.length === m.length) s += 4; if (s > bestScore) { bestScore = s; best = c; } } }
  if (best) return best.id;
  const sorted = [...bot.hand].sort((a, b) => { if (a.id === '7O') return 1; if (b.id === '7O') return -1; if (a.value === 7 && b.value !== 7) return 1; if (b.value === 7 && a.value !== 7) return -1; if (a.suit === 'O' && b.suit !== 'O') return 1; if (b.suit === 'O' && a.suit !== 'O') return -1; return a.value - b.value; });
  return sorted[0].id;
}

// ── Interface adaptateur ──────────────────────────────────────────────────
export function rondaApply(st: RState, seatId: string, a: any): RState {
  if (st.phase !== 'playing') return st;
  if (a?.type !== 'PLAY_CARD' || typeof a.cardId !== 'string') return st;
  if (st.players[st.turn]?.id !== seatId) return st;
  return play(st, a.cardId);
}
export function rondaAdvance(st: RState): { next: RState; delay: number } | null {
  if (st.phase === 'over') return null;
  if (st.phase === 'round_end') return { next: nextRound(st), delay: 2200 };
  if (!st.players[st.turn]?.isBot) return null;
  return { next: play(st, botChoose(st)), delay: 850 };
}
export function rondaCurrentId(st: RState): string | null { return st.players[st.turn]?.id ?? null; }
export function rondaIsOver(st: RState): boolean { return st.phase === 'over'; }
export function rondaView(st: RState, youId: string) {
  return {
    game: 'ronda', youId, phase: st.phase, turn: st.turn, currentId: rondaCurrentId(st),
    table: st.table, deckCount: st.deck.length, roundNumber: st.roundNumber, winner: st.winner, target: st.target,
    lastEvent: st.lastEvent, log: st.log, roundScores: st.roundScores,
    players: st.players.map((p) => ({ id: p.id, name: p.name, isBot: p.isBot, score: p.score, captureCount: p.captures.length, ronda: p.ronda, tringa: p.tringa, handCount: p.hand.length, hand: p.id === youId ? p.hand : undefined })),
  };
}
