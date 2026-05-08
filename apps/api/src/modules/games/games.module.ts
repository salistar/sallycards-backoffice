import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { GameHistory, GameHistorySchema } from './schemas/game-history.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GameHistory.name, schema: GameHistorySchema },
    ]),
  ],
  controllers: [GamesController],
  providers: [GamesService],
  exports: [GamesService],
})
export class GamesModule {}
