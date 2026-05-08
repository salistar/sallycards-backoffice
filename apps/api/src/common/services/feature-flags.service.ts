import { Injectable, Logger } from '@nestjs/common';

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string;
  rolloutPercentage: number; // 0-100
  enabledForUserIds: string[];
  disabledForUserIds: string[];
}

/**
 * Default feature flags for SallyCards.
 * These are loaded on startup and can be overridden at runtime.
 */
export const DEFAULT_FLAGS: FeatureFlag[] = [
  {
    key: 'video_conference',
    enabled: false,
    description: 'In-game video chat via WebRTC',
    rolloutPercentage: 0,
    enabledForUserIds: [],
    disabledForUserIds: [],
  },
  {
    key: 'tournament_mode',
    enabled: true,
    description: 'Tournament system with brackets and prizes',
    rolloutPercentage: 100,
    enabledForUserIds: [],
    disabledForUserIds: [],
  },
  {
    key: 'ramadan_theme',
    enabled: false,
    description: 'Ramadan seasonal theme and decorations',
    rolloutPercentage: 100,
    enabledForUserIds: [],
    disabledForUserIds: [],
  },
  {
    key: 'dark_mode_v2',
    enabled: false,
    description: 'Redesigned dark mode with AMOLED support',
    rolloutPercentage: 50,
    enabledForUserIds: [],
    disabledForUserIds: [],
  },
  {
    key: 'in_app_purchases',
    enabled: true,
    description: 'In-app purchases for coins and items',
    rolloutPercentage: 100,
    enabledForUserIds: [],
    disabledForUserIds: [],
  },
  {
    key: 'bluetooth_game',
    enabled: true,
    description: 'Bluetooth LE local multiplayer gaming',
    rolloutPercentage: 100,
    enabledForUserIds: [],
    disabledForUserIds: [],
  },
  {
    key: 'ai_opponents',
    enabled: false,
    description: 'AI-powered bot opponents for solo play',
    rolloutPercentage: 0,
    enabledForUserIds: [],
    disabledForUserIds: [],
  },
  {
    key: 'spectator_mode',
    enabled: false,
    description: 'Watch live games as a spectator',
    rolloutPercentage: 0,
    enabledForUserIds: [],
    disabledForUserIds: [],
  },
];

@Injectable()
export class FeatureFlagService {
  private readonly logger = new Logger(FeatureFlagService.name);
  private flags: Map<string, FeatureFlag> = new Map();

  constructor() {
    this.loadDefaults();
  }

  /**
   * Check if a feature flag is enabled for a given user.
   * Evaluation order:
   *   1. Explicit user deny list -> disabled
   *   2. Explicit user allow list -> enabled
   *   3. Global enabled check
   *   4. Rollout percentage (deterministic hash based on userId)
   */
  isEnabled(key: string, userId?: string): boolean {
    const flag = this.flags.get(key);
    if (!flag) {
      this.logger.warn(`Feature flag "${key}" not found, defaulting to disabled`);
      return false;
    }

    if (!flag.enabled) {
      return false;
    }

    if (userId) {
      // Explicit deny list takes priority
      if (flag.disabledForUserIds.includes(userId)) {
        return false;
      }

      // Explicit allow list
      if (flag.enabledForUserIds.includes(userId)) {
        return true;
      }

      // Percentage-based rollout using deterministic hash
      if (flag.rolloutPercentage < 100) {
        const hash = this.hashUserId(userId, key);
        return hash < flag.rolloutPercentage;
      }
    }

    // If no userId and rollout < 100, treat as disabled for anonymous
    if (!userId && flag.rolloutPercentage < 100) {
      return false;
    }

    return true;
  }

  /**
   * Get all registered feature flags.
   */
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  /**
   * Get a single flag by key.
   */
  getFlag(key: string): FeatureFlag | undefined {
    return this.flags.get(key);
  }

  /**
   * Enable or disable a flag globally.
   */
  setFlag(key: string, enabled: boolean): void {
    const flag = this.flags.get(key);
    if (!flag) {
      this.logger.warn(`Feature flag "${key}" not found`);
      return;
    }
    flag.enabled = enabled;
    this.logger.log(`Feature flag "${key}" set to ${enabled}`);
  }

  /**
   * Set the rollout percentage for a flag (0-100).
   */
  setRollout(key: string, percentage: number): void {
    const flag = this.flags.get(key);
    if (!flag) {
      this.logger.warn(`Feature flag "${key}" not found`);
      return;
    }
    flag.rolloutPercentage = Math.max(0, Math.min(100, percentage));
    this.logger.log(`Feature flag "${key}" rollout set to ${flag.rolloutPercentage}%`);
  }

  /**
   * Add a user to the explicit allow list for a flag.
   */
  enableForUser(key: string, userId: string): void {
    const flag = this.flags.get(key);
    if (!flag) return;
    if (!flag.enabledForUserIds.includes(userId)) {
      flag.enabledForUserIds.push(userId);
    }
    // Remove from deny list if present
    flag.disabledForUserIds = flag.disabledForUserIds.filter((id) => id !== userId);
  }

  /**
   * Add a user to the explicit deny list for a flag.
   */
  disableForUser(key: string, userId: string): void {
    const flag = this.flags.get(key);
    if (!flag) return;
    if (!flag.disabledForUserIds.includes(userId)) {
      flag.disabledForUserIds.push(userId);
    }
    // Remove from allow list if present
    flag.enabledForUserIds = flag.enabledForUserIds.filter((id) => id !== userId);
  }

  /**
   * Register a new feature flag at runtime.
   */
  registerFlag(flag: FeatureFlag): void {
    this.flags.set(flag.key, { ...flag });
    this.logger.log(`Feature flag "${flag.key}" registered`);
  }

  // --- Private ---

  private loadDefaults(): void {
    for (const flag of DEFAULT_FLAGS) {
      this.flags.set(flag.key, { ...flag });
    }
    this.logger.log(`Loaded ${DEFAULT_FLAGS.length} default feature flags`);
  }

  /**
   * Deterministic hash of userId + flagKey to a number 0-99.
   * Ensures the same user always gets the same result for a given flag.
   */
  private hashUserId(userId: string, flagKey: string): number {
    const str = `${userId}:${flagKey}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 100;
  }
}
