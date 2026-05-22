/**
 * @file apps/socket-server/src/game/belote-engine.ts
 * @description Moteur Belote autoritatif côté serveur (pur-TS, sans dépendance).
 *   Identique au moteur client (web/mobile) pour des règles cohérentes :
 *   paquet espagnol 40 cartes, 4 joueurs / 2 équipes, enchères d'atout puis plis.
 *   Le serveur fait foi : il distribue, valide les coups, joue les bots et
 *   diffuse l'état (vue personnalisée par joueur).
 */

export type Suit = 'bastos' | 'copas' | 'espadas' | 'oros';
export type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 10 | 11 | 12;

export interface Card { suit: Suit; value: CardValue; id: string }
export interface Player { id: string; name: string; hand: Card[]; isBot: boolean; team: number }

export type GamePhase = 'waiting' | 'bidding' | 'playing' | 'trick_end' | 'round_end' | 'game_over';

export interface Trick { cards: { playerId: string; card: Card }[]; leadSuit: Suit; winnerId: string }
export interface Bid { playerId: string; suit: Suit | null }

export interface GameState {
  phase: GamePhase;
  players: Player[];
  currentPlayerIndex: number;
  deck: Card[];
  trumpSuit: Suit | null;
  bids: Bid[];
  bidWinnerId: string | null;
  currentTrick: { playerId: string; card: Card }[];
  tricks: Trick[];
  teamScores: [number, number];
  roundNumber: number;
  winnerId: string | null;
  targetScore: number;
  lastTrickWinner: string | null;
}

export type GameAction =
  | { type: 'JOIN'; playerId: string; playerName: string; isBot?: boolean; team: number }
  | { type: 'START_GAME' }
  | { type: 'BID'; playerId: string; suit: Suit | null }
  | { type: 'PLAY_CARD'; playerId: string; cardId: string }
  | { type: 'NEXT_TRICK' }
  | { type: 'NEW_ROUND' }
  | { type: 'RESET' };

export const SUITS: Suit[] = ['bastos', 'copas', 'espadas', 'oros'];
export const VALUES: CardValue[] = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
export const TRUMP_ORDER: CardValue[] = [2, 3, 4, 5, 6, 7, 10, 12, 1, 11];
export const NON_TRUMP_ORDER: CardValue[] = [2, 3, 4, 5, 6, 7, 10, 11, 12, 1];
export const PLAYERS_COUNT = 4;
export const CARDS_PER_PLAYER = 5;
export const DEFAULT_TARGET_SCORE = 10;

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({ suit, value, id: `${value.toString().padStart(2, '0')}-${suit}` });
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const s = [...deck];
  for (let i = s.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [s[i], s[j]] = [s[j], s[i]];
  }
  return s;
}

export function dealCards(players: Player[], deck: Card[]): { players: Player[]; remainingDeck: Card[] } {
  const shuffled = shuffleDeck(deck);
  let idx = 0;
  const updated = players.map((p) => {
    const hand = shuffled.slice(idx, idx + CARDS_PER_PLAYER);
    idx += CARDS_PER_PLAYER;
    return { ...p, hand };
  });
  return { players: updated, remainingDeck: shuffled.slice(idx) };
}

export function getCardStrength(card: Card, trumpSuit: Suit | null): number {
  const isTrump = card.suit === trumpSuit;
  const order = isTrump ? TRUMP_ORDER : NON_TRUMP_ORDER;
  const base = order.indexOf(card.value);
  return isTrump ? base + 100 : base;
}

export function getPlayableCards(hand: Card[], leadSuit: Suit | null, trumpSuit: Suit | null): Card[] {
  if (!leadSuit) return hand;
  const suitCards = hand.filter((c) => c.suit === leadSuit);
  if (suitCards.length > 0) return suitCards;
  if (trumpSuit) {
    const trumpCards = hand.filter((c) => c.suit === trumpSuit);
    if (trumpCards.length > 0) return trumpCards;
  }
  return hand;
}

