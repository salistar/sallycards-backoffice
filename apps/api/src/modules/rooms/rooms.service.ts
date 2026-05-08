import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { Room, RoomDocument } from './schemas/room.schema';
import { RedisService } from '../../common/services/redis.service';

interface CreateRoomOptions {
  hostUsername?: string;
  isPrivate?: boolean;
  maxPlayers?: number;
  minPlayers?: number;
  botDifficulty?: string;
  stake?: number;
}

@Injectable()
export class RoomsService {
  private readonly logger = new Logger(RoomsService.name);

  constructor(
    @InjectModel(Room.name) private readonly roomModel: Model<RoomDocument>,
    @InjectConnection() private readonly conn: Connection,
    private readonly redis: RedisService,
  ) {}

  /**
   * Publie un événement de mise à jour de room sur Redis.
   * Le socket-server écoute ce channel et relaie à tous les clients connectés
   * à la room socket.io correspondante → remplacement du poll 3s par du
   * temps réel. Les événements : 'created' | 'updated' | 'joined' | 'left'
   * | 'ready' | 'started' | 'closed'.
   */
  private async publishRoomEvent(event: string, room: any) {
    try {
      await this.redis.publish(
        'sallycards:room',
        JSON.stringify({ event, code: room.code, room, timestamp: Date.now() }),
      );
    } catch (e) {
      this.logger.warn(`publishRoomEvent failed: ${e}`);
    }
  }

  /**
   * SIMULATION MODE — creates a room pre-populated with N randomly-chosen
   * users from the game's user collection. Handy for QA: one tap and you
   * have a fully-seated lobby to test sharing, audio/video, and the auto-
   * play driver. All simulated players are flagged `isSimulated:true` so
   * the socket-server can drive their moves via the bot service.
   */
  async createSimulatedRoom(hostId: string, gameType: string, userCount: number) {
    const n = Math.min(Math.max(userCount, 2), 10);
    const col = `${gameType}_users`;
    // Pick n-1 random users (the caller is seat 1 as host). If the DB pool
    // is smaller than requested, we fill the remaining seats with
    // synthetic bots so simulation always succeeds up to 10 players.
    const pool: any[] = await this.conn
      .collection(col)
      .aggregate([
        { $match: { isGuest: { $ne: true }, _id: { $ne: this.tryObjectId(hostId) } } },
        { $sample: { size: n - 1 } },
        { $project: { _id: 1, username: 1, avatar: 1, 'stats.elo': 1, location: 1 } },
      ])
      .toArray();

    const SYNTHETIC_NAMES = [
      'Amine', 'Yasmine', 'Rayan', 'Lina', 'Karim', 'Salma',
      'Mehdi', 'Nora', 'Omar', 'Zineb', 'Youssef', 'Imane',
    ];
    const synthCount = Math.max(0, n - 1 - pool.length);
    const { ObjectId } = require('mongodb');
    const synthetics = Array.from({ length: synthCount }, (_, i) => ({
      _id: new ObjectId(),  // valid Mongo ObjectId so schema validation passes
      username: SYNTHETIC_NAMES[(pool.length + i) % SYNTHETIC_NAMES.length],
      avatar: '',
      isSynthetic: true,
      stats: { elo: 900 + Math.floor(Math.random() * 400) },
    }));

    const allBots = [...pool, ...synthetics];
    const code = await this.generateUniqueCode();
    const players = [
      {
        userId: hostId,
        username: 'Host',
        isReady: true,
        isHost: true,
        isSimulated: false,
        joinedAt: new Date(),
      },
      ...allBots.map((u: any, i: number) => ({
        userId: u._id.toString(),
        username: u.username,
        avatar: u.avatar || '',
        elo: u.stats?.elo || 1000,
        isReady: true,
        isHost: false,
        isSimulated: true,
        isSynthetic: !!u.isSynthetic,
        joinedAt: new Date(Date.now() + i * 1000),
      })),
    ];

    const room = await this.roomModel.create({
      code,
      hostId,
      gameType,
      players,
      status: 'waiting',
      mode: 'public',
      maxPlayers: n,
      minPlayers: 2,
      config: { isSimulated: true, audioVideoEnabled: true },
      createdAt: new Date(),
    });

    this.logger.log(
      `Simulated room ${code} created (${gameType}, ${n} players, host=${hostId})`,
    );
    const out = this.sanitize(room);
    await this.publishRoomEvent('created', out);
    return out;
  }

  private tryObjectId(id: string) {
    try {
      const { ObjectId } = require('mongodb');
      return new ObjectId(id);
    } catch {
      return id;
    }
  }

