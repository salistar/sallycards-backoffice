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

  /**
   * On-demand probe — runs from inside the container so it can hit:
   *   - the API itself (loopback)
   *   - the socket-server (over the docker network)
   *   - the TURN server (DNS resolution + TCP connect to 3478)
   *   - Mongo (mongoose connection already up if API is alive)
   * Used by the "Vérifier maintenant" button on salistar.com (the browser
   * can't probe TURN/UDP or internal Mongo on its own).
   */
  async checkNow(): Promise<{ source: 'manual'; checkedAt: string; results: ServiceCheck[]; allOk: boolean }> {
    const results: ServiceCheck[] = await Promise.all([
      this.probeHttp('api', 'http://localhost:3000/api/v1/health'),
      this.probeHttp('socket', 'http://sallycards-socket:3001/health'),
      this.probeHttp('turn', 'turn.salistar.com:3478'),
      this.probeMongo(),
      this.probeRedis(),
    ]);
    const allOk = results.every((r) => r.ok);
    return {
      source: 'manual',
      checkedAt: new Date().toISOString(),
      results,
      allOk,
    };
  }

  private async probeHttp(
    service: 'api' | 'socket' | 'turn',
    target: string,
  ): Promise<ServiceCheck> {
    const t0 = Date.now();
    // For TURN we do a TCP-level connect probe (not HTTP) since 3478 speaks
    // STUN/TURN. Use Node's net module for that path.
    if (service === 'turn') {
      const [host, portStr] = target.split(':');
      const port = parseInt(portStr ?? '3478', 10);
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const net = require('node:net');
      return new Promise<ServiceCheck>((resolve) => {
        const socket = new net.Socket();
        const done = (ok: boolean, error?: string) => {
          try { socket.destroy(); } catch { /* noop */ }
          resolve({
            service,
            ok,
            latencyMs: Date.now() - t0,
            url: `tcp://${host}:${port}`,
            error,
          });
        };
        socket.setTimeout(3000);
        socket.once('connect', () => done(true));
        socket.once('timeout', () => done(false, 'timeout'));
        socket.once('error', (err: Error) => done(false, err.message));
        socket.connect(port, host);
      });
    }
    // HTTP probe (api + socket).
    const url = target;
    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 5000);
      const res = await fetch(url, { method: 'GET', signal: ctrl.signal });
      clearTimeout(timeout);
      return {
        service,
        ok: res.ok,
        latencyMs: Date.now() - t0,
        status: res.status,
        url,
      };
    } catch (e: any) {
      return {
        service,
        ok: false,
        latencyMs: Date.now() - t0,
        error: e?.message ?? 'unreachable',
        url,
      };
    }
  }

  private async probeRedis(): Promise<ServiceCheck> {
    const t0 = Date.now();
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const net = require('node:net');
      const host = 'sallycards-redis';
      const port = 6379;
      return await new Promise<ServiceCheck>((resolve) => {
        const socket = new net.Socket();
        const done = (ok: boolean, error?: string) => {
          try { socket.destroy(); } catch { /* noop */ }
          resolve({
            service: 'redis' as any,
            ok,
            latencyMs: Date.now() - t0,
            url: `redis://${host}:${port}`,
            error,
          });
        };
        socket.setTimeout(3000);
        // After TCP connect, send a PING command (RESP-2) and check for +PONG.
        socket.once('connect', () => {
          socket.write('*1\r\n$4\r\nPING\r\n');
        });
        socket.once('data', (buf: Buffer) => {
          done(buf.toString('utf8').startsWith('+PONG'));
        });
        socket.once('timeout', () => done(false, 'timeout'));
        socket.once('error', (err: Error) => done(false, err.message));
        socket.connect(port, host);
      });
    } catch (e: any) {
      return {
        service: 'redis' as any,
        ok: false,
        latencyMs: Date.now() - t0,
        error: e?.message ?? 'redis probe failed',
        url: 'redis://sallycards-redis:6379',
      };
    }
  }

  private async probeMongo(): Promise<ServiceCheck> {
    const t0 = Date.now();
    try {
      // The heartbeat collection exists if mongoose is connected. A simple
      // findOne() round-trip is a sufficient liveness check.
      await this.heartbeatModel.findOne().limit(1).lean().exec();
      return {
        service: 'mongo',
        ok: true,
        latencyMs: Date.now() - t0,
        url: 'mongodb://sallycards-mongo:27017',
      };
    } catch (e: any) {
      return {
        service: 'mongo',
        ok: false,
        latencyMs: Date.now() - t0,
        error: e?.message ?? 'mongo down',
        url: 'mongodb://sallycards-mongo:27017',
      };
    }
  }

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
    for (const svc of ['api', 'socket', 'turn', 'mongo', 'redis']) {
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
