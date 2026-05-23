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

export const ADAPTERS: Record<string, GameAdapter> = {
  belote: beloteAdapter,
  scopa: scopaAdapter,
  tarot: tarotAdapter,
};

export function getAdapter(gameType: string | undefined): GameAdapter {
  return ADAPTERS[(gameType || 'belote').toLowerCase()] || beloteAdapter;
}
