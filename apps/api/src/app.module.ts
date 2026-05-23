import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import * as Joi from 'joi';
import { RedisModule } from './common/modules/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { GamesModule } from './modules/games/games.module';
import { DealSeedsModule } from './modules/deal-seeds/deal-seeds.module';
import { SolitaireMatchesModule } from './modules/solitaire-matches/solitaire-matches.module';
import { QuiestceMatchesModule } from './modules/quiestce-matches/quiestce-matches.module';
import { ConcentrationMatchesModule } from './modules/concentration-matches/concentration-matches.module';
import { ScopaMatchesModule } from './modules/scopa-matches/scopa-matches.module';
import { TarotMatchesModule } from './modules/tarot-matches/tarot-matches.module';
import { PokerMatchesModule } from './modules/poker-matches/poker-matches.module';
import { TournamentsModule } from './modules/tournaments/tournaments.module';
import { MigrationsModule } from './modules/migrations/migrations.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module';
import { BotsModule } from './modules/bots/bots.module';
import { AssetsModule } from './modules/assets/assets.module';
import { HealthModule } from './modules/health/health.module';
import { AdminModule } from './modules/admin/admin.module';
import { ShopModule } from './modules/shop/shop.module';
import { ChallengesModule } from './modules/challenges/challenges.module';
import { InfraMonitoringModule } from './modules/infra-monitoring/infra-monitoring.module';
import { HkimModule } from './modules/hkim/hkim.module';
// --- Vision produit 2026 : modules ajoutes (sport challenges, classements
// multi-periode, recompenses voucher, niveaux, friends, inbox push)
import { ChallengesSportModule } from './modules/challenges-sport/challenges-sport.module';
import { RankingsPeriodModule } from './modules/rankings-period/rankings-period.module';
import { RewardsModule } from './modules/rewards/rewards.module';
import { LevelsModule } from './modules/levels/levels.module';
import { FriendsModule } from './modules/friends/friends.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PostsModule } from './modules/posts/posts.module';
import { WeatherModule } from './modules/weather/weather.module';
import { SupportModule } from './modules/support/support.module';
import { ExternalInvitesModule } from './modules/external-invites/external-invites.module';
import { TurnModule } from './modules/turn/turn.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    // Configuration with validation
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().default(3000),
        MONGODB_URI: Joi.string().required(),
        REDIS_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required().min(16),
        JWT_REFRESH_SECRET: Joi.string().required().min(16),
        JWT_EXPIRES_IN: Joi.string().default('15m'),
        JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
        BCRYPT_ROUNDS: Joi.number().default(12),
        CORS_ORIGINS: Joi.string().default('http://localhost:4000'),
        GEMINI_API_KEY: Joi.string().optional().allow(''),
        GEMINI_MODEL: Joi.string().default('gemini-2.0-flash'),
        REVENUECAT_WEBHOOK_SECRET: Joi.string().optional().allow(''),
      }),
    }),

    // MongoDB
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        autoIndex: configService.get<string>('NODE_ENV') !== 'production',
      }),
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Global modules
    RedisModule,

    // Feature modules
    AuthModule,
    UsersModule,
    GamesModule,
    DealSeedsModule,
    SolitaireMatchesModule,
    QuiestceMatchesModule,
    ConcentrationMatchesModule,
    ScopaMatchesModule,
    TarotMatchesModule,
    PokerMatchesModule,
    TournamentsModule,
    MigrationsModule,
    AnalyticsModule,
    RoomsModule,
    LeaderboardModule,
    BotsModule,
    AssetsModule,
    HealthModule,
    AdminModule,
    ShopModule,
    ChallengesModule,
    ChallengesSportModule,
    RankingsPeriodModule,
    RewardsModule,
    LevelsModule,
    FriendsModule,
    NotificationsModule,
    PostsModule,
    WeatherModule,
    SupportModule,
    ExternalInvitesModule,
    TurnModule,
    InfraMonitoringModule,
    HkimModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
