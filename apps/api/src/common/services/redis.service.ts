import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: Redis;
  private subscriber!: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        const delay = Math.min(times * 200, 5000);
        return delay;
      },
    });
    this.subscriber = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
    });

    this.client.on('connect', () => this.logger.log('Redis client connected'));
    this.client.on('error', (err) => this.logger.error('Redis client error', err));
    this.subscriber.on('error', (err) => this.logger.error('Redis subscriber error', err));
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.quit();
    await this.subscriber?.quit();
    this.logger.log('Redis connections closed');
  }

  // ──────────────────────────────────────────
  // Game state operations
  // ──────────────────────────────────────────

  async setGameState(roomId: string, state: object): Promise<void> {
    try {
      const key = `game:state:${roomId}`;
      await this.client.set(key, JSON.stringify(state), 'EX', 86400); // 24h TTL
    } catch (error) {
      this.logger.error(`Failed to set game state for ${roomId}`, error);
      throw error;
    }
  }

  async getGameState(roomId: string): Promise<object | null> {
    try {
      const key = `game:state:${roomId}`;
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      this.logger.error(`Failed to get game state for ${roomId}`, error);
      return null;
    }
  }

  async deleteGameState(roomId: string): Promise<void> {
    try {
      const key = `game:state:${roomId}`;
      await this.client.del(key);
    } catch (error) {
      this.logger.error(`Failed to delete game state for ${roomId}`, error);
      throw error;
    }
  }

  // ──────────────────────────────────────────
  // Presence
  // ──────────────────────────────────────────

  async setOnline(userId: string): Promise<void> {
    try {
      const key = `presence:${userId}`;
      await this.client.set(key, '1', 'EX', 30); // 30s TTL, must be refreshed via heartbeat
    } catch (error) {
      this.logger.error(`Failed to set online status for ${userId}`, error);
      throw error;
    }
  }

  async isOnline(userId: string): Promise<boolean> {
    try {
      const key = `presence:${userId}`;
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to check online status for ${userId}`, error);
      return false;
    }
  }

  async setOffline(userId: string): Promise<void> {
    try {
      const key = `presence:${userId}`;
      await this.client.del(key);
    } catch (error) {
      this.logger.error(`Failed to set offline status for ${userId}`, error);
      throw error;
    }
  }

  // ──────────────────────────────────────────
  // Session
  // ──────────────────────────────────────────

  async setSession(userId: string, sessionData: object): Promise<void> {
    try {
      const key = `session:${userId}`;
      await this.client.set(key, JSON.stringify(sessionData), 'EX', 604800); // 7 days
    } catch (error) {
      this.logger.error(`Failed to set session for ${userId}`, error);
      throw error;
    }
  }

  async getSession(userId: string): Promise<object | null> {
    try {
      const key = `session:${userId}`;
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      this.logger.error(`Failed to get session for ${userId}`, error);
      return null;
    }
  }

  async deleteSession(userId: string): Promise<void> {
    try {
      const key = `session:${userId}`;
      await this.client.del(key);
    } catch (error) {
      this.logger.error(`Failed to delete session for ${userId}`, error);
      throw error;
    }
  }

  // ──────────────────────────────────────────
  // Matchmaking queue (Sorted Set by ELO)
  // ──────────────────────────────────────────

  async addToMatchmaking(
    gameType: string,
    userId: string,
    elo: number,
  ): Promise<void> {
    try {
      const key = `matchmaking:${gameType}`;
      await this.client.zadd(key, elo, userId);
    } catch (error) {
      this.logger.error(`Failed to add ${userId} to matchmaking for ${gameType}`, error);
      throw error;
    }
  }

  async findMatch(
    gameType: string,
    elo: number,
    range: number,
  ): Promise<string[]> {
    try {
      const key = `matchmaking:${gameType}`;
      return await this.client.zrangebyscore(key, elo - range, elo + range);
    } catch (error) {
      this.logger.error(`Failed to find match for gameType ${gameType}`, error);
      return [];
    }
  }

  async removeFromMatchmaking(
    gameType: string,
    userId: string,
  ): Promise<void> {
    try {
      const key = `matchmaking:${gameType}`;
      await this.client.zrem(key, userId);
    } catch (error) {
      this.logger.error(`Failed to remove ${userId} from matchmaking for ${gameType}`, error);
      throw error;
    }
  }

  // ──────────────────────────────────────────
  // Leaderboard (Sorted Set)
  // ──────────────────────────────────────────

  async updateLeaderboard(
    gameType: string,
    userId: string,
    score: number,
  ): Promise<void> {
    try {
      const key = `leaderboard:${gameType}`;
      await this.client.zadd(key, score, userId);
    } catch (error) {
      this.logger.error(`Failed to update leaderboard for ${gameType}`, error);
      throw error;
    }
  }

  async getLeaderboard(
    gameType: string,
    start: number,
    end: number,
  ): Promise<{ userId: string; score: number }[]> {
    try {
      const key = `leaderboard:${gameType}`;
      const results = await this.client.zrevrange(key, start, end, 'WITHSCORES');

      const entries: { userId: string; score: number }[] = [];
      for (let i = 0; i < results.length; i += 2) {
        entries.push({
          userId: results[i],
          score: parseFloat(results[i + 1]),
        });
      }
      return entries;
    } catch (error) {
      this.logger.error(`Failed to get leaderboard for ${gameType}`, error);
      return [];
    }
  }

  async getUserRank(
    gameType: string,
    userId: string,
  ): Promise<number | null> {
    try {
      const key = `leaderboard:${gameType}`;
      const rank = await this.client.zrevrank(key, userId);
      return rank !== null ? rank + 1 : null; // 1-based ranking
    } catch (error) {
      this.logger.error(`Failed to get user rank for ${userId}`, error);
      return null;
    }
  }

  // ──────────────────────────────────────────
  // Rate limiting
  // ──────────────────────────────────────────

  async checkRateLimit(
    key: string,
    maxRequests: number,
    windowSeconds: number,
  ): Promise<boolean> {
    try {
      const redisKey = `ratelimit:${key}`;
      const current = await this.client.incr(redisKey);
      if (current === 1) {
        await this.client.expire(redisKey, windowSeconds);
      }
      return current <= maxRequests;
    } catch (error) {
      this.logger.error(`Failed to check rate limit for ${key}`, error);
      return false;
    }
  }

  // ──────────────────────────────────────────
  // Room players tracking (Set)
  // ──────────────────────────────────────────

  async addPlayerToRoom(roomId: string, userId: string): Promise<void> {
    try {
      const key = `room:players:${roomId}`;
      await this.client.sadd(key, userId);
      await this.client.expire(key, 86400); // 24h TTL
    } catch (error) {
      this.logger.error(`Failed to add player ${userId} to room ${roomId}`, error);
      throw error;
    }
  }

  async removePlayerFromRoom(roomId: string, userId: string): Promise<void> {
    try {
      const key = `room:players:${roomId}`;
      await this.client.srem(key, userId);
    } catch (error) {
      this.logger.error(`Failed to remove player ${userId} from room ${roomId}`, error);
      throw error;
    }
  }

  async getRoomPlayers(roomId: string): Promise<string[]> {
    try {
      const key = `room:players:${roomId}`;
      return await this.client.smembers(key);
    } catch (error) {
      this.logger.error(`Failed to get players for room ${roomId}`, error);
      return [];
    }
  }

  // ──────────────────────────────────────────
  // Pub/Sub
  // ──────────────────────────────────────────

  async publish(channel: string, message: string): Promise<void> {
    try {
      await this.client.publish(channel, message);
    } catch (error) {
      this.logger.error(`Failed to publish to channel ${channel}`, error);
      throw error;
    }
  }

  async subscribe(
    channel: string,
    callback: (message: string) => void,
  ): Promise<void> {
    try {
      await this.subscriber.subscribe(channel);
      this.subscriber.on('message', (ch: string, msg: string) => {
        if (ch === channel) {
          callback(msg);
        }
      });
    } catch (error) {
      this.logger.error(`Failed to subscribe to channel ${channel}`, error);
      throw error;
    }
  }

  // ──────────────────────────────────────────
  // Generic helpers
  // ──────────────────────────────────────────

  getClient(): Redis {
    return this.client;
  }
}
