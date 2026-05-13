/**
 * @file infra-monitoring.module.ts
 * @description Module NestJS pour le monitoring de l'infrastructure
 * (heartbeats du cron VPS + bouton "Vérifier" mobile + dashboard salistar).
 *
 * À enregistrer dans le AppModule :
 *   imports: [ ..., InfraMonitoringModule ]
 */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { InfraMonitoringController } from './infra-monitoring.controller';
import { InfraMonitoringService } from './infra-monitoring.service';
import { Heartbeat, HeartbeatSchema } from './schemas/heartbeat.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: Heartbeat.name, schema: HeartbeatSchema }]),
  ],
  controllers: [InfraMonitoringController],
  providers: [InfraMonitoringService],
  exports: [InfraMonitoringService],
})
export class InfraMonitoringModule {}
