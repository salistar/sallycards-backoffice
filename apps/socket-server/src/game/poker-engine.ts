/**
 * @file apps/socket-server/src/game/poker-engine.ts
 * @description Moteur Poker Texas Hold'em No-Limit autoritatif serveur (paquet
 *   espagnol 40 cartes, 2-4 sièges). Le serveur distribue, gère les enchères et
 *   le showdown, et ne révèle JAMAIS les cartes privées des autres (sauf abattage).
 */
export type Suit = 'bastos' | 'copas' | 'espadas' | 'oros';
export type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 10 | 11 | 12;
export interface Card { suit: Suit; value: CardValue; id: string }
export interface Player { id: string; name: string; hand: Card[]; chips: number; currentBet: number; folded: boolean; isBot: boolean; isAllIn: boolean }
export type GamePhase = 'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | 'game_over';
export type HandRank = 'high_card' | 'pair' | 'two_pair' | 'three_of_a_kind' | 'straight' | 'flush' | 'full_house' | 'four_of_a_kind' | 'straight_flush';
const HAND_RANK_VALUES: Record<HandRank, number> = { high_card: 0, pair: 1, two_pair: 2, three_of_a_kind: 3, straight: 4, flush: 5, full_house: 6, four_of_a_kind: 7, straight_flush: 8 };
interface HandEvaluation { rank: HandRank; rankValue: number; highCards: number[]; description: string }
export interface GameState { phase: GamePhase; players: Player[]; communityCards: Card[]; deck: Card[]; pot: number; currentBet: number; dealerIndex: number; currentPlayerIndex: number; roundNumber: number; winnerId: string | null; winnerHandDescription: string; lastAction: string; smallBlind: number; bigBlind: number }
type GameAction =
  | { type: 'JOIN'; playerId: string; playerName: string; isBot?: boolean } | { type: 'START_GAME' }
  | { type: 'CHECK'; playerId: string } | { type: 'BET'; playerId: string; amount: number } | { type: 'CALL'; playerId: string }
  | { type: 'FOLD'; playerId: string } | { type: 'RAISE'; playerId: string; amount: number } | { type: 'NEXT_PHASE' } | { type: 'NEW_ROUND' };

const SUITS: Suit[] = ['bastos', 'copas', 'espadas', 'oros'];
const VALUES: CardValue[] = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
const STARTING_CHIPS = 1000, SMALL_BLIND = 10, BIG_BLIND = 20, MAX_PLAYERS = 4;
const STRAIGHT_MAP: Record<CardValue, number> = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 10: 8, 11: 9, 12: 10 };
const SUIT_NAMES: Record<Suit, string> = { bastos: 'Bâtons', copas: 'Coupes', espadas: 'Épées', oros: 'Deniers' };
const VALUE_NAMES: Record<CardValue, string> = { 1: 'As', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 10: 'Sota', 11: 'Caballo', 12: 'Rey' };

function createDeck(): Card[] { const d: Card[] = []; for (const s of SUITS) for (const v of VALUES) d.push({ suit: s, value: v, id: `${v.toString().padStart(2, '0')}-${s}` }); return d; }
function shuffleDeck(deck: Card[]): Card[] { const s = [...deck]; for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [s[i], s[j]] = [s[j], s[i]]; } return s; }

