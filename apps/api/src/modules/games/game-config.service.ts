import { Injectable, Logger } from '@nestjs/common';

export interface GameConfig {
  gameType: string;
  timerSeconds: number;
  enableBots: boolean;
  botFillDelay: number;
  maxSpectators: number;
  enableAnnouncements: boolean;
  enableChat: boolean;
  customRules: Record<string, any>;
}

const DEFAULT_CONFIGS: Record<string, GameConfig> = {
  RONDA: {
    gameType: 'RONDA',
    timerSeconds: 30,
    enableBots: true,
    botFillDelay: 10,
    maxSpectators: 10,
    enableAnnouncements: true,
    enableChat: true,
    customRules: {
      targetScore: 21,
      allowTringa: true,
      allowRondaAnnounce: true,
    },
  },
  KDOUB: {
    gameType: 'KDOUB',
    timerSeconds: 30,
    enableBots: true,
    botFillDelay: 10,
    maxSpectators: 10,
    enableAnnouncements: true,
    enableChat: true,
    customRules: {
      targetScore: 11,
    },
  },
  BELOTE: {
    gameType: 'BELOTE',
    timerSeconds: 45,
    enableBots: true,
    botFillDelay: 15,
    maxSpectators: 10,
    enableAnnouncements: true,
    enableChat: true,
    customRules: {
      targetScore: 501,
      enableCoinche: false,
      enableBeloteRebelote: true,
    },
  },
  POKER: {
    gameType: 'POKER',
    timerSeconds: 60,
    enableBots: true,
    botFillDelay: 15,
    maxSpectators: 50,
    enableAnnouncements: false,
    enableChat: true,
    customRules: {
      smallBlind: 10,
      bigBlind: 20,
      startingChips: 1000,
      maxRaises: 4,
      variant: 'texas_holdem',
    },
  },
  TAROT: {
    gameType: 'TAROT',
    timerSeconds: 45,
    enableBots: true,
    botFillDelay: 15,
    maxSpectators: 10,
    enableAnnouncements: true,
    enableChat: true,
    customRules: {
      playerCount: 4,
      enablePetitAuBout: true,
      enablePoignee: true,
    },
  },
  SCOPA: {
    gameType: 'SCOPA',
    timerSeconds: 30,
    enableBots: true,
    botFillDelay: 10,
    maxSpectators: 10,
    enableAnnouncements: true,
    enableChat: true,
    customRules: {
      targetScore: 11,
      enableScopone: false,
    },
  },
  OKEY: {
    gameType: 'OKEY',
    timerSeconds: 45,
    enableBots: true,
    botFillDelay: 15,
    maxSpectators: 10,
    enableAnnouncements: true,
    enableChat: true,
    customRules: {
      enableOpeningHand: true,
      enablePairs: true,
    },
  },
  CONCENTRATION: {
    gameType: 'CONCENTRATION',
    timerSeconds: 15,
    enableBots: true,
    botFillDelay: 5,
    maxSpectators: 20,
    enableAnnouncements: false,
    enableChat: false,
    customRules: {
      gridSize: '4x4',
      deckType: 'french52',
      enableTimer: true,
    },
  },
  SOLITAIRE: {
    gameType: 'SOLITAIRE',
    timerSeconds: 0,
    enableBots: false,
    botFillDelay: 0,
    maxSpectators: 5,
    enableAnnouncements: false,
    enableChat: false,
    customRules: {
      drawMode: 1,
      enableUndo: true,
      enableHints: true,
      enableAutoComplete: true,
    },
  },
  QUIESTCE: {
    gameType: 'QUIESTCE',
    timerSeconds: 60,
    enableBots: false,
    botFillDelay: 0,
    maxSpectators: 20,
    enableAnnouncements: false,
    enableChat: true,
    customRules: {
      roundCount: 10,
      questionCategories: ['personality', 'preferences', 'hypothetical'],
      enableCustomQuestions: true,
    },
  },
};

@Injectable()
export class GameConfigService {
  private readonly logger = new Logger(GameConfigService.name);
  private configOverrides: Map<string, Partial<GameConfig>> = new Map();

  /**
   * Get the effective configuration for a game type.
   * Merges default config with any stored overrides.
   */
  async getConfig(gameType: string): Promise<GameConfig> {
    const defaultConfig = this.getDefaultConfig(gameType);
    const overrides = this.configOverrides.get(gameType);

    if (!overrides) {
      return defaultConfig;
    }

    return {
      ...defaultConfig,
      ...overrides,
      customRules: {
        ...defaultConfig.customRules,
        ...(overrides.customRules || {}),
      },
    };
  }

  /**
   * Update the configuration for a game type.
   * Only the provided fields are updated; the rest remain default.
   */
  async updateConfig(
    gameType: string,
    updates: Partial<GameConfig>,
  ): Promise<GameConfig> {
    const existing = this.configOverrides.get(gameType) || {};

    const merged: Partial<GameConfig> = {
      ...existing,
      ...updates,
    };

    if (updates.customRules) {
      merged.customRules = {
        ...(existing.customRules || {}),
        ...updates.customRules,
      };
    }

    this.configOverrides.set(gameType, merged);
    this.logger.log(`Updated config for ${gameType}`);

    return this.getConfig(gameType);
  }

  /**
   * Get the default configuration for a game type.
   * Throws if the game type is unknown.
   */
  getDefaultConfig(gameType: string): GameConfig {
    const config = DEFAULT_CONFIGS[gameType];
    if (!config) {
      this.logger.warn(`Unknown game type: ${gameType}, returning generic defaults`);
      return {
        gameType,
        timerSeconds: 30,
        enableBots: true,
        botFillDelay: 10,
        maxSpectators: 10,
        enableAnnouncements: false,
        enableChat: true,
        customRules: {},
      };
    }

    return { ...config, customRules: { ...config.customRules } };
  }

  /**
   * Get all available game types.
   */
  getAvailableGameTypes(): string[] {
    return Object.keys(DEFAULT_CONFIGS);
  }

  /**
   * Reset configuration overrides for a game type.
   */
  async resetConfig(gameType: string): Promise<GameConfig> {
    this.configOverrides.delete(gameType);
    this.logger.log(`Reset config for ${gameType}`);
    return this.getDefaultConfig(gameType);
  }
}
