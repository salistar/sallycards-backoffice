import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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

  constructor(
    private readonly usersService: UsersService,
    @InjectModel(GameHistory.name)
    private readonly gameHistoryModel: Model<GameHistoryDocument>,
  ) {}

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
