/**
 * @file apps/web/app/poker/lib/engine.ts
 * @description Moteur Poker Texas Hold'em No-Limit (paquet espagnol 40 cartes,
 *   2-4 joueurs). 2 cartes privées, 5 communes (flop/turn/river), 4 tours
 *   d'enchères, meilleure main de 5 cartes. Blinds 10/20, tapis 1000. Logique
 *   propre portée de l'app mobile (évaluation de mains, enchères, IA, showdown).
 */
export type Suit = 'bastos' | 'copas' | 'espadas' | 'oros';
export type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 10 | 11 | 12;
export interface Card { suit: Suit; value: CardValue; id: string }
export interface Player { id: string; name: string; hand: Card[]; chips: number; currentBet: number; folded: boolean; isBot: boolean; isAllIn: boolean }
export type GamePhase = 'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | 'game_over';
export type HandRank = 'high_card' | 'pair' | 'two_pair' | 'three_of_a_kind' | 'straight' | 'flush' | 'full_house' | 'four_of_a_kind' | 'straight_flush';

export const HAND_RANK_VALUES: Record<HandRank, number> = { high_card: 0, pair: 1, two_pair: 2, three_of_a_kind: 3, straight: 4, flush: 5, full_house: 6, four_of_a_kind: 7, straight_flush: 8 };
export interface HandEvaluation { rank: HandRank; rankValue: number; highCards: number[]; description: string }
export interface GameState {
  phase: GamePhase; players: Player[]; communityCards: Card[]; deck: Card[]; pot: number; currentBet: number;
  dealerIndex: number; currentPlayerIndex: number; roundNumber: number; winnerId: string | null;
  winnerHandDescription: string; lastAction: string; smallBlind: number; bigBlind: number;
}
export type GameAction =
  | { type: 'JOIN'; playerId: string; playerName: string; isBot?: boolean }
  | { type: 'START_GAME' } | { type: 'CHECK'; playerId: string } | { type: 'BET'; playerId: string; amount: number }
  | { type: 'CALL'; playerId: string } | { type: 'FOLD'; playerId: string } | { type: 'RAISE'; playerId: string; amount: number }
  | { type: 'NEXT_PHASE' } | { type: 'NEW_ROUND' } | { type: 'RESET' };

export const SUITS: Suit[] = ['bastos', 'copas', 'espadas', 'oros'];
export const VALUES: CardValue[] = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
export const STARTING_CHIPS = 1000;
export const SMALL_BLIND = 10;
export const BIG_BLIND = 20;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;

const STRAIGHT_MAP: Record<CardValue, number> = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 10: 8, 11: 9, 12: 10 };
export const SUIT_NAMES: Record<Suit, string> = { bastos: 'Bâtons', copas: 'Coupes', espadas: 'Épées', oros: 'Deniers' };
export const SUIT_LETTER: Record<Suit, string> = { bastos: 'B', copas: 'C', espadas: 'E', oros: 'O' };
export const VALUE_NAMES: Record<CardValue, string> = { 1: 'As', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 10: 'Sota', 11: 'Caballo', 12: 'Rey' };
export const HAND_FR: Record<HandRank, string> = { high_card: 'Carte haute', pair: 'Paire', two_pair: 'Double paire', three_of_a_kind: 'Brelan', straight: 'Quinte', flush: 'Couleur', full_house: 'Full', four_of_a_kind: 'Carré', straight_flush: 'Quinte flush' };

export function cardImage(c: Card): string { return `/cards/spanish40/${c.value}${SUIT_LETTER[c.suit]}.png`; }
export const CARD_BACK = '/cards/spanish40/back.png';

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) for (const value of VALUES) deck.push({ suit, value, id: `${value.toString().padStart(2, '0')}-${suit}` });
  return deck;
}
export function shuffleDeck(deck: Card[]): Card[] {
  const s = [...deck];
  for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [s[i], s[j]] = [s[j], s[i]]; }
  return s;
}

