import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RoomsService } from './rooms.service';
import { SimulationService } from './simulation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Rooms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rooms')
export class RoomsController {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly simulation: SimulationService,
  ) {}

  @Post('simulate/move')
  @ApiOperation({ summary: 'Get a simulated player\'s next move (called by socket-server)' })
  async simulatedMove(@Body() body: any) {
    return this.simulation.computeSimulatedMove({
      roomCode: body.roomCode,
      gameType: body.gameType,
      simulatedUserId: body.simulatedUserId,
      state: body.state,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create a new room' })
  async create(@Request() req: any, @Body() body: any) {
    return this.roomsService.create(req.user.userId, body.gameType, {
      hostUsername: req.user.username,
      isPrivate: body.isPrivate,
      maxPlayers: body.maxPlayers,
      minPlayers: body.minPlayers,
      botDifficulty: body.botDifficulty,
      stake: body.stake,
    });
  }

  @Get()
  @ApiOperation({ summary: 'List public rooms' })
  async list(
    @Query('gameType') gameType?: string,
    @Query('status') status?: string,
    @Query('mode') mode?: string,
  ) {
    return this.roomsService.list({ status, mode, gameType });
  }

  @Get(':code')
  @ApiOperation({ summary: 'Get room by code' })
  async findByCode(@Param('code') code: string) {
    return this.roomsService.findByCode(code);
  }

  @Post(':code/join')
  @ApiOperation({ summary: 'Join a room' })
  async join(@Param('code') code: string, @Request() req: any) {
    return this.roomsService.join(code, req.user.userId, req.user.username);
  }

  @Post(':code/leave')
  @ApiOperation({ summary: 'Leave a room' })
  async leave(@Param('code') code: string, @Request() req: any) {
    return this.roomsService.leave(code, req.user.userId);
  }

  @Post(':code/ready')
  @ApiOperation({ summary: 'Toggle ready state in a room' })
  async ready(
    @Param('code') code: string,
    @Request() req: any,
    @Body() body: { isReady: boolean },
  ) {
    return this.roomsService.setReady(code, req.user.userId, body.isReady);
  }

  @Post(':code/start')
  @ApiOperation({ summary: 'Host starts the game' })
  async start(@Param('code') code: string, @Request() req: any) {
    return this.roomsService.startGame(code, req.user.userId);
  }

  @Post('simulate')
  @ApiOperation({ summary: 'Create a simulated room pre-seated with N bots from DB' })
  async simulate(@Request() req: any, @Body() body: any) {
    return this.roomsService.createSimulatedRoom(
      req.user.userId,
      body.gameType || 'kdoub',
      parseInt(body.userCount, 10) || 4,
    );
  }
}
