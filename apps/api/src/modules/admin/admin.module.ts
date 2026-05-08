import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UsersModule } from '../users/users.module';
import {
  GameHistory,
  GameHistorySchema,
} from '../games/schemas/game-history.schema';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      { name: GameHistory.name, schema: GameHistorySchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
