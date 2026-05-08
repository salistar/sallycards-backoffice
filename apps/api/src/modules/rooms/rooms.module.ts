import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { MatchmakingService } from './matchmaking.service';
import { SimulationService } from './simulation.service';
import { Room, RoomSchema } from './schemas/room.schema';
import { BotsModule } from '../bots/bots.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Room.name, schema: RoomSchema }]),
    BotsModule,
  ],
  controllers: [RoomsController],
  providers: [RoomsService, MatchmakingService, SimulationService],
  exports: [RoomsService, MatchmakingService, SimulationService],
})
export class RoomsModule {}
