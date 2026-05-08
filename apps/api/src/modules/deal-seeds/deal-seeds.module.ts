import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DealSeed, DealSeedSchema } from './schemas/deal-seed.schema';
import { SeedHistoryEntry, SeedHistorySchema } from './schemas/seed-history.schema';
import { SpiderDealV2, SpiderDealV2Schema } from './schemas/spider-deal-v2.schema';
import { DealSeedsService } from './deal-seeds.service';
import { DealSeedsController } from './deal-seeds.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DealSeed.name, schema: DealSeedSchema },
      { name: SeedHistoryEntry.name, schema: SeedHistorySchema },
      { name: SpiderDealV2.name, schema: SpiderDealV2Schema },
    ]),
  ],
  controllers: [DealSeedsController],
  providers: [DealSeedsService],
  exports: [DealSeedsService],
})
export class DealSeedsModule {}
