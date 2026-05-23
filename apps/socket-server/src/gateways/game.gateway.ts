/**
 * @file game.gateway.ts
 * @description Gateway de jeu AUTORITATIF multi-jeux (namespace /game).
 *
 * Le serveur fait foi pour Belote, Scopa et Tarot via un registre
 * d'adaptateurs (game/adapters.ts). Il distribue, valide chaque coup, joue les
 * bots et diffuse à chaque joueur une vue personnalisée. Permet une vraie
 * partie temps réel entre un joueur web et un joueur mobile dans la même room.
 *
 * Events entrants : game:join {roomCode, gameType?}, game:action {roomCode, action},
 *                   game:start {roomCode}, game:annonce, game:belote
 * Events sortants : game:state (vue perso), game:annonce:declared,
 *                   game:belote:declared, game:error
 */
import {
  WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection,
  OnGatewayDisconnect, MessageBody, ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server } from 'socket.io';
import { AuthenticatedSocket, createWsAuthMiddleware } from '../middleware/ws-auth.middleware';
import { getAdapter, GameAdapter, Human } from '../game/adapters';

interface RoomGame {
  code: string;
  gameType: string;
  adapter: GameAdapter;
  state: any;
  humans: Human[];
  socketByUser: Map<string, string>;
  timer?: NodeJS.Timeout;
  cleanupTimer?: NodeJS.Timeout;
}

@WebSocketGateway({ namespace: '/game', cors: { origin: '*' } })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(GameGateway.name);
  private readonly rooms = new Map<string, RoomGame>();
  private readonly EMPTY_ROOM_TTL = 5 * 60 * 1000;

  constructor(private readonly jwtService: JwtService) {}

  afterInit(server: Server) {
    server.use(createWsAuthMiddleware(this.jwtService));
    this.logger.log('GameGateway (multi-game authoritative) initialised');
  }

  handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`Client connected: ${client.id} (user: ${client.userId})`);
  }

  handleDisconnect(client: AuthenticatedSocket) {
    for (const room of this.rooms.values()) {
      if (room.socketByUser.get(client.userId) === client.id) {
        room.socketByUser.delete(client.userId);
        if (room.socketByUser.size === 0) this.scheduleRoomCleanup(room);
      }
    }
  }

  @SubscribeMessage('game:join')
  handleJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { roomCode: string; gameType?: string },
  ) {
    const code = (payload?.roomCode || '').toUpperCase();
    if (!code) { client.emit('game:error', { message: 'roomCode required' }); return; }
    client.join(code);

    let room = this.rooms.get(code);
    if (!room) {
      const gameType = (payload?.gameType || 'belote').toLowerCase();
      room = { code, gameType, adapter: getAdapter(gameType), state: null, humans: [], socketByUser: new Map() };
      this.rooms.set(code, room);
    }
    if (room.cleanupTimer) { clearTimeout(room.cleanupTimer); room.cleanupTimer = undefined; }
    room.socketByUser.set(client.userId, client.id);

    const seated = room.humans.find((h) => h.userId === client.userId);
    if (!seated && room.humans.length < room.adapter.maxHumans) {
      room.humans.push({ userId: client.userId, name: client.username || 'Joueur' });
      this.rebuild(room);
      this.logger.log(`${client.userId} seated in ${code} [${room.gameType}] (seat ${room.humans.length - 1})`);
    } else if (!room.state) {
      this.rebuild(room);
    }

    this.broadcast(room);
    this.scheduleTick(room);
    return { ok: true, gameType: room.gameType, seat: room.humans.findIndex((h) => h.userId === client.userId) };
  }

  @SubscribeMessage('game:action')
  handleAction(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { roomCode: string; action: any },
  ) {
    const room = this.rooms.get((payload?.roomCode || '').toUpperCase());
    if (!room || !room.state) return;
    const next = room.adapter.applyAction(room.state, client.userId, payload?.action || {});
    if (next === room.state) return;
    room.state = next;
    this.broadcast(room);
    this.scheduleTick(room);
  }

  @SubscribeMessage('game:start')
  handleStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { roomCode: string },
  ) {
    const room = this.rooms.get((payload?.roomCode || '').toUpperCase());
    if (!room) return;
    this.rebuild(room);
    this.broadcast(room);
    this.scheduleTick(room);
  }

  @SubscribeMessage('game:annonce')
  handleAnnonce(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { roomId: string; annonces: any[] },
  ) {
    const roomId = (payload?.roomId || '').toUpperCase();
    if (!roomId || !Array.isArray(payload?.annonces)) return;
    this.server.to(roomId).emit('game:annonce:declared', { playerId: client.userId, annonces: payload.annonces });
  }

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
  private rebuild(room: RoomGame) {
    if (room.humans.length === 0) return;
    room.state = room.adapter.build(room.humans);
  }

  private broadcast(room: RoomGame) {
    if (!room.state) return;
    for (const h of room.humans) {
      const sid = room.socketByUser.get(h.userId);
      if (sid) this.server.to(sid).emit('game:state', room.adapter.view(room.state, h.userId));
    }
  }

  private scheduleTick(room: RoomGame) {
    if (room.timer) { clearTimeout(room.timer); room.timer = undefined; }
    if (!room.state) return;
    const peek = room.adapter.advance(room.state);
    if (!peek) return;
    room.timer = setTimeout(() => {
      const adv = room.adapter.advance(room.state);
      if (adv) { room.state = adv.next; this.broadcast(room); }
      this.scheduleTick(room);
    }, peek.delay);
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
