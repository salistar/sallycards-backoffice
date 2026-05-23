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
import {
  ServerToClientEvents,
  ClientToServerEvents,
  ChatMessage,
} from '../../../../libs/shared/types/src';

@WebSocketGateway({ namespace: '/chat', cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server<ClientToServerEvents, ServerToClientEvents>;

  private readonly logger = new Logger(ChatGateway.name);

  /** Max message length: 500 characters */
  private readonly maxMessageLength = 500;

  /** Rate limiting: max 5 messages per user per 10 seconds */
  private readonly rateLimitMessages = 5;

  private readonly rateLimitWindowMs = 10 * 1000;

  /** Track message timestamps per user: userId -> timestamps[] */
  private readonly userMessageTimestamps = new Map<string, number[]>();

  constructor(private readonly jwtService: JwtService) {}

  afterInit(server: Server) {
    server.use(createWsAuthMiddleware(this.jwtService));
    this.logger.log('ChatGateway initialised');
  }

  handleConnection(client: AuthenticatedSocket) {
    this.logger.log(
      `Chat client connected: ${client.id} (user: ${client.userId})`,
    );
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(
      `Chat client disconnected: ${client.id} (user: ${client.userId})`,
    );

    // Clean up rate limit tracking for user
    this.userMessageTimestamps.delete(client.userId);
  }

  // ── chat:join / chat:leave ─────────────────────────────────────────────────
  // Sans rejoindre la room socket.io, le client ne reçoit pas les messages
  // diffusés via server.to(roomId). On expose donc join/leave explicites.

  @SubscribeMessage('chat:join')
  handleJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { roomId: string },
  ) {
    if (!payload?.roomId) return { error: 'roomId required' };
    client.join(payload.roomId);
    return { ok: true };
  }

  @SubscribeMessage('chat:leave')
  handleLeave(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { roomId: string },
  ) {
    if (payload?.roomId) client.leave(payload.roomId);
    return { ok: true };
  }

  // ── chat:message ──────────────────────────────────────────────────────────

  @SubscribeMessage('chat:message')
  handleMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { roomId: string; content: string },
  ) {
    try {
      // Validate content exists
      if (!payload.content || typeof payload.content !== 'string') {
        client.emit('chat:error', {
          message: 'Message content is required',
        });
        return;
      }

      // Validate message length
      if (payload.content.length > this.maxMessageLength) {
        client.emit('chat:error', {
          message: `Message exceeds maximum length of ${this.maxMessageLength} characters`,
        });
        return;
      }

      // Check rate limit
      const now = Date.now();
      const timestamps = this.userMessageTimestamps.get(client.userId) || [];

      // Remove old timestamps outside the rate limit window
      const recentTimestamps = timestamps.filter(
        (ts) => now - ts < this.rateLimitWindowMs,
      );

      if (recentTimestamps.length >= this.rateLimitMessages) {
        client.emit('chat:error', {
          message: `Too many messages. Max ${this.rateLimitMessages} messages per ${this.rateLimitWindowMs / 1000}s`,
        });
        this.logger.warn(
          `Rate limit exceeded for user ${client.userId}`,
        );
        return;
      }

      // Track message timestamp
      recentTimestamps.push(now);
      this.userMessageTimestamps.set(client.userId, recentTimestamps);

      // Sanitize content: trim and normalize whitespace
      const sanitizedContent = payload.content
        .trim()
        .replace(/\s+/g, ' ');

      const message: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        roomId: payload.roomId,
        senderId: client.userId,
        senderName: client.username,
        content: sanitizedContent,
        timestamp: new Date().toISOString(),
      };

      this.server.to(payload.roomId).emit('chat:message', message);
      this.logger.debug(
        `Message in ${payload.roomId} from ${client.userId}`,
      );
    } catch (err) {
      this.logger.error(
        `Error in chat:message: ${err instanceof Error ? err.message : 'unknown error'}`,
      );
      client.emit('chat:error', {
        message: 'Failed to send message',
      });
    }
  }

  // ── chat:typing ───────────────────────────────────────────────────────────

  @SubscribeMessage('chat:typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { roomId: string; isTyping: boolean },
  ) {
    client.to(payload.roomId).emit('chat:typing', {
      userId: client.userId,
      username: client.username,
      isTyping: payload.isTyping,
    });
  }
}
