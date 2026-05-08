/**
 * WebRtcGateway
 * ─────────────
 * بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
 *
 * Signaling pour la méthode "WebRTC P2P custom" de la simulation.
 * Namespace `/webrtc`.
 *
 * IMPORTANT — alignement spec SallyCards section 5.3 :
 * La spec utilise les noms d'événements `signal:offer`, `signal:answer`, `signal:ice`,
 * `signal:hangup`, `signal:mute`. Ce gateway expose maintenant les DEUX nommages
 * (legacy `webrtc:*` pour rétro-compat + spec `signal:*`) pour faciliter la migration
 * du frontend. À terme on déprécie `webrtc:*`.
 *
 * Événements ENTRANTS (client → server) :
 *   - signal:join / webrtc:join     {roomCode} → rejoint, reçoit liste peers
 *   - signal:offer / webrtc:offer   {roomCode, to, sdp} — offre SDP
 *   - signal:answer / webrtc:answer {roomCode, to, sdp} — réponse SDP
 *   - signal:ice / webrtc:ice       {roomCode, to, candidate} — candidat ICE
 *   - signal:hangup                 {roomCode, to, reason} — raccrocher (NEW)
 *   - signal:mute                   {roomCode, to, audio, video} — toggle mute (NEW)
 *   - signal:leave / webrtc:leave   {roomCode}
 *
 * Événements SORTANTS (server → client) :
 *   - signal:peers / webrtc:peers   ← liste peers (pour l'arrivant)
 *   - signal:joined / webrtc:joined ← nouveau peer arrive (pour les existants)
 *   - signal:offer/answer/ice       ← relay SDP/ICE entre peers
 *   - signal:hangup                 ← l'autre a raccroché
 *   - signal:mute                   ← l'autre a toggled audio/video
 *   - signal:left / webrtc:left     ← peer parti
 *
 * Le serveur ne voit JAMAIS les flux audio/vidéo — pure relay de signaling.
 * Latence cible <50ms entre les deux pairs (testé sur Hetzner FRA1 ↔ Casablanca).
 */

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
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

type PeerInfo = { userId: string; username: string; socketId: string };

