/**
 * RoomBridgeGateway
 * ─────────────────
 * Pont temps réel entre l'API HTTP (qui persiste les rooms en MongoDB) et
 * les clients mobiles. Il :
 *   1. Abonne chaque client à la room socket.io `room:<code>` via
 *      l'événement `room:subscribe` (et se désabonne via `room:unsubscribe`).
 *   2. Écoute le channel Redis `sallycards:room` où l'API publie chaque
 *      mutation (create / join / leave / ready / started / closed) et
 *      relaie l'événement `room:updated` à tous les membres de la room
 *      correspondante.
 *
 * Remplace le poll HTTP toutes les 3 secondes côté mobile.
 */

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Server } from 'socket.io';
import Redis from 'ioredis';
import {
  AuthenticatedSocket,
  createWsAuthMiddleware,
} from '../middleware/ws-auth.middleware';

@WebSocketGateway({ namespace: '/lobby', cors: { origin: '*' } })
export class RoomBridgeGateway implements OnGatewayInit, OnModuleDestroy {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(RoomBridgeGateway.name);
  private redisSub?: Redis;

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async afterInit(server: Server) {
    server.use(createWsAuthMiddleware(this.jwtService));
    await this.startRedisBridge();
    this.logger.log('RoomBridgeGateway initialised');
  }

  async onModuleDestroy() {
    try { await this.redisSub?.quit(); } catch {}
  }

  private async startRedisBridge() {
    const url = this.config.get<string>('REDIS_URL') || 'redis://localhost:6379';
    this.redisSub = new Redis(url);
    this.redisSub.on('error', (e) => this.logger.error('Redis sub error', e));

    await this.redisSub.subscribe('sallycards:room');
    this.logger.log('Subscribed to Redis channel sallycards:room');

    this.redisSub.on('message', (_channel, raw) => {
      try {
        const evt = JSON.parse(raw);
        if (!evt?.code) return;
        const roomChan = `room:${evt.code}`;
        // Broadcast to every socket currently in the room socket.io channel.
        this.server.to(roomChan).emit('room:updated', {
          event: evt.event,
          room: evt.room,
          timestamp: evt.timestamp,
        });
        this.logger.log(
          `Relayed ${evt.event} to ${roomChan} (${evt.room?.playersCount ?? '?'} players)`,
        );
      } catch (e) {
        this.logger.warn(`Malformed Redis payload: ${e}`);
      }
    });
  }

  // ── Client subscribes to updates for a room code ────────────────────
  @SubscribeMessage('room:subscribe')
  subscribeToRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { code: string },
  ) {
    if (!payload?.code) return { error: 'code required' };
    const roomChan = `room:${payload.code.toUpperCase()}`;
    client.join(roomChan);
    this.logger.log(`${client.userId} subscribed to ${roomChan}`);
    return { ok: true, channel: roomChan };
  }

  @SubscribeMessage('room:unsubscribe')
  unsubscribeFromRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { code: string },
  ) {
    if (!payload?.code) return { error: 'code required' };
    const roomChan = `room:${payload.code.toUpperCase()}`;
    client.leave(roomChan);
    this.logger.log(`${client.userId} unsubscribed from ${roomChan}`);
    return { ok: true };
  }
}