function getValueCounts(cards: Card[]) { const m = new Map<CardValue, number>(); for (const c of cards) m.set(c.value, (m.get(c.value) || 0) + 1); return m; }
function getSuitCounts(cards: Card[]) { const m = new Map<Suit, number>(); for (const c of cards) m.set(c.suit, (m.get(c.suit) || 0) + 1); return m; }
function isFlush(cards: Card[]): Suit | null { for (const [s, c] of getSuitCounts(cards)) if (c >= 5) return s; return null; }
function findStraight(cards: Card[]): number | null {
  const mapped = [...new Set(cards.map((c) => STRAIGHT_MAP[c.value]))].sort((a, b) => b - a);
  if (mapped.includes(1)) mapped.unshift(11);
  for (let i = 0; i <= mapped.length - 5; i++) { let ok = true; for (let j = 1; j < 5; j++) if (mapped[i] - mapped[i + j] !== j) { ok = false; break; } if (ok) return mapped[i]; }
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
  const vc = getValueCounts(cards); const flushSuit = isFlush(cards); const sh = findStraight(cards);
  const counts = Array.from(vc.entries()).sort((a, b) => b[1] - a[1] || STRAIGHT_MAP[b[0]] - STRAIGHT_MAP[a[0]]);
  const sv = cards.map((c) => STRAIGHT_MAP[c.value]).sort((a, b) => b - a);
  if (flushSuit && sh) { const fc = cards.filter((c) => c.suit === flushSuit); const fs = findStraight(fc); if (fs) return { rank: 'straight_flush', rankValue: 8, highCards: [fs], description: `Quinte flush, ${fs} haute` }; }
  if (counts[0][1] === 4) return { rank: 'four_of_a_kind', rankValue: 7, highCards: [STRAIGHT_MAP[counts[0][0]], counts[1] ? STRAIGHT_MAP[counts[1][0]] : 0], description: `Carré de ${VALUE_NAMES[counts[0][0]]}` };
  if (counts[0][1] === 3 && counts[1] && counts[1][1] >= 2) return { rank: 'full_house', rankValue: 6, highCards: [STRAIGHT_MAP[counts[0][0]], STRAIGHT_MAP[counts[1][0]]], description: `Full ${VALUE_NAMES[counts[0][0]]} par ${VALUE_NAMES[counts[1][0]]}` };
  if (flushSuit) { const fc = cards.filter((c) => c.suit === flushSuit).map((c) => STRAIGHT_MAP[c.value]).sort((a, b) => b - a).slice(0, 5); return { rank: 'flush', rankValue: 5, highCards: fc, description: `Couleur (${SUIT_NAMES[flushSuit]})` }; }
  if (sh) return { rank: 'straight', rankValue: 4, highCards: [sh], description: `Quinte, ${sh} haute` };
  if (counts[0][1] === 3) { const k = counts.slice(1).map((c) => STRAIGHT_MAP[c[0]]).sort((a, b) => b - a); return { rank: 'three_of_a_kind', rankValue: 3, highCards: [STRAIGHT_MAP[counts[0][0]], ...k], description: `Brelan de ${VALUE_NAMES[counts[0][0]]}` }; }
  if (counts[0][1] === 2 && counts[1] && counts[1][1] === 2) { const hi = Math.max(STRAIGHT_MAP[counts[0][0]], STRAIGHT_MAP[counts[1][0]]); const lo = Math.min(STRAIGHT_MAP[counts[0][0]], STRAIGHT_MAP[counts[1][0]]); const k = counts[2] ? STRAIGHT_MAP[counts[2][0]] : 0; return { rank: 'two_pair', rankValue: 2, highCards: [hi, lo, k], description: `Double paire ${VALUE_NAMES[counts[0][0]]} & ${VALUE_NAMES[counts[1][0]]}` }; }
  if (counts[0][1] === 2) { const k = counts.slice(1).map((c) => STRAIGHT_MAP[c[0]]).sort((a, b) => b - a); return { rank: 'pair', rankValue: 1, highCards: [STRAIGHT_MAP[counts[0][0]], ...k], description: `Paire de ${VALUE_NAMES[counts[0][0]]}` }; }
  return { rank: 'high_card', rankValue: 0, highCards: sv, description: 'Carte haute' };
}
function compareHands(a: HandEvaluation, b: HandEvaluation): number { if (a.rankValue !== b.rankValue) return a.rankValue - b.rankValue; for (let i = 0; i < Math.min(a.highCards.length, b.highCards.length); i++) if (a.highCards[i] !== b.highCards[i]) return a.highCards[i] - b.highCards[i]; return 0; }
function evaluateHand(hand: Card[], community: Card[]): HandEvaluation { const all = [...hand, ...community]; if (all.length < 5) return evaluateFiveCards(all.length >= 5 ? all.slice(0, 5) : [...all, ...Array(5 - all.length).fill(all[0])]); return evaluateFiveCards(getBestFiveCardHand(all)); }

