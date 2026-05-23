/**
 * @file apps/web/app/tarot/lib/engine.ts
 * @description Moteur Tarot français (pur-TS, version simplifiée jouable).
 *   78 cartes : 4 couleurs (♠♥♦♣, As→Roi) + 21 atouts + l'Excuse. 4 joueurs :
 *   le joueur humain est le « preneur » (p0), les 3 bots sont la défense.
 *   18 cartes chacun + chien de 6 (le preneur l'intègre puis écarte 6 cartes).
 *   Plis avec obligation de suivre / monter à l'atout. Bouts = Petit(1), 21,
 *   Excuse. Le preneur gagne s'il atteint son contrat de points (56→36 selon
 *   le nombre de bouts). Distinct de la Belote/Scopa : atouts, Excuse, bouts.
 */

export type TSuit = 'pique' | 'coeur' | 'carreau' | 'trefle';
export interface TCard { kind: 'suit' | 'trump' | 'excuse'; suit?: TSuit; rank?: number; trump?: number; id: string }
export interface TPlayer { id: string; name: string; isBot: boolean; hand: TCard[] }
export type TPhase = 'playing' | 'game_over';

export interface TarotState {
  phase: TPhase;
  players: TPlayer[];      // [0]=preneur (humain), 1..3 défense (bots)
  trick: { p: number; card: TCard }[];
  leadIndex: number;
  turn: number;
  wonTaker: TCard[];
  wonDefense: TCard[];
  ecart: TCard[];
  lastTrickWinner: number | null;
  result: null | { takerPoints: number; bouts: number; target: number; takerWins: boolean };
}

import { pickBots } from '../../games/bots';

export const TSUITS: TSuit[] = ['pique', 'coeur', 'carreau', 'trefle'];
export const SUIT_SYMBOL: Record<TSuit, string> = { pique: '♠', coeur: '♥', carreau: '♦', trefle: '♣' };
export const SUIT_RED: Record<TSuit, boolean> = { pique: false, coeur: true, carreau: true, trefle: false };

export function isTrump(c: TCard) { return c.kind === 'trump'; }
export function isExcuse(c: TCard) { return c.kind === 'excuse'; }
export function isBout(c: TCard) { return isExcuse(c) || (c.kind === 'trump' && (c.trump === 1 || c.trump === 21)); }

export function rankLabel(rank: number): string {
  return rank === 1 ? 'A' : rank === 11 ? 'V' : rank === 12 ? 'C' : rank === 13 ? 'D' : rank === 14 ? 'R' : String(rank);
}
export function cardLabel(c: TCard): string {
  if (c.kind === 'excuse') return 'Exc';
  if (c.kind === 'trump') return String(c.trump);
  return rankLabel(c.rank!);
}

export function cardPoints(c: TCard): number {
  if (c.kind === 'excuse') return 4.5;
  if (c.kind === 'trump') return c.trump === 1 || c.trump === 21 ? 4.5 : 0.5;
  const r = c.rank!;
  return r === 14 ? 4.5 : r === 13 ? 3.5 : r === 12 ? 2.5 : r === 11 ? 1.5 : 0.5;
}

function buildDeck(): TCard[] {
  const d: TCard[] = [];
  for (const s of TSUITS) for (let r = 1; r <= 14; r++) d.push({ kind: 'suit', suit: s, rank: r, id: `s-${s}-${r}` });
  for (let t = 1; t <= 21; t++) d.push({ kind: 'trump', trump: t, id: `t-${t}` });
  d.push({ kind: 'excuse', id: 'excuse' });
  for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; }
  return d;
}

