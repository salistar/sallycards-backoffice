/**
 * @file solitaire-matches.gateway.ts
 * @description WebSocket Gateway pour Quick Match — alternative à SSE.
 *
 * STATUS : INACTIF par défaut. Pour activer :
 *   1. pnpm add @nestjs/websockets @nestjs/platform-socket.io socket.io
 *   2. Décommenter le code ci-dessous + l'ajouter dans solitaire-matches.module.ts (providers)
 *   3. Côté mobile : `import { io } from 'socket.io-client'; const sock = io(API_URL); sock.emit('match:join', { code });`
 *
 * Avantages vs SSE :
 *  - reconnexion auto (vs EventSource qui ferme à un timeout)
 *  - bidirectionnel (le client peut emit progress directement, pas besoin de POST)
 *  - rooms : tous les sockets dans `match:CODE` reçoivent les broadcasts
 */

import { Injectable, Logger } from '@nestjs/common';
import { Subject, Subscription } from 'rxjs';
import { SolitaireMatch } from './schemas/solitaire-match.schema';

// ============================================================
// VERSION COMMENTÉE — décommente quand les packages WS sont installés
// ============================================================

/*
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage,
  WebSocketGateway, WebSocketServer, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SolitaireMatchesService } from './solitaire-matches.service';

@WebSocketGateway({
  namespace: '/solitaire-matches',
  cors: { origin: '*' },
  transports: ['websocket'],
})
@Injectable()
export class SolitaireMatchesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(SolitaireMatchesGateway.name);
  private readonly eventSubs = new Map<string, Subscription>();

  @WebSocketServer() server!: Server;

  constructor(private readonly service: SolitaireMatchesService) {
    // S'abonne au stream du service pour broadcaster
    this.service['events$'].subscribe(({ code, match }) => {
      this.server.to(`match:${code}`).emit('match:update', match);
    });
  }

  handleConnection(client: Socket) {
    this.logger.log(`🔌 WS connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`🔌 WS disconnected: ${client.id}`);
  }

  @SubscribeMessage('match:join')
  async onJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { code: string }) {
    if (!data?.code) return { error: 'code required' };
    await client.join(`match:${data.code}`);
    const match = await this.service.getByCode(data.code);
    return { ok: true, match };
  }

  @SubscribeMessage('match:leave')
  async onLeaveRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { code: string }) {
    if (!data?.code) return;
    await client.leave(`match:${data.code}`);
    return { ok: true };
  }

  @SubscribeMessage('match:progress')
  async onProgress(@MessageBody() data: any) {
    return this.service.updateProgress(data.code, data.userId, {
      score: data.score, moves: data.moves, finished: data.finished, actions: data.actions,
    });
  }
}
*/

/**
 * Stub Injectable — pas de WS Gateway active, juste un placeholder qui rappelle
 * à activer la version commentée si les packages sont installés.
 */
@Injectable()
export class SolitaireMatchesGatewayStub {
  private readonly logger = new Logger('SolitaireMatchesGateway:STUB');

  constructor() {
    this.logger.log(
      '⚠️ WebSocket Gateway en mode STUB — actuellement SSE est utilisé. ' +
      'Pour activer WS : `pnpm add @nestjs/websockets @nestjs/platform-socket.io socket.io` ' +
      'puis décommente la version dans ce fichier.'
    );
  }
}
