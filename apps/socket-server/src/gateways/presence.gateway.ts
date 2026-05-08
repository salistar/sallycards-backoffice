import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, OnModuleDestroy } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server } from 'socket.io';
import {
  AuthenticatedSocket,
  createWsAuthMiddleware,
} from '../middleware/ws-auth.middleware';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  PresenceInfo,
} from '../../../../libs/shared/types/src';

@WebSocketGateway({ namespace: '/presence', cors: { origin: '*' } })
export class PresenceGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy
{
  @WebSocketServer()
  server!: Server<ClientToServerEvents, ServerToClientEvents>;

  private readonly logger = new Logger(PresenceGateway.name);

  /** Track online users: userId -> PresenceInfo */
  private readonly onlineUsers = new Map<string, PresenceInfo>();

  /** Stale user timeout: 5 minutes without heartbeat */
  private readonly staleUserTimeoutMs = 5 * 60 * 1000;

  /** Cleanup interval: check for stale users every 1 minute */
  private readonly cleanupIntervalMs = 1 * 60 * 1000;

  private cleanupInterval?: NodeJS.Timeout;

  constructor(private readonly jwtService: JwtService) {}

  afterInit(server: Server) {
    server.use(createWsAuthMiddleware(this.jwtService));
    this.logger.log('PresenceGateway initialised');
    this.startCleanupInterval();
  }

  /**
   * Start periodic cleanup of stale users.
   * Users are considered stale if they haven't sent a heartbeat in 5 minutes.
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleUsers();
    }, this.cleanupIntervalMs);

    this.logger.log('Stale user cleanup interval started');
  }

  /**
   * Clean up users who haven't sent a heartbeat recently.
   */
  private cleanupStaleUsers(): void {
    const now = Date.now();
    const staleUsers: string[] = [];

    for (const [userId, info] of this.onlineUsers.entries()) {
      const lastSeenTime = new Date(info.lastSeen).getTime();
      if (now - lastSeenTime > this.staleUserTimeoutMs) {
        staleUsers.push(userId);
      }
    }

    if (staleUsers.length > 0) {
      this.logger.warn(
        `Cleaning up ${staleUsers.length} stale users`,
      );

      for (const userId of staleUsers) {
        const info = this.onlineUsers.get(userId);
        if (info) {
          this.onlineUsers.delete(userId);
          this.server.emit('presence:update', {
            ...info,
            status: 'offline',
          });
          this.logger.log(`Stale user removed: ${userId}`);
        }
      }
    }
  }

  handleConnection(client: AuthenticatedSocket) {
    const info: PresenceInfo = {
      userId: client.userId,
      username: client.username,
      status: 'online',
      lastSeen: new Date().toISOString(),
    };

    this.onlineUsers.set(client.userId, info);
    this.server.emit('presence:update', info);
    this.logger.log(`User online: ${client.userId}`);
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const info: PresenceInfo = {
      userId: client.userId,
      username: client.username,
      status: 'offline',
      lastSeen: new Date().toISOString(),
    };

    this.onlineUsers.delete(client.userId);
    this.server.emit('presence:update', info);
    this.logger.log(`User offline: ${client.userId}`);
  }

  /**
   * Called on gateway destroy to clean up resources.
   */
  onModuleDestroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.logger.log('Stale user cleanup interval cleared');
    }
  }

  // ── presence:heartbeat ────────────────────────────────────────────────────

  @SubscribeMessage('presence:heartbeat')
  handleHeartbeat(@ConnectedSocket() client: AuthenticatedSocket) {
    const existing = this.onlineUsers.get(client.userId);
    if (existing) {
      existing.lastSeen = new Date().toISOString();
      existing.status = 'online';
      this.onlineUsers.set(client.userId, existing);
    }
  }

  /**
   * Utility: return a snapshot of all currently online users.
   * Called by other gateways or via a scheduled interval.
   */
  getOnlineUsers(): PresenceInfo[] {
    return [...this.onlineUsers.values()];
  }
}
