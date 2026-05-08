import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BotsController } from './bots.controller';
import { BotsService } from './bots.service';
import { BotProfile, BotProfileSchema } from './schemas/bot-profile.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BotProfile.name, schema: BotProfileSchema },
    ]),
  ],
  controllers: [BotsController],
  providers: [BotsService],
  exports: [BotsService],
})
export class BotsModule {}
