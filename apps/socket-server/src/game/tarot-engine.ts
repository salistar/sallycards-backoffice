/**
 * @file apps/socket-server/src/game/tarot-engine.ts
 * @description Moteur Tarot autoritatif côté serveur (4 sièges). Siège 0 =
 *   preneur, sièges 1-3 = défenseurs (humains ou bots). Suivre / monter à
 *   l'atout, Excuse, bouts, contrat de points. API par siège pour le multi.
 */
export type TSuit = 'pique' | 'coeur' | 'carreau' | 'trefle';
export interface TCard { kind: 'suit' | 'trump' | 'excuse'; suit?: TSuit; rank?: number; trump?: number; id: string }
export interface TPlayer { id: string; name: string; isBot: boolean; hand: TCard[] }
export type TPhase = 'playing' | 'game_over';
export interface TarotState {
  phase: TPhase; players: TPlayer[]; trick: { p: number; card: TCard }[]; leadIndex: number; turn: number;
  wonTaker: TCard[]; wonDefense: TCard[]; ecart: TCard[]; lastTrickWinner: number | null;
  result: null | { takerPoints: number; bouts: number; target: number; takerWins: boolean };
}
const TSUITS: TSuit[] = ['pique', 'coeur', 'carreau', 'trefle'];

export function isTrump(c: TCard) { return c.kind === 'trump'; }
export function isExcuse(c: TCard) { return c.kind === 'excuse'; }
export function isBout(c: TCard) { return isExcuse(c) || (c.kind === 'trump' && (c.trump === 1 || c.trump === 21)); }
export function cardPoints(c: TCard): number {
  if (c.kind === 'excuse') return 4.5;
  if (c.kind === 'trump') return c.trump === 1 || c.trump === 21 ? 4.5 : 0.5;
  const r = c.rank!; return r === 14 ? 4.5 : r === 13 ? 3.5 : r === 12 ? 2.5 : r === 11 ? 1.5 : 0.5;
}
function buildDeck(): TCard[] {
  const d: TCard[] = [];
  for (const s of TSUITS) for (let r = 1; r <= 14; r++) d.push({ kind: 'suit', suit: s, rank: r, id: `s-${s}-${r}` });
  for (let t = 1; t <= 21; t++) d.push({ kind: 'trump', trump: t, id: `t-${t}` });
  d.push({ kind: 'excuse', id: 'excuse' });
  for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; }
  return d;
}
function sortHand(hand: TCard[]): TCard[] {
  const o = (c: TCard) => c.kind === 'excuse' ? 999 : c.kind === 'trump' ? 100 + c.trump! : TSUITS.indexOf(c.suit!) * 20 + c.rank!;
  return [...hand].sort((a, b) => o(a) - o(b));
}

export function buildTarot(seats: { id: string; name: string; isBot: boolean }[]): TarotState {
  const deck = buildDeck();
  const hands: TCard[][] = [[], [], [], []];
  let idx = 0; const chien: TCard[] = [];
  while (idx < deck.length && !hands.every((h) => h.length >= 18)) {
    for (let p = 0; p < 4 && idx < deck.length; p++) { if (hands[p].length < 18) hands[p].push(deck[idx++]); }
  }
  for (; idx < deck.length; idx++) chien.push(deck[idx]);
  hands[0] = [...hands[0], ...chien];
  const discardable = hands[0].filter((c) => c.kind === 'suit' && c.rank !== 14).sort((a, b) => cardPoints(a) - cardPoints(b));
  const ecart: TCard[] = [];
  for (const c of discardable) { if (ecart.length >= 6) break; ecart.push(c); }
  if (ecart.length < 6) { const extra = hands[0].filter((c) => c.kind === 'trump' && !isBout(c) && !ecart.includes(c)).sort((a, b) => a.trump! - b.trump!); for (const c of extra) { if (ecart.length >= 6) break; ecart.push(c); } }
  const ids = new Set(ecart.map((c) => c.id)); hands[0] = hands[0].filter((c) => !ids.has(c.id));
  const players: TPlayer[] = [0, 1, 2, 3].map((i) => ({ id: seats[i]?.id || `bot-${i}`, name: seats[i]?.name || `Bot ${i}`, isBot: seats[i] ? seats[i].isBot : true, hand: i === 0 ? sortHand(hands[0]) : hands[i] }));
  return { phase: 'playing', players, trick: [], leadIndex: 0, turn: 0, wonTaker: [], wonDefense: [], ecart, lastTrickWinner: null, result: null };
}

function leadSuitOf(trick: { p: number; card: TCard }[]): 'trump' | TSuit | null {
  for (const e of trick) { if (!isExcuse(e.card)) return e.card.kind === 'trump' ? 'trump' : e.card.suit!; }
  return null;
}
function highestTrumpIn(trick: { p: number; card: TCard }[]): number { let m = 0; for (const e of trick) if (e.card.kind === 'trump' && e.card.trump! > m) m = e.card.trump!; return m; }

