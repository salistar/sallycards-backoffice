/**
 * @file apps/web/app/scopa/lib/engine.ts
 * @description Moteur Scopa (pur-TS) — jeu de capture italien à 2 joueurs.
 *   40 cartes (Spade/Coppe/Bastoni/Denari, valeurs 1-10). 3 en main + 4 au
 *   centre. On capture une carte de même valeur, ou un ensemble dont la somme
 *   égale la valeur jouée ; sinon on défausse. Balayer le centre = Scopa (+1).
 *   Scoring de manche : cartes, denari, settebello (7 de denari), primiera.
 *   Aucune dépendance React.
 */

export type Suit = 'spade' | 'coppe' | 'bastoni' | 'denari';
export interface Card { suit: Suit; value: number; id: string }
export interface SPlayer { id: string; name: string; isBot: boolean; hand: Card[]; captured: Card[]; scope: number }
export type SPhase = 'playing' | 'round_end' | 'game_over';

export interface ScopaState {
  phase: SPhase;
  players: [SPlayer, SPlayer];
  table: Card[];
  deck: Card[];
  turn: 0 | 1;
  lastCapturer: 0 | 1 | null;
  roundNumber: number;
  scores: [number, number];
  target: number;
  lastBreakdown: null | { labels: string[]; pts: [number, number] };
  winner: 0 | 1 | null;
}

import { pickBots } from '../../games/bots';

export const SUITS: Suit[] = ['spade', 'coppe', 'bastoni', 'denari'];
const SUIT_LETTER: Record<Suit, string> = { spade: 'E', coppe: 'C', bastoni: 'B', denari: 'O' };
export const SUIT_NAME: Record<Suit, string> = { spade: 'Spade', coppe: 'Coppe', bastoni: 'Bastoni', denari: 'Denari' };
const PRIME: Record<number, number> = { 7: 21, 6: 18, 1: 16, 5: 15, 4: 14, 3: 13, 2: 12, 10: 10, 9: 10, 8: 10 };

export function cardImage(c: Card): string { return `/cards/spanish40/${c.value}${SUIT_LETTER[c.suit]}.png`; }
export const CARD_BACK = '/cards/spanish40/back.png';

function buildDeck(): Card[] {
  const d: Card[] = [];
  for (const s of SUITS) for (let v = 1; v <= 10; v++) d.push({ suit: s, value: v, id: `${v}-${s}` });
  for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; }
  return d;
}

export function newGame(target = 11): ScopaState {
  const players: [SPlayer, SPlayer] = [
    { id: 'p0', name: 'Vous', isBot: false, hand: [], captured: [], scope: 0 },
    { id: 'p1', name: pickBots('scopa', 1)[0] || 'Bot', isBot: true, hand: [], captured: [], scope: 0 },
  ];
  const st: ScopaState = { phase: 'playing', players, table: [], deck: [], turn: 0, lastCapturer: null, roundNumber: 0, scores: [0, 0], target, lastBreakdown: null, winner: null };
  return deal(st, true);
}

/** Démarre une manche : distribue 3 cartes/joueur + 4 au centre. */
function deal(st: ScopaState, fresh: boolean): ScopaState {
  const deck = buildDeck();
  const p0: SPlayer = { ...st.players[0], hand: deck.splice(0, 3), captured: fresh ? [] : st.players[0].captured, scope: fresh ? 0 : st.players[0].scope };
  const p1: SPlayer = { ...st.players[1], hand: deck.splice(0, 3), captured: fresh ? [] : st.players[1].captured, scope: fresh ? 0 : st.players[1].scope };
  const table = deck.splice(0, 4);
  return { ...st, players: [p0, p1], table, deck, turn: 0, lastCapturer: null, phase: 'playing', roundNumber: st.roundNumber + 1 };
}

/** Cherche une capture pour `value` : match exact prioritaire, sinon sous-somme. */
export function findCapture(value: number, table: Card[]): Card[] | null {
  const exact = table.filter((c) => c.value === value);
  if (exact.length > 0) return [exact[0]];
  // sous-ensemble dont la somme = value (préférer le plus petit)
  let best: Card[] | null = null;
  const n = table.length;
  for (let mask = 1; mask < (1 << n); mask++) {
    let sum = 0; const sub: Card[] = [];
    for (let i = 0; i < n; i++) if (mask & (1 << i)) { sum += table[i].value; sub.push(table[i]); }
    if (sum === value && (!best || sub.length < best.length)) best = sub;
  }
  return best;
}

