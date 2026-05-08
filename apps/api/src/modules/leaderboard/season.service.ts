import { Injectable, Logger } from '@nestjs/common';

export interface SeasonReward {
  userId: string;
  rank: number;
  reward: number;
}

export interface SeasonHistory {
  season: string;
  startDate: string;
  endDate: string;
  topPlayers: {
    userId: string;
    username: string;
    rank: number;
    elo: number;
    gamesWon: number;
  }[];
}

@Injectable()
export class SeasonService {
  private readonly logger = new Logger(SeasonService.name);

  private seasonHistory: SeasonHistory[] = [];

  /**
   * Get the current season identifier.
   * Format: "YYYY-QN" (e.g., "2026-Q2")
   */
  getCurrentSeason(): string {
    const now = new Date();
    const year = now.getFullYear();
    const quarter = Math.ceil((now.getMonth() + 1) / 3);
    return `${year}-Q${quarter}`;
  }

  /**
   * Get the start and end dates for the current season.
   */
  getCurrentSeasonDates(): { start: Date; end: Date } {
    const now = new Date();
    const year = now.getFullYear();
    const quarter = Math.ceil((now.getMonth() + 1) / 3);
    const startMonth = (quarter - 1) * 3;
    const endMonth = startMonth + 3;

    return {
      start: new Date(year, startMonth, 1),
      end: new Date(year, endMonth, 0, 23, 59, 59, 999),
    };
  }

  /**
   * Get the number of days remaining in the current season.
   */
  getDaysRemaining(): number {
    const { end } = this.getCurrentSeasonDates();
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  /**
   * End the current season: calculate final rankings, distribute rewards,
   * archive results, and reset leaderboards.
   *
   * Reward tiers:
   *   1st place: 5000 coins
   *   2nd place: 3000 coins
   *   3rd place: 2000 coins
   *   4th-10th: 1000 coins
   *   11th-50th: 500 coins
   *   51st-100th: 250 coins
   */
  async endSeason(): Promise<{ rewards: SeasonReward[] }> {
    const season = this.getCurrentSeason();
    this.logger.log(`Ending season: ${season}`);

    // In production, this would fetch from the database
    // For now, simulate with placeholder data
    const topPlayers = await this.getTopPlayersForCurrentSeason();

    const rewards: SeasonReward[] = topPlayers.map((player, index) => {
      const rank = index + 1;
      let reward: number;

      if (rank === 1) reward = 5000;
      else if (rank === 2) reward = 3000;
      else if (rank === 3) reward = 2000;
      else if (rank <= 10) reward = 1000;
      else if (rank <= 50) reward = 500;
      else if (rank <= 100) reward = 250;
      else reward = 100;

      return { userId: player.userId, rank, reward };
    });

    // Archive the season
    const { start, end } = this.getCurrentSeasonDates();
    this.seasonHistory.push({
      season,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      topPlayers: topPlayers.slice(0, 10).map((p, i) => ({
        ...p,
        rank: i + 1,
      })),
    });

    this.logger.log(
      `Season ${season} ended. ${rewards.length} players rewarded.`,
    );

    return { rewards };
  }

  /**
   * Get the history of all past seasons with their top players.
   */
  async getSeasonHistory(): Promise<SeasonHistory[]> {
    return [...this.seasonHistory];
  }

  /**
   * Get the top players for the current season.
   * In production, this would query the leaderboard collection.
   */
  private async getTopPlayersForCurrentSeason(): Promise<
    { userId: string; username: string; elo: number; gamesWon: number }[]
  > {
    // Placeholder: in production this queries the database
    return [];
  }

  /**
   * Check if the current season should end (called by a scheduled job).
   */
  async checkSeasonEnd(): Promise<boolean> {
    const daysRemaining = this.getDaysRemaining();
    if (daysRemaining <= 0) {
      await this.endSeason();
      return true;
    }
    return false;
  }
}
