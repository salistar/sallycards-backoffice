import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import * as Joi from 'joi';

import { GameGateway } from './gateways/game.gateway';
import { LobbyGateway } from './gateways/lobby.gateway';
import { ChatGateway } from './gateways/chat.gateway';
import { PresenceGateway } from './gateways/presence.gateway';
import { RoomBridgeGateway } from './gateways/room-bridge.gateway';
import { WebRtcGateway } from './gateways/webrtc.gateway';
import { HkimFeedGateway } from './gateways/hkim-feed.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().default(3001),
        REDIS_URL: Joi.string().default('redis://localhost:6379'),
        JWT_SECRET: Joi.string().required(),
        CORS_ORIGINS: Joi.string().default('*'),
      }),
    }),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: '7d' },
      }),
      global: true,
    }),
  ],
  providers: [GameGateway, LobbyGateway, ChatGateway, PresenceGateway, RoomBridgeGateway, WebRtcGateway, HkimFeedGateway],
})
export class AppModule {}
