// @sally/social
// Social features for SallyCards multiplayer experience.

// Chat
export { ChatService, QUICK_REPLIES } from './lib/chat.service';
export type { ChatMessage } from './lib/chat.service';

// Friends
export {
  createFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  blockFriendRequest,
  getHeadToHead,
  recordHeadToHead,
  getPendingRequests,
  getFriendsList,
} from './lib/friends.service';
export type { FriendRequest, FriendProfile } from './lib/friends.service';

// Achievements
export {
  ACHIEVEMENTS,
  checkAchievement,
  getAchievementsByGame,
  getAchievementsByCategory,
  getAllAchievements,
  getUserProgress,
} from './lib/achievements';
export type { AchievementDef, AchievementCategory } from './lib/achievements';

// Tournaments
export {
  generateBracket,
  advanceWinner,
  createTournament,
  registerParticipant,
  startTournament,
} from './lib/tournament';
export type {
  Tournament,
  TournamentParticipant,
  TournamentMatch,
  TournamentRound,
} from './lib/tournament';

// Daily Challenges
export {
  generateDailyChallenges,
  checkChallengeCompletion,
} from './lib/daily-challenges';
export type { DailyChallenge } from './lib/daily-challenges';

// Presence
export { PresenceService } from './lib/presence.service';
export type { UserStatus, PresenceInfo } from './lib/presence.service';

// Shop & IAP
export {
  SHOP_ITEMS,
  canAfford,
  purchaseItem,
  ownsItem,
  grantItem,
  getOwnedItems,
  getShopItemsByType,
} from './lib/shop';
export type { ShopItem } from './lib/shop';

// Game Invites
export {
  createInvite,
  acceptInvite,
  declineInvite,
  createShareLink,
  createWhatsAppMessage,
  getPendingInvites,
  expireStaleInvites,
  createInviteMessage,
  createWhatsAppUrl,
  createSmsUrl,
  createTelegramUrl,
} from './lib/invite.service';
export type { GameInvite } from './lib/invite.service';

// Chat Overlay UI
export { ChatOverlay } from './lib/ChatOverlay';
export type { ChatOverlayProps } from './lib/ChatOverlay';

// Game Replay
export { ReplayService } from './lib/replay.service';
export type { GameReplay, ReplayMove, ReplayPlayer } from './lib/replay.service';

// Spectator Analytics
export {
  calculateWinProbability,
  getCardCountStats,
  aggregateSpectatorStats,
} from './lib/spectator-analytics';
export type { SpectatorStats, SpectatorSession } from './lib/spectator-analytics';

// Referral System
export {
  generateReferralCode,
  createReferralLink,
  createReferralShareMessage,
} from './lib/referral.service';
export type { ReferralInfo } from './lib/referral.service';

// Seasonal Events
export {
  SEASONAL_EVENTS,
  getCurrentEvent,
  isEventActive,
  getActiveEvents,
  getNextEvent,
} from './lib/seasonal-events';
export type { SeasonalEvent } from './lib/seasonal-events';