export function legalCards(state: TarotState, pi: number): TCard[] {
  const hand = state.players[pi].hand;
  if (state.trick.length === 0) return hand;
  const led = leadSuitOf(state.trick); const excuse = hand.filter(isExcuse); let legal: TCard[] = [];
  if (led === 'trump') {
    const tr = hand.filter(isTrump);
    if (tr.length > 0) { const hi = highestTrumpIn(state.trick); const over = tr.filter((c) => c.trump! > hi); legal = over.length > 0 ? over : tr; }
    else legal = hand.filter((c) => !isExcuse(c));
  } else if (led) {
    const follow = hand.filter((c) => c.kind === 'suit' && c.suit === led);
    if (follow.length > 0) legal = follow;
    else { const tr = hand.filter(isTrump); if (tr.length > 0) { const hi = highestTrumpIn(state.trick); const over = tr.filter((c) => c.trump! > hi); legal = over.length > 0 ? over : tr; } else legal = hand.filter((c) => !isExcuse(c)); }
  }
  if (legal.length === 0) legal = hand.filter((c) => !isExcuse(c));
  return [...legal, ...excuse];
}

function resolveTrick(trick: { p: number; card: TCard }[]): number {
  const led = leadSuitOf(trick); const hi = highestTrumpIn(trick);
  if (hi > 0) return trick.find((x) => x.card.kind === 'trump' && x.card.trump === hi)!.p;
  let winner = trick.find((x) => !isExcuse(x.card))!.p; let best = -1;
  for (const e of trick) if (e.card.kind === 'suit' && e.card.suit === led && e.card.rank! > best) { best = e.card.rank!; winner = e.p; }
  return winner;
}

function applyPlay(state: TarotState, pi: number, cardId: string): TarotState {
  if (state.turn !== pi) return state;
  const card = state.players[pi].hand.find((c) => c.id === cardId);
  if (!card) return state;
  if (!legalCards(state, pi).some((c) => c.id === cardId)) return state;
  const players = state.players.map((p, i) => i === pi ? { ...p, hand: p.hand.filter((c) => c.id !== cardId) } : p);
  const trick = [...state.trick, { p: pi, card }];
  if (trick.length < 4) return { ...state, players, trick, turn: (pi + 1) % 4 };
  const winner = resolveTrick(trick);
  const ex = trick.find((e) => isExcuse(e.card));
  let wonTaker = [...state.wonTaker]; let wonDefense = [...state.wonDefense];
  const side = (cards: TCard[], taker: boolean) => { if (taker) wonTaker = [...wonTaker, ...cards]; else wonDefense = [...wonDefense, ...cards]; };
  side(trick.filter((e) => !isExcuse(e.card)).map((e) => e.card), winner === 0);
  if (ex) side([ex.card], ex.p === 0);
  const next: TarotState = { ...state, players, trick: [], leadIndex: winner, turn: winner, wonTaker, wonDefense, lastTrickWinner: winner };
  if (players.every((p) => p.hand.length === 0)) return endGame(next);
  return next;
}

function endGame(state: TarotState): TarotState {
  const taker = [...state.wonTaker, ...state.ecart];
  const pts = taker.reduce((s, c) => s + cardPoints(c), 0);
  const bouts = taker.filter(isBout).length;
  const target = bouts >= 3 ? 36 : bouts === 2 ? 41 : bouts === 1 ? 51 : 56;
  return { ...state, phase: 'game_over', result: { takerPoints: Math.round(pts * 10) / 10, bouts, target, takerWins: pts >= target } };
}

export function tarotPlay(state: TarotState, seatId: string, cardId: string): TarotState {
  if (state.phase !== 'playing') return state;
  const pi = state.players.findIndex((p) => p.id === seatId);
  if (pi < 0 || pi !== state.turn) return state;
  return applyPlay(state, pi, cardId);
}

export function tarotAdvance(state: TarotState): { next: TarotState; delay: number } | null {
  if (state.phase === 'game_over') return null;
  const pi = state.turn; const cur = state.players[pi];
  if (!cur.isBot) return null;
  const legal = legalCards(state, pi);
  if (legal.length === 0) return null;
  const byPts = (a: TCard, b: TCard) => cardPoints(a) - cardPoints(b);
  let leaderIsTaker = false;
  if (state.trick.length > 0) leaderIsTaker = resolveTrick(state.trick) === 0;
  let chosen: TCard;
  if (state.trick.length === 0) { const low = [...legal].filter((c) => !isBout(c)).sort(byPts); chosen = low[0] || legal[0]; }
  else {
    const wins = legal.filter((c) => resolveTrick([...state.trick, { p: pi, card: c }]) === pi).sort(byPts);
    if (leaderIsTaker && wins.length > 0) chosen = wins[0];
    else { const dump = [...legal].filter((c) => !isBout(c)).sort(byPts); chosen = dump[0] || legal[0]; }
  }
  return { next: applyPlay(state, pi, chosen.id), delay: 800 };
}

export function tarotCurrentId(state: TarotState): string | null { return state.players[state.turn]?.id ?? null; }
export function tarotIsOver(state: TarotState): boolean { return state.phase === 'game_over'; }

export function tarotView(state: TarotState, youId: string) {
  const players = state.players.map((p) => ({
    id: p.id, name: p.name, isBot: p.isBot, count: p.hand.length,
    hand: p.id === youId ? p.hand : p.hand.map((_, i) => ({ hidden: true, id: `h-${p.id}-${i}` })),
  }));
  const takerPile = [...state.wonTaker, ...state.ecart];
  return {
    game: 'tarot', youId, phase: state.phase, players, trick: state.trick, turn: state.turn,
    currentId: tarotCurrentId(state), leadIndex: state.leadIndex, lastTrickWinner: state.lastTrickWinner,
    takerPoints: Math.round(takerPile.reduce((s, c) => s + cardPoints(c), 0) * 10) / 10,
    takerBouts: takerPile.filter(isBout).length, result: state.result,
  };
}
