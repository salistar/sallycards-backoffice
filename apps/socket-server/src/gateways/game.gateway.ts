/**
 * @file game.gateway.ts
 * @description Gateway Belote AUTORITATIF (namespace /game).
 *
 * Le serveur fait foi : il distribue les cartes, valide chaque coup, joue les
 * bots et diffuse à chaque joueur une vue personnalisée de l'état (sa main
 * visible, celles des autres masquées). Permet une vraie partie temps réel
 * entre un joueur web et un joueur mobile dans la même room.
 *
 * Modèle de sièges (4 joueurs / 2 équipes) :
 *   siège 0 = 1er humain (équipe A) · siège 1 = 2e humain ou bot (équipe B)
 *   siège 2 = bot (équipe A) · siège 3 = bot (équipe B)
 * → web (siège 0) contre mobile (siège 1), chacun avec un bot partenaire.
 *
 * Events entrants  : game:join {roomCode}, game:action {roomCode, action},
 *                    game:start {roomCode} (revanche), game:annonce, game:belote
 * Events sortants  : game:state (vue perso), game:annonce:declared,
 *                    game:belote:declared, game:error
 */
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server } from 'socket.io';
import {
  AuthenticatedSocket,
  createWsAuthMiddleware,
} from '../middleware/ws-auth.middleware';
import * as Belote from '../game/belote-engine';

interface RoomGame {
  code: string;
  state: Belote.GameState;
  humans: { userId: string; name: string }[]; // ordre d'arrivée, 2 sièges max
  socketByUser: Map<string, string>; // userId → socketId courant
  timer?: NodeJS.Timeout;
  cleanupTimer?: NodeJS.Timeout;
}

