/**
 * @file apps/socket-server/src/game/kdoub-engine.ts
 * @description Moteur Kdoub autoritatif serveur (bluff marocain, paquet espagnol
 *   40 cartes, jusqu'à 6 sièges). Pose une carte face cachée en déclarant une
 *   valeur (verrouillée pour la séquence), conteste avec « Kdoub ! ». Le menteur
 *   ou le contestataire ramasse le tas. Premier à vider sa main gagne la manche.
 */
export type Suit = 'B' | 'C' | 'E' | 'O';
export type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 10 | 11 | 12;
export interface Card { id: string; suit: Suit; value: CardValue }
export interface PlayedCard { card: Card; declaredValue: CardValue; playerId: string; isBluff: boolean }
export interface KPlayer { id: string; name: string; isBot: boolean; hand: Card[]; score: number }
export type KPhase = 'playing' | 'challenge' | 'reveal' | 'round_end' | 'over';
export interface KChallenge { challengerId: string; wasBluff: boolean; loserId: string; declaredValue: CardValue; realValue: CardValue; count: number }
export interface KState {
  players: KPlayer[]; currentPlayerIndex: number; pile: PlayedCard[]; deck: Card[];
  declaredValue: CardValue | null; lastPlay: PlayedCard | null; lastChallenge: KChallenge | null;
  phase: KPhase; winner: number | null; roundNumber: number; target: number; lastEvent: string; log: string[];
}

const SUITS: Suit[] = ['B', 'C', 'E', 'O'];
const VALUES: CardValue[] = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
export const VALUE_NAME: Record<CardValue, string> = { 1: 'As', 2: 'Deux', 3: 'Trois', 4: 'Quatre', 5: 'Cinq', 6: 'Six', 7: 'Sept', 10: 'Sota', 11: 'Caballo', 12: 'Rey' };
const CARD_POINTS: Record<CardValue, number> = { 1: 11, 2: 0, 3: 10, 4: 0, 5: 0, 6: 0, 7: 0, 10: 2, 11: 3, 12: 4 };
const TARGET = 100;

function buildDeck(): Card[] {
  const d: Card[] = [];
  for (const s of SUITS) for (const v of VALUES) d.push({ id: `${v}${s}`, suit: s, value: v });
  for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; }
  return d;
}
function cardsPerPlayer(n: number): number { return n <= 3 ? 10 : n === 4 ? 8 : n === 5 ? 7 : 6; }
function nextIdx(cur: number, players: KPlayer[]): number {
  let n = (cur + 1) % players.length, tries = 0;
  while (players[n].hand.length === 0 && tries < players.length) { n = (n + 1) % players.length; tries++; }
  return n;
}
function handPoints(hand: Card[]): number { return hand.reduce((t, c) => t + CARD_POINTS[c.value], 0); }
function push(log: string[], line: string): string[] { return [line, ...log].slice(0, 30); }

function deal(st: KState): KState {
  const deck = buildDeck();
  const per = cardsPerPlayer(st.players.length);
  const players = st.players.map((p, i) => ({ ...p, hand: deck.slice(i * per, (i + 1) * per) }));
  const rest = deck.slice(st.players.length * per);
  return { ...st, players, deck: rest, currentPlayerIndex: 0, pile: [], declaredValue: null, lastPlay: null, lastChallenge: null, phase: 'playing', roundNumber: st.roundNumber + 1, lastEvent: `Manche ${st.roundNumber + 1}` };
}

export function buildKdoub(seats: { id: string; name: string; isBot: boolean }[]): KState {
  const players: KPlayer[] = seats.slice(0, 6).map((s) => ({ ...s, hand: [], score: 0 }));
  while (players.length < 2) players.push({ id: `bot-${players.length}`, name: `Bot ${players.length}`, isBot: true, hand: [], score: 0 });
  return deal({ players, currentPlayerIndex: 0, pile: [], deck: [], declaredValue: null, lastPlay: null, lastChallenge: null, phase: 'playing', winner: null, roundNumber: 0, target: TARGET, lastEvent: 'Distribution', log: ['Nouvelle partie.'] });
}

function deciderIndex(st: KState): number { return nextIdx(st.currentPlayerIndex, st.players); }

