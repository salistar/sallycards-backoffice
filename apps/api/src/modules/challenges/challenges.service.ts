import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { RoomsService } from '../rooms/rooms.service';

@Injectable()
export class ChallengesService {
  private readonly logger = new Logger(ChallengesService.name);
  private readonly pendingByGame: Map<string, Set<string>> = new Map();

  constructor(
    @InjectConnection() private readonly conn: Connection,
    private readonly rooms: RoomsService,
  ) {}

  /**
   * Returns today's challenge for a given gameType. If no document exists
   * for today (e.g. the daily-reset cron hasn't fired yet), we create one
   * on the fly with sensible defaults — so the mobile UI never 404s.
   */
  async today(gameType: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.conn.collection('challenges').findOne({
      date: today, gameType,
    });
    if (existing) return existing;

    // Auto-create today's challenge — idempotent via upsert on (date,gameType)
    const doc = {
      date: today,
      gameType,
      title: 'Défi du jour',
      description: 'Gagne 3 parties consécutives',
      rewardCoins: 50,
      rewardXp: 100,
      maxPlayers: 10,
      active: true,
      participants: [],
      createdAt: new Date(),
      autoCreated: true,
    };
    try {
      await this.conn.collection('challenges').updateOne(
        { date: today, gameType },
        { $setOnInsert: doc },
        { upsert: true },
      );
    } catch (e) {
      this.logger.warn(`today() upsert failed: ${e}`);
    }
    return this.conn.collection('challenges').findOne({ date: today, gameType });
  }

  /**
   * Matchmaking: bucket the user into a room with other challengers of
   * the same gameType. If a waiting room has room, join it; otherwise create
   * a ranked/public room and wait.
   */
  async joinDailyMatchmaking(gameType: string, userId: string, username?: string) {
    // Look for an open matchmaking room
    const openRoom = await this.conn.collection('rooms').findOne({
      gameType,
      status: 'waiting',
      mode: 'ranked',
      'config.isDailyChallenge': true,
      $expr: { $lt: [{ $size: '$players' }, '$maxPlayers'] },
    });

    if (openRoom) {
      this.logger.log(`${userId} joining existing challenge room ${openRoom.code}`);
      return this.rooms.join(openRoom.code, userId, username);
    }

    // None open → create one
    const newRoom = await this.rooms.create(userId, gameType, {
      hostUsername: username,
      isPrivate: false,
      maxPlayers: 4,
      minPlayers: 2,
    });
    // Mark as daily-challenge + ranked
    await this.conn.collection('rooms').updateOne(
      { code: newRoom.code },
      { $set: { mode: 'ranked', 'config.isDailyChallenge': true } },
    );
    // Record participation in the challenges doc
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await this.conn.collection('challenges').updateOne(
      { date: today, gameType },
      { $addToSet: { participants: userId } },
    );
    this.logger.log(`${userId} created new challenge room ${newRoom.code}`);
    return { ...newRoom, mode: 'ranked' };
  }

  async completeChallenge(gameType: string, userId: string, won: boolean) {
    if (!won) return { rewarded: false };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const challenge = await this.conn.collection('challenges').findOne({
      date: today, gameType,
    });
    if (!challenge) return { rewarded: false };

    // Avoid double-reward per day
    const already = await this.conn.collection('coin_transactions').findOne({
      userId,
      source: 'daily_challenge',
      'meta.date': today,
      'meta.gameType': gameType,
    });
    if (already) return { rewarded: false, already: true };

    await (this.conn.collection(`${gameType}_users`) as any).updateOne(
      { _id: userId },
      { $inc: { coins: challenge.rewardCoins || 50 } },
    );
    await this.conn.collection('coin_transactions').insertOne({
      userId,
      gameType,
      amount: challenge.rewardCoins || 50,
      type: 'credit',
      source: 'daily_challenge',
      meta: { date: today, gameType, challengeId: challenge._id },
      createdAt: new Date(),
    });
    return { rewarded: true, coins: challenge.rewardCoins || 50 };
  }
}
