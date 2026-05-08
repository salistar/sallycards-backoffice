import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GamesService } from './games.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Games')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Post('move')
  @ApiOperation({ summary: 'Submit a game move' })
  async makeMove(@Request() req: any, @Body() body: any) {
    return this.gamesService.makeMove(body.gameId, req.user.userId, body.move);
  }

  @Post('complete')
  @ApiOperation({ summary: 'Report end-of-game; bumps ELO / stats / streaks' })
  async complete(@Body() body: any) {
    return this.gamesService.completeGame(body);
  }

  @Post('save')
  @ApiOperation({
    summary: 'Persist a SOLO game result — score/moves/duration/won/variant + difficulty + hintsUsed',
  })
  async saveSolo(@Request() req: any, @Body() body: any) {
    const diffRaw = (body.difficulty || '').toString().toLowerCase();
    const difficulty: 'easy' | 'medium' | 'hard' | undefined =
      diffRaw === 'easy' || diffRaw === 'medium' || diffRaw === 'hard' ? diffRaw : undefined;
    return this.gamesService.saveSoloGame({
      userId: req.user.userId,
      gameType: body.gameType,
      variant: body.variant,
      score: Number(body.score) || 0,
      moves: Number(body.moves) || 0,
      durationMs: Number(body.durationMs) || 0,
      won: !!body.won,
      difficulty,
      hintsUsed: Math.max(0, Number(body.hintsUsed) || 0),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get game state by ID' })
  async getGame(@Param('id') id: string) {
    return this.gamesService.getGame(id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get move history for a game' })
  async getHistory(@Param('id') id: string) {
    return this.gamesService.getHistory(id);
  }
}