function getNonFolded(players: Player[]): Player[] { return players.filter((p) => !p.folded); }
function getNextActive(cur: number, players: Player[]): number { let n = (cur + 1) % players.length, c = 0; while ((players[n].folded || players[n].isAllIn) && c < players.length) { n = (n + 1) % players.length; c++; } return n; }
function allBetsEqual(players: Player[]): boolean { const a = players.filter((p) => !p.folded && !p.isAllIn); if (a.length <= 1) return true; const t = a[0].currentBet; return a.every((p) => p.currentBet === t); }
function getWinner(state: GameState): { winnerId: string; description: string } | null {
  const nf = getNonFolded(state.players); if (nf.length === 0) return null;
  if (nf.length === 1) return { winnerId: nf[0].id, description: 'Seul joueur restant' };
  let bp = nf[0], be = evaluateHand(bp.hand, state.communityCards);
  for (let i = 1; i < nf.length; i++) { const e = evaluateHand(nf[i].hand, state.communityCards); if (compareHands(e, be) > 0) { be = e; bp = nf[i]; } }
  return { winnerId: bp.id, description: be.description };
}
function botPlay(state: GameState): GameAction | null {
  const p = state.players[state.currentPlayerIndex];
  if (!p || !p.isBot || p.folded) return null;
  const hs = evaluateHand(p.hand, state.communityCards); const toCall = state.currentBet - p.currentBet;
  if (hs.rankValue >= HAND_RANK_VALUES.three_of_a_kind) { const r = Math.min(state.bigBlind * 3 + state.currentBet, p.chips + p.currentBet); return r > state.currentBet ? { type: 'RAISE', playerId: p.id, amount: r } : { type: 'CALL', playerId: p.id }; }
  if (hs.rankValue >= HAND_RANK_VALUES.pair) { if (toCall === 0) return Math.random() > 0.5 ? { type: 'BET', playerId: p.id, amount: state.bigBlind } : { type: 'CHECK', playerId: p.id }; if (toCall <= state.bigBlind * 4) return { type: 'CALL', playerId: p.id }; return { type: 'FOLD', playerId: p.id }; }
  if (toCall === 0) return { type: 'CHECK', playerId: p.id };
  if (toCall <= state.bigBlind && Math.random() > 0.4) return { type: 'CALL', playerId: p.id };
  if (Math.random() > 0.85) return { type: 'CALL', playerId: p.id };
  return { type: 'FOLD', playerId: p.id };
}
function initGame(): GameState { return { phase: 'waiting', players: [], communityCards: [], deck: [], pot: 0, currentBet: 0, dealerIndex: 0, currentPlayerIndex: 0, roundNumber: 0, winnerId: null, winnerHandDescription: '', lastAction: '', smallBlind: SMALL_BLIND, bigBlind: BIG_BLIND }; }
function dealPhase(state: GameState): GameState {
  const deck = shuffleDeck(createDeck()); let di = 0;
  const players = state.players.map((p) => ({ ...p, hand: [deck[di++], deck[di++]], currentBet: 0, folded: false, isAllIn: false }));
  const remaining = deck.slice(di);
  const sb = (state.dealerIndex + 1) % players.length, bb = (state.dealerIndex + 2) % players.length;
  const sbA = Math.min(state.smallBlind, players[sb].chips), bbA = Math.min(state.bigBlind, players[bb].chips);
  players[sb] = { ...players[sb], chips: players[sb].chips - sbA, currentBet: sbA, isAllIn: players[sb].chips - sbA === 0 };
  players[bb] = { ...players[bb], chips: players[bb].chips - bbA, currentBet: bbA, isAllIn: players[bb].chips - bbA === 0 };
  return { ...state, phase: 'preflop', players, deck: remaining, communityCards: [], pot: sbA + bbA, currentBet: bbA, currentPlayerIndex: (bb + 1) % players.length, lastAction: 'Blinds postées' };
}
function advancePhase(state: GameState): GameState {
  const nf = getNonFolded(state.players);
  if (nf.length <= 1) { const w = getWinner(state); return { ...state, phase: 'showdown', winnerId: w?.winnerId || null, winnerHandDescription: w?.description || '' }; }
  const reset = state.players.map((p) => ({ ...p, currentBet: 0 })); const fa = getNextActive(state.dealerIndex, reset);
  switch (state.phase) {
    case 'preflop': return { ...state, phase: 'flop', players: reset, communityCards: state.deck.slice(0, 3), deck: state.deck.slice(3), currentBet: 0, currentPlayerIndex: fa, lastAction: 'Flop' };
    case 'flop': return { ...state, phase: 'turn', players: reset, communityCards: [...state.communityCards, state.deck[0]], deck: state.deck.slice(1), currentBet: 0, currentPlayerIndex: fa, lastAction: 'Turn' };
    case 'turn': return { ...state, phase: 'river', players: reset, communityCards: [...state.communityCards, state.deck[0]], deck: state.deck.slice(1), currentBet: 0, currentPlayerIndex: fa, lastAction: 'River' };
    case 'river': { const w = getWinner(state); return { ...state, phase: 'showdown', winnerId: w?.winnerId || null, winnerHandDescription: w?.description || '' }; }
    default: return state;
  }
}
function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'JOIN': { if (state.players.length >= MAX_PLAYERS || state.players.find((p) => p.id === action.playerId)) return state; return { ...state, players: [...state.players, { id: action.playerId, name: action.playerName, hand: [], chips: STARTING_CHIPS, currentBet: 0, folded: false, isBot: action.isBot || false, isAllIn: false }] }; }
    case 'START_GAME': { if (state.players.length < 2) return state; return dealPhase({ ...state, roundNumber: state.roundNumber + 1 }); }
    case 'CHECK': { if (!['preflop', 'flop', 'turn', 'river'].includes(state.phase)) return state; const pi = state.players.findIndex((p) => p.id === action.playerId); if (pi !== state.currentPlayerIndex || state.players[pi].folded) return state; if (state.currentBet > state.players[pi].currentBet) return state; const ni = getNextActive(pi, state.players); const ns = { ...state, currentPlayerIndex: ni, lastAction: `${state.players[pi].name} check` }; return (ni <= pi || allBetsEqual(state.players)) ? advancePhase(ns) : ns; }
    case 'BET': { if (!['preflop', 'flop', 'turn', 'river'].includes(state.phase)) return state; const pi = state.players.findIndex((p) => p.id === action.playerId); if (pi !== state.currentPlayerIndex || state.players[pi].folded || state.currentBet > 0) return state; const amt = Math.min(action.amount, state.players[pi].chips); const up = [...state.players]; up[pi] = { ...up[pi], chips: up[pi].chips - amt, currentBet: amt, isAllIn: up[pi].chips - amt === 0 }; return { ...state, players: up, pot: state.pot + amt, currentBet: amt, currentPlayerIndex: getNextActive(pi, up), lastAction: `${up[pi].name} mise ${amt}` }; }
    case 'CALL': { if (!['preflop', 'flop', 'turn', 'river'].includes(state.phase)) return state; const pi = state.players.findIndex((p) => p.id === action.playerId); if (pi !== state.currentPlayerIndex || state.players[pi].folded) return state; const toCall = Math.min(state.currentBet - state.players[pi].currentBet, state.players[pi].chips); const up = [...state.players]; up[pi] = { ...up[pi], chips: up[pi].chips - toCall, currentBet: up[pi].currentBet + toCall, isAllIn: up[pi].chips - toCall === 0 }; const ns = { ...state, players: up, pot: state.pot + toCall, currentPlayerIndex: getNextActive(pi, up), lastAction: `${up[pi].name} suit ${toCall}` }; return allBetsEqual(up) ? advancePhase(ns) : ns; }
    case 'FOLD': { if (!['preflop', 'flop', 'turn', 'river'].includes(state.phase)) return state; const pi = state.players.findIndex((p) => p.id === action.playerId); if (pi !== state.currentPlayerIndex) return state; const up = [...state.players]; up[pi] = { ...up[pi], folded: true }; const nf = up.filter((p) => !p.folded); if (nf.length === 1) return { ...state, players: up, phase: 'showdown', winnerId: nf[0].id, winnerHandDescription: 'Seul joueur restant', lastAction: `${up[pi].name} se couche` }; const ns = { ...state, players: up, currentPlayerIndex: getNextActive(pi, up), lastAction: `${up[pi].name} se couche` }; return allBetsEqual(up) ? advancePhase(ns) : ns; }
    case 'RAISE': { if (!['preflop', 'flop', 'turn', 'river'].includes(state.phase)) return state; const pi = state.players.findIndex((p) => p.id === action.playerId); if (pi !== state.currentPlayerIndex || state.players[pi].folded) return state; const total = Math.min(action.amount, state.players[pi].chips + state.players[pi].currentBet); const add = total - state.players[pi].currentBet; const up = [...state.players]; up[pi] = { ...up[pi], chips: up[pi].chips - add, currentBet: total, isAllIn: up[pi].chips - add === 0 }; return { ...state, players: up, pot: state.pot + add, currentBet: total, currentPlayerIndex: getNextActive(pi, up), lastAction: `${up[pi].name} relance à ${total}` }; }
    case 'NEXT_PHASE': return advancePhase(state);
    case 'NEW_ROUND': { if (state.phase !== 'showdown') return state; const players = state.players.map((p) => (p.id === state.winnerId ? { ...p, chips: p.chips + state.pot, hand: [], currentBet: 0, folded: false, isAllIn: false } : { ...p, hand: [], currentBet: 0, folded: false, isAllIn: false })); const active = players.filter((p) => p.chips > 0); if (active.length <= 1) return { ...state, phase: 'game_over', players, winnerId: active[0]?.id || state.winnerId }; return dealPhase({ ...state, players: active, dealerIndex: (state.dealerIndex + 1) % active.length, roundNumber: state.roundNumber + 1, pot: 0, winnerId: null, winnerHandDescription: '' }); }
    default: return state;
  }
}