// ── Évaluation des mains ────────────────────────────────────────────────────
function getValueCounts(cards: Card[]): Map<CardValue, number> { const m = new Map<CardValue, number>(); for (const c of cards) m.set(c.value, (m.get(c.value) || 0) + 1); return m; }
function getSuitCounts(cards: Card[]): Map<Suit, number> { const m = new Map<Suit, number>(); for (const c of cards) m.set(c.suit, (m.get(c.suit) || 0) + 1); return m; }
function isFlush(cards: Card[]): Suit | null { for (const [s, c] of getSuitCounts(cards)) if (c >= 5) return s; return null; }
function findStraight(cards: Card[]): number | null {
  const mapped = [...new Set(cards.map((c) => STRAIGHT_MAP[c.value]))].sort((a, b) => b - a);
  if (mapped.includes(1)) mapped.unshift(11);
  for (let i = 0; i <= mapped.length - 5; i++) {
    let ok = true; for (let j = 1; j < 5; j++) if (mapped[i] - mapped[i + j] !== j) { ok = false; break; }
    if (ok) return mapped[i];
  }
  return null;
}
function getBestFiveCardHand(all: Card[]): Card[] {
  const combos: Card[][] = [];
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) for (let k = j + 1; k < all.length; k++) for (let l = k + 1; l < all.length; l++) for (let m = l + 1; m < all.length; m++) combos.push([all[i], all[j], all[k], all[l], all[m]]);
  let best: HandEvaluation | null = null, bestC = combos[0];
  for (const c of combos) { const e = evaluateFiveCards(c); if (!best || compareHands(e, best) > 0) { best = e; bestC = c; } }
  return bestC;
}
function evaluateFiveCards(cards: Card[]): HandEvaluation {
  const valueCounts = getValueCounts(cards);
  const flushSuit = isFlush(cards);
  const straightHigh = findStraight(cards);
  const counts = Array.from(valueCounts.entries()).sort((a, b) => b[1] - a[1] || STRAIGHT_MAP[b[0]] - STRAIGHT_MAP[a[0]]);
  const sortedValues = cards.map((c) => STRAIGHT_MAP[c.value]).sort((a, b) => b - a);
  if (flushSuit && straightHigh) { const fc = cards.filter((c) => c.suit === flushSuit); const fs = findStraight(fc); if (fs) return { rank: 'straight_flush', rankValue: 8, highCards: [fs], description: `Quinte flush, ${fs} haute` }; }
  if (counts[0][1] === 4) { const k = counts[1] ? STRAIGHT_MAP[counts[1][0]] : 0; return { rank: 'four_of_a_kind', rankValue: 7, highCards: [STRAIGHT_MAP[counts[0][0]], k], description: `Carré de ${VALUE_NAMES[counts[0][0]]}` }; }
  if (counts[0][1] === 3 && counts[1] && counts[1][1] >= 2) return { rank: 'full_house', rankValue: 6, highCards: [STRAIGHT_MAP[counts[0][0]], STRAIGHT_MAP[counts[1][0]]], description: `Full ${VALUE_NAMES[counts[0][0]]} par ${VALUE_NAMES[counts[1][0]]}` };
  if (flushSuit) { const fc = cards.filter((c) => c.suit === flushSuit).map((c) => STRAIGHT_MAP[c.value]).sort((a, b) => b - a).slice(0, 5); return { rank: 'flush', rankValue: 5, highCards: fc, description: `Couleur (${SUIT_NAMES[flushSuit]})` }; }
  if (straightHigh) return { rank: 'straight', rankValue: 4, highCards: [straightHigh], description: `Quinte, ${straightHigh} haute` };
  if (counts[0][1] === 3) { const k = counts.slice(1).map((c) => STRAIGHT_MAP[c[0]]).sort((a, b) => b - a); return { rank: 'three_of_a_kind', rankValue: 3, highCards: [STRAIGHT_MAP[counts[0][0]], ...k], description: `Brelan de ${VALUE_NAMES[counts[0][0]]}` }; }
  if (counts[0][1] === 2 && counts[1] && counts[1][1] === 2) { const hi = Math.max(STRAIGHT_MAP[counts[0][0]], STRAIGHT_MAP[counts[1][0]]); const lo = Math.min(STRAIGHT_MAP[counts[0][0]], STRAIGHT_MAP[counts[1][0]]); const k = counts[2] ? STRAIGHT_MAP[counts[2][0]] : 0; return { rank: 'two_pair', rankValue: 2, highCards: [hi, lo, k], description: `Double paire ${VALUE_NAMES[counts[0][0]]} & ${VALUE_NAMES[counts[1][0]]}` }; }
  if (counts[0][1] === 2) { const k = counts.slice(1).map((c) => STRAIGHT_MAP[c[0]]).sort((a, b) => b - a); return { rank: 'pair', rankValue: 1, highCards: [STRAIGHT_MAP[counts[0][0]], ...k], description: `Paire de ${VALUE_NAMES[counts[0][0]]}` }; }
  return { rank: 'high_card', rankValue: 0, highCards: sortedValues, description: 'Carte haute' };
}
function compareHands(a: HandEvaluation, b: HandEvaluation): number {
  if (a.rankValue !== b.rankValue) return a.rankValue - b.rankValue;
  for (let i = 0; i < Math.min(a.highCards.length, b.highCards.length); i++) if (a.highCards[i] !== b.highCards[i]) return a.highCards[i] - b.highCards[i];
  return 0;
}
export function evaluateHand(hand: Card[], community: Card[]): HandEvaluation {
  const all = [...hand, ...community];
  if (all.length < 5) return evaluateFiveCards(all.length >= 5 ? all.slice(0, 5) : [...all, ...Array(5 - all.length).fill(all[0])]);
  return evaluateFiveCards(getBestFiveCardHand(all));
}