function applyPlay(st: ScopaState, cardId: string): ScopaState {
  const turn = st.turn;
  const p = st.players[turn];
  const card = p.hand.find((c) => c.id === cardId);
  if (!card) return st;
  const hand = p.hand.filter((c) => c.id !== cardId);
  let table = [...st.table];
  let captured = [...p.captured];
  let scope = p.scope;
  let lastCapturer = st.lastCapturer;

  const cap = findCapture(card.value, table);
  if (cap) {
    const ids = new Set(cap.map((c) => c.id));
    table = table.filter((c) => !ids.has(c.id));
    captured = [...captured, card, ...cap];
    lastCapturer = turn;
    // Scopa : table vidée (sauf au tout dernier coup de la manche)
    const lastPlayOfRound = st.deck.length === 0 && st.players[0].hand.length + st.players[1].hand.length - 1 === 0;
    if (table.length === 0 && !lastPlayOfRound) scope += 1;
  } else {
    table = [...table, card];
  }

  const players: [SPlayer, SPlayer] = [...st.players] as any;
  players[turn] = { ...p, hand, captured, scope };
  let next: ScopaState = { ...st, players, table, lastCapturer, turn: (1 - turn) as 0 | 1 };

  // Redistribution si les deux mains sont vides
  if (players[0].hand.length === 0 && players[1].hand.length === 0) {
    if (next.deck.length > 0) {
      const deck = [...next.deck];
      const h0 = deck.splice(0, 3), h1 = deck.splice(0, 3);
      next = { ...next, deck, players: [{ ...players[0], hand: h0 }, { ...players[1], hand: h1 }], turn: 0 };
    } else {
      next = endRound(next);
    }
  }
  return next;
}

function endRound(st: ScopaState): ScopaState {
  // Cartes restantes au dernier capteur
  let players: [SPlayer, SPlayer] = [...st.players] as any;
  if (st.table.length > 0 && st.lastCapturer != null) {
    const lc = st.lastCapturer;
    players[lc] = { ...players[lc], captured: [...players[lc].captured, ...st.table] };
  }
  const [pts, labels] = scoreRound(players[0], players[1]);
  const scores: [number, number] = [st.scores[0] + pts[0], st.scores[1] + pts[1]];
  let phase: SPhase = 'round_end';
  let winner: 0 | 1 | null = null;
  if ((scores[0] >= st.target || scores[1] >= st.target) && scores[0] !== scores[1]) {
    phase = 'game_over';
    winner = scores[0] > scores[1] ? 0 : 1;
  }
  return { ...st, players, table: [], phase, scores, winner, lastBreakdown: { labels, pts } };
}

function primiera(captured: Card[]): number {
  const best: Record<Suit, number> = { spade: 0, coppe: 0, bastoni: 0, denari: 0 };
  for (const c of captured) { const v = PRIME[c.value] || 0; if (v > best[c.suit]) best[c.suit] = v; }
  return best.spade + best.coppe + best.bastoni + best.denari;
}

/** Calcule les points de manche : cartes, denari, settebello, primiera, scope. */
export function scoreRound(p0: SPlayer, p1: SPlayer): [[number, number], string[]] {
  const pts: [number, number] = [p0.scope, p1.scope];
  const labels: string[] = [];
  if (p0.scope) labels.push(`Scopa ×${p0.scope} (Vous)`);
  if (p1.scope) labels.push(`Scopa ×${p1.scope} (Bot)`);

  if (p0.captured.length !== p1.captured.length) { const w = p0.captured.length > p1.captured.length ? 0 : 1; pts[w]++; labels.push(`Cartes (${w === 0 ? 'Vous' : 'Bot'})`); }
  const d0 = p0.captured.filter((c) => c.suit === 'denari').length, d1 = p1.captured.filter((c) => c.suit === 'denari').length;
  if (d0 !== d1) { const w = d0 > d1 ? 0 : 1; pts[w]++; labels.push(`Denari (${w === 0 ? 'Vous' : 'Bot'})`); }
  const sb0 = p0.captured.some((c) => c.suit === 'denari' && c.value === 7);
  const sb1 = p1.captured.some((c) => c.suit === 'denari' && c.value === 7);
  if (sb0 || sb1) { const w = sb0 ? 0 : 1; pts[w]++; labels.push(`Settebello (${w === 0 ? 'Vous' : 'Bot'})`); }
  const pr0 = primiera(p0.captured), pr1 = primiera(p1.captured);
  if (pr0 !== pr1) { const w = pr0 > pr1 ? 0 : 1; pts[w]++; labels.push(`Primiera (${w === 0 ? 'Vous' : 'Bot'})`); }
  return [pts, labels];
}

export function playHuman(st: ScopaState, cardId: string): ScopaState {
  if (st.phase !== 'playing' || st.turn !== 0) return st;
  return applyPlay(st, cardId);
}

/** Coup du bot : meilleure capture (settebello > denari > nb cartes > scopa), sinon défausse basse. */
export function botTurn(st: ScopaState): ScopaState {
  if (st.phase !== 'playing' || st.turn !== 1) return st;
  const bot = st.players[1];
  if (bot.hand.length === 0) return st;
  let bestCard = bot.hand[0]; let bestScore = -1;
  for (const c of bot.hand) {
    const cap = findCapture(c.value, st.table);
    let score = -1;
    if (cap) {
      const all = [c, ...cap];
      score = all.length; // nb de cartes prises
      if (all.some((x) => x.suit === 'denari' && x.value === 7)) score += 20; // settebello
      score += all.filter((x) => x.suit === 'denari').length * 2;
      if (st.table.length === cap.length) score += 8; // scopa potentielle
    } else {
      score = -c.value; // défausse : préférer petite valeur
    }
    if (score > bestScore) { bestScore = score; bestCard = c; }
  }
  return applyPlay(st, bestCard.id);
}

export function newRound(st: ScopaState): ScopaState {
  if (st.phase !== 'round_end') return st;
  return deal({ ...st, players: [{ ...st.players[0], scope: 0 }, { ...st.players[1], scope: 0 }] }, true);
}

export function rematch(st: ScopaState): ScopaState { return newGame(st.target); }
