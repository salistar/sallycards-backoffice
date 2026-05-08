// Bot Personality System for SallyCards AI opponents

export type BotPersonalityType = 'cautious' | 'aggressive' | 'balanced' | 'trickster' | 'beginner';
export type BotDifficulty = 'easy' | 'medium' | 'hard';

export interface BotConfig {
  personality: BotPersonalityType;
  difficulty: BotDifficulty;
  thinkTimeMin: number;  // ms
  thinkTimeMax: number;  // ms
  bluffRate: number;      // 0-1
  memoryAccuracy: number; // 0-1 (how well bot remembers played cards)
  aggression: number;     // 0-1
  riskTolerance: number;  // 0-1
}

export interface BotProfile extends BotConfig {
  name: string;
  avatar: string;
}

export const BOT_PROFILES: Record<string, BotProfile> = {
  yassine: {
    name: 'Yassine',
    avatar: 'bot_yassine',
    personality: 'beginner',
    difficulty: 'easy',
    thinkTimeMin: 1500,
    thinkTimeMax: 3000,
    bluffRate: 0.1,
    memoryAccuracy: 0.2,
    aggression: 0.2,
    riskTolerance: 0.3,
  },
  fatima: {
    name: 'Fatima',
    avatar: 'bot_fatima',
    personality: 'cautious',
    difficulty: 'easy',
    thinkTimeMin: 1000,
    thinkTimeMax: 2500,
    bluffRate: 0.05,
    memoryAccuracy: 0.4,
    aggression: 0.15,
    riskTolerance: 0.2,
  },
  hamid: {
    name: 'Hamid',
    avatar: 'bot_hamid',
    personality: 'aggressive',
    difficulty: 'medium',
    thinkTimeMin: 800,
    thinkTimeMax: 2000,
    bluffRate: 0.45,
    memoryAccuracy: 0.6,
    aggression: 0.85,
    riskTolerance: 0.8,
  },
  nora: {
    name: 'Nora',
    avatar: 'bot_nora',
    personality: 'balanced',
    difficulty: 'medium',
    thinkTimeMin: 1000,
    thinkTimeMax: 2500,
    bluffRate: 0.2,
    memoryAccuracy: 0.7,
    aggression: 0.5,
    riskTolerance: 0.5,
  },
  amine: {
    name: 'Amine',
    avatar: 'bot_amine',
    personality: 'trickster',
    difficulty: 'medium',
    thinkTimeMin: 600,
    thinkTimeMax: 1800,
    bluffRate: 0.35,
    memoryAccuracy: 0.5,
    aggression: 0.6,
    riskTolerance: 0.7,
  },
  karima: {
    name: 'Karima',
    avatar: 'bot_karima',
    personality: 'balanced',
    difficulty: 'hard',
    thinkTimeMin: 800,
    thinkTimeMax: 2500,
    bluffRate: 0.25,
    memoryAccuracy: 0.95,
    aggression: 0.55,
    riskTolerance: 0.5,
  },
  brahim: {
    name: 'Brahim',
    avatar: 'bot_brahim',
    personality: 'trickster',
    difficulty: 'hard',
    thinkTimeMin: 500,
    thinkTimeMax: 2000,
    bluffRate: 0.5,
    memoryAccuracy: 0.85,
    aggression: 0.7,
    riskTolerance: 0.75,
  },
  salma: {
    name: 'Salma',
    avatar: 'bot_salma',
    personality: 'balanced',
    difficulty: 'medium',
    thinkTimeMin: 800,
    thinkTimeMax: 2200,
    bluffRate: 0.2,
    memoryAccuracy: 0.6,
    aggression: 0.45,
    riskTolerance: 0.5,
  },
};

/**
 * Get a random think delay for the bot, within its configured range.
 * Adds a small random jitter for human-like feel.
 */
export function getBotThinkDelay(config: BotConfig): number {
  const { thinkTimeMin, thinkTimeMax } = config;
  const base = thinkTimeMin + Math.random() * (thinkTimeMax - thinkTimeMin);
  // Add +/- 10% jitter
  const jitter = base * 0.1 * (Math.random() * 2 - 1);
  return Math.max(thinkTimeMin * 0.8, base + jitter);
}

/**
 * Select a bot profile suitable for a given difficulty.
 * Returns a random profile matching the requested difficulty.
 * Falls back to any profile if no exact match exists.
 */
export function selectBot(difficulty: BotDifficulty): BotProfile {
  const profiles = Object.values(BOT_PROFILES);
  const matching = profiles.filter((p) => p.difficulty === difficulty);
  if (matching.length === 0) {
    return profiles[Math.floor(Math.random() * profiles.length)];
  }
  return matching[Math.floor(Math.random() * matching.length)];
}

/**
 * Get all bot profiles as an array.
 */
export function getAllBotProfiles(): BotProfile[] {
  return Object.values(BOT_PROFILES);
}

/**
 * Get a specific bot profile by key.
 */
export function getBotProfile(key: string): BotProfile | undefined {
  return BOT_PROFILES[key];
}