export function newGame(): TarotState {
  const deck = buildDeck();
  const hands: TCard[][] = [[], [], [], []];
  // 18 chacun (par 3) + 6 au chien
  let idx = 0;
  const chien: TCard[] = [];
  while (idx < deck.length) {
    for (let p = 0; p < 4 && idx < deck.length; p++) {
      if (hands[p].length >= 18) continue;
      hands[p].push(deck[idx++]);
    }
    if (hands.every((h) => h.length >= 18)) break;
  }
  for (; idx < deck.length; idx++) chien.push(deck[idx]);

  // Preneur (p0) intègre le chien puis écarte 6 cartes (basses, ni Roi, ni atout, ni bout)
  hands[0] = [...hands[0], ...chien];
  const discardable = hands[0].filter((c) => c.kind === 'suit' && c.rank !== 14);
  const ecart: TCard[] = [];
  discardable.sort((a, b) => cardPoints(a) - cardPoints(b));
  for (const c of discardable) { if (ecart.length >= 6) break; ecart.push(c); }
  // si pas assez, complète avec des atouts non-bouts
  if (ecart.length < 6) {
    const extra = hands[0].filter((c) => c.kind === 'trump' && !isBout(c) && !ecart.includes(c)).sort((a, b) => (a.trump! - b.trump!));
    for (const c of extra) { if (ecart.length >= 6) break; ecart.push(c); }
  }
  const ecartIds = new Set(ecart.map((c) => c.id));
  hands[0] = hands[0].filter((c) => !ecartIds.has(c.id));

  const bn = pickBots('tarot', 3);
  const players: TPlayer[] = [
    { id: 'p0', name: 'Vous', isBot: false, hand: sortHand(hands[0]) },
    { id: 'p1', name: bn[0] || 'Bot 1', isBot: true, hand: hands[1] },
    { id: 'p2', name: bn[1] || 'Bot 2', isBot: true, hand: hands[2] },
    { id: 'p3', name: bn[2] || 'Bot 3', isBot: true, hand: hands[3] },
  ];
  return { phase: 'playing', players, trick: [], leadIndex: 0, turn: 0, wonTaker: [], wonDefense: [], ecart, lastTrickWinner: null, result: null };
}

export function sortHand(hand: TCard[]): TCard[] {
  const order = (c: TCard) => c.kind === 'excuse' ? 999 : c.kind === 'trump' ? 100 + c.trump! : TSUITS.indexOf(c.suit!) * 20 + c.rank!;
  return [...hand].sort((a, b) => order(a) - order(b));
}

/** Couleur demandée par le pli (atout/couleur), en ignorant l'Excuse en tête. */
function leadSuitOf(trick: { p: number; card: TCard }[]): 'trump' | TSuit | null {
  for (const e of trick) { if (!isExcuse(e.card)) return e.card.kind === 'trump' ? 'trump' : e.card.suit!; }
  return null;
}

function highestTrumpIn(trick: { p: number; card: TCard }[]): number {
  let m = 0; for (const e of trick) if (e.card.kind === 'trump' && e.card.trump! > m) m = e.card.trump!; return m;
}

/** Cartes jouables selon les obligations (suivre / couper / monter). L'Excuse est toujours jouable. */
export function legalCards(state: TarotState, playerIndex: number): TCard[] {
  const hand = state.players[playerIndex].hand;
  if (state.trick.length === 0) return hand;
  const led = leadSuitOf(state.trick);
  const excuse = hand.filter(isExcuse);
  let legal: TCard[] = [];
  if (led === 'trump') {
    const trumps = hand.filter(isTrump);
    if (trumps.length > 0) {
      const hi = highestTrumpIn(state.trick);
      const over = trumps.filter((c) => c.trump! > hi);
      legal = over.length > 0 ? over : trumps;
    } else legal = hand.filter((c) => !isExcuse(c));
  } else if (led) {
    const follow = hand.filter((c) => c.kind === 'suit' && c.suit === led);
    if (follow.length > 0) legal = follow;
    else {
      const trumps = hand.filter(isTrump);
      if (trumps.length > 0) {
        const hi = highestTrumpIn(state.trick);
        const over = trumps.filter((c) => c.trump! > hi);
        legal = over.length > 0 ? over : trumps;
      } else legal = hand.filter((c) => !isExcuse(c));
    }
  }
  if (legal.length === 0) legal = hand.filter((c) => !isExcuse(c));
  return [...legal, ...excuse];
}

function resolveTrick(trick: { p: number; card: TCard }[]): number {
  const led = leadSuitOf(trick);
  const hiTrump = highestTrumpIn(trick);
  if (hiTrump > 0) { const e = trick.find((x) => x.card.kind === 'trump' && x.card.trump === hiTrump)!; return e.p; }
  // pas d'atout : plus haute carte de la couleur demandée
  let winner = trick.find((x) => !isExcuse(x.card))!.p;
  let bestRank = -1;
  for (const e of trick) {
    if (e.card.kind === 'suit' && e.card.suit === led && e.card.rank! > bestRank) { bestRank = e.card.rank!; winner = e.p; }
  }
  return winner;
}

