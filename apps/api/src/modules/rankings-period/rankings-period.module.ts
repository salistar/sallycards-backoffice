import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RankingsPeriodController } from './rankings-period.controller';
import { RankingsPeriodService } from './rankings-period.service';
import { RankingsPeriod, RankingsPeriodSchema } from './schemas/rankings-period.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: RankingsPeriod.name, schema: RankingsPeriodSchema }]),
  ],
  controllers: [RankingsPeriodController],
  providers: [RankingsPeriodService],
  exports: [RankingsPeriodService],
})
export class RankingsPeriodModule {}
