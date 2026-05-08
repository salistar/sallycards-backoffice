import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PokerMatch, PokerMatchSchema } from './schemas/poker-match.schema';
import { PokerScore, PokerScoreSchema } from './schemas/poker-score.schema';
import { PokerMatchesService } from './poker-matches.service';
import { PokerLeaderboardService } from './poker-leaderboard.service';
import { PokerMatchesController } from './poker-matches.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PokerMatch.name, schema: PokerMatchSchema },
      { name: PokerScore.name, schema: PokerScoreSchema },
    ]),
  ],
  controllers: [PokerMatchesController],
  providers: [PokerMatchesService, PokerLeaderboardService],
  exports: [PokerMatchesService, PokerLeaderboardService],
})
export class PokerMatchesModule {}