export function resolveTrick(trick: { playerId: string; card: Card }[], trumpSuit: Suit | null): string {
  if (trick.length === 0) throw new Error('Empty trick');
  const leadSuit = trick[0].card.suit;
  let winnerId = trick[0].playerId;
  let winnerStrength = getCardStrength(trick[0].card, trumpSuit);
  let winnerIsTrump = trick[0].card.suit === trumpSuit;
  for (let i = 1; i < trick.length; i++) {
    const entry = trick[i];
    const isTrump = entry.card.suit === trumpSuit;
    const strength = getCardStrength(entry.card, trumpSuit);
    if (isTrump && !winnerIsTrump) {
      winnerId = entry.playerId; winnerStrength = strength; winnerIsTrump = true;
    } else if (isTrump === winnerIsTrump) {
      if (isTrump) {
        if (strength > winnerStrength) { winnerId = entry.playerId; winnerStrength = strength; }
      } else if (entry.card.suit === leadSuit && strength > winnerStrength) {
        winnerId = entry.playerId; winnerStrength = strength;
      } else if (entry.card.suit === leadSuit && trick[0].card.suit !== leadSuit) {
        winnerId = entry.playerId; winnerStrength = strength;
      }
    }
  }
  return winnerId;
}

export function botBid(bot: Player, bids: Bid[]): Suit | null {
  const counts: Record<Suit, number> = { bastos: 0, copas: 0, espadas: 0, oros: 0 };
  const strength: Record<Suit, number> = { bastos: 0, copas: 0, espadas: 0, oros: 0 };
  for (const card of bot.hand) { counts[card.suit]++; strength[card.suit] += TRUMP_ORDER.indexOf(card.value); }
  let bestSuit: Suit | null = null, bestCount = 0, bestStr = 0;
  for (const suit of SUITS) {
    if (counts[suit] > bestCount || (counts[suit] === bestCount && strength[suit] > bestStr)) {
      bestCount = counts[suit]; bestStr = strength[suit]; bestSuit = suit;
    }
  }
  if (bestCount >= 2 && bestStr >= 8) {
    if (!bids.some((b) => b.suit === bestSuit)) return bestSuit;
  }
  if (!bids.some((b) => b.suit !== null) && Math.random() < 0.3 && bestSuit) return bestSuit;
  return null;
}

export function botPlay(state: GameState): { cardId: string } {
  const bot = state.players[state.currentPlayerIndex];
  if (!bot || bot.hand.length === 0) throw new Error('Bot has no cards');
  const leadSuit = state.currentTrick.length > 0 ? state.currentTrick[0].card.suit : null;
  const playable = getPlayableCards(bot.hand, leadSuit, state.trumpSuit);
  if (playable.length === 1) return { cardId: playable[0].id };
  if (state.currentTrick.length === 0) {
    const nonTrump = playable.filter((c) => c.suit !== state.trumpSuit);
    if (nonTrump.length > 0) {
      const sorted = nonTrump.sort((a, b) => getCardStrength(b, state.trumpSuit) - getCardStrength(a, state.trumpSuit));
      return { cardId: sorted[0].id };
    }
  }
  if (state.currentTrick.length === PLAYERS_COUNT - 1) {
    const winner = resolveTrick(state.currentTrick, state.trumpSuit);
    const winnerTeam = state.players.find((p) => p.id === winner)?.team;
    if (winnerTeam === bot.team) {
      const sorted = playable.sort((a, b) => getCardStrength(a, state.trumpSuit) - getCardStrength(b, state.trumpSuit));
      return { cardId: sorted[0].id };
    }
  }
  if (state.currentTrick.length > 0) {
    const winStrength = Math.max(...state.currentTrick.map((e) => {
      if (e.card.suit === state.trumpSuit) return getCardStrength(e.card, state.trumpSuit);
      if (e.card.suit === state.currentTrick[0].card.suit) return getCardStrength(e.card, state.trumpSuit);
      return -1;
    }));
    const winners = playable.filter((c) => getCardStrength(c, state.trumpSuit) > winStrength);
    if (winners.length > 0) {
      winners.sort((a, b) => getCardStrength(a, state.trumpSuit) - getCardStrength(b, state.trumpSuit));
      return { cardId: winners[0].id };
    }
  }
  const sorted = playable.sort((a, b) => getCardStrength(a, state.trumpSuit) - getCardStrength(b, state.trumpSuit));
  return { cardId: sorted[0].id };
}

