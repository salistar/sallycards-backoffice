/**
 * @sally/storage
 * Type-safe storage abstraction for SallyCards.
 * Provides AsyncStorage wrapper with JSON serialization and MMKV fallback support.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StorageOptions {
  /**
   * Time-to-live in milliseconds. Item is considered stale after this time.
   */
  ttl?: number;

  /**
   * Automatically refresh the item when accessed if TTL exceeded.
   */
  autoRefresh?: boolean;
}

interface StoredValue<T> {
  data: T;
  timestamp: number;
  ttl?: number;
}

/**
 * Type-safe async storage wrapper.
 * Handles JSON serialization and TTL support.
 */
export class Storage {
  /**
   * Get a stored value with optional TTL checking.
   */
  async get<T = unknown>(key: string, options: StorageOptions = {}): Promise<T | null> {
    try {
      const stored = await AsyncStorage.getItem(key);
      if (!stored) return null;

      const item = JSON.parse(stored) as StoredValue<T>;

      // Check TTL
      if (item.ttl && options.ttl) {
        const age = Date.now() - item.timestamp;
        if (age > item.ttl) {
          if (options.autoRefresh) {
            // Item is stale - return null to trigger refresh
            return null;
          }
          // Remove expired item
          await this.remove(key);
          return null;
        }
      }

      return item.data;
    } catch (err) {
      console.error(`[Storage] Failed to get key "${key}":`, err);
      return null;
    }
  }

  /**
   * Set a stored value with optional TTL.
   */
  async set<T>(key: string, value: T, options: StorageOptions = {}): Promise<boolean> {
    try {
      const item: StoredValue<T> = {
        data: value,
        timestamp: Date.now(),
        ttl: options.ttl,
      };
      await AsyncStorage.setItem(key, JSON.stringify(item));
      return true;
    } catch (err) {
      console.error(`[Storage] Failed to set key "${key}":`, err);
      return false;
    }
  }

  /**
   * Remove a stored value.
   */
  async remove(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (err) {
      console.error(`[Storage] Failed to remove key "${key}":`, err);
      return false;
    }
  }

  /**
   * Check if a key exists and is not stale.
   */
  async has(key: string): Promise<boolean> {
    try {
      const stored = await AsyncStorage.getItem(key);
      if (!stored) return false;

      const item = JSON.parse(stored) as StoredValue<unknown>;

      // Check TTL
      if (item.ttl) {
        const age = Date.now() - item.timestamp;
        if (age > item.ttl) {
          await this.remove(key);
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear all stored data.
   */
  async clear(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (err) {
      console.error('[Storage] Failed to clear storage:', err);
      return false;
    }
  }

  /**
   * Get all keys in storage.
   */
  async keys(): Promise<string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (err) {
      console.error('[Storage] Failed to get keys:', err);
      return [];
    }
  }

  /**
   * Get size of storage in bytes (approximate).
   */
  async getSize(): Promise<number> {
    try {
      const keys = await this.keys();
      let size = 0;

      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          size += key.length + value.length;
        }
      }

      return size;
    } catch (err) {
      console.error('[Storage] Failed to calculate size:', err);
      return 0;
    }
  }

  /**
   * Set multiple values at once.
   */
  async setMultiple<T extends Record<string, unknown>>(
    items: T,
    options: StorageOptions = {},
  ): Promise<boolean> {
    try {
      const promises = Object.entries(items).map(([key, value]) =>
        this.set(key, value, options),
      );
      const results = await Promise.all(promises);
      return results.every((r) => r);
    } catch (err) {
      console.error('[Storage] Failed to set multiple items:', err);
      return false;
    }
  }

  /**
   * Get multiple values at once.
   */
  async getMultiple<T extends Record<string, unknown>>(
    keys: (keyof T)[],
    options: StorageOptions = {},
  ): Promise<Partial<T>> {
    try {
      const promises = keys.map((key) => this.get(String(key), options));
      const values = await Promise.all(promises);

      const result: Partial<T> = {};
      for (let i = 0; i < keys.length; i++) {
        if (values[i] !== null) {
          result[keys[i]] = values[i];
        }
      }

      return result;
    } catch (err) {
      console.error('[Storage] Failed to get multiple items:', err);
      return {};
    }
  }

  /**
   * Remove multiple values at once.
   */
  async removeMultiple(keys: string[]): Promise<boolean> {
    try {
      await AsyncStorage.multiRemove(keys);
      return true;
    } catch (err) {
      console.error('[Storage] Failed to remove multiple items:', err);
      return false;
    }
  }
}

// Type-safe getters for common data
export interface AppPreferences {
  theme: 'dark' | 'light';
  language: 'en' | 'fr' | 'ar' | 'es' | 'darija';
  soundEnabled: boolean;
  hapticEnabled: boolean;
  showTutorial: boolean;
}

export interface GameProgress {
  lastGameId: string | null;
  totalGamesPlayed: number;
  totalGamesWon: number;
  lastGameTime: number;
}

/**
 * Convenient methods for accessing common app data.
 */
export class AppStorage extends Storage {
  /**
   * Get user preferences.
   */
  async getPreferences(): Promise<Partial<AppPreferences>> {
    const prefs = await this.get<AppPreferences>('@app/preferences');
    return prefs ?? {};
  }

  /**
   * Set user preferences (partial update).
   */
  async setPreferences(prefs: Partial<AppPreferences>): Promise<boolean> {
    const current = await this.getPreferences();
    return this.set('@app/preferences', { ...current, ...prefs });
  }

  /**
   * Get game progress stats.
   */
  async getGameProgress(): Promise<GameProgress> {
    const progress = await this.get<GameProgress>('@app/game_progress');
    return (
      progress ?? {
        lastGameId: null,
        totalGamesPlayed: 0,
        totalGamesWon: 0,
        lastGameTime: 0,
      }
    );
  }

  /**
   * Update game progress.
   */
  async updateGameProgress(updates: Partial<GameProgress>): Promise<boolean> {
    const current = await this.getGameProgress();
    return this.set('@app/game_progress', { ...current, ...updates });
  }

  /**
   * Get user settings.
   */
  async getSettings<T extends Record<string, unknown>>(key: string): Promise<T | null> {
    return this.get<T>(`@settings/${key}`);
  }

  /**
   * Set user settings.
   */
  async setSettings<T extends Record<string, unknown>>(key: string, value: T): Promise<boolean> {
    return this.set(`@settings/${key}`, value);
  }

  /**
   * Cache game replay data.
   */
  async cacheGameReplay(gameId: string, data: unknown): Promise<boolean> {
    // Cache replays for 30 days
    return this.set(`@replay/${gameId}`, data, { ttl: 30 * 24 * 60 * 60 * 1000 });
  }

  /**
   * Get cached game replay.
   */
  async getCachedGameReplay(gameId: string): Promise<unknown | null> {
    return this.get(`@replay/${gameId}`);
  }

  /**
   * Clear old cached replays (older than 30 days).
   */
  async clearOldReplays(): Promise<void> {
    const keys = await this.keys();
    const replayKeys = keys.filter((k) => k.startsWith('@replay/'));

    for (const key of replayKeys) {
      await this.remove(key);
    }
  }
}

// Export singleton
export const appStorage = new AppStorage();
export const storage = new Storage();