// ── Interface adaptateur ──────────────────────────────────────────────────
export function buildPoker(seats: { id: string; name: string; isBot: boolean }[]): GameState {
  let st = initGame();
  for (const s of seats.slice(0, MAX_PLAYERS)) st = reducer(st, { type: 'JOIN', playerId: s.id, playerName: s.name, isBot: s.isBot });
  return reducer(st, { type: 'START_GAME' });
}
export function pokerApply(st: GameState, seatId: string, a: any): GameState {
  if (!a?.type) return st;
  if (a.type === 'CHECK' || a.type === 'CALL' || a.type === 'FOLD') return reducer(st, { type: a.type, playerId: seatId });
  if (a.type === 'BET') return reducer(st, { type: 'BET', playerId: seatId, amount: Number(a.amount) || 0 });
  if (a.type === 'RAISE') return reducer(st, { type: 'RAISE', playerId: seatId, amount: Number(a.amount) || 0 });
  return st;
}
export function pokerAdvance(st: GameState): { next: GameState; delay: number } | null {
  if (st.phase === 'game_over') return null;
  if (st.phase === 'showdown') return { next: reducer(st, { type: 'NEW_ROUND' }), delay: 2600 };
  if (st.players.filter((p) => !p.folded && !p.isAllIn).length === 0) return { next: reducer(st, { type: 'NEXT_PHASE' }), delay: 900 };
  const cur = st.players[st.currentPlayerIndex];
  if (!cur || !cur.isBot) return null;
  const action = botPlay(st);
  if (!action) return null;
  return { next: reducer(st, action), delay: 1000 };
}
export function pokerCurrentId(st: GameState): string | null { return st.players[st.currentPlayerIndex]?.id ?? null; }
export function pokerIsOver(st: GameState): boolean { return st.phase === 'game_over'; }
export function pokerView(st: GameState, youId: string) {
  const reveal = st.phase === 'showdown' || st.phase === 'game_over';
  return {
    game: 'poker', youId, phase: st.phase, pot: st.pot, currentBet: st.currentBet, communityCards: st.communityCards,
    currentId: pokerCurrentId(st), dealerIndex: st.dealerIndex, roundNumber: st.roundNumber, lastAction: st.lastAction,
    winnerId: st.winnerId, winnerHandDescription: st.winnerHandDescription, smallBlind: st.smallBlind, bigBlind: st.bigBlind,
    players: st.players.map((p) => ({
      id: p.id, name: p.name, isBot: p.isBot, chips: p.chips, currentBet: p.currentBet, folded: p.folded, isAllIn: p.isAllIn,
      handCount: p.hand.length,
      hand: p.id === youId || (reveal && !p.folded) ? p.hand : undefined,
    })),
  };
}
