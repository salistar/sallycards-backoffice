import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConcentrationMatch, ConcentrationMatchSchema } from './schemas/concentration-match.schema';
import { ConcentrationScore, ConcentrationScoreSchema } from './schemas/concentration-score.schema';
import { ConcentrationMatchesService } from './concentration-matches.service';
import { ConcentrationLeaderboardService } from './concentration-leaderboard.service';
import { ConcentrationMatchesController } from './concentration-matches.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ConcentrationMatch.name, schema: ConcentrationMatchSchema },
      { name: ConcentrationScore.name, schema: ConcentrationScoreSchema },
    ]),
  ],
  controllers: [ConcentrationMatchesController],
  providers: [ConcentrationMatchesService, ConcentrationLeaderboardService],
  exports: [ConcentrationMatchesService, ConcentrationLeaderboardService],
})
export class ConcentrationMatchesModule {}