@WebSocketGateway({ namespace: '/webrtc', cors: { origin: '*' } })
export class WebRtcGateway implements OnGatewayInit, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(WebRtcGateway.name);

  /** roomCode → { socketId → PeerInfo } */
  private readonly rooms = new Map<string, Map<string, PeerInfo>>();

  constructor(private readonly jwtService: JwtService) {}

  afterInit(server: Server) {
    server.use(createWsAuthMiddleware(this.jwtService));
    this.logger.log('WebRtcGateway initialised');
  }

  handleDisconnect(client: AuthenticatedSocket) {
    // Remove from every room this socket was in
    for (const [code, peers] of this.rooms.entries()) {
      if (peers.has(client.id)) {
        peers.delete(client.id);
        client.to(`webrtc:${code}`).emit('webrtc:left', { socketId: client.id, userId: client.userId });
        this.logger.log(`${client.userId} disconnected → left ${code}`);
        if (peers.size === 0) this.rooms.delete(code);
      }
    }
  }

  @SubscribeMessage('webrtc:join')
  handleJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { roomCode: string },
  ) {
    const code = (payload?.roomCode || '').toUpperCase();
    if (!code) return { error: 'roomCode required' };

    const chan = `webrtc:${code}`;
    client.join(chan);

    if (!this.rooms.has(code)) this.rooms.set(code, new Map());
    const peers = this.rooms.get(code)!;

    // List of peers already in the room (for the new arrival)
    const existingPeers: PeerInfo[] = Array.from(peers.values());

    // Register this peer
    const me: PeerInfo = {
      userId: client.userId,
      username: client.username,
      socketId: client.id,
    };
    peers.set(client.id, me);

    // Send existing peers back to the new arrival
    client.emit('webrtc:peers', { peers: existingPeers, me });

    // Notify existing peers that someone joined
    client.to(chan).emit('webrtc:joined', me);

    this.logger.log(`${client.userId} joined ${code} (total: ${peers.size})`);
    return { ok: true, peersCount: peers.size };
  }

  @SubscribeMessage('webrtc:offer')
  handleOffer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { roomCode: string; to: string; sdp: any },
  ) {
    // Relay the offer to the target socketId
    this.server.to(payload.to).emit('webrtc:offer', {
      from: client.id,
      fromUserId: client.userId,
      fromUsername: client.username,
      sdp: payload.sdp,
    });
  }

  @SubscribeMessage('webrtc:answer')
  handleAnswer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { roomCode: string; to: string; sdp: any },
  ) {
    this.server.to(payload.to).emit('webrtc:answer', {
      from: client.id,
      fromUserId: client.userId,
      sdp: payload.sdp,
    });
  }

  @SubscribeMessage('webrtc:ice')
  handleIce(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { roomCode: string; to: string; candidate: any },
  ) {
    this.server.to(payload.to).emit('webrtc:ice', {
      from: client.id,
      candidate: payload.candidate,
    });
  }

  @SubscribeMessage('webrtc:leave')
  handleLeave(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { roomCode: string },
  ) {
    const code = (payload?.roomCode || '').toUpperCase();
    const peers = this.rooms.get(code);
    if (peers) {
      peers.delete(client.id);
      client.to(`webrtc:${code}`).emit('webrtc:left', { socketId: client.id, userId: client.userId });
      if (peers.size === 0) this.rooms.delete(code);
    }
    client.leave(`webrtc:${code}`);
  }

  // ════════════════════════════════════════════════════════════════════
  // ALIASES "signal:*" — alignement spec SallyCards section 5.3
  // Mêmes handlers, noms d'événements alignés avec la spec officielle.
  // Le frontend mobile/web peut utiliser indifféremment l'un ou l'autre.
  // ════════════════════════════════════════════════════════════════════

  @SubscribeMessage('signal:join')
  handleSignalJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { roomCode: string },
  ) {
    return this.handleJoin(client, payload);
  }

  @SubscribeMessage('signal:offer')
  handleSignalOffer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { roomCode: string; to: string; sdp: any },
  ) {
    if (process.env.NODE_ENV !== 'production') {
      this.logger.debug(`[signal:offer] ${client.userId} → ${payload.to}`);
    }
    // Émet à la fois sous le nouveau et l'ancien nom pour rétro-compat
    this.server.to(payload.to).emit('signal:offer', {
      from: client.id,
      fromUserId: client.userId,
      fromUsername: client.username,
      sdp: payload.sdp,
    });
    this.server.to(payload.to).emit('webrtc:offer', {
      from: client.id,
      fromUserId: client.userId,
      fromUsername: client.username,
      sdp: payload.sdp,
    });
  }

  @SubscribeMessage('signal:answer')
  handleSignalAnswer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { roomCode: string; to: string; sdp: any },
  ) {
    if (process.env.NODE_ENV !== 'production') {
      this.logger.debug(`[signal:answer] ${client.userId} → ${payload.to}`);
    }
    this.server.to(payload.to).emit('signal:answer', {
      from: client.id,
      fromUserId: client.userId,
      sdp: payload.sdp,
    });
    this.server.to(payload.to).emit('webrtc:answer', {
      from: client.id,
      fromUserId: client.userId,
      sdp: payload.sdp,
    });
  }

  @SubscribeMessage('signal:ice')
  handleSignalIce(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { roomCode: string; to: string; candidate: any },
  ) {
    this.server.to(payload.to).emit('signal:ice', {
      from: client.id,
      candidate: payload.candidate,
    });
    this.server.to(payload.to).emit('webrtc:ice', {
      from: client.id,
      candidate: payload.candidate,
    });
  }

  /**
   * Spec section 5.3 : `signal:hangup`. L'utilisateur clique "raccrocher" ou
   * abandonne. On notifie le pair pour qu'il ferme sa peer connection proprement.
   */
  @SubscribeMessage('signal:hangup')
  handleSignalHangup(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { roomCode: string; to: string; reason?: string },
  ) {
    this.logger.log(
      `[signal:hangup] ${client.userId} → ${payload.to} (${payload.reason ?? 'user_action'})`,
    );
    this.server.to(payload.to).emit('signal:hangup', {
      from: client.id,
      fromUserId: client.userId,
      reason: payload.reason ?? 'user_action',
    });
  }

  /**
   * Spec section 5.3 : `signal:mute`. Notification que l'utilisateur a coupé
   * son micro et/ou sa caméra. Le pair affiche une icône "muted" sur la PiP.
   */
  @SubscribeMessage('signal:mute')
  handleSignalMute(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: {
      roomCode: string;
      to: string;
      audio: boolean;
      video: boolean;
    },
  ) {
    if (process.env.NODE_ENV !== 'production') {
      this.logger.debug(
        `[signal:mute] ${client.userId} audio=${payload.audio} video=${payload.video}`,
      );
    }
    this.server.to(payload.to).emit('signal:mute', {
      from: client.id,
      fromUserId: client.userId,
      audio: payload.audio,
      video: payload.video,
    });
  }

  @SubscribeMessage('signal:leave')
  handleSignalLeave(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { roomCode: string },
  ) {
    return this.handleLeave(client, payload);
  }
}
