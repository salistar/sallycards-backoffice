import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScopaMatch, ScopaMatchSchema } from './schemas/scopa-match.schema';
import { ScopaScore, ScopaScoreSchema } from './schemas/scopa-score.schema';
import { ScopaMatchesService } from './scopa-matches.service';
import { ScopaLeaderboardService } from './scopa-leaderboard.service';
import { ScopaMatchesController } from './scopa-matches.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ScopaMatch.name, schema: ScopaMatchSchema },
      { name: ScopaScore.name, schema: ScopaScoreSchema },
    ]),
  ],
  controllers: [ScopaMatchesController],
  providers: [ScopaMatchesService, ScopaLeaderboardService],
  exports: [ScopaMatchesService, ScopaLeaderboardService],
})
export class ScopaMatchesModule {}
