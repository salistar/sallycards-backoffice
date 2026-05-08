// بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
// SallyCards Solitaire — TURN Module
// Expose l'endpoint /api/turn-creds (credentials WebRTC tournants).

import { Module } from '@nestjs/common';
import { TurnCredentialsController } from './turn-credentials.controller';

@Module({
  controllers: [TurnCredentialsController],
})
export class TurnModule {}
