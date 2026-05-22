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
  Move,
  GameState,
  GameStatus,
} from '../../../../libs/shared/types/src';

@WebSocketGateway({ namespace: '/game', cors: { origin: '*' } })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server<ClientToServerEvents, ServerToClientEvents>;

  private readonly logger = new Logger(GameGateway.name);

  /** In-memory game state store (keyed by roomId). */
  private readonly games = new Map<string, GameState>();

  /** Game cleanup timeout: 30 minutes after game ends */
  private readonly gameCleanupTimeMs = 30 * 60 * 1000;

  /** Track cleanup timers for games */
  private readonly cleanupTimers = new Map<string, NodeJS.Timeout>();

  constructor(private readonly jwtService: JwtService) {}

  afterInit(server: Server) {
    server.use(createWsAuthMiddleware(this.jwtService));
    this.logger.log('GameGateway initialised');
  }

  handleConnection(client: AuthenticatedSocket) {
    this.logger.log(
      `Client connected: ${client.id} (user: ${client.userId})`,
    );
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(
      `Client disconnected: ${client.id} (user: ${client.userId})`,
    );
  }

  // ── game:start ────────────────────────────────────────────────────────────

  @SubscribeMessage('game:start')
  handleGameStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { roomId: string },
  ) {
    const { roomId } = payload;
    this.logger.log(`game:start in room ${roomId} by ${client.userId}`);

    const existing = this.games.get(roomId);
    if (existing && existing.status === GameStatus.IN_PROGRESS) {
      client.emit('game:error', { message: 'Game already in progress' });
      return;
    }

    const state: GameState = {
      id: roomId,
      type: existing?.type ?? (undefined as never),
      status: GameStatus.IN_PROGRESS,
      players: existing?.players ?? [],
      currentPlayerId: existing?.players[0]?.id ?? null,
      turnNumber: 1,
      phase: 'play',
      createdAt: new Date().toISOString(),
    };

    this.games.set(roomId, state);
    client.join(roomId);
    this.server.to(roomId).emit('game:started', state);
  }

  // ── game:action ───────────────────────────────────────────────────────────

  @SubscribeMessage('game:action')
  handleGameAction(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() move: Move,
  ) {
    try {
      this.logger.log(
        `game:action from ${client.userId}: ${move.type}`,
      );

      // Broadcast move to all players in the same rooms
      for (const room of client.rooms) {
        if (room !== client.id) {
          // Validate that user is actually in the game
          const gameState = this.games.get(room);
          if (!gameState) {
            this.logger.warn(
              `game:action - Game state not found for room ${room}`,
            );
            continue;
          }

          const playerInGame = gameState.players?.some(
            (p) => p.id === client.userId,
          );
          if (!playerInGame) {
            this.logger.warn(
              `game:action - User ${client.userId} not in game room ${room}`,
            );
            client.emit('game:error', {
              message: 'You are not in this game',
            });
            continue;
          }

          this.server.to(room).emit('game:action', move);

          // Update and broadcast state
          gameState.turnNumber += 1;
          this.server.to(room).emit('game:state', gameState);
        }
      }
    } catch (err) {
      this.logger.error(
        `Error in game:action: ${err instanceof Error ? err.message : 'unknown error'}`,
      );
      client.emit('game:error', {
        message: 'Failed to process game action',
      });
    }
  }

  // ── game:end ──────────────────────────────────────────────────────────────

  @SubscribeMessage('game:end')
  handleGameEnd(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { roomId: string; winnerId?: string | null },
  ) {
    try {
      const { roomId, winnerId } = payload;
      this.logger.log(`game:end in room ${roomId} by ${client.userId}`);

      const state = this.games.get(roomId);
      if (!state) {
        client.emit('game:error', { message: 'Game not found' });
        return;
      }

      state.status = GameStatus.FINISHED;
      this.games.set(roomId, state);

      this.server.to(roomId).emit('game:ended', {
        winnerId: winnerId ?? null,
        finalState: state,
      });

      // Schedule cleanup of finished game
      this.scheduleGameCleanup(roomId);
    } catch (err) {
      this.logger.error(
        `Error in game:end: ${err instanceof Error ? err.message : 'unknown error'}`,
      );
      client.emit('game:error', {
        message: 'Failed to end game',
      });
    }
  }

  // ── game:annonce (Belote-specific : Tierce/Cinquante/Cent/Carrés) ─────────
  // Permet à un joueur de déclarer ses annonces ; le serveur broadcast
  // l'event aux autres joueurs sans valider (scoring est calculé côté
  // client). Pas de persistance — fire-and-forget.
  @SubscribeMessage('game:annonce')
  handleAnnonce(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: {
      roomId: string;
      annonces: Array<{ type: string; points: number; cards?: Array<{ id: string }> }>;
    },
  ) {
    try {
      const { roomId, annonces } = payload;
      if (!roomId || !Array.isArray(annonces)) return;
      this.logger.log(
        `game:annonce in ${roomId} by ${client.userId} (${annonces.length} annonce(s))`,
      );
      this.server.to(roomId).emit('game:annonce:declared' as any, {
        playerId: client.userId,
        annonces,
      });
    } catch (err) {
      this.logger.error(
        `Error in game:annonce: ${err instanceof Error ? err.message : 'unknown error'}`,
      );
    }
  }

  // ── game:belote (Belote-Rebelote : R+D atout posés successivement) ────────
  @SubscribeMessage('game:belote')
  handleBelote(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { roomId: string; type: 'belote' | 'rebelote' },
  ) {
    try {
      const { roomId, type } = payload;
      if (!roomId || (type !== 'belote' && type !== 'rebelote')) return;
      this.logger.log(`game:belote (${type}) in ${roomId} by ${client.userId}`);
      this.server.to(roomId).emit('game:belote:declared' as any, {
        playerId: client.userId,
        type,
      });
    } catch (err) {
      this.logger.error(
        `Error in game:belote: ${err instanceof Error ? err.message : 'unknown error'}`,
      );
    }
  }

  /**
   * Schedule cleanup of a finished game after a timeout.
   * Prevents memory leaks from accumulated game states.
   */
  private scheduleGameCleanup(roomId: string): void {
    // Clear any existing timer
    const existingTimer = this.cleanupTimers.get(roomId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Schedule new cleanup
    const timer = setTimeout(() => {
      if (this.games.has(roomId)) {
        this.games.delete(roomId);
        this.cleanupTimers.delete(roomId);
        this.logger.log(`Cleaned up finished game: ${roomId}`);
      }
    }, this.gameCleanupTimeMs);

    this.cleanupTimers.set(roomId, timer);
  }
}
