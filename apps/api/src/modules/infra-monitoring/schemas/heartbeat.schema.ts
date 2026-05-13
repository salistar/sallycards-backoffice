/**
 * @file heartbeat.schema.ts
 * @description Schéma Mongoose pour persister les heartbeats du cron
 * infra-monitoring. Une entrée par run (4 services × 1 ligne agrégée).
 *
 * Lifecycle : insertion via `POST /infra-monitoring/heartbeat` (cron VPS
 * + bouton "Vérifier" dans l'app + dashboard salistar). Lecture via
 * `GET /infra-monitoring/heartbeat/latest` pour le statut courant et
 * `GET /infra-monitoring/heartbeat/history?days=30` pour les graphs
 * d'uptime.
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type HeartbeatDocument = HydratedDocument<Heartbeat>;

@Schema({ _id: false })
export class ServiceCheck {
  @Prop({ required: true, enum: ['api', 'socket', 'turn', 'mongo'] })
  service!: 'api' | 'socket' | 'turn' | 'mongo';

  @Prop({ required: true })
  ok!: boolean;

  @Prop({ required: true })
  latencyMs!: number;

  @Prop()
  status?: number;

  @Prop()
  error?: string;

  @Prop({ required: true })
  url!: string;
}

@Schema({ collection: 'infra_heartbeats', timestamps: { createdAt: 'createdAt', updatedAt: false } })
export class Heartbeat {
  /** Source du heartbeat — distingue cron VPS, button utilisateur, ou test. */
  @Prop({ required: true, enum: ['cron', 'manual', 'health-test'], index: true })
  source!: 'cron' | 'manual' | 'health-test';

  @Prop({ required: true, index: true })
  checkedAt!: Date;

  @Prop({ type: [ServiceCheck], required: true })
  results!: ServiceCheck[];

  /** Vrai si TOUS les services sont OK. Indexé pour query rapide "down events". */
  @Prop({ required: true, index: true })
  allOk!: boolean;

  /** IP/User-Agent du caller (cron VPS = `127.0.0.1`, mobile = IP user). */
  @Prop()
  caller?: string;

  @Prop({ index: -1 })
  createdAt!: Date;
}

export const HeartbeatSchema = SchemaFactory.createForClass(Heartbeat);

// TTL index : auto-supprime les heartbeats vieux de 90 jours (rétention disque).
HeartbeatSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 3600 });
