/**
 * @file infra-monitoring.service.ts
 * @description Logique métier du monitoring infra :
 *   - persiste les heartbeats reçus du cron VPS
 *   - calcule l'uptime % sur fenêtre glissante (1h, 24h, 7j, 30j)
 *   - fournit le dernier statut connu par service
 *
 * Découplé du controller pour faciliter les tests unitaires.
 */
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Heartbeat, HeartbeatDocument, ServiceCheck } from './schemas/heartbeat.schema';

export interface HeartbeatPayload {
  source: 'cron' | 'manual' | 'health-test';
  checkedAt: string;
  results: ServiceCheck[];
  caller?: string;
}

@Injectable()
export class InfraMonitoringService {
  private readonly logger = new Logger(InfraMonitoringService.name);

  constructor(
    @InjectModel(Heartbeat.name)
    private readonly heartbeatModel: Model<HeartbeatDocument>,
  ) {}

  async record(payload: HeartbeatPayload): Promise<HeartbeatDocument> {
    const allOk = payload.results.every((r) => r.ok);
    const doc = await this.heartbeatModel.create({
      source: payload.source,
      checkedAt: new Date(payload.checkedAt),
      results: payload.results,
      allOk,
      caller: payload.caller,
    });
    if (!allOk) {
      const failing = payload.results.filter((r) => !r.ok).map((r) => r.service).join(',');
      this.logger.warn(`🚨 Heartbeat DOWN — services en panne: ${failing}`);
    } else {
      this.logger.log(`✓ Heartbeat OK — tous services up (source=${payload.source})`);
    }
    return doc;
  }

  async getLatest(): Promise<HeartbeatDocument | null> {
    return this.heartbeatModel
      .findOne()
      .sort({ checkedAt: -1 })
      .lean()
      .exec() as Promise<HeartbeatDocument | null>;
  }

  async getHistory(days: number): Promise<HeartbeatDocument[]> {
    const since = new Date(Date.now() - days * 24 * 3600 * 1000);
    return this.heartbeatModel
      .find({ checkedAt: { $gte: since } })
      .sort({ checkedAt: -1 })
      .limit(1000)
      .lean()
      .exec() as Promise<HeartbeatDocument[]>;
  }

  /**
   * Uptime % par service sur les N derniers jours.
   *   - Compte le ratio de heartbeats où `service.ok === true`
   *   - Retourne 4 nombres : api, socket, turn, mongo
   * Utile pour le dashboard salistar (graph "99.97% uptime sur 30 jours").
   */
  async getUptimeStats(days: number): Promise<Record<string, { ok: number; total: number; uptimePct: number }>> {
    const since = new Date(Date.now() - days * 24 * 3600 * 1000);
    const docs = await this.heartbeatModel
      .find({ checkedAt: { $gte: since } })
      .lean()
      .exec();
    const stats: Record<string, { ok: number; total: number; uptimePct: number }> = {};
    for (const svc of ['api', 'socket', 'turn', 'mongo']) {
      let ok = 0, total = 0;
      for (const d of docs) {
        const found = d.results.find((r) => r.service === svc);
        if (found) {
          total++;
          if (found.ok) ok++;
        }
      }
      stats[svc] = {
        ok,
        total,
        uptimePct: total > 0 ? +((ok / total) * 100).toFixed(3) : 100,
      };
    }
    return stats;
  }
}
