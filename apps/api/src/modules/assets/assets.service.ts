import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import {
  CardAssetSource,
  CardAssetSourceDocument,
} from './schemas/card-asset-source.schema';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SourceStatus {
  name: string;
  url: string;
  priority: number;
  isActive: boolean;
  lastChecked: Date | null;
  successRate: number;
  totalDownloads: number;
  lastError: string | null;
  healthy: boolean;
}

export interface AssetVerification {
  cardId: string;
  exists: boolean;
  integrityOk: boolean;
  expectedHash: string | null;
  actualHash: string | null;
}

export interface CardUrlResult {
  url: string;
  fallbackUrl: string;
  cdnCached: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CDN_BASE_URL = process.env['ASSET_CDN_URL'] || 'https://assets.sallycards.com/cards';
const FALLBACK_BASE_URL = process.env['ASSET_FALLBACK_URL'] || 'https://fallback.sallycards.com/cards';
const HEALTH_THRESHOLD = 0.5; // Sources below 50% success are unhealthy

const SUITS_BY_DECK: Record<string, string[]> = {
  french52: ['hearts', 'diamonds', 'clubs', 'spades'],
  french32: ['hearts', 'diamonds', 'clubs', 'spades'],
  spanish40: ['oros', 'copas', 'espadas', 'bastos'],
  tarot78: ['hearts', 'diamonds', 'clubs', 'spades'],
  okey106: ['red', 'blue', 'green', 'black'],
};

const VALUES_BY_DECK: Record<string, number[]> = {
  french52: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  french32: [1, 7, 8, 9, 10, 11, 12, 13],
  spanish40: [1, 2, 3, 4, 5, 6, 7, 10, 11, 12],
  tarot78: Array.from({ length: 22 }, (_, i) => i),
  okey106: Array.from({ length: 13 }, (_, i) => i + 1),
};

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class AssetsService {
  private readonly logger = new Logger(AssetsService.name);

  constructor(
    @InjectModel(CardAssetSource.name)
    private readonly sourceModel: Model<CardAssetSourceDocument>,
  ) {}

  // -----------------------------------------------------------------------
  // Status
  // -----------------------------------------------------------------------

  async getStatus() {
    const sources = await this.sourceModel.find().sort({ priority: 1 }).exec();
    const activeSources = sources.filter((s) => s.isActive);
    const totalDownloads = sources.reduce((sum, s) => sum + s.totalDownloads, 0);

    return {
      version: '2.0.0',
      totalAssets: 52,
      lastUpdated: new Date().toISOString(),
      categories: ['cards', 'backgrounds', 'sounds', 'animations'],
      sources: {
        total: sources.length,
        active: activeSources.length,
        healthy: activeSources.filter((s) => s.successRate >= HEALTH_THRESHOLD).length,
      },
      downloads: {
        total: totalDownloads,
        cdnBaseUrl: CDN_BASE_URL,
      },
    };
  }

  // -----------------------------------------------------------------------
  // Cards
  // -----------------------------------------------------------------------

  async getCards(deck = 'french52') {
    const suits = SUITS_BY_DECK[deck] ?? SUITS_BY_DECK['french52'];
    const values = VALUES_BY_DECK[deck] ?? VALUES_BY_DECK['french52'];

    const cards = suits.flatMap((suit) =>
      values.map((value) => ({
        id: `${deck}_${suit}_${value}`,
        suit,
        value,
        deck,
        urls: {
          '@1x': this.buildCdnUrl(deck, suit, value, 1),
          '@2x': this.buildCdnUrl(deck, suit, value, 2),
          '@3x': this.buildCdnUrl(deck, suit, value, 3),
        },
      })),
    );

    return {
      deck,
      total: cards.length,
      suits,
      values,
      cards,
    };
  }

  // -----------------------------------------------------------------------
  // Download
  // -----------------------------------------------------------------------

  async requestDownload(assetIds: string[]) {
    this.logger.log(`Download requested for ${assetIds.length} assets`);

    // Generate a signed download URL (mock implementation)
    const token = crypto.randomBytes(16).toString('hex');
    const expiresIn = 3600;

    return {
      downloadUrl: `${CDN_BASE_URL}/bundle/${token}`,
      assetIds,
      expiresIn,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      message: `Bundle of ${assetIds.length} assets ready for download`,
    };
  }

  // -----------------------------------------------------------------------
  // Source status
  // -----------------------------------------------------------------------

  async getSourceStatus(): Promise<SourceStatus[]> {
    const sources = await this.sourceModel.find().sort({ priority: 1 }).exec();

    return sources.map((source) => ({
      name: source.name,
      url: source.url,
      priority: source.priority,
      isActive: source.isActive,
      lastChecked: source.lastChecked,
      successRate: source.successRate,
      totalDownloads: source.totalDownloads,
      lastError: source.lastError,
      healthy: source.isActive && source.successRate >= HEALTH_THRESHOLD,
    }));
  }

  // -----------------------------------------------------------------------
  // Asset verification
  // -----------------------------------------------------------------------

  async verifyAssets(
    deck = 'french52',
    manifestHashes?: Record<string, string>,
  ): Promise<{ verified: number; failed: number; results: AssetVerification[] }> {
    const suits = SUITS_BY_DECK[deck] ?? SUITS_BY_DECK['french52'];
    const values = VALUES_BY_DECK[deck] ?? VALUES_BY_DECK['french52'];

    const results: AssetVerification[] = [];
    let verified = 0;
    let failed = 0;

    for (const suit of suits) {
      for (const value of values) {
        const cardId = `${deck}_${suit}_${value}`;
        const expectedHash = manifestHashes?.[cardId] ?? null;

        // In production this would fetch the asset from CDN and verify the SHA256.
        // For now we check whether the CDN URL is reachable by pattern.
        const url = this.buildCdnUrl(deck, suit, value, 2);
        const exists = url.length > 0; // placeholder check

        const verification: AssetVerification = {
          cardId,
          exists,
          integrityOk: exists && expectedHash === null, // can't verify without manifest
          expectedHash,
          actualHash: null, // would be computed from actual file
        };

        if (verification.integrityOk) {
          verified++;
        } else {
          failed++;
        }

        results.push(verification);
      }
    }

    this.logger.log(
      `Asset verification for ${deck}: ${verified} verified, ${failed} failed`,
    );

    return { verified, failed, results };
  }

  // -----------------------------------------------------------------------
  // URL generation
  // -----------------------------------------------------------------------

  getCardUrl(
    deck: string,
    suit: string,
    value: number,
    scale: number = 2,
  ): CardUrlResult {
    const cdnUrl = this.buildCdnUrl(deck, suit, value, scale);
    const fallbackUrl = this.getFallbackUrl(deck, suit, value);

    return {
      url: cdnUrl,
      fallbackUrl,
      cdnCached: true, // In production, check CDN cache status
    };
  }

  getFallbackUrl(deck: string, suit: string, value: number): string {
    // Fallback generates a server-rendered card image on demand
    return `${FALLBACK_BASE_URL}/render/${deck}/${suit}/${value}.png`;
  }

  // -----------------------------------------------------------------------
  // Source management helpers
  // -----------------------------------------------------------------------

  async recordDownloadSuccess(sourceName: string): Promise<void> {
    const source = await this.sourceModel.findOne({ name: sourceName }).exec();
    if (!source) return;

    const newTotal = source.totalDownloads + 1;
    // Exponential moving average for success rate
    const newRate = source.successRate * 0.95 + 1 * 0.05;

    await this.sourceModel.updateOne(
      { name: sourceName },
      {
        $set: {
          totalDownloads: newTotal,
          successRate: Math.min(newRate, 1),
          lastChecked: new Date(),
          lastError: null,
        },
      },
    );
  }

  async recordDownloadFailure(
    sourceName: string,
    error: string,
  ): Promise<void> {
    const source = await this.sourceModel.findOne({ name: sourceName }).exec();
    if (!source) return;

    const newRate = source.successRate * 0.95 + 0 * 0.05;

    await this.sourceModel.updateOne(
      { name: sourceName },
      {
        $set: {
          successRate: Math.max(newRate, 0),
          lastChecked: new Date(),
          lastError: error,
          // Auto-disable sources that drop below threshold
          ...(newRate < HEALTH_THRESHOLD / 2 && { isActive: false }),
        },
      },
    );

    this.logger.warn(
      `Source ${sourceName} failure recorded. Success rate: ${(newRate * 100).toFixed(1)}%`,
    );
  }

  async seedDefaultSources(): Promise<void> {
    const defaults = [
      {
        name: 'kenney-cards',
        url: 'https://kenney.nl/media/pages/assets/playing-cards-pack/',
        priority: 1,
      },
      {
        name: 'svg-cards-github',
        url: 'https://raw.githubusercontent.com/htdebeer/SVG-cards/master/svg-cards/',
        priority: 2,
      },
      {
        name: 'wikimedia-commons',
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/',
        priority: 3,
      },
    ];

    for (const src of defaults) {
      await this.sourceModel.updateOne(
        { name: src.name },
        { $setOnInsert: { ...src, isActive: true, successRate: 1, totalDownloads: 0 } },
        { upsert: true },
      );
    }

    this.logger.log(`Seeded ${defaults.length} default asset sources`);
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  private buildCdnUrl(
    deck: string,
    suit: string,
    value: number,
    scale: number,
  ): string {
    // Validate inputs before building URL
    if (!deck || !suit || !value || !scale) {
      this.logger.warn(`Invalid CDN URL parameters: deck=${deck}, suit=${suit}, value=${value}, scale=${scale}`);
      return '';
    }
    return `${CDN_BASE_URL}/${deck}/${deck}_${suit}_${value}@${scale}x.png`;
  }
}