// ── Logique de jeu ──────────────────────────────────────────────────────────
function getNonFoldedPlayers(players: Player[]): Player[] { return players.filter((p) => !p.folded); }
function getNextActivePlayerIndex(cur: number, players: Player[]): number {
  let next = (cur + 1) % players.length, n = 0;
  while ((players[next].folded || players[next].isAllIn) && n < players.length) { next = (next + 1) % players.length; n++; }
  return next;
}
function allBetsEqual(players: Player[]): boolean {
  const active = players.filter((p) => !p.folded && !p.isAllIn);
  if (active.length <= 1) return true;
  const t = active[0].currentBet; return active.every((p) => p.currentBet === t);
}
export function getWinner(state: GameState): { winnerId: string; description: string } | null {
  const nf = getNonFoldedPlayers(state.players);
  if (nf.length === 0) return null;
  if (nf.length === 1) return { winnerId: nf[0].id, description: 'Seul joueur restant' };
  let bp = nf[0], be = evaluateHand(bp.hand, state.communityCards);
  for (let i = 1; i < nf.length; i++) { const e = evaluateHand(nf[i].hand, state.communityCards); if (compareHands(e, be) > 0) { be = e; bp = nf[i]; } }
  return { winnerId: bp.id, description: be.description };
}

export function botPlay(state: GameState): GameAction | null {
  const p = state.players[state.currentPlayerIndex];
  if (!p || !p.isBot || p.folded) return null;
  const hs = evaluateHand(p.hand, state.communityCards);
  const toCall = state.currentBet - p.currentBet;
  if (hs.rankValue >= HAND_RANK_VALUES.three_of_a_kind) {
    const raise = Math.min(state.bigBlind * 3 + state.currentBet, p.chips + p.currentBet);
    if (raise > state.currentBet) return { type: 'RAISE', playerId: p.id, amount: raise };
    return { type: 'CALL', playerId: p.id };
  }
  if (hs.rankValue >= HAND_RANK_VALUES.pair) {
    if (toCall === 0) return Math.random() > 0.5 ? { type: 'BET', playerId: p.id, amount: state.bigBlind } : { type: 'CHECK', playerId: p.id };
    if (toCall <= state.bigBlind * 4) return { type: 'CALL', playerId: p.id };
    return { type: 'FOLD', playerId: p.id };
  }
  if (toCall === 0) return { type: 'CHECK', playerId: p.id };
  if (toCall <= state.bigBlind && Math.random() > 0.4) return { type: 'CALL', playerId: p.id };
  if (Math.random() > 0.85) return { type: 'CALL', playerId: p.id };
  return { type: 'FOLD', playerId: p.id };
}

