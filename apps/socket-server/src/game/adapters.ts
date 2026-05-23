/**
 * @file apps/socket-server/src/game/adapters.ts
 * @description Registre d'adaptateurs de jeux pour le gateway /game autoritatif.
 *   Chaque jeu (belote, scopa, tarot) fournit la même interface : build (donne +
 *   bots), vue personnalisée, application d'une action, avancement auto (bots /
 *   transitions), fin de partie. Le gateway devient agnostique au type de jeu.
 */
import * as Belote from './belote-engine';
import * as Scopa from './scopa-engine';
import * as Tarot from './tarot-engine';
import * as Okey from './okey-engine';
import * as Quiestce from './quiestce-engine';
import * as Kdoub from './kdoub-engine';
import * as Kantcopy from './kantcopy-engine';
import * as Concentration from './concentration-engine';
import * as Poker from './poker-engine';
import * as Ronda from './ronda-engine';
import { pickBots } from './bot-roster';

export interface Human { userId: string; name: string }

export interface GameAdapter {
  seatCount: number;
  maxHumans: number;
  build(humans: Human[]): any;
  view(state: any, youId: string): any;
  currentId(state: any): string | null;
  applyAction(state: any, userId: string, action: any): any;
  advance(state: any): { next: any; delay: number } | null;
  isOver(state: any): boolean;
}

function seatsFor(humans: Human[], count: number, gameType: string): { id: string; name: string; isBot: boolean }[] {
  const botCount = Math.max(0, count - humans.length);
  const names = pickBots(gameType, botCount);
  const seats: { id: string; name: string; isBot: boolean }[] = [];
  let bi = 0;
  for (let i = 0; i < count; i++) {
    const h = humans[i];
    seats.push(h ? { id: h.userId, name: h.name, isBot: false } : { id: `bot-${i}`, name: names[bi++] || `Bot ${i}`, isBot: true });
  }
  return seats;
}

const beloteAdapter: GameAdapter = {
  seatCount: 4, maxHumans: 2,
  build: (humans) => Belote.buildGame(seatsFor(humans, 4, 'belote')),
  view: (s, you) => Belote.viewFor(s, you),
  currentId: (s) => Belote.getCurrentPlayer(s)?.id ?? null,
  applyAction: (s, userId, a) => {
    const seat = s.players.findIndex((p: any) => p.id === userId);
    if (seat < 0 || seat !== s.currentPlayerIndex) return s;
    if (a?.type === 'BID') return Belote.gameReducer(s, { type: 'BID', playerId: userId, suit: a.suit ?? null });
    if (a?.type === 'PLAY_CARD') return Belote.gameReducer(s, { type: 'PLAY_CARD', playerId: userId, cardId: a.cardId });
    return s;
  },
  advance: (s) => {
    if (s.phase === 'game_over' || s.phase === 'waiting') return null;
    if (s.phase === 'trick_end') return { next: Belote.gameReducer(s, { type: 'NEXT_TRICK' }), delay: 1100 };
    if (s.phase === 'round_end') return { next: Belote.gameReducer(s, { type: 'NEW_ROUND' }), delay: 1600 };
    const cur = Belote.getCurrentPlayer(s);
    if (!cur || !cur.isBot) return null;
    if (s.phase === 'bidding') return { next: Belote.gameReducer(s, { type: 'BID', playerId: cur.id, suit: Belote.botBid(cur, s.bids) }), delay: 750 };
    if (s.phase === 'playing') { try { const { cardId } = Belote.botPlay(s); return { next: Belote.gameReducer(s, { type: 'PLAY_CARD', playerId: cur.id, cardId }), delay: 800 }; } catch { return null; } }
    return null;
  },
  isOver: (s) => s.phase === 'game_over',
};

const scopaAdapter: GameAdapter = {
  seatCount: 2, maxHumans: 2,
  build: (humans) => Scopa.buildScopa(seatsFor(humans, 2, 'scopa')),
  view: (s, you) => Scopa.scopaView(s, you),
  currentId: (s) => Scopa.scopaCurrentId(s),
  applyAction: (s, userId, a) => (a?.type === 'PLAY_CARD' ? Scopa.scopaPlay(s, userId, a.cardId) : s),
  advance: (s) => Scopa.scopaAdvance(s),
  isOver: (s) => Scopa.scopaIsOver(s),
};

const tarotAdapter: GameAdapter = {
  seatCount: 4, maxHumans: 4,
  build: (humans) => Tarot.buildTarot(seatsFor(humans, 4, 'tarot')),
  view: (s, you) => Tarot.tarotView(s, you),
  currentId: (s) => Tarot.tarotCurrentId(s),
  applyAction: (s, userId, a) => (a?.type === 'PLAY_CARD' ? Tarot.tarotPlay(s, userId, a.cardId) : s),
  advance: (s) => Tarot.tarotAdvance(s),
  isOver: (s) => Tarot.tarotIsOver(s),
};

