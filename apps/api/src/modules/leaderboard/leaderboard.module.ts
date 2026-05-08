import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardService } from './leaderboard.service';
import { EloService } from './elo.service';
import {
  LeaderboardEntry,
  LeaderboardEntrySchema,
} from './schemas/leaderboard.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LeaderboardEntry.name, schema: LeaderboardEntrySchema },
    ]),
  ],
  controllers: [LeaderboardController],
  providers: [LeaderboardService, EloService],
  exports: [LeaderboardService, EloService],
})
export class LeaderboardModule {}