export function initGame(): GameState {
  return { phase: 'waiting', players: [], communityCards: [], deck: [], pot: 0, currentBet: 0, dealerIndex: 0, currentPlayerIndex: 0, roundNumber: 0, winnerId: null, winnerHandDescription: '', lastAction: '', smallBlind: SMALL_BLIND, bigBlind: BIG_BLIND };
}
function dealPhase(state: GameState): GameState {
  const deck = shuffleDeck(createDeck());
  let di = 0;
  const players = state.players.map((p) => ({ ...p, hand: [deck[di++], deck[di++]], currentBet: 0, folded: false, isAllIn: false }));
  const remaining = deck.slice(di);
  const sb = (state.dealerIndex + 1) % players.length;
  const bb = (state.dealerIndex + 2) % players.length;
  const sbA = Math.min(state.smallBlind, players[sb].chips);
  const bbA = Math.min(state.bigBlind, players[bb].chips);
  players[sb] = { ...players[sb], chips: players[sb].chips - sbA, currentBet: sbA, isAllIn: players[sb].chips - sbA === 0 };
  players[bb] = { ...players[bb], chips: players[bb].chips - bbA, currentBet: bbA, isAllIn: players[bb].chips - bbA === 0 };
  return { ...state, phase: 'preflop', players, deck: remaining, communityCards: [], pot: sbA + bbA, currentBet: bbA, currentPlayerIndex: (bb + 1) % players.length, lastAction: 'Blinds postées' };
}
function advancePhase(state: GameState): GameState {
  const nf = getNonFoldedPlayers(state.players);
  if (nf.length <= 1) { const w = getWinner(state); return { ...state, phase: 'showdown', winnerId: w?.winnerId || null, winnerHandDescription: w?.description || '' }; }
  const reset = state.players.map((p) => ({ ...p, currentBet: 0 }));
  const firstActive = getNextActivePlayerIndex(state.dealerIndex, reset);
  switch (state.phase) {
    case 'preflop': return { ...state, phase: 'flop', players: reset, communityCards: state.deck.slice(0, 3), deck: state.deck.slice(3), currentBet: 0, currentPlayerIndex: firstActive, lastAction: 'Flop distribué' };
    case 'flop': return { ...state, phase: 'turn', players: reset, communityCards: [...state.communityCards, state.deck[0]], deck: state.deck.slice(1), currentBet: 0, currentPlayerIndex: firstActive, lastAction: 'Turn distribué' };
    case 'turn': return { ...state, phase: 'river', players: reset, communityCards: [...state.communityCards, state.deck[0]], deck: state.deck.slice(1), currentBet: 0, currentPlayerIndex: firstActive, lastAction: 'River distribué' };
    case 'river': { const w = getWinner(state); return { ...state, phase: 'showdown', winnerId: w?.winnerId || null, winnerHandDescription: w?.description || '' }; }
    default: return state;
  }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'JOIN': {
      if (state.phase !== 'waiting' && state.phase !== 'showdown') return state;
      if (state.players.length >= MAX_PLAYERS || state.players.find((p) => p.id === action.playerId)) return state;
      return { ...state, players: [...state.players, { id: action.playerId, name: action.playerName, hand: [], chips: STARTING_CHIPS, currentBet: 0, folded: false, isBot: action.isBot || false, isAllIn: false }] };
    }
    case 'START_GAME': {
      if (state.players.length < MIN_PLAYERS) return state;
      return dealPhase({ ...state, roundNumber: state.roundNumber + 1, winnerId: null, winnerHandDescription: '' });
    }
    case 'CHECK': {
      if (state.phase === 'waiting' || state.phase === 'showdown' || state.phase === 'game_over') return state;
      const pi = state.players.findIndex((p) => p.id === action.playerId);
      if (pi !== state.currentPlayerIndex || state.players[pi].folded) return state;
      if (state.currentBet > state.players[pi].currentBet) return state;
      const nextIdx = getNextActivePlayerIndex(pi, state.players);
      const ns = { ...state, currentPlayerIndex: nextIdx, lastAction: `${state.players[pi].name} check` };
      if (nextIdx <= pi || allBetsEqual(state.players)) return advancePhase(ns);
      return ns;
    }
    case 'BET': {
      if (state.phase === 'waiting' || state.phase === 'showdown' || state.phase === 'game_over') return state;
      const pi = state.players.findIndex((p) => p.id === action.playerId);
      if (pi !== state.currentPlayerIndex || state.players[pi].folded || state.currentBet > 0) return state;
      const amount = Math.min(action.amount, state.players[pi].chips);
      const up = [...state.players];
      up[pi] = { ...up[pi], chips: up[pi].chips - amount, currentBet: amount, isAllIn: up[pi].chips - amount === 0 };
      return { ...state, players: up, pot: state.pot + amount, currentBet: amount, currentPlayerIndex: getNextActivePlayerIndex(pi, up), lastAction: `${up[pi].name} mise ${amount}` };
    }
    case 'CALL': {
      if (state.phase === 'waiting' || state.phase === 'showdown' || state.phase === 'game_over') return state;
      const pi = state.players.findIndex((p) => p.id === action.playerId);
      if (pi !== state.currentPlayerIndex || state.players[pi].folded) return state;
      const toCall = Math.min(state.currentBet - state.players[pi].currentBet, state.players[pi].chips);
      const up = [...state.players];
      up[pi] = { ...up[pi], chips: up[pi].chips - toCall, currentBet: up[pi].currentBet + toCall, isAllIn: up[pi].chips - toCall === 0 };
      const ns = { ...state, players: up, pot: state.pot + toCall, currentPlayerIndex: getNextActivePlayerIndex(pi, up), lastAction: `${up[pi].name} suit ${toCall}` };
      if (allBetsEqual(up)) return advancePhase(ns);
      return ns;
    }
    case 'FOLD': {
      if (state.phase === 'waiting' || state.phase === 'showdown' || state.phase === 'game_over') return state;
      const pi = state.players.findIndex((p) => p.id === action.playerId);
      if (pi !== state.currentPlayerIndex) return state;
      const up = [...state.players];
      up[pi] = { ...up[pi], folded: true };
      const nf = up.filter((p) => !p.folded);
      if (nf.length === 1) return { ...state, players: up, phase: 'showdown', winnerId: nf[0].id, winnerHandDescription: 'Seul joueur restant', lastAction: `${up[pi].name} se couche` };
      const ns = { ...state, players: up, currentPlayerIndex: getNextActivePlayerIndex(pi, up), lastAction: `${up[pi].name} se couche` };
      if (allBetsEqual(up)) return advancePhase(ns);
      return ns;
    }
    case 'RAISE': {
      if (state.phase === 'waiting' || state.phase === 'showdown' || state.phase === 'game_over') return state;
      const pi = state.players.findIndex((p) => p.id === action.playerId);
      if (pi !== state.currentPlayerIndex || state.players[pi].folded) return state;
      const totalBet = Math.min(action.amount, state.players[pi].chips + state.players[pi].currentBet);
      const additional = totalBet - state.players[pi].currentBet;
      const up = [...state.players];
      up[pi] = { ...up[pi], chips: up[pi].chips - additional, currentBet: totalBet, isAllIn: up[pi].chips - additional === 0 };
      return { ...state, players: up, pot: state.pot + additional, currentBet: totalBet, currentPlayerIndex: getNextActivePlayerIndex(pi, up), lastAction: `${up[pi].name} relance à ${totalBet}` };
    }
    case 'NEXT_PHASE': return advancePhase(state);
    case 'NEW_ROUND': {
      if (state.phase !== 'showdown') return state;
      const players = state.players.map((p) => (p.id === state.winnerId ? { ...p, chips: p.chips + state.pot, hand: [], currentBet: 0, folded: false, isAllIn: false } : { ...p, hand: [], currentBet: 0, folded: false, isAllIn: false }));
      const active = players.filter((p) => p.chips > 0);
      if (active.length <= 1) return { ...state, phase: 'game_over', players, winnerId: active[0]?.id || state.winnerId };
      return dealPhase({ ...state, players: active, dealerIndex: (state.dealerIndex + 1) % active.length, roundNumber: state.roundNumber + 1, pot: 0, winnerId: null, winnerHandDescription: '' });
    }
    case 'RESET': return initGame();
    default: return state;
  }
}

