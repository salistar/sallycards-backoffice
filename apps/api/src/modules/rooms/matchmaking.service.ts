import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../common/services/redis.service';

interface QueueEntry {
  userId: string;
  elo: number;
  joinedAt: number; // timestamp in ms
}

@Injectable()
export class MatchmakingService {
  private readonly logger = new Logger(MatchmakingService.name);

  /** Base ELO range for matching */
  private readonly BASE_RANGE = 200;

  /** How much the range expands per second of waiting */
  private readonly RANGE_EXPANSION_PER_SEC = 10;

  /** Maximum expanded range */
  private readonly MAX_RANGE = 600;

  /** Minimum players needed for a match (1v1) */
  private readonly MIN_PLAYERS = 2;

  constructor(private readonly redisService: RedisService) {}

  /**
   * Add a player to the matchmaking queue for a specific game type.
   */
  async joinQueue(
    userId: string,
    gameType: string,
    elo: number,
  ): Promise<void> {
    // Store the player in the Redis sorted set (score = elo)
    await this.redisService.addToMatchmaking(gameType, userId, elo);

    // Store join timestamp for range expansion
    const metaKey = `matchmaking:meta:${gameType}:${userId}`;
    await this.redisService
      .getClient()
      .set(metaKey, Date.now().toString(), 'EX', 600); // 10 min max queue time

    this.logger.log(
      `User ${userId} joined ${gameType} queue with ELO ${elo}`,
    );
  }

  /**
   * Remove a player from the matchmaking queue.
   */
  async leaveQueue(userId: string, gameType: string): Promise<void> {
    await this.redisService.removeFromMatchmaking(gameType, userId);

    const metaKey = `matchmaking:meta:${gameType}:${userId}`;
    await this.redisService.getClient().del(metaKey);

    this.logger.log(`User ${userId} left ${gameType} queue`);
  }

  /**
   * Try to find a match in the queue for a given game type.
   * Looks for two players within an ELO range that expands over time.
   *
   * @returns matched player IDs or null if no match found
   */
  async findMatch(
    gameType: string,
  ): Promise<{ players: string[] } | null> {
    const client = this.redisService.getClient();
    const queueKey = `matchmaking:${gameType}`;

    // Get all players in queue with their ELO scores
    const rawEntries = await client.zrange(queueKey, 0, -1, 'WITHSCORES');

    if (rawEntries.length < this.MIN_PLAYERS * 2) {
      return null; // Not enough players
    }

    // Parse into structured entries
    const entries: QueueEntry[] = [];
    for (let i = 0; i < rawEntries.length; i += 2) {
      const userId = rawEntries[i];
      const elo = parseFloat(rawEntries[i + 1]);

      const metaKey = `matchmaking:meta:${gameType}:${userId}`;
      const joinedAtStr = await client.get(metaKey);
      const joinedAt = joinedAtStr ? parseInt(joinedAtStr, 10) : Date.now();

      entries.push({ userId, elo, joinedAt });
    }

    // Sort by ELO for efficient matching
    entries.sort((a, b) => a.elo - b.elo);

    const now = Date.now();

    // Try to find two compatible players
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const a = entries[i];
        const b = entries[j];

        // Calculate expanded range based on how long each player has been waiting
        const waitA = (now - a.joinedAt) / 1000;
        const waitB = (now - b.joinedAt) / 1000;
        const maxWait = Math.max(waitA, waitB);

        const expandedRange = Math.min(
          this.BASE_RANGE + maxWait * this.RANGE_EXPANSION_PER_SEC,
          this.MAX_RANGE,
        );

        const eloDiff = Math.abs(a.elo - b.elo);

        if (eloDiff <= expandedRange) {
          // Match found! Remove both players from the queue
          await this.leaveQueue(a.userId, gameType);
          await this.leaveQueue(b.userId, gameType);

          this.logger.log(
            `Match found in ${gameType}: ${a.userId} (${a.elo}) vs ${b.userId} (${b.elo}), diff=${eloDiff}`,
          );

          return { players: [a.userId, b.userId] };
        }
      }
    }

    return null;
  }
}
