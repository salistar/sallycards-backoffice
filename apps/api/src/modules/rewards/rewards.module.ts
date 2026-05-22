import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RewardsController } from './rewards.controller';
import { RewardsService } from './rewards.service';
import { RewardsVoucher, RewardsVoucherSchema } from './schemas/rewards-voucher.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: RewardsVoucher.name, schema: RewardsVoucherSchema }]),
  ],
  controllers: [RewardsController],
  providers: [RewardsService],
  exports: [RewardsService],
})
export class RewardsModule {}
