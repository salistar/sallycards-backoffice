import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

type Scope = 'world' | 'country' | 'city';
type Filter = 'season' | 'weekly' | 'allTime';

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  constructor(@InjectConnection() private readonly connection: Connection) {}

  private collectionNameFor(gameType: string) {
    return `${gameType}_users`;
  }

  /**
   * Fetch ranked users for a game, filtered by geographic scope.
   *   - world   → everyone
   *   - country → same `location.country` as the requester
   *   - city    → same `location.city` as the requester
   */
  async getGlobalRanking(
    gameType: string,
    page = 1,
    limit = 50,
    filter: Filter = 'season',
    scope: Scope = 'world',
    requesterCountry?: string,
    requesterCity?: string,
  ) {
    const query: any = { isGuest: { $ne: true } };
    if (scope === 'country' && requesterCountry) {
      query['location.country'] = requesterCountry;
    } else if (scope === 'city' && requesterCity) {
      query['location.city'] = requesterCity;
    }

    try {
      const col = this.collectionNameFor(gameType);
      const users = await this.connection
        .collection(col)
        .find(query, {
          projection: {
            _id: 1,
            username: 1,
            avatar: 1,
            'stats.elo': 1,
            'stats.gamesPlayed': 1,
            'stats.gamesWon': 1,
            'location.country': 1,
            'location.countryName': 1,
            'location.city': 1,
          },
        })
        .sort({ 'stats.elo': -1 })
        .skip(((page || 1) - 1) * (limit || 50))
        .limit(limit || 50)
        .toArray();

      const entries = users.map((u: any, i: number) => {
        const gp = u.stats?.gamesPlayed || 0;
        const gw = u.stats?.gamesWon || 0;
        return {
          rank: ((page || 1) - 1) * (limit || 50) + i + 1,
          userId: u._id?.toString(),
          username: u.username,
          avatar: u.avatar,
          elo: u.stats?.elo || 1000,
          gamesPlayed: gp,
          gamesWon: gw,
          winRate: gp > 0 ? Math.round((gw / gp) * 100) : 0,
          country: u.location?.country,
          countryName: u.location?.countryName,
          city: u.location?.city,
        };
      });

      return {
        gameType,
        scope,
        filter,
        entries,
        page,
        limit,
        total: entries.length,
      };
    } catch (err) {
      this.logger.error(`Leaderboard fetch failed: ${err instanceof Error ? err.message : 'unknown'}`);
      return { gameType, scope, filter, entries: [], page, limit, total: 0 };
    }
  }

  async getUserRank(
    gameType: string,
    userId: string,
    _filter: Filter = 'season',
  ) {
    const col = this.collectionNameFor(gameType);
    try {
      const { ObjectId } = require('mongodb');
      const _id = (() => { try { return new ObjectId(userId); } catch { return userId; } })();
      const user = await this.connection.collection(col).findOne({ _id }, { projection: { stats: 1 } });
      const myElo = user?.stats?.elo ?? 1000;
      const higher = await this.connection.collection(col).countDocuments({
        'stats.elo': { $gt: myElo },
        isGuest: { $ne: true },
      });
      const total = await this.connection.collection(col).countDocuments({ isGuest: { $ne: true } });
      return {
        gameType,
        userId,
        rank: higher + 1,
        elo: myElo,
        percentile: total > 0 ? Math.round(((total - higher) / total) * 100) : 0,
        gamesPlayed: user?.stats?.gamesPlayed ?? 0,
        gamesWon: user?.stats?.gamesWon ?? 0,
      };
    } catch (e) {
      return { gameType, userId, rank: null, elo: 1000, percentile: 0, gamesPlayed: 0, gamesWon: 0 };
    }
  }
}
