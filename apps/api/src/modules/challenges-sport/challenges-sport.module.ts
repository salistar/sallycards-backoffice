import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChallengesSportController } from './challenges-sport.controller';
import { ChallengesSportService } from './challenges-sport.service';
import { ChallengeSport, ChallengeSportSchema } from './schemas/challenge-sport.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ChallengeSport.name, schema: ChallengeSportSchema }]),
  ],
  controllers: [ChallengesSportController],
  providers: [ChallengesSportService],
  exports: [ChallengesSportService],
})
export class ChallengesSportModule {}
