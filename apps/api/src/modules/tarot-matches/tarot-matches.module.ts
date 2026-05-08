import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TarotMatch, TarotMatchSchema } from './schemas/tarot-match.schema';
import { TarotScore, TarotScoreSchema } from './schemas/tarot-score.schema';
import { TarotMatchesService } from './tarot-matches.service';
import { TarotLeaderboardService } from './tarot-leaderboard.service';
import { TarotMatchesController } from './tarot-matches.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TarotMatch.name, schema: TarotMatchSchema },
      { name: TarotScore.name, schema: TarotScoreSchema },
    ]),
  ],
  controllers: [TarotMatchesController],
  providers: [TarotMatchesService, TarotLeaderboardService],
  exports: [TarotMatchesService, TarotLeaderboardService],
})
export class TarotMatchesModule {}
