/**
 * @file apps/web/app/ronda/lib/engine.ts
 * @description Moteur Ronda marocaine — jeu de capture, paquet espagnol 40
 *   cartes, 2-4 joueurs. 7 cartes par joueur, 4 au centre. À ton tour : pose une
 *   carte ; si sa valeur correspond à une carte du centre, tu captures toutes
 *   les cartes de cette valeur (+ la tienne). Ronda (paire en main) / Tringa
 *   (brelan) = bonus. Quand le paquet est vide, on compte les captures. Premier
 *   à 21 gagne. Logique propre inspirée de l'app mobile.
 */
export type Suit = 'B' | 'C' | 'E' | 'O'; // bastos, copas, espadas, oros (lettres spanish40)
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

export const SUITS: Suit[] = ['B', 'C', 'E', 'O'];
export const VALUES: CardValue[] = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
export const SUIT_NAME: Record<Suit, string> = { B: 'Bâtons', C: 'Coupes', E: 'Épées', O: 'Deniers' };
export const VALUE_NAME: Record<CardValue, string> = { 1: 'As', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 10: 'Sota', 11: 'Caballo', 12: 'Rey' };
export const CARDS_PER_PLAYER = 7;
export const TABLE_CARDS = 4;
export const TARGET = 21;

export function cardImage(c: Card): string { return `/cards/spanish40/${c.value}${c.suit}.png`; }
export const CARD_BACK = '/cards/spanish40/back.png';
export function valueName(v: CardValue): string { return VALUE_NAME[v]; }

function buildDeck(): Card[] {
  const d: Card[] = [];
  for (const s of SUITS) for (const v of VALUES) d.push({ id: `${v}${s}`, suit: s, value: v });
  for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; }
  return d;
}
function push(log: string[], line: string): string[] { return [line, ...log].slice(0, 30); }

/** Détecte ronda (paire) / tringa (brelan+) dans une main → applique les flags. */
function detectFlags(hand: Card[]): { ronda: boolean; tringa: boolean } {
  const counts: Record<number, number> = {};
  for (const c of hand) counts[c.value] = (counts[c.value] || 0) + 1;
  let ronda = false, tringa = false;
  for (const v of Object.keys(counts)) { if (counts[+v] >= 3) tringa = true; else if (counts[+v] >= 2) ronda = true; }
  return { ronda, tringa };
}

function dealInitial(players: RPlayer[], deck: Card[]): { players: RPlayer[]; table: Card[]; rest: Card[] } {
  let i = 0;
  const np = players.map((p) => { const hand = deck.slice(i, i + CARDS_PER_PLAYER); i += CARDS_PER_PLAYER; const f = detectFlags(hand); return { ...p, hand, captures: [], ronda: f.ronda, tringa: f.tringa }; });
  const table = deck.slice(i, i + TABLE_CARDS); i += TABLE_CARDS;
  return { players: np, table, rest: deck.slice(i) };
}
function dealMore(players: RPlayer[], deck: Card[]): { players: RPlayer[]; rest: Card[] } {
  const each = Math.min(CARDS_PER_PLAYER, Math.floor(deck.length / players.length));
  if (each === 0) return { players, rest: deck };
  let i = 0;
  const np = players.map((p) => { const nc = deck.slice(i, i + each); i += each; return { ...p, hand: [...p.hand, ...nc] }; });
  return { players: np, rest: deck.slice(i) };
}

export function buildRonda(seats: { id: string; name: string; isBot: boolean }[]): RState {
  const players: RPlayer[] = seats.slice(0, 4).map((s) => ({ ...s, hand: [], captures: [], score: 0, ronda: false, tringa: false }));
  while (players.length < 2) players.push({ id: `bot-${players.length}`, name: `Bot ${players.length}`, isBot: true, hand: [], captures: [], score: 0, ronda: false, tringa: false });
  const { players: dp, table, rest } = dealInitial(players, buildDeck());
  return { players: dp, table, deck: rest, turn: 0, phase: 'playing', roundNumber: 1, lastCaptureBy: null, winner: null, target: TARGET, lastEvent: 'Distribution', log: ['Nouvelle partie.'], roundScores: null };
}

export function newGame(): RState {
  return buildRonda([
    { id: 'p0', name: 'Vous', isBot: false },
    { id: 'p1', name: 'Hamza', isBot: true },
    { id: 'p2', name: 'Fatima', isBot: true },
  ]);
}

function computeScores(players: RPlayer[]): RRoundScore[] {
  const counts = players.map((p) => ({ playerId: p.id, total: p.captures.length, oros: p.captures.filter((c) => c.suit === 'O').length, sette: p.captures.some((c) => c.value === 7 && c.suit === 'O'), sevens: p.captures.filter((c) => c.value === 7).length, rondaBonus: p.ronda ? 1 : 0, tringaBonus: p.tringa ? 2 : 0 }));
  const maxCards = Math.max(...counts.map((c) => c.total));
  const maxOros = Math.max(...counts.map((c) => c.oros));
  const maxSevens = Math.max(...counts.map((c) => c.sevens));
  const cardsTied = counts.filter((c) => c.total === maxCards).length > 1;
  const orosTied = counts.filter((c) => c.oros === maxOros).length > 1;
  const sevensTied = counts.filter((c) => c.sevens === maxSevens).length > 1;
  return counts.map((c) => {
    const mostCards = !cardsTied && c.total === maxCards;
    const mostOros = !orosTied && c.oros === maxOros && c.oros > 0;
    const mostSevens = !sevensTied && c.sevens === maxSevens && c.sevens > 0;
    const total = (mostCards ? 1 : 0) + (mostOros ? 1 : 0) + (c.sette ? 1 : 0) + (mostSevens ? 1 : 0) + c.rondaBonus + c.tringaBonus;
    return { playerId: c.playerId, mostCards, mostOros, settebello: c.sette, mostSevens, rondaBonus: c.rondaBonus, tringaBonus: c.tringaBonus, total };
  });
}