@WebSocketGateway({ namespace: '/game', cors: { origin: '*' } })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(GameGateway.name);
  private readonly rooms = new Map<string, RoomGame>();
  private readonly BOT_DELAY = 900;
  private readonly EMPTY_ROOM_TTL = 5 * 60 * 1000;

  constructor(private readonly jwtService: JwtService) {}

  afterInit(server: Server) {
    server.use(createWsAuthMiddleware(this.jwtService));
    this.logger.log('GameGateway (belote authoritative) initialised');
  }

  handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`Client connected: ${client.id} (user: ${client.userId})`);
  }

  handleDisconnect(client: AuthenticatedSocket) {
    for (const room of this.rooms.values()) {
      if (room.socketByUser.get(client.userId) === client.id) {
        room.socketByUser.delete(client.userId);
        this.logger.log(`${client.userId} disconnected from ${room.code}`);
        if (room.socketByUser.size === 0) this.scheduleRoomCleanup(room);
      }
    }
  }

  // ── game:join ───────────────────────────────────────────────────────
  @SubscribeMessage('game:join')
  handleJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { roomCode: string },
  ) {
    const code = (payload?.roomCode || '').toUpperCase();
    if (!code) {
      client.emit('game:error', { message: 'roomCode required' });
      return;
    }
    client.join(code);

    let room = this.rooms.get(code);
    if (!room) {
      room = { code, state: Belote.createInitialState(), humans: [], socketByUser: new Map() };
      this.rooms.set(code, room);
    }
    if (room.cleanupTimer) { clearTimeout(room.cleanupTimer); room.cleanupTimer = undefined; }
    room.socketByUser.set(client.userId, client.id);

    const seated = room.humans.find((h) => h.userId === client.userId);
    if (!seated) {
      if (room.humans.length < 2) {
        room.humans.push({ userId: client.userId, name: client.username || 'Joueur' });
        this.rebuild(room); // nouvel effectif → nouvelle donne
        this.logger.log(`${client.userId} seated in ${code} (seat ${room.humans.length - 1})`);
      }
      // sinon : spectateur (room déjà pleine de 2 humains)
    } else if (room.state.phase === 'waiting') {
      this.rebuild(room);
    }

    this.broadcast(room);
    this.scheduleTick(room);
    const seat = room.humans.findIndex((h) => h.userId === client.userId);
    return { ok: true, seat, players: room.state.players.length };
  }

  // ── game:action (PLAY_CARD / BID) ───────────────────────────────────
  @SubscribeMessage('game:action')
  handleAction(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { roomCode: string; action: any },
  ) {
    const code = (payload?.roomCode || '').toUpperCase();
    const room = this.rooms.get(code);
    if (!room) return;

    const seatIdx = room.state.players.findIndex((p) => p.id === client.userId);
    if (seatIdx < 0) return; // pas assis
    if (seatIdx !== room.state.currentPlayerIndex) return; // pas son tour

    const a = payload?.action || {};
    let next = room.state;
    if (a.type === 'BID') {
      next = Belote.gameReducer(room.state, { type: 'BID', playerId: client.userId, suit: a.suit ?? null });
    } else if (a.type === 'PLAY_CARD') {
      next = Belote.gameReducer(room.state, { type: 'PLAY_CARD', playerId: client.userId, cardId: a.cardId });
    } else {
      return;
    }
    if (next === room.state) return; // coup invalide : aucun changement
    room.state = next;
    this.broadcast(room);
    this.scheduleTick(room);
  }

  // ── game:start (revanche / nouvelle donne) ──────────────────────────
  @SubscribeMessage('game:start')
  handleStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { roomCode: string },
  ) {
    const code = (payload?.roomCode || '').toUpperCase();
    const room = this.rooms.get(code);
    if (!room) return;
    this.rebuild(room);
    this.broadcast(room);
    this.scheduleTick(room);
  }

  // ── game:annonce (relay) ────────────────────────────────────────────
  @SubscribeMessage('game:annonce')
  handleAnnonce(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { roomId: string; annonces: Array<{ type: string; points: number }> },
  ) {
    const roomId = (payload?.roomId || '').toUpperCase();
    if (!roomId || !Array.isArray(payload?.annonces)) return;
    this.server.to(roomId).emit('game:annonce:declared', { playerId: client.userId, annonces: payload.annonces });
  }

  // ── game:belote (relay) ─────────────────────────────────────────────
  @SubscribeMessage('game:belote')
  handleBelote(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { roomId: string; type: 'belote' | 'rebelote' },
  ) {
    const roomId = (payload?.roomId || '').toUpperCase();
    if (!roomId || (payload.type !== 'belote' && payload.type !== 'rebelote')) return;
    this.server.to(roomId).emit('game:belote:declared', { playerId: client.userId, type: payload.type });
  }

  // ── Helpers ─────────────────────────────────────────────────────────

  private seatsFor(room: RoomGame): { id: string; name: string; isBot: boolean }[] {
    const h0 = room.humans[0];
    const h1 = room.humans[1];
    return [
      h0 ? { id: h0.userId, name: h0.name, isBot: false } : { id: 'bot-0', name: 'Bot Sud', isBot: true },
      h1 ? { id: h1.userId, name: h1.name, isBot: false } : { id: 'bot-1', name: 'Bot Est', isBot: true },
      { id: 'bot-2', name: 'Bot Nord', isBot: true },
      { id: 'bot-3', name: 'Bot Ouest', isBot: true },
    ];
  }

  private rebuild(room: RoomGame) {
    if (room.humans.length === 0) return;
    room.state = Belote.buildGame(this.seatsFor(room));
  }

  private broadcast(room: RoomGame) {
    for (const h of room.humans) {
      const sid = room.socketByUser.get(h.userId);
      if (sid) this.server.to(sid).emit('game:state', Belote.viewFor(room.state, h.userId));
    }
  }

  /** Joue les bots + avance trick_end/round_end jusqu'au tour d'un humain. */
  private scheduleTick(room: RoomGame) {
    if (room.timer) { clearTimeout(room.timer); room.timer = undefined; }
    const st = room.state;
    if (st.phase === 'game_over' || st.phase === 'waiting') return;

    if (st.phase === 'trick_end') {
      room.timer = setTimeout(() => {
        room.state = Belote.gameReducer(room.state, { type: 'NEXT_TRICK' });
        this.broadcast(room);
        this.scheduleTick(room);
      }, 1100);
      return;
    }
    if (st.phase === 'round_end') {
      room.timer = setTimeout(() => {
        room.state = Belote.gameReducer(room.state, { type: 'NEW_ROUND' });
        this.broadcast(room);
        this.scheduleTick(room);
      }, 1600);
      return;
    }

    const cur = Belote.getCurrentPlayer(st);
    if (!cur || !cur.isBot) return; // tour d'un humain → on attend son action

    room.timer = setTimeout(() => {
      const c = Belote.getCurrentPlayer(room.state);
      if (!c || !c.isBot) { this.scheduleTick(room); return; }
      try {
        if (room.state.phase === 'bidding') {
          const suit = Belote.botBid(c, room.state.bids);
          room.state = Belote.gameReducer(room.state, { type: 'BID', playerId: c.id, suit });
        } else if (room.state.phase === 'playing') {
          const { cardId } = Belote.botPlay(room.state);
          room.state = Belote.gameReducer(room.state, { type: 'PLAY_CARD', playerId: c.id, cardId });
        }
      } catch (err) {
        this.logger.warn(`bot move failed in ${room.code}: ${err instanceof Error ? err.message : err}`);
      }
      this.broadcast(room);
      this.scheduleTick(room);
    }, this.BOT_DELAY);
  }

  private scheduleRoomCleanup(room: RoomGame) {
    if (room.cleanupTimer) clearTimeout(room.cleanupTimer);
    room.cleanupTimer = setTimeout(() => {
      if (room.socketByUser.size === 0) {
        if (room.timer) clearTimeout(room.timer);
        this.rooms.delete(room.code);
        this.logger.log(`Room ${room.code} cleaned up (empty)`);
      }
    }, this.EMPTY_ROOM_TTL);
  }
}
