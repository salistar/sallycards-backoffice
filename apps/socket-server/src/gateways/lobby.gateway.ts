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
  Room,
  RoomConfig,
  GameType,
  GameStatus,
} from '../../../../libs/shared/types/src';

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

@WebSocketGateway({ namespace: '/lobby', cors: { origin: '*' } })
export class LobbyGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server<ClientToServerEvents, ServerToClientEvents>;

  private readonly logger = new Logger(LobbyGateway.name);

  /** In-memory room store (keyed by room id). */
  private readonly rooms = new Map<string, Room>();

  constructor(private readonly jwtService: JwtService) {}

  afterInit(server: Server) {
    server.use(createWsAuthMiddleware(this.jwtService));
    this.logger.log('LobbyGateway initialised');
  }

  handleConnection(client: AuthenticatedSocket) {
    this.logger.log(
      `Lobby client connected: ${client.id} (user: ${client.userId})`,
    );
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(
      `Lobby client disconnected: ${client.id} (user: ${client.userId})`,
    );

    // Clean up rooms when user disconnects
    const roomsToDelete: string[] = [];
    for (const [roomId, room] of this.rooms.entries()) {
      // Remove player from room
      room.players = room.players.filter((p) => p.id !== client.userId);

      // If room is empty, mark for deletion
      if (room.players.length === 0) {
        roomsToDelete.push(roomId);
        this.logger.log(
          `Room ${room.code} removed on disconnect (empty)`,
        );
      } else if (room.hostId === client.userId) {
        // Transfer host to first remaining player
        room.hostId = room.players[0].id;
        this.server.to(roomId).emit('room:updated', room);
        this.logger.log(
          `Host transferred in room ${room.code}`,
        );
      }
    }

    // Delete empty rooms
    for (const roomId of roomsToDelete) {
      this.rooms.delete(roomId);
    }
  }

  // ── room:create ───────────────────────────────────────────────────────────

  @SubscribeMessage('room:create')
  handleRoomCreate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { gameType?: GameType; config?: RoomConfig },
  ) {
    try {
      // Validate required fields
      if (!payload.gameType) {
        client.emit('room:error', {
          message: 'gameType is required',
        });
        return null;
      }

      if (!payload.config) {
        client.emit('room:error', {
          message: 'config is required',
        });
        return null;
      }

      // Validate maxPlayers
      const maxPlayers = payload.config.maxPlayers || 4;
      if (maxPlayers < 2 || maxPlayers > 8) {
        client.emit('room:error', {
          message: 'maxPlayers must be between 2 and 8',
        });
        return null;
      }

      const code = generateRoomCode();
      const roomId = `room_${Date.now()}_${code}`;

      const room: Room = {
        id: roomId,
        code,
        hostId: client.userId,
        gameType: payload.gameType,
        players: [
          {
            id: client.userId,
            username: client.username,
            avatar: '',
            score: 0,
            isBot: false,
            isConnected: true,
            isReady: false,
          },
        ],
        status: GameStatus.WAITING,
        config: { ...payload.config, maxPlayers },
        createdAt: new Date().toISOString(),
      };

      this.rooms.set(roomId, room);
      client.join(roomId);
      client.emit('room:created', room);
      this.logger.log(`Room created: ${code} by ${client.userId}`);

      return room;
    } catch (err) {
      this.logger.error(
        `Error in room:create: ${err instanceof Error ? err.message : 'unknown error'}`,
      );
      client.emit('room:error', {
        message: 'Failed to create room',
      });
      return null;
    }
  }

  // ── room:join ─────────────────────────────────────────────────────────────

  @SubscribeMessage('room:join')
  handleRoomJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { code: string; password?: string },
  ) {
    try {
      const room = [...this.rooms.values()].find(
        (r) => r.code === payload.code,
      );

      if (!room) {
        client.emit('room:error', { message: 'Room not found' });
        return null;
      }

      // Check if player is already in the room
      const alreadyInRoom = room.players.some((p) => p.id === client.userId);
      if (alreadyInRoom) {
        client.emit('room:error', {
          message: 'You are already in this room',
        });
        return null;
      }

      if (room.config.isPrivate && room.config.password !== payload.password) {
        client.emit('room:error', { message: 'Invalid password' });
        return null;
      }

      if (room.players.length >= room.config.maxPlayers) {
        client.emit('room:error', { message: 'Room is full' });
        return null;
      }

      const player = {
        id: client.userId,
        username: client.username,
        avatar: '',
        score: 0,
        isBot: false,
        isConnected: true,
        isReady: false,
      };

      room.players.push(player);
      client.join(room.id);

      this.server.to(room.id).emit('room:joined', { room, player });
      this.logger.log(`${client.userId} joined room ${room.code}`);

      return room;
    } catch (err) {
      this.logger.error(
        `Error in room:join: ${err instanceof Error ? err.message : 'unknown error'}`,
      );
      client.emit('room:error', {
        message: 'Failed to join room',
      });
      return null;
    }
  }

  // ── room:leave ────────────────────────────────────────────────────────────

  @SubscribeMessage('room:leave')
  handleRoomLeave(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { roomId: string },
  ) {
    const room = this.rooms.get(payload.roomId);
    if (!room) return;

    room.players = room.players.filter((p) => p.id !== client.userId);
    client.leave(room.id);

    this.server
      .to(room.id)
      .emit('room:left', { roomId: room.id, playerId: client.userId });

    // Remove room if empty
    if (room.players.length === 0) {
      this.rooms.delete(room.id);
      this.logger.log(`Room ${room.code} removed (empty)`);
    } else if (room.hostId === client.userId) {
      // Transfer host
      room.hostId = room.players[0].id;
      this.server.to(room.id).emit('room:updated', room);
    }
  }

  // ── room:list ─────────────────────────────────────────────────────────────

  @SubscribeMessage('room:list')
  handleRoomList(@ConnectedSocket() client: AuthenticatedSocket) {
    const publicRooms = [...this.rooms.values()].filter(
      (r) => !r.config.isPrivate && r.status === GameStatus.WAITING,
    );
    client.emit('room:list', publicRooms);
    return publicRooms;
  }
}
