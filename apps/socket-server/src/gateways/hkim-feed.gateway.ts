/**
 * @file hkim-feed.gateway.ts
 * @description Fil d'actualité temps réel des "hkim".
 * Namespace /hkim. Quand un joueur termine un hkim, il émet
 * 'hkim:completed' → le serveur rediffuse 'hkim:feed' à TOUS.
 * Idem pour les commentaires ('hkim:comment').
 *
 * Pas de TURN/STUN : flux texte pur, Socket.IO suffit.
 */
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server } from 'socket.io';
import {
  AuthenticatedSocket,
  createWsAuthMiddleware,
} from '../middleware/ws-auth.middleware';

@WebSocketGateway({ namespace: '/hkim', cors: { origin: '*' } })
export class HkimFeedGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(HkimFeedGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  afterInit(server: Server) {
    server.use(createWsAuthMiddleware(this.jwtService));
    this.logger.log('HkimFeedGateway initialised (/hkim)');
  }

  handleConnection(client: AuthenticatedSocket) {
    this.logger.debug(`hkim feed connect: ${client.userId}`);
  }

  /** Un joueur a terminé un hkim → diffuser à tout le monde. */
  @SubscribeMessage('hkim:completed')
  onCompleted(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    body: {
      hkimId: string;
      name: string;
      from: string;
      to: string;
      distanceMeters?: number;
    },
  ) {
    const event = {
      hkimId: body?.hkimId,
      username: client.username || 'Joueur',
      userId: client.userId,
      name: body?.name || 'Hkim',
      from: body?.from || 'Départ',
      to: body?.to || 'Arrivée',
      distanceMeters: body?.distanceMeters || 0,
      completedAt: new Date().toISOString(),
    };
    this.server.emit('hkim:feed', event);
    this.logger.log(`hkim:feed ${event.username} ${event.name}`);
  }

  /** Commentaire sur un exploit → diffuser. */
  @SubscribeMessage('hkim:comment')
  onComment(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { hkimId: string; text: string },
  ) {
    const event = {
      hkimId: body?.hkimId,
      username: client.username || 'Joueur',
      userId: client.userId,
      text: String(body?.text || '').slice(0, 280),
      createdAt: new Date().toISOString(),
    };
    this.server.emit('hkim:comment', event);
  }
}