/** Joue une carte du joueur courant : capture par valeur (auto) ou pose au centre. */
export function play(st: RState, cardId: string): RState {
  if (st.phase !== 'playing') return st;
  const pi = st.turn;
  const player = st.players[pi];
  const card = player.hand.find((c) => c.id === cardId);
  if (!card) return st;
  const matches = st.table.filter((t) => t.value === card.value);
  let players = [...st.players];
  let table = st.table;
  let lastCaptureBy = st.lastCaptureBy;
  let event = '';
  if (matches.length > 0) {
    players[pi] = { ...player, hand: player.hand.filter((c) => c.id !== cardId), captures: [...player.captures, card, ...matches] };
    table = st.table.filter((t) => !matches.some((m) => m.id === t.id));
    lastCaptureBy = pi;
    const tringla = table.length === 0;
    event = `${player.name} capture ${matches.length + 1} carte(s)${tringla ? ' — Tringla ! 🧹' : ''}`;
  } else {
    players[pi] = { ...player, hand: player.hand.filter((c) => c.id !== cardId) };
    table = [...st.table, card];
    event = `${player.name} pose ${VALUE_NAME[card.value]}`;
  }

  let deck = st.deck;
  // Mains vides → redistribuer si possible, sinon fin de manche.
  if (players.every((p) => p.hand.length === 0)) {
    if (deck.length > 0) {
      const dm = dealMore(players, deck); players = dm.players; deck = dm.rest;
    } else {
      // dernier capteur ramasse le centre
      if (lastCaptureBy !== null && table.length > 0) { players[lastCaptureBy] = { ...players[lastCaptureBy], captures: [...players[lastCaptureBy].captures, ...table] }; table = []; }
      const scores = computeScores(players);
      const scored = players.map((p) => ({ ...p, score: p.score + (scores.find((s) => s.playerId === p.id)?.total || 0) }));
      const winIdx = scored.findIndex((p) => p.score >= st.target);
      if (winIdx >= 0) return { ...st, players: scored, table, deck, lastCaptureBy, phase: 'over', winner: winIdx, roundScores: scores, lastEvent: `${scored[winIdx].name} atteint ${scored[winIdx].score} — partie gagnée !`, log: push(st.log, event) };
      return { ...st, players: scored, table, deck, lastCaptureBy, phase: 'round_end', roundScores: scores, lastEvent: 'Fin de manche — décompte des captures.', log: push(st.log, event) };
    }
  }
  return { ...st, players, table, deck, lastCaptureBy, turn: (pi + 1) % st.players.length, lastEvent: event, log: push(st.log, event) };
}

export function nextRound(st: RState): RState {
  if (st.phase !== 'round_end') return st;
  const reset = st.players.map((p) => ({ ...p, hand: [], captures: [], ronda: false, tringa: false }));
  const { players, table, rest } = dealInitial(reset, buildDeck());
  return { ...st, players, table, deck: rest, turn: 0, phase: 'playing', roundNumber: st.roundNumber + 1, lastCaptureBy: null, roundScores: null, lastEvent: `Manche ${st.roundNumber + 1}` };
}

// ── Bot ───────────────────────────────────────────────────────────────────────
function botChoose(st: RState): string {
  const bot = st.players[st.turn];
  let best: Card | null = null, bestScore = -1;
  for (const c of bot.hand) {
    const matches = st.table.filter((t) => t.value === c.value);
    if (matches.length > 0) {
      let s = 1 + matches.length;
      if (matches.some((m) => m.suit === 'O')) s += 3;
      if (matches.some((m) => m.value === 7)) s += 2;
      if (matches.some((m) => m.id === '7O')) s += 5;
      if (c.id === '7O') s -= 4; // ne pas gâcher le settebello
      if (st.table.length === matches.length) s += 4; // tringla
      if (s > bestScore) { bestScore = s; best = c; }
    }
  }
  if (best) return best.id;
  // pas de capture : pose la plus basse, garde 7 et oros
  const sorted = [...bot.hand].sort((a, b) => {
    if (a.id === '7O') return 1; if (b.id === '7O') return -1;
    if (a.value === 7 && b.value !== 7) return 1; if (b.value === 7 && a.value !== 7) return -1;
    if (a.suit === 'O' && b.suit !== 'O') return 1; if (b.suit === 'O' && a.suit !== 'O') return -1;
    return a.value - b.value;
  });
  return sorted[0].id;
}

export function botStep(st: RState): RState {
  if (st.phase === 'round_end') return nextRound(st);
  if (st.phase !== 'playing') return st;
  if (!st.players[st.turn].isBot) return st;
  return play(st, botChoose(st));
}