  async create(hostId: string, gameType: string, options: CreateRoomOptions = {}) {
    const code = await this.generateUniqueCode();
    const maxPlayers = Math.min(Math.max(options.maxPlayers ?? 4, 2), 10);
    const minPlayers = Math.max(options.minPlayers ?? 2, 2);

    const room = await this.roomModel.create({
      code,
      hostId,
      gameType,
      players: [{
        userId: hostId,
        username: options.hostUsername || 'Host',
        isReady: false,
        isHost: true,
        joinedAt: new Date(),
      }],
      status: 'waiting',
      mode: options.isPrivate ? 'private' : 'public',
      maxPlayers,
      minPlayers,
      config: {
        botDifficulty: options.botDifficulty,
        stake: options.stake ?? 0,
      },
      createdAt: new Date(),
    });

    this.logger.log(`Room created: ${code} [${gameType}] host=${hostId} ${maxPlayers}p`);
    const out = this.sanitize(room);
    await this.publishRoomEvent('created', out);
    return out;
  }

  async list(filters: { status?: string; mode?: string; gameType?: string } = {}) {
    const query: any = { mode: 'public', status: 'waiting' };
    if (filters.gameType) query.gameType = filters.gameType;
    if (filters.status) query.status = filters.status;

    const rooms = await this.roomModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return {
      rooms: rooms.map((r) => this.sanitize(r as any)),
      total: rooms.length,
    };
  }

  async findByCode(code: string) {
    const room = await this.roomModel.findOne({ code: code.toUpperCase() }).lean();
    if (!room) throw new NotFoundException(`Room ${code} not found`);
    return this.sanitize(room as any);
  }

  async join(code: string, userId: string, username?: string) {
    const room = await this.roomModel.findOne({ code: code.toUpperCase() });
    if (!room) throw new NotFoundException(`Room ${code} not found`);
    if (room.status !== 'waiting')
      throw new BadRequestException('Room is not accepting new players');
    if (room.players.some((p: any) => String(p.userId) === String(userId))) {
      return this.sanitize(room);
    }
    if (room.players.length >= room.maxPlayers)
      throw new BadRequestException('Room is full');

    room.players.push({
      userId,
      username: username || 'Player',
      isReady: false,
      isHost: false,
      joinedAt: new Date(),
    } as any);
    await room.save();
    this.logger.log(`User ${userId} joined room ${code} (${room.players.length}/${room.maxPlayers})`);
    const out = this.sanitize(room);
    await this.publishRoomEvent('joined', out);
    return out;
  }

  async leave(code: string, userId: string) {
    const room = await this.roomModel.findOne({ code: code.toUpperCase() });
    if (!room) throw new NotFoundException(`Room ${code} not found`);
    room.players = room.players.filter((p: any) => String(p.userId) !== String(userId)) as any;

    // If host left, transfer host or close room
    if (String(room.hostId) === String(userId)) {
      if (room.players.length > 0) {
        room.hostId = (room.players[0] as any).userId;
        (room.players[0] as any).isHost = true;
      } else {
        room.status = 'finished';
      }
    }
    await room.save();
    this.logger.log(`User ${userId} left room ${code} (${room.players.length}/${room.maxPlayers})`);
    const out = this.sanitize(room);
    await this.publishRoomEvent('left', out);
    return out;
  }

  async setReady(code: string, userId: string, isReady: boolean) {
    const room = await this.roomModel.findOne({ code: code.toUpperCase() });
    if (!room) throw new NotFoundException(`Room ${code} not found`);
    const player = room.players.find((p: any) => String(p.userId) === String(userId));
    if (!player) throw new NotFoundException('Player not in room');
    (player as any).isReady = isReady;
    await room.save();
    const out = this.sanitize(room);
    await this.publishRoomEvent('ready', out);
    return out;
  }

  async startGame(code: string, userId: string) {
    const room = await this.roomModel.findOne({ code: code.toUpperCase() });
    if (!room) throw new NotFoundException(`Room ${code} not found`);
    if (String(room.hostId) !== String(userId))
      throw new BadRequestException('Only the host can start the game');
    if (room.players.length < room.minPlayers)
      throw new BadRequestException(`Need at least ${room.minPlayers} players`);
    room.status = 'in_progress';
    await room.save();
    this.logger.log(`Game started in room ${code}`);
    const out = this.sanitize(room);
    await this.publishRoomEvent('started', out);
    return out;
  }

  private sanitize(room: RoomDocument | any) {
    const obj = (room as any).toObject ? (room as any).toObject() : room;
    return {
      code: obj.code,
      hostId: obj.hostId,
      gameType: obj.gameType,
      status: obj.status,
      mode: obj.mode,
      maxPlayers: obj.maxPlayers,
      minPlayers: obj.minPlayers || 2,
      players: obj.players,
      config: obj.config,
      playersCount: obj.players?.length ?? 0,
      shareUrl: `https://sallycards.com/join/${obj.code}`,
      createdAt: obj.createdAt,
    };
  }

  private async generateUniqueCode(): Promise<string> {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let attempt = 0; attempt < 100; attempt++) {
      let code = '';
      for (let i = 0; i < 6; i++)
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      const exists = await this.roomModel.exists({ code });
      if (!exists) return code;
    }
    throw new Error('Could not generate unique room code');
  }
}