function applyPlay(state: TarotState, playerIndex: number, cardId: string): TarotState {
  if (state.turn !== playerIndex) return state;
  const card = state.players[playerIndex].hand.find((c) => c.id === cardId);
  if (!card) return state;
  if (!legalCards(state, playerIndex).some((c) => c.id === cardId)) return state;

  const players = state.players.map((p, i) => i === playerIndex ? { ...p, hand: p.hand.filter((c) => c.id !== cardId) } : p);
  const trick = [...state.trick, { p: playerIndex, card }];

  if (trick.length < 4) {
    return { ...state, players, trick, turn: (playerIndex + 1) % 4 };
  }

  // Pli complet : on résout
  const winner = resolveTrick(trick);
  const excuseEntry = trick.find((e) => isExcuse(e.card));
  let wonTaker = [...state.wonTaker];
  let wonDefense = [...state.wonDefense];
  const toSide = (cards: TCard[], takerSide: boolean) => { if (takerSide) wonTaker = [...wonTaker, ...cards]; else wonDefense = [...wonDefense, ...cards]; };
  const nonExcuse = trick.filter((e) => !isExcuse(e.card)).map((e) => e.card);
  toSide(nonExcuse, winner === 0);
  if (excuseEntry) toSide([excuseEntry.card], excuseEntry.p === 0); // l'Excuse reste au camp qui l'a jouée

  const next: TarotState = { ...state, players, trick: [], leadIndex: winner, turn: winner, wonTaker, wonDefense, lastTrickWinner: winner };

  if (players.every((p) => p.hand.length === 0)) return endGame(next);
  return next;
}

function endGame(state: TarotState): TarotState {
  const taker = [...state.wonTaker, ...state.ecart];
  const takerPoints = taker.reduce((s, c) => s + cardPoints(c), 0);
  const bouts = taker.filter(isBout).length;
  const target = bouts >= 3 ? 36 : bouts === 2 ? 41 : bouts === 1 ? 51 : 56;
  return { ...state, phase: 'game_over', result: { takerPoints: Math.round(takerPoints * 10) / 10, bouts, target, takerWins: takerPoints >= target } };
}

export function playHuman(state: TarotState, cardId: string): TarotState {
  if (state.phase !== 'playing' || state.turn !== 0) return state;
  return applyPlay(state, 0, cardId);
}

/** IA défenseur : si le preneur (p0) mène, tente de couper au plus juste ; sinon défausse bas. */
export function botTurn(state: TarotState): TarotState {
  if (state.phase !== 'playing' || state.turn === 0) return state;
  const pi = state.turn;
  const legal = legalCards(state, pi);
  if (legal.length === 0) return state;

  // qui mène actuellement ?
  let leaderIsTaker = false;
  if (state.trick.length > 0) leaderIsTaker = resolveTrick(state.trick) === 0;

  const byPoints = (a: TCard, b: TCard) => cardPoints(a) - cardPoints(b);
  // Si on peut gagner le pli et que le preneur mène (ou pli vide en défense), jouer la plus petite gagnante
  if (state.trick.length > 0) {
    const wins = legal.filter((c) => {
      const sim = [...state.trick, { p: pi, card: c }];
      return resolveTrick(sim) === pi;
    }).sort(byPoints);
    if (leaderIsTaker && wins.length > 0) return applyPlay(state, pi, wins[0].id);
  } else {
    // mène : sortir une carte basse non-bout
    const low = [...legal].filter((c) => !isBout(c)).sort(byPoints);
    return applyPlay(state, pi, (low[0] || legal[0]).id);
  }
  // sinon : défausser la plus basse (garder les bouts si possible)
  const dump = [...legal].filter((c) => !isBout(c)).sort(byPoints);
  return applyPlay(state, pi, (dump[0] || legal[0]).id);
}

export function rematch(): TarotState { return newGame(); }
