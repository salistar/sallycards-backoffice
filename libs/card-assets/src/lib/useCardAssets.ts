/**
 * useCardAssets.ts
 * Hook for loading and caching card images by deck type.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Image, ImageSourcePropType, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DeckType, Suit } from '@sally/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CACHE_KEY_PREFIX = 'sally_card_cache_';
const ASSET_CDN_BASE = 'https://assets.sallycards.com/cards';

// Bundled asset map — populated at build time or via require()
// In a real build, metro bundler resolves these statically.
const BUNDLED_ASSETS: Record<string, ImageSourcePropType> = {};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildCardKey(deck: string, suit: string, value: number): string {
  return `${deck}_${suit}_${value}`;
}

function buildCdnUrl(deck: string, suit: string, value: number, scale: number): string {
  return `${ASSET_CDN_BASE}/${deck}/${deck}_${suit}_${value}@${scale}x.png`;
}

function getDeviceScale(): number {
  // React Native PixelRatio would be used in production
  // Defaulting to 2x as a safe middle ground
  try {
    const { PixelRatio } = require('react-native');
    const ratio = PixelRatio.get();
    if (ratio >= 3) return 3;
    if (ratio >= 2) return 2;
    return 1;
  } catch {
    return 2;
  }
}

// ---------------------------------------------------------------------------
// Placeholder generator
// ---------------------------------------------------------------------------

function generatePlaceholderSource(suit: string, value: number): ImageSourcePropType {
  // Return a transparent 1x1 pixel as a placeholder.
  // The FallbackCard component handles actual visual rendering.
  return { uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' };
}

// ---------------------------------------------------------------------------
// Deck card lists
// ---------------------------------------------------------------------------

interface DeckDefinition {
  suits: string[];
  values: number[];
}

const DECK_DEFINITIONS: Record<DeckType, DeckDefinition> = {
  french52: {
    suits: ['hearts', 'diamonds', 'clubs', 'spades'],
    values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  },
  french32: {
    suits: ['hearts', 'diamonds', 'clubs', 'spades'],
    values: [1, 7, 8, 9, 10, 11, 12, 13],
  },
  spanish40: {
    suits: ['oros', 'copas', 'espadas', 'bastos'],
    values: [1, 2, 3, 4, 5, 6, 7, 10, 11, 12],
  },
  tarot78: {
    suits: ['hearts', 'diamonds', 'clubs', 'spades'],
    values: Array.from({ length: 22 }, (_, i) => i), // Major arcana 0-21 + suited cards
  },
  okey106: {
    suits: ['red', 'blue', 'green', 'black'],
    values: Array.from({ length: 13 }, (_, i) => i + 1),
  },
};

/**
 * Local asset path builder - enables loading from bundled assets or local filesystem.
 * When assets are bundled with the app, provide local paths here.
 */
function buildLocalPath(deck: string, suit: string, value: number): string | null {
  // Return null if local assets are not available
  // Consumers can implement require() patterns or asset bundling here
  // Example: return require(`./assets/${deck}_${suit}_${value}.png`);
  return null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseCardAssetsReturn {
  getCardImage: (suit: string, value: number) => ImageSourcePropType;
  preloadDeck: () => Promise<void>;
  isLoading: boolean;
  progress: { downloaded: number; total: number };
  error: string | null;
}

export function useCardAssets(deckType: DeckType): UseCardAssetsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ downloaded: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<Record<string, ImageSourcePropType>>({});
  const scale = useRef(getDeviceScale());

  // Restore cached URIs from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      try {
        const cacheKey = `${CACHE_KEY_PREFIX}${deckType}`;
        const stored = await AsyncStorage.getItem(cacheKey);
        if (stored) {
          const parsed: Record<string, string> = JSON.parse(stored);
          for (const [key, uri] of Object.entries(parsed)) {
            cacheRef.current[key] = { uri };
          }
        }
      } catch {
        // Cache miss is fine
      }
    })();
  }, [deckType]);

  const getCardImage = useCallback(
    (suit: string, value: number): ImageSourcePropType => {
      const key = buildCardKey(deckType, suit, value);

      // 1. Check in-memory cache
      if (cacheRef.current[key]) {
        return cacheRef.current[key];
      }

      // 2. Check bundled assets
      if (BUNDLED_ASSETS[key]) {
        cacheRef.current[key] = BUNDLED_ASSETS[key];
        return BUNDLED_ASSETS[key];
      }

      // 3. Try local asset path
      const localPath = buildLocalPath(deckType, suit, value);
      if (localPath) {
        const source: ImageSourcePropType = { uri: localPath };
        cacheRef.current[key] = source;
        return source;
      }

      // 4. Fall back to CDN URL (will be fetched by Image component)
      const cdnUrl = buildCdnUrl(deckType, suit, value, scale.current);
      const source: ImageSourcePropType = { uri: cdnUrl };
      cacheRef.current[key] = source;
      return source;
    },
    [deckType],
  );

  const preloadDeck = useCallback(async (): Promise<void> => {
    const definition = DECK_DEFINITIONS[deckType];
    if (!definition) {
      setError(`Unknown deck type: ${deckType}`);
      return;
    }

    const { suits, values } = definition;
    const total = suits.length * values.length;
    setIsLoading(true);
    setProgress({ downloaded: 0, total });
    setError(null);

    let downloaded = 0;
    const cacheEntries: Record<string, string> = {};

    const preloadPromises = suits.flatMap((suit) =>
      values.map(async (value) => {
        const key = buildCardKey(deckType, suit, value);
        const uri = buildCdnUrl(deckType, suit, value, scale.current);

        try {
          // Try local path first
          const localPath = buildLocalPath(deckType, suit, value);
          if (localPath) {
            cacheRef.current[key] = { uri: localPath };
            cacheEntries[key] = localPath;
          } else {
            // Prefetch via React Native's Image API
            if (Platform.OS !== 'web') {
              await Image.prefetch(uri);
            }
            cacheRef.current[key] = { uri };
            cacheEntries[key] = uri;
          }
        } catch (err) {
          // Use placeholder on failure with fallback for CDN timeout
          console.warn(
            `[useCardAssets] Failed to preload ${deckType} ${suit} ${value}: ${err instanceof Error ? err.message : 'unknown error'}`
          );
          cacheRef.current[key] = generatePlaceholderSource(suit, value);
        }

        downloaded++;
        setProgress({ downloaded, total });
      }),
    );

    try {
      await Promise.allSettled(preloadPromises);

      // Persist to AsyncStorage
      const cacheKey = `${CACHE_KEY_PREFIX}${deckType}`;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheEntries));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to preload deck';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [deckType]);

  return { getCardImage, preloadDeck, isLoading, progress, error };
}
