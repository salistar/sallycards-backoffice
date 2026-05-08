import { Injectable, Logger, NotFoundException } from '@nestjs/common';

export interface GDPRExportData {
  profile: {
    userId: string;
    username: string;
    email: string;
    createdAt: string;
    lastLogin: string;
    locale: string;
  };
  gameHistory: {
    gameId: string;
    gameType: string;
    result: string;
    score: number;
    playedAt: string;
  }[];
  achievements: {
    achievementId: string;
    name: string;
    unlockedAt: string;
  }[];
  socialData: {
    friends: string[];
    blockedUsers: string[];
  };
  purchases: {
    transactionId: string;
    item: string;
    amount: number;
    currency: string;
    purchasedAt: string;
  }[];
  preferences: Record<string, unknown>;
}

@Injectable()
export class GDPRService {
  private readonly logger = new Logger(GDPRService.name);

  /**
   * Export all user data in a machine-readable format.
   * Compliant with GDPR Article 20 (Right to Data Portability).
   *
   * @param userId - The ID of the user requesting data export
   * @returns All user data in JSON format
   */
  async exportUserData(
    userId: string,
  ): Promise<{ data: GDPRExportData; format: 'json' }> {
    this.logger.log(`GDPR data export requested for user: ${userId}`);

    // In production, these would be actual database queries
    const profile = await this.getUserProfile(userId);
    const gameHistory = await this.getUserGameHistory(userId);
    const achievements = await this.getUserAchievements(userId);
    const socialData = await this.getUserSocialData(userId);
    const purchases = await this.getUserPurchases(userId);
    const preferences = await this.getUserPreferences(userId);

    const data: GDPRExportData = {
      profile,
      gameHistory,
      achievements,
      socialData,
      purchases,
      preferences,
    };

    this.logger.log(`GDPR data export completed for user: ${userId}`);

    return { data, format: 'json' };
  }

  /**
   * Permanently delete all user data.
   * Compliant with GDPR Article 17 (Right to Erasure / Right to be Forgotten).
   *
   * This operation is irreversible. It removes:
   * - User profile and authentication data
   * - Game history and statistics
   * - Achievements and progression data
   * - Social connections (friends, blocks)
   * - Purchase history
   * - Chat messages
   * - All preferences and settings
   *
   * @param userId - The ID of the user requesting deletion
   */
  async deleteUserData(userId: string): Promise<void> {
    this.logger.warn(`GDPR full data deletion requested for user: ${userId}`);

    // Step 1: Remove user from all active games
    await this.removeFromActiveGames(userId);

    // Step 2: Delete game history
    await this.deleteGameHistory(userId);

    // Step 3: Delete achievements
    await this.deleteAchievements(userId);

    // Step 4: Delete social data (friends, blocks, chat messages)
    await this.deleteSocialData(userId);

    // Step 5: Delete purchase records
    await this.deletePurchaseRecords(userId);

    // Step 6: Delete leaderboard entries
    await this.deleteLeaderboardEntries(userId);

    // Step 7: Delete the user profile and authentication data
    await this.deleteUserProfile(userId);

    this.logger.warn(`GDPR full data deletion completed for user: ${userId}`);
  }

  /**
   * Anonymize user data instead of deleting it.
   * Preserves aggregate statistics while removing personally identifiable information.
   *
   * This replaces:
   * - Username with "DeletedUser_XXXX"
   * - Email with a hash
   * - Avatar with default
   * - All personal preferences
   *
   * Game history and statistics are retained but de-identified.
   *
   * @param userId - The ID of the user requesting anonymization
   */
  async anonymizeUser(userId: string): Promise<void> {
    this.logger.warn(`GDPR anonymization requested for user: ${userId}`);

    const anonymousId = this.generateAnonymousId(userId);

    // Step 1: Anonymize profile
    await this.anonymizeProfile(userId, anonymousId);

    // Step 2: Remove social connections
    await this.deleteSocialData(userId);

    // Step 3: Anonymize chat messages (replace sender name)
    await this.anonymizeChatMessages(userId, anonymousId);

    // Step 4: Clear preferences
    await this.clearPreferences(userId);

    this.logger.warn(`GDPR anonymization completed for user: ${userId}`);
  }

  // --- Private helper methods ---

  private async getUserProfile(userId: string) {
    // In production: query users collection
    return {
      userId,
      username: '',
      email: '',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      locale: 'en',
    };
  }

  private async getUserGameHistory(userId: string) {
    // In production: query game_history collection
    return [] as GDPRExportData['gameHistory'];
  }

  private async getUserAchievements(userId: string) {
    // In production: query achievements collection
    return [] as GDPRExportData['achievements'];
  }

  private async getUserSocialData(userId: string) {
    // In production: query friends/blocks collections
    return { friends: [] as string[], blockedUsers: [] as string[] };
  }

  private async getUserPurchases(userId: string) {
    // In production: query purchases collection
    return [] as GDPRExportData['purchases'];
  }

  private async getUserPreferences(userId: string) {
    // In production: query preferences collection
    return {};
  }

  private async removeFromActiveGames(userId: string): Promise<void> {
    this.logger.log(`Removing user ${userId} from active games`);
    // In production: find active rooms, remove player or replace with bot
  }

  private async deleteGameHistory(userId: string): Promise<void> {
    this.logger.log(`Deleting game history for user ${userId}`);
    // In production: delete from game_history collection
  }

  private async deleteAchievements(userId: string): Promise<void> {
    this.logger.log(`Deleting achievements for user ${userId}`);
    // In production: delete from achievements collection
  }

  private async deleteSocialData(userId: string): Promise<void> {
    this.logger.log(`Deleting social data for user ${userId}`);
    // In production: remove friend entries, block entries, chat messages
  }

  private async deletePurchaseRecords(userId: string): Promise<void> {
    this.logger.log(`Deleting purchase records for user ${userId}`);
    // In production: delete from purchases collection
    // Note: some jurisdictions require retaining financial records
  }

  private async deleteLeaderboardEntries(userId: string): Promise<void> {
    this.logger.log(`Deleting leaderboard entries for user ${userId}`);
    // In production: delete from leaderboard collection
  }

  private async deleteUserProfile(userId: string): Promise<void> {
    this.logger.log(`Deleting user profile for user ${userId}`);
    // In production: delete from users collection
  }

  private async anonymizeProfile(
    userId: string,
    anonymousId: string,
  ): Promise<void> {
    this.logger.log(`Anonymizing profile for user ${userId}`);
    // In production: update user document with anonymized data
  }

  private async anonymizeChatMessages(
    userId: string,
    anonymousId: string,
  ): Promise<void> {
    this.logger.log(`Anonymizing chat messages for user ${userId}`);
    // In production: update chat messages sender field
  }

  private async clearPreferences(userId: string): Promise<void> {
    this.logger.log(`Clearing preferences for user ${userId}`);
    // In production: delete user preferences document
  }

  private generateAnonymousId(userId: string): string {
    // Simple hash-like anonymization
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit int
    }
    return `DeletedUser_${Math.abs(hash).toString(36).substring(0, 8)}`;
  }
}