export function getCurrentPlayer(state: GameState): Player | null { return state.players[state.currentPlayerIndex] || null; }

/** Crée une partie vs bots prête à jouer (humain + N bots, déjà démarrée). */
export function newGame(botNames: string[] = ['Carlos', 'Maria']): GameState {
  let st = initGame();
  st = gameReducer(st, { type: 'JOIN', playerId: 'p0', playerName: 'Vous', isBot: false });
  botNames.slice(0, MAX_PLAYERS - 1).forEach((n, i) => { st = gameReducer(st, { type: 'JOIN', playerId: `bot-${i + 1}`, playerName: n, isBot: true }); });
  return gameReducer(st, { type: 'START_GAME' });
}

/** Personne ne peut plus agir (tous les non-couchés sont à tapis) → runout. */
function noActorsLeft(state: GameState): boolean {
  return state.players.filter((p) => !p.folded && !p.isAllIn).length === 0;
}

/** Pilote vs-bot : avance l'état (bot / runout / showdown→nouvelle manche). */
export function autoStep(state: GameState): { next: GameState; delay: number } | null {
  if (state.phase === 'game_over') return null;
  if (state.phase === 'showdown') return { next: gameReducer(state, { type: 'NEW_ROUND' }), delay: 2400 };
  if (noActorsLeft(state)) return { next: gameReducer(state, { type: 'NEXT_PHASE' }), delay: 900 };
  const cur = getCurrentPlayer(state);
  if (!cur || !cur.isBot) return null;
  const action = botPlay(state);
  if (!action) return null;
  return { next: gameReducer(state, action), delay: 950 };
}
