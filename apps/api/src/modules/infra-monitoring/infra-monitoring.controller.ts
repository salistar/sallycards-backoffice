/**
 * @file infra-monitoring.controller.ts
 * @description Endpoints REST pour le monitoring infra.
 *
 *   POST /api/v1/infra-monitoring/heartbeat
 *     - Reçoit les résultats du cron VPS (scripts/cron-infra-check.sh)
 *       OU du bouton "Vérifier l'infrastructure" mobile
 *     - Protégé par header X-Heartbeat-Token (config: HEARTBEAT_TOKEN)
 *
 *   GET /api/v1/infra-monitoring/heartbeat/latest
 *     - Dernier heartbeat (statut courant pour le dashboard salistar)
 *
 *   GET /api/v1/infra-monitoring/heartbeat/history?days=30
 *     - Historique pour graph uptime
 *
 *   GET /api/v1/infra-monitoring/uptime?days=30
 *     - Stats agrégées : uptime % par service sur la fenêtre
 */
import {
  Controller, Get, Post, Body, Query, Headers, HttpException, HttpStatus, Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { InfraMonitoringService, HeartbeatPayload } from './infra-monitoring.service';

@ApiTags('Infra Monitoring')
@Controller('infra-monitoring')
export class InfraMonitoringController {
  private readonly logger = new Logger(InfraMonitoringController.name);
  constructor(
    private readonly service: InfraMonitoringService,
    private readonly config: ConfigService,
  ) {}

  @Post('heartbeat')
  @ApiOperation({ summary: 'Reçoit un heartbeat infra (cron VPS ou bouton mobile)' })
  @ApiHeader({ name: 'X-Heartbeat-Token', description: 'Secret partagé HEARTBEAT_TOKEN' })
  async heartbeat(
    @Body() payload: HeartbeatPayload,
    @Headers('x-heartbeat-token') token?: string,
  ) {
    const expected = this.config.get<string>('HEARTBEAT_TOKEN');
    // Si pas de token configuré côté serveur, accepte (mode dev).
    if (expected && token !== expected) {
      this.logger.warn(`Heartbeat rejected — bad token (got=${token?.slice(0, 8)}…)`);
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    if (!payload?.results || !Array.isArray(payload.results)) {
      throw new HttpException('Invalid payload — `results[]` required', HttpStatus.BAD_REQUEST);
    }
    const doc = await this.service.record(payload);
    return { success: true, data: { id: (doc as any)._id, allOk: doc.allOk } };
  }

  @Get('heartbeat/latest')
  @ApiOperation({ summary: 'Dernier heartbeat (statut courant)' })
  async latest() {
    const doc = await this.service.getLatest();
    return { success: true, data: doc };
  }

  @Get('heartbeat/history')
  @ApiOperation({ summary: 'Historique heartbeats (fenêtre glissante)' })
  async history(@Query('days') daysQ?: string) {
    const days = Math.max(1, Math.min(90, parseInt(daysQ ?? '7', 10) || 7));
    const docs = await this.service.getHistory(days);
    return { success: true, data: docs, meta: { days, count: docs.length } };
  }

  @Get('uptime')
  @ApiOperation({ summary: 'Stats uptime % par service sur fenêtre' })
  async uptime(@Query('days') daysQ?: string) {
    const days = Math.max(1, Math.min(90, parseInt(daysQ ?? '30', 10) || 30));
    const stats = await this.service.getUptimeStats(days);
    return { success: true, data: stats, meta: { days } };
  }
}