function play(st: KState, cardId: string, declared: CardValue): KState {
  let s = st;
  if (s.phase === 'challenge') s = { ...s, phase: 'playing', currentPlayerIndex: nextIdx(s.currentPlayerIndex, s.players) };
  else if (s.phase !== 'playing') return st;

  const pi = s.currentPlayerIndex;
  const player = s.players[pi];
  const idx = player.hand.findIndex((c) => c.id === cardId);
  if (idx < 0) return st;
  const forced: CardValue = s.declaredValue !== null ? s.declaredValue : declared;
  const card = player.hand[idx];
  const isBluff = card.value !== forced;
  const hand = player.hand.filter((c) => c.id !== cardId);
  const players = s.players.map((p, i) => (i === pi ? { ...p, hand } : p));
  const played: PlayedCard = { card, declaredValue: forced, playerId: player.id, isBluff };
  const log = push(s.log, `${player.name} pose « ${VALUE_NAME[forced]} »`);

  if (hand.length === 0) {
    const scored = players.map((p) => ({ ...p, score: p.score + handPoints(p.hand) }));
    const over = scored.some((p) => p.score >= s.target) || s.roundNumber >= 10;
    if (over) {
      const lowest = scored.reduce((b, p, i) => (p.score < scored[b].score ? i : b), 0);
      return { ...s, players: scored, pile: [...s.pile, played], phase: 'over', winner: lowest, declaredValue: forced, lastPlay: played, lastEvent: `${player.name} se débarrasse de tout !`, log: push(log, `🏆 ${scored[lowest].name} gagne (score le plus bas).`) };
    }
    return { ...s, players: scored, pile: [...s.pile, played], phase: 'round_end', winner: pi, declaredValue: forced, lastPlay: played, lastEvent: `${player.name} remporte la manche !`, log: push(log, `${player.name} vide sa main.`) };
  }
  return { ...s, players, pile: [...s.pile, played], lastPlay: played, declaredValue: forced, phase: 'challenge', lastEvent: `${player.name} déclare ${VALUE_NAME[forced]}`, log };
}

function challenge(st: KState, challengerId: string): KState {
  if (st.phase !== 'challenge' || !st.lastPlay) return st;
  if (challengerId === st.lastPlay.playerId) return st;
  const wasBluff = st.lastPlay.isBluff;
  const loserId = wasBluff ? st.lastPlay.playerId : challengerId;
  const collected = st.pile.map((p) => p.card);
  const loserIdx = st.players.findIndex((p) => p.id === loserId);
  if (loserIdx < 0) return st;
  const players = st.players.map((p, i) => (i === loserIdx ? { ...p, hand: [...p.hand, ...collected] } : p));
  const chName = st.players.find((p) => p.id === challengerId)?.name || '?';
  const liarName = st.players.find((p) => p.id === st.lastPlay!.playerId)?.name || '?';
  const verdict = wasBluff
    ? `Kdoub ! ${liarName} bluffait (${VALUE_NAME[st.lastPlay.card.value]}) → ramasse ${collected.length} cartes.`
    : `Kdoub raté ! ${liarName} disait vrai → ${chName} ramasse ${collected.length} cartes.`;
  const lastChallenge: KChallenge = { challengerId, wasBluff, loserId, declaredValue: st.lastPlay.declaredValue, realValue: st.lastPlay.card.value, count: collected.length };
  return { ...st, players, pile: [], phase: 'reveal', lastChallenge, lastEvent: verdict, log: push(st.log, verdict) };
}

function pass(st: KState): KState {
  if (st.phase !== 'challenge') return st;
  return { ...st, phase: 'playing', currentPlayerIndex: nextIdx(st.currentPlayerIndex, st.players), lastEvent: 'Personne ne conteste.' };
}
function nextTurn(st: KState): KState {
  if (st.phase !== 'reveal') return st;
  const start = st.lastChallenge ? st.players.findIndex((p) => p.id === st.lastChallenge!.loserId) : st.currentPlayerIndex;
  const cur = st.players[start]?.hand.length ? start : nextIdx(start, st.players);
  return { ...st, phase: 'playing', currentPlayerIndex: cur, declaredValue: null, lastPlay: null, lastEvent: 'Nouvelle séquence.' };
}
function newRound(st: KState): KState {
  if (st.phase !== 'round_end') return st;
  return deal({ ...st, players: st.players.map((p) => ({ ...p, hand: [] })) });
}

