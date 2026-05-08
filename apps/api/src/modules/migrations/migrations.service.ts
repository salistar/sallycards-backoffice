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
        this.logger.error(`  ✗ ${m.id} FAILED: ${err?.message ?? err}`);
        throw err;
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
