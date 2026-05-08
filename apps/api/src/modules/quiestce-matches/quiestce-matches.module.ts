import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuiestceMatch, QuiestceMatchSchema } from './schemas/quiestce-match.schema';
import { QuiestceScore, QuiestceScoreSchema } from './schemas/quiestce-score.schema';
import { QuiestceMatchesService } from './quiestce-matches.service';
import { QuiestceLeaderboardService } from './quiestce-leaderboard.service';
import { QuiestceMatchesController } from './quiestce-matches.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: QuiestceMatch.name, schema: QuiestceMatchSchema },
      { name: QuiestceScore.name, schema: QuiestceScoreSchema },
    ]),
  ],
  controllers: [QuiestceMatchesController],
  providers: [QuiestceMatchesService, QuiestceLeaderboardService],
  exports: [QuiestceMatchesService, QuiestceLeaderboardService],
})
export class QuiestceMatchesModule {}