function botPick(bot: KPlayer, locked: CardValue | null): { cardId: string; declared: CardValue } {
  if (locked === null) { const c = bot.hand[Math.floor(Math.random() * bot.hand.length)]; return { cardId: c.id, declared: c.value }; }
  const honest = bot.hand.find((c) => c.value === locked);
  if (honest) return { cardId: honest.id, declared: locked };
  const cheap = [...bot.hand].sort((a, b) => CARD_POINTS[a.value] - CARD_POINTS[b.value])[0];
  return { cardId: cheap.id, declared: locked };
}
function botChallenges(bot: KPlayer, last: PlayedCard, pileSize: number): boolean {
  const hesitation = Math.min(pileSize * 0.08, 0.45);
  const have = bot.hand.filter((c) => c.value === last.declaredValue).length;
  if (have >= 3) return Math.random() > hesitation;
  if (have >= 2) return Math.random() > 0.55 + hesitation;
  return Math.random() > 0.85 + hesitation;
}

// ── Interface adaptateur ──────────────────────────────────────────────────
export function kdoubApply(st: KState, seatId: string, a: any): KState {
  if (st.phase === 'over' || st.phase === 'round_end' || st.phase === 'reveal') return st;
  if (a?.type === 'PLAY' && typeof a.cardId === 'string') {
    const actingIdx = st.phase === 'challenge' ? deciderIndex(st) : st.currentPlayerIndex;
    if (st.players[actingIdx]?.id !== seatId) return st;
    const declared: CardValue = VALUES.includes(a.declaredValue) ? a.declaredValue : (st.players[actingIdx].hand[0]?.value ?? 1);
    return play(st, a.cardId, declared);
  }
  if (a?.type === 'CHALLENGE') {
    if (st.phase !== 'challenge') return st;
    if (st.players[deciderIndex(st)]?.id !== seatId) return st; // seul le décideur conteste
    return challenge(st, seatId);
  }
  if (a?.type === 'PASS') {
    if (st.phase !== 'challenge' || st.players[deciderIndex(st)]?.id !== seatId) return st;
    return pass(st);
  }
  return st;
}

export function kdoubAdvance(st: KState): { next: KState; delay: number } | null {
  if (st.phase === 'over') return null;
  if (st.phase === 'reveal') return { next: nextTurn(st), delay: 1700 };
  if (st.phase === 'round_end') return { next: newRound(st), delay: 1800 };
  if (st.phase === 'challenge') {
    const dec = st.players[deciderIndex(st)];
    if (!dec.isBot) return null;
    if (st.lastPlay && botChallenges(dec, st.lastPlay, st.pile.length)) return { next: challenge(st, dec.id), delay: 1000 };
    const passed = pass(st);
    const cur = passed.players[passed.currentPlayerIndex];
    if (!cur.isBot || cur.hand.length === 0) return { next: passed, delay: 900 };
    const { cardId, declared } = botPick(cur, passed.declaredValue);
    return { next: play(passed, cardId, declared), delay: 950 };
  }
  if (st.phase === 'playing') {
    const cur = st.players[st.currentPlayerIndex];
    if (!cur.isBot || cur.hand.length === 0) return null;
    const { cardId, declared } = botPick(cur, st.declaredValue);
    return { next: play(st, cardId, declared), delay: 950 };
  }
  return null;
}

export function kdoubCurrentId(st: KState): string | null {
  const idx = st.phase === 'challenge' ? deciderIndex(st) : st.currentPlayerIndex;
  return st.players[idx]?.id ?? null;
}
export function kdoubIsOver(st: KState): boolean { return st.phase === 'over'; }

export function kdoubView(st: KState, youId: string) {
  return {
    game: 'kdoub', youId, phase: st.phase, currentId: kdoubCurrentId(st),
    deciderId: st.phase === 'challenge' ? st.players[deciderIndex(st)]?.id ?? null : null,
    declaredValue: st.declaredValue, valueNames: VALUE_NAME, values: VALUES,
    pileCount: st.pile.length, deckCount: st.deck.length, winner: st.winner, roundNumber: st.roundNumber,
    lastEvent: st.lastEvent, log: st.log, lastChallenge: st.lastChallenge,
    players: st.players.map((p) => ({ id: p.id, name: p.name, isBot: p.isBot, count: p.hand.length, score: p.score, hand: p.id === youId ? p.hand : undefined })),
  };
}
