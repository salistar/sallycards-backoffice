import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LevelsController } from './levels.controller';
import { LevelsService } from './levels.service';
import { LevelProgression, LevelProgressionSchema } from './schemas/level-progression.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: LevelProgression.name, schema: LevelProgressionSchema }]),
  ],
  controllers: [LevelsController],
  providers: [LevelsService],
  exports: [LevelsService],
})
export class LevelsModule {}
