import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UserDocument } from '../users/schemas/user.schema';
import {
  GameHistory,
  GameHistoryDocument,
} from '../games/schemas/game-history.schema';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  private readonly GAME_TYPES = ['ronda', 'kdoub', 'belote', 'poker', 'tarot', 'scopa', 'okey', 'concentration', 'solitaire', 'quiestce', 'kantcopy'];

  constructor(
    private readonly usersService: UsersService,
    @InjectModel(GameHistory.name)
    private readonly gameHistoryModel: Model<GameHistoryDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  /** Crée et envoie une notification (à un jeu ou à tous). */
  async broadcastNotification(dto: { gameType?: string; type?: string; title: string; body: string }) {
    if (!dto?.title || !dto?.body) throw new BadRequestException('title et body requis');
    const type = dto.type || 'system';
    const games = dto.gameType && dto.gameType !== 'all' ? [dto.gameType] : this.GAME_TYPES;
    const now = new Date();
    let sent = 0;
    for (const gt of games) {
      const users = await this.connection.collection(`${gt}_users`).find({}, { projection: { _id: 1 } }).toArray();
      const docs = users.map((u) => ({ userId: u._id.toString(), type, title: dto.title, body: dto.body, payload: {}, sentAt: now }));
      if (docs.length) { await this.connection.collection('notifications').insertMany(docs); sent += docs.length; }
    }
    this.logger.log(`Broadcast "${dto.title}" → ${sent} notifs`);
    return { sent, games };
  }

  /** Liste des notifications envoyées, groupées par titre/message (broadcasts). */
  async recentNotifications(limit = 40) {
    return this.connection.collection('notifications').aggregate([
      { $group: { _id: { title: '$title', body: '$body', type: '$type' }, recipients: { $sum: 1 }, sentAt: { $max: '$sentAt' } } },
      { $sort: { sentAt: -1 } },
      { $limit: limit },
      { $project: { _id: 0, title: '$_id.title', body: '$_id.body', type: '$_id.type', recipients: 1, sentAt: 1 } },
    ]).toArray();
  }

  /** Liste de tous les tournois (admin). */
  async listTournaments() {
    const docs = await this.connection.collection('tournaments').find({}).sort({ createdAt: -1 }).limit(100).toArray();
    return docs.map((t: any) => ({
      code: t.code, type: t.type, variant: t.variant, status: t.status,
      participants: t.entries?.length ?? 0, startsAt: t.startsAt, endsAt: t.endsAt, prizes: t.prizes ?? [],
    }));
  }

  /** Crée un tournoi ouvert. */
  async createTournament(dto: { gameType: string; type?: string; name?: string; prizes?: any[]; startsAt?: number; endsAt?: number }) {
    if (!dto?.gameType) throw new BadRequestException('gameType requis');
    const now = Date.now();
    const type = dto.type || 'daily';
    const doc = {
      code: `ADM-${dto.gameType}-${type}-${now}`,
      type, variant: dto.gameType, difficulty: 'medium', status: 'open',
      startsAt: dto.startsAt || now,
      endsAt: dto.endsAt || now + 7 * 24 * 3600 * 1000,
      prizes: dto.prizes && dto.prizes.length ? dto.prizes : [{ rank: 1, gold: 500 }, { rank: 2, gold: 250 }, { rank: 3, gold: 100 }],
      entries: [], createdAt: new Date(), updatedAt: new Date(),
    };
    await this.connection.collection('tournaments').insertOne(doc);
    return doc;
  }

  /** Crée et envoie un cadeau (bon) aux utilisateurs, avec condition optionnelle. */
  async createGift(dto: { gameType?: string; amount: number; currency?: string; providerStoreCode?: string; reason?: string; minGamesPlayed?: number }) {
    if (!dto?.amount) throw new BadRequestException('amount requis');
    const games = dto.gameType && dto.gameType !== 'all' ? [dto.gameType] : this.GAME_TYPES;
    const now = new Date();
    const min = dto.minGamesPlayed || 0;
    let issued = 0;
    for (const gt of games) {
      const q: any = min > 0 ? { 'stats.gamesPlayed': { $gte: min } } : {};
      const users = await this.connection.collection(`${gt}_users`).find(q, { projection: { _id: 1 } }).toArray();
      const docs = users.map((u, i) => ({
        code: `GIFT-${gt.toUpperCase()}-${now.getTime().toString(36)}-${i}`,
        userId: u._id.toString(), amount: dto.amount, currency: dto.currency || 'EUR',
        providerStoreCode: dto.providerStoreCode || 'custom', reason: dto.reason || 'Cadeau de l\'équipe',
        status: 'issued', issuedAt: now, expiresAt: new Date(Date.now() + 180 * 24 * 3600 * 1000), createdAt: now, updatedAt: now,
      }));
      if (docs.length) { await this.connection.collection('rewards-vouchers').insertMany(docs); issued += docs.length; }
    }
    this.logger.log(`Gift ${dto.amount} → ${issued} bons`);
    return { issued, condition: min > 0 ? `≥ ${min} parties` : 'tous' };
  }

  /** Surveille l'activité (défis HKIM) des utilisateurs d'un jeu. */
  async getUserActivity(gameType?: string) {
    const gt = gameType || 'belote';
    const users = await this.connection.collection(`${gt}_users`)
      .find({}, { projection: { username: 1, status: 1, stats: 1, updatedAt: 1 } }).limit(100).toArray();
    let doneByUser: Record<string, number> = {};
    let pendingByUser: Record<string, number> = {};
    try {
      const agg = await this.connection.collection(`hkim_${gt}`).aggregate([
        { $group: { _id: { userId: '$userId', status: '$status' }, n: { $sum: 1 } } },
      ]).toArray();
      for (const a of agg) {
        const uid = a._id.userId;
        if (a._id.status === 'done') doneByUser[uid] = a.n; else pendingByUser[uid] = a.n;
      }
    } catch { /* collection absente */ }
    return users.map((u) => {
      const uid = u._id.toString();
      const done = doneByUser[uid] || 0; const pending = pendingByUser[uid] || 0;
      return {
        userId: uid, username: u.username || 'Joueur', status: u.status || 'offline',
        gamesPlayed: u.stats?.gamesPlayed || 0, gamesWon: u.stats?.gamesWon || 0, elo: u.stats?.elo || 1000,
        hkimDone: done, hkimPending: pending,
        active: done > 0 || (u.stats?.gamesPlayed || 0) > 0,
        lastSeen: u.updatedAt || null,
      };
    });
  }

  /** Stats détaillées : joueurs jour/semaine/mois + ressources. */
  async getOverview() {
    const now = Date.now();
    const dayMs = 24 * 3600 * 1000;
    const since = new Date(now - 30 * dayMs);
    const byDay: Record<string, number> = {};
    let total = 0, online = 0;
    for (const gt of this.GAME_TYPES) {
      const col = this.connection.collection(`${gt}_users`);
      total += await col.countDocuments({});
      online += await col.countDocuments({ status: 'online' });
      const agg = await col.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, n: { $sum: 1 } } },
      ]).toArray();
      for (const a of agg) byDay[a._id] = (byDay[a._id] || 0) + a.n;
    }
    const days = Object.entries(byDay).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));
    const sum = (n: number) => days.filter((d) => new Date(d.date).getTime() >= now - n * dayMs).reduce((s, d) => s + d.count, 0);
    return {
      totalUsers: total, onlineUsers: online,
      newToday: sum(1), newThisWeek: sum(7), newThisMonth: sum(30),
      daily: days,
      resources: { uptimePct: 99.9, note: 'Heartbeats infra via /infra-monitoring' },
    };
  }

  async listUsers(query: ListUsersQueryDto) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(query.limit || '20', 10)),
    );
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (query.search) {
      const regex = new RegExp(query.search, 'i');
      filter.$or = [{ username: regex }, { email: regex }];
    }

    if (query.status) {
      filter.status = query.status;
    }

    // If gameType is specified, query only that collection
    if (query.gameType) {
      const model = this.usersService.getModel(query.gameType);
      const [users, total] = await Promise.all([
        model
          .find(filter)
          .select('-passwordHash')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        model.countDocuments(filter).exec(),
      ]);
      return { users, total, page, limit, gameType: query.gameType };
    }

    // Query ALL collections and merge
    const allModels = this.usersService.getAllModels();
    let allUsers: any[] = [];

    for (const { gameType, model } of allModels) {
      const users = await model
        .find(filter)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .exec();
      allUsers = allUsers.concat(
        users.map((u) => {
          const obj = u.toObject();
          // Tag with the source collection's game type
          obj.gameType = gameType;
          return obj;
        }),
      );
    }

    // Sort merged results by createdAt descending
    allUsers.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const total = allUsers.length;
    const paginatedUsers = allUsers.slice(skip, skip + limit);

    return { users: paginatedUsers, total, page, limit };
  }

  async createUser(dto: CreateUserDto) {
    const gameType = dto.gameType || 'ronda';
    const model = this.usersService.getModel(gameType);

    const existing = await model
      .findOne({ email: dto.email.toLowerCase() })
      .exec();
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = new model({
      email: dto.email.toLowerCase(),
      username: dto.username,
      passwordHash,
      role: dto.role || 'player',
      stats: { gamesPlayed: 0, gamesWon: 0, elo: 1000 },
      settings: {
        theme: 'system',
        soundEnabled: true,
        hapticEnabled: true,
        language: 'en',
      },
    });

    const saved = await user.save();
    this.logger.log(
      `Admin created user: ${saved._id} in ${gameType}_users`,
    );

    const { passwordHash: _, ...result } = saved.toObject();
    return result;
  }

  async updateUser(id: string, body: any) {
    const { username, email, role, avatar, locale, stats } = body;
    const update: any = {};
    if (username) update.username = username;
    if (email) update.email = email.toLowerCase();
    if (role) update.role = role;
    if (avatar !== undefined) update.avatar = avatar;
    if (locale) update.locale = locale;
    if (stats) update.stats = stats;

    // If gameType is provided in body, search only that collection
    if (body.gameType) {
      const model = this.usersService.getModel(body.gameType);
      const user = await model
        .findByIdAndUpdate(id, update, { new: true })
        .select('-passwordHash')
        .exec();
      if (!user) throw new NotFoundException('User not found');
      this.logger.log(
        `Admin updated user: ${id} in ${body.gameType}_users`,
      );
      return user;
    }

    // Search all collections to find and update the user
    for (const { gameType, model } of this.usersService.getAllModels()) {
      const user = await model
        .findByIdAndUpdate(id, update, { new: true })
        .select('-passwordHash')
        .exec();
      if (user) {
        this.logger.log(`Admin updated user: ${id} in ${gameType}_users`);
        return user;
      }
    }

    throw new NotFoundException('User not found');
  }

  async deleteUser(id: string) {
    // Search all collections to find and delete the user
    for (const { gameType, model } of this.usersService.getAllModels()) {
      const result = await model.findByIdAndDelete(id).exec();
      if (result) {
        this.logger.log(`Admin deleted user: ${id} from ${gameType}_users`);
        return;
      }
    }
    throw new NotFoundException('User not found');
  }

  async getDashboardStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Aggregate user counts across all 10 collections
    const allModels = this.usersService.getAllModels();
    let totalUsers = 0;
    let onlineUsers = 0;
    let totalPlayTimeSum = 0;
    let totalPlayTimeCount = 0;

    for (const { model } of allModels) {
      const [total, online, avgResult] = await Promise.all([
        model.countDocuments().exec(),
        model.countDocuments({ status: 'online' }).exec(),
        model
          .aggregate([
            {
              $group: {
                _id: null,
                totalMs: { $sum: '$stats.totalPlayTimeMs' },
                count: { $sum: 1 },
              },
            },
          ])
          .exec(),
      ]);
      totalUsers += total;
      onlineUsers += online;
      if (avgResult[0]) {
        totalPlayTimeSum += avgResult[0].totalMs;
        totalPlayTimeCount += avgResult[0].count;
      }
    }

    const gamesToday = await this.gameHistoryModel
      .countDocuments({ createdAt: { $gte: todayStart } })
      .exec();

    return {
      totalUsers,
      onlineUsers,
      gamesToday,
      avgTotalPlayTimeMs:
        totalPlayTimeCount > 0
          ? totalPlayTimeSum / totalPlayTimeCount
          : 0,
    };
  }

  async getActivityStats() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Aggregate registration activity across all collections
    const allModels = this.usersService.getAllModels();
    const dateMap: Record<string, number> = {};

    for (const { model } of allModels) {
      const results = await model
        .aggregate([
          { $match: { createdAt: { $gte: thirtyDaysAgo } } },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$createdAt',
                },
              },
              count: { $sum: 1 },
            },
          },
        ])
        .exec();

      for (const r of results) {
        dateMap[r._id] = (dateMap[r._id] || 0) + r.count;
      }
    }

    return Object.entries(dateMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getGamesByType() {
    return this.gameHistoryModel
      .aggregate([
        {
          $group: {
            _id: '$gameType',
            count: { $sum: 1 },
          },
        },
        { $project: { gameType: '$_id', count: 1, _id: 0 } },
        { $sort: { count: -1 } },
      ])
      .exec();
  }
}
