import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SolitaireMatch, SolitaireMatchSchema } from './schemas/solitaire-match.schema';
import { SolitaireScore, SolitaireScoreSchema } from './schemas/solitaire-score.schema';
import { SolitaireMatchesService } from './solitaire-matches.service';
import { SolitaireLeaderboardService } from './solitaire-leaderboard.service';
import { SolitaireMatchesController } from './solitaire-matches.controller';
import { DealSeedsModule } from '../deal-seeds/deal-seeds.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SolitaireMatch.name, schema: SolitaireMatchSchema },
      { name: SolitaireScore.name, schema: SolitaireScoreSchema },
    ]),
    DealSeedsModule,
  ],
  controllers: [SolitaireMatchesController],
  providers: [SolitaireMatchesService, SolitaireLeaderboardService],
  exports: [SolitaireMatchesService, SolitaireLeaderboardService],
})
export class SolitaireMatchesModule {}