const okeyAdapter: GameAdapter = {
  seatCount: 4, maxHumans: 4,
  build: (humans) => Okey.buildOkey(seatsFor(humans, 4, 'okey')),
  view: (s, you) => Okey.okeyView(s, you),
  currentId: (s) => Okey.okeyCurrentId(s),
  applyAction: (s, userId, a) => Okey.okeyApply(s, userId, a),
  advance: (s) => Okey.okeyAdvance(s),
  isOver: (s) => Okey.okeyIsOver(s),
};

const quiestceAdapter: GameAdapter = {
  seatCount: 2, maxHumans: 2,
  build: (humans) => Quiestce.buildQuiestce(seatsFor(humans, 2, 'quiestce')),
  view: (s, you) => Quiestce.quiestceView(s, you),
  currentId: (s) => Quiestce.quiestceCurrentId(s),
  applyAction: (s, userId, a) => Quiestce.quiestceApply(s, userId, a),
  advance: (s) => Quiestce.quiestceAdvance(s),
  isOver: (s) => Quiestce.quiestceIsOver(s),
};

const kdoubAdapter: GameAdapter = {
  seatCount: 4, maxHumans: 4,
  build: (humans) => Kdoub.buildKdoub(seatsFor(humans, 4, 'kdoub')),
  view: (s, you) => Kdoub.kdoubView(s, you),
  currentId: (s) => Kdoub.kdoubCurrentId(s),
  applyAction: (s, userId, a) => Kdoub.kdoubApply(s, userId, a),
  advance: (s) => Kdoub.kdoubAdvance(s),
  isOver: (s) => Kdoub.kdoubIsOver(s),
};

const kantcopyAdapter: GameAdapter = {
  seatCount: 4, maxHumans: 4,
  build: (humans) => Kantcopy.buildKantcopy(seatsFor(humans, 4, 'kantcopy')),
  view: (s, you) => Kantcopy.kantcopyView(s, you),
  currentId: (s) => Kantcopy.kantcopyCurrentId(s),
  applyAction: (s, userId, a) => Kantcopy.kantcopyApply(s, userId, a),
  advance: (s) => Kantcopy.kantcopyAdvance(s),
  isOver: (s) => Kantcopy.kantcopyIsOver(s),
};

const concentrationAdapter: GameAdapter = {
  seatCount: 4, maxHumans: 4,
  build: (humans) => Concentration.buildConcentration(seatsFor(humans, 4, 'concentration')),
  view: (s, you) => Concentration.concentrationView(s, you),
  currentId: (s) => Concentration.concentrationCurrentId(s),
  applyAction: (s, userId, a) => Concentration.concentrationApply(s, userId, a),
  advance: (s) => Concentration.concentrationAdvance(s),
  isOver: (s) => Concentration.concentrationIsOver(s),
};

const pokerAdapter: GameAdapter = {
  seatCount: 4, maxHumans: 4,
  build: (humans) => Poker.buildPoker(seatsFor(humans, 4, 'poker')),
  view: (s, you) => Poker.pokerView(s, you),
  currentId: (s) => Poker.pokerCurrentId(s),
  applyAction: (s, userId, a) => Poker.pokerApply(s, userId, a),
  advance: (s) => Poker.pokerAdvance(s),
  isOver: (s) => Poker.pokerIsOver(s),
};

const rondaAdapter: GameAdapter = {
  seatCount: 4, maxHumans: 4,
  build: (humans) => Ronda.buildRonda(seatsFor(humans, 4, 'ronda')),
  view: (s, you) => Ronda.rondaView(s, you),
  currentId: (s) => Ronda.rondaCurrentId(s),
  applyAction: (s, userId, a) => Ronda.rondaApply(s, userId, a),
  advance: (s) => Ronda.rondaAdvance(s),
  isOver: (s) => Ronda.rondaIsOver(s),
};

export const ADAPTERS: Record<string, GameAdapter> = {
  belote: beloteAdapter,
  scopa: scopaAdapter,
  tarot: tarotAdapter,
  okey: okeyAdapter,
  quiestce: quiestceAdapter,
  kdoub: kdoubAdapter,
  kantcopy: kantcopyAdapter,
  concentration: concentrationAdapter,
  poker: pokerAdapter,
  ronda: rondaAdapter,
};

export function getAdapter(gameType: string | undefined): GameAdapter {
  return ADAPTERS[(gameType || 'belote').toLowerCase()] || beloteAdapter;
}