export function createInitialState(targetScore: number = DEFAULT_TARGET_SCORE): GameState {
  return {
    phase: 'waiting', players: [], currentPlayerIndex: 0, deck: [], trumpSuit: null,
    bids: [], bidWinnerId: null, currentTrick: [], tricks: [], teamScores: [0, 0],
    roundNumber: 0, winnerId: null, targetScore, lastTrickWinner: null,
  };
}

/**
 * Construit une partie à 4 sièges. `seats[i]` = { id, name, isBot }.
 * seat 0,2 → équipe 0 ; seat 1,3 → équipe 1. Distribue et démarre.
 */
export function buildGame(seats: { id: string; name: string; isBot: boolean }[], targetScore = DEFAULT_TARGET_SCORE): GameState {
  let s = createInitialState(targetScore);
  seats.slice(0, PLAYERS_COUNT).forEach((seat, i) => {
    s = gameReducer(s, { type: 'JOIN', playerId: seat.id, playerName: seat.name, isBot: seat.isBot, team: i % 2 });
  });
  s = gameReducer(s, { type: 'START_GAME' });
  return s;
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'JOIN': {
      if (state.phase !== 'waiting') return state;
      if (state.players.length >= PLAYERS_COUNT) return state;
      if (state.players.find((p) => p.id === action.playerId)) return state;
      const np: Player = { id: action.playerId, name: action.playerName, hand: [], isBot: action.isBot || false, team: action.team };
      return { ...state, players: [...state.players, np] };
    }
    case 'START_GAME': {
      if (state.players.length !== PLAYERS_COUNT) return state;
      const { players, remainingDeck } = dealCards(state.players, createDeck());
      return { ...state, phase: 'bidding', players, deck: remainingDeck, currentPlayerIndex: 0, bids: [], bidWinnerId: null, currentTrick: [], tricks: [], roundNumber: state.roundNumber + 1, lastTrickWinner: null };
    }
    case 'BID': {
      if (state.phase !== 'bidding') return state;
      const pIdx = state.players.findIndex((p) => p.id === action.playerId);
      if (pIdx !== state.currentPlayerIndex) return state;
      const newBids = [...state.bids, { playerId: action.playerId, suit: action.suit }];
      if (newBids.length >= PLAYERS_COUNT) {
        const winningBid = [...newBids].reverse().find((b) => b.suit !== null);
        if (!winningBid) {
          const fp = state.players[0];
          const counts: Record<Suit, number> = { bastos: 0, copas: 0, espadas: 0, oros: 0 };
          for (const card of fp.hand) counts[card.suit]++;
          const forced = SUITS.reduce((a, b) => (counts[a] >= counts[b] ? a : b));
          return { ...state, phase: 'playing', bids: newBids, trumpSuit: forced, bidWinnerId: fp.id, currentPlayerIndex: 0 };
        }
        return { ...state, phase: 'playing', bids: newBids, trumpSuit: winningBid.suit, bidWinnerId: winningBid.playerId, currentPlayerIndex: state.players.findIndex((p) => p.id === winningBid.playerId) };
      }
      return { ...state, bids: newBids, currentPlayerIndex: (state.currentPlayerIndex + 1) % PLAYERS_COUNT };
    }
    case 'PLAY_CARD': {
      if (state.phase !== 'playing') return state;
      const playerIndex = state.players.findIndex((p) => p.id === action.playerId);
      if (playerIndex !== state.currentPlayerIndex) return state;
      const player = state.players[playerIndex];
      const card = player.hand.find((c) => c.id === action.cardId);
      if (!card) return state;
      const leadSuit = state.currentTrick.length > 0 ? state.currentTrick[0].card.suit : null;
      const playable = getPlayableCards(player.hand, leadSuit, state.trumpSuit);
      if (!playable.some((c) => c.id === card.id)) return state;
      const newHand = player.hand.filter((c) => c.id !== card.id);
      const updated = [...state.players];
      updated[playerIndex] = { ...player, hand: newHand };
      const newTrick = [...state.currentTrick, { playerId: player.id, card }];
      if (newTrick.length >= PLAYERS_COUNT) {
        const winnerId = resolveTrick(newTrick, state.trumpSuit);
        const winnerTeam = updated.find((p) => p.id === winnerId)!.team;
        const newTricks = [...state.tricks, { cards: newTrick, leadSuit: newTrick[0].card.suit, winnerId }];
        const newScores: [number, number] = [...state.teamScores];
        newScores[winnerTeam] += 1;
        const allEmpty = updated.every((p) => p.hand.length === 0);
        if (allEmpty) {
          const wTeam = newScores[0] > newScores[1] ? 0 : newScores[1] > newScores[0] ? 1 : -1;
          if (wTeam !== -1 && newScores[wTeam] >= state.targetScore) {
            return { ...state, phase: 'game_over', players: updated, currentTrick: [], tricks: newTricks, teamScores: newScores, winnerId: `team-${wTeam}`, lastTrickWinner: winnerId };
          }
          return { ...state, phase: 'round_end', players: updated, currentTrick: [], tricks: newTricks, teamScores: newScores, lastTrickWinner: winnerId };
        }
        return { ...state, phase: 'trick_end', players: updated, currentTrick: newTrick, tricks: newTricks, teamScores: newScores, lastTrickWinner: winnerId };
      }
      return { ...state, players: updated, currentTrick: newTrick, currentPlayerIndex: (playerIndex + 1) % PLAYERS_COUNT };
    }
    case 'NEXT_TRICK': {
      if (state.phase !== 'trick_end') return state;
      const winnerIdx = state.players.findIndex((p) => p.id === state.lastTrickWinner);
      return { ...state, phase: 'playing', currentTrick: [], currentPlayerIndex: winnerIdx >= 0 ? winnerIdx : 0 };
    }
    case 'NEW_ROUND': {
      if (state.phase !== 'round_end') return state;
      const reset = state.players.map((p) => ({ ...p, hand: [] }));
      const { players, remainingDeck } = dealCards(reset, createDeck());
      return { ...state, phase: 'bidding', players, deck: remainingDeck, currentPlayerIndex: 0, trumpSuit: null, bids: [], bidWinnerId: null, currentTrick: [], tricks: [], roundNumber: state.roundNumber + 1, lastTrickWinner: null };
    }
    case 'RESET':
      return createInitialState(state.targetScore);
    default:
      return state;
  }
}

export function getCurrentPlayer(state: GameState): Player | null {
  if (state.currentPlayerIndex < 0 || state.currentPlayerIndex >= state.players.length) return null;
  return state.players[state.currentPlayerIndex];
}

/**
 * Vue personnalisée pour un joueur : sa main est visible, celles des autres
 * sont masquées (remplacées par des dos, on garde juste le nombre de cartes).
 * Ajoute `youId` pour que le client identifie son siège.
 */
export function viewFor(state: GameState, youId: string) {
  return {
    ...state,
    youId,
    players: state.players.map((p) =>
      p.id === youId
        ? p
        : { ...p, hand: p.hand.map((_, i) => ({ hidden: true, id: `hidden-${p.id}-${i}` })) },
    ),
  };
}
