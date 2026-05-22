/**
 * @file migrations.service.ts
 * @description Module de migrations Mongo léger (pas de dépendance externe).
 *
 * Pattern :
 *  - Chaque migration a un `id` unique + une fn `up(connection)`.
 *  - Au boot : check `_migrations` collection ; exécute uniquement les
 *    migrations non-encore appliquées.
 *
 * Pour une vraie production, envisager `mongoose-migrate-2` ou `migrate-mongo`,
 * mais ce système couvre 90% des besoins.
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

interface Migration {
  id: string;
  description: string;
  up: (conn: Connection) => Promise<void>;
}

@Injectable()
export class MigrationsService implements OnModuleInit {
  private readonly logger = new Logger(MigrationsService.name);

  /**
   * Liste ordonnée des migrations. Ajouter en bas, jamais réordonner.
   */
  private readonly migrations: Migration[] = [
    {
      id: '001-deal-seeds-indexes',
      description: 'Vérifie les index obligatoires sur deal_seeds',
      up: async (conn) => {
        const col = conn.collection('deal_seeds');
        await col.createIndex({ variant: 1, dealHash: 1 }, { unique: true, name: 'variant_dealHash_unique' });
        await col.createIndex({ variant: 1, difficulty: 1 }, { name: 'variant_difficulty' });
      },
    },
    {
      id: '002-solitaire-scores-indexes',
      description: 'Index pour leaderboard solitaire',
      up: async (conn) => {
        const col = conn.collection('solitaire_scores');
        await col.createIndex({ variant: 1, score: -1 }, { name: 'variant_score_desc' });
        await col.createIndex({ variant: 1, durationMs: 1 }, { name: 'variant_duration_asc' });
      },
    },
    {
      id: '003-tournaments-default-prizes',
      description: 'Fallback prizes vides → defaults',
      up: async (conn) => {
        const col = conn.collection('tournaments');
        await col.updateMany(
          { $or: [{ prizes: null }, { prizes: { $exists: false } }] },
          {
            $set: {
              prizes: [
                { rank: 1, gold: 500 },
                { rank: 2, gold: 250 },
                { rank: 3, gold: 100 },
              ],
            },
          },
        );
      },
    },
    {
      id: '004-seed-belote-content',
      description: 'Seed boutique (items + coin packs) + tournoi belote pour les écrans Belote',
      up: async (conn) => {
        const now = Date.now();
        // ── shop_items (catalogue cosmétique) ──
        const items = [
          { name: 'Avatar Joker', category: 'avatar', description: 'Un avatar joker exclusif, animé.', priceEur: 1.99, priceCoins: 500, active: true, sortOrder: 1 },
          { name: 'Avatar Reine de Pique', category: 'avatar', description: 'Portrait stylisé de la Reine de Pique.', priceEur: 1.99, priceCoins: 500, active: true, sortOrder: 2 },
          { name: 'Thème Bois Royal', category: 'theme', description: 'Tapis de jeu en bois sombre verni.', priceEur: 2.99, priceCoins: 800, active: true, sortOrder: 3 },
          { name: 'Thème Néon', category: 'theme', description: 'Table néon cyberpunk pour les parties nocturnes.', priceEur: 2.99, priceCoins: 800, active: true, sortOrder: 4 },
          { name: 'Deck Français Classique', category: 'deck', description: 'Cartes françaises traditionnelles HD.', priceEur: 2.99, priceCoins: 800, active: true, sortOrder: 5 },
          { name: 'Deck Marocain', category: 'deck', description: 'Cartes aux motifs zellige marocains.', priceEur: 2.99, priceCoins: 800, active: true, sortOrder: 6 },
          { name: 'Sally Plus (mensuel)', category: 'premium', description: 'Sans pub, défis illimités, avatars exclusifs.', priceEur: 4.99, active: true, sortOrder: 7 },
          { name: 'Boost XP x2 (24h)', category: 'boost', description: 'Double ton XP pendant 24 heures.', priceEur: 1.99, priceCoins: 600, active: true, sortOrder: 8 },
        ];
        for (const it of items) {
          await conn.collection('shop_items').updateOne(
            { name: it.name },
            { $set: { ...it, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
            { upsert: true },
          );
        }
        // ── shop_packages (coin packs) si absents ──
        const packs = [
          { productId: 'coins_100', coins: 100, priceEur: 0.99, label: '100 pièces', active: true, sortOrder: 1 },
          { productId: 'coins_500', coins: 500, priceEur: 4.99, label: '500 pièces', active: true, sortOrder: 2, bonus: 50 },
          { productId: 'coins_2000', coins: 2000, priceEur: 19.99, label: '2000 pièces', active: true, sortOrder: 3, bonus: 400 },
          { productId: 'coins_10000', coins: 10000, priceEur: 49.99, label: '10000 pièces', active: true, sortOrder: 4, bonus: 3000 },
        ];
        for (const pk of packs) {
          await conn.collection('shop_packages').updateOne(
            { productId: pk.productId },
            { $set: { ...pk, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
            { upsert: true },
          );
        }
        // ── 1 tournoi belote ouvert (fenêtre 30j, pour les écrans Tournois) ──
        await conn.collection('tournaments').updateOne(
          { code: 'SEED-belote-open' },
          {
            $set: {
              code: 'SEED-belote-open', type: 'daily', variant: 'belote', difficulty: 'medium',
              status: 'open', startsAt: now, endsAt: now + 30 * 24 * 3600 * 1000,
              prizes: [{ rank: 1, gold: 500 }, { rank: 2, gold: 250 }, { rank: 3, gold: 100 }],
              updatedAt: new Date(),
            },
            $setOnInsert: { entries: [], createdAt: new Date() },
          },
          { upsert: true },
        );
      },
    },
    {
      id: '005-seed-demo-account',
      description: 'Compte démo (demo@sallycards.com / Demo123456) dans toutes les collections *_users',
      up: async (conn) => {
        const bcrypt = require('bcrypt');
        const passwordHash = await bcrypt.hash('Demo123456', 12);
        const games = ['ronda', 'kdoub', 'belote', 'poker', 'tarot', 'scopa', 'okey', 'concentration', 'solitaire', 'quiestce', 'kantcopy'];
        const now = new Date();
        for (const gameType of games) {
          await conn.collection(`${gameType}_users`).updateOne(
            { email: 'demo@sallycards.com' },
            {
              $set: {
                email: 'demo@sallycards.com',
                username: 'Demo',
                passwordHash,
                avatar: '',
                locale: 'fr',
                gameType,
                coins: 500,
                stats: { gamesPlayed: 0, gamesWon: 0, elo: 1000, winStreak: 0, bestWinStreak: 0, totalPlayTimeMs: 0 },
                settings: { theme: 'system', soundEnabled: true, hapticEnabled: true, language: 'fr', notificationsEnabled: true, autoMatchmaking: false, cardBackStyle: 'classic' },
                role: 'player',
                isGuest: false,
                status: 'offline',
                isVerified: true,
                updatedAt: now,
              },
              $setOnInsert: { friends: [], friendRequests: [], blockedUsers: [], deviceTokens: [], createdAt: now },
            },
            { upsert: true },
          );
        }
      },
    },
  ];

  constructor(@InjectConnection() private readonly connection: Connection) {}

  async onModuleInit() {
    try {
      await this.runPending();
    } catch (err: any) {
      this.logger.error(`Migrations fail: ${err?.message ?? err}`);
    }
  }

  /** Liste les migrations pending. */
  async listPending(): Promise<Migration[]> {
    const col = this.connection.collection('_migrations');
    const applied = await col.find({}, { projection: { id: 1 } }).toArray();
    const appliedIds = new Set(applied.map((d) => d.id));
    return this.migrations.filter((m) => !appliedIds.has(m.id));
  }

  /** Applique toutes les migrations pending. */
  async runPending(): Promise<{ applied: string[] }> {
    const pending = await this.listPending();
    const applied: string[] = [];
    if (pending.length === 0) {
      this.logger.log(`✓ Migrations à jour (${this.migrations.length} appliquées)`);
      return { applied };
    }
    this.logger.log(`📦 ${pending.length} migration(s) à appliquer…`);
    const col = this.connection.collection('_migrations');
    for (const m of pending) {
      const t0 = Date.now();
      try {
        await m.up(this.connection);
        await col.insertOne({ id: m.id, description: m.description, appliedAt: new Date() });
        const dt = Date.now() - t0;
        this.logger.log(`  ✓ ${m.id} (${dt}ms) — ${m.description}`);
        applied.push(m.id);
      } catch (err: any) {
        // Résilient : on logge et on CONTINUE — une migration en échec (ex.
        // conflit d'index préexistant) ne doit pas bloquer les suivantes.
        // Elle restera "pending" et sera retentée au prochain boot.
        this.logger.error(`  ✗ ${m.id} FAILED (skip): ${err?.message ?? err}`);
      }
    }
    return { applied };
  }

  /** Status des migrations (pour endpoint admin). */
  async getStatus(): Promise<{
    total: number; applied: number; pending: { id: string; description: string }[];
  }> {
    const pending = await this.listPending();
    return {
      total: this.migrations.length,
      applied: this.migrations.length - pending.length,
      pending: pending.map((m) => ({ id: m.id, description: m.description })),
    };
  }
}
