import { Controller, Get, Post, Body, Param, Query, Sse } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { ConcentrationMatchesService } from './concentration-matches.service';
import { ConcentrationLeaderboardService } from './concentration-leaderboard.service';
import { ConcentrationMatch } from './schemas/concentration-match.schema';

@ApiTags('Concentration Matches')
@Controller('concentration-matches')
export class ConcentrationMatchesController {
  constructor(
    private readonly service: ConcentrationMatchesService,
    private readonly leaderboard: ConcentrationLeaderboardService,
  ) {}

  @Post('score-submit')
  async submitScore(@Body() body: any) {
    if (!body?.userId || !body?.variant || body?.pairsFound == null || body?.moves == null) {
      return { success: false, error: 'BAD_REQUEST' };
    }
    const score = await this.leaderboard.submitScore({
      userId: body.userId,
      displayName: body.displayName ?? 'Anon',
      variant: body.variant,
      difficulty: body.difficulty,
      pairsFound: body.pairsFound,
      moves: body.moves,
      durationMs: body.durationMs ?? 0,
      won: body.won ?? true,
    });
    return { success: true, data: score };
  }

  @Get('leaderboard/:variant')
  async getLeaderboard(@Param('variant') variant: string, @Query('limit') limitQ?: string) {
    const limit = parseInt(limitQ ?? '100', 10);
    const entries = await this.leaderboard.getLeaderboard(variant, isNaN(limit) ? 100 : limit);
    return { success: true, data: entries };
  }

  @Get('leaderboard/:variant/user/:userId')
  async getUserRank(@Param('variant') variant: string, @Param('userId') userId: string) {
    const r = await this.leaderboard.getUserRank(userId, variant);
    return { success: true, data: r };
  }

  @Get('leaderboard/:variant/time')
  async getTimeLb(@Param('variant') variant: string, @Query('limit') limitQ?: string) {
    const limit = parseInt(limitQ ?? '100', 10);
    const entries = await this.leaderboard.getTimeLeaderboard(variant, isNaN(limit) ? 100 : limit);
    return { success: true, data: entries };
  }

  @Get('leaderboard/:variant/moves')
  async getMovesLb(@Param('variant') variant: string, @Query('limit') limitQ?: string) {
    const limit = parseInt(limitQ ?? '100', 10);
    const entries = await this.leaderboard.getMovesLeaderboard(variant, isNaN(limit) ? 100 : limit);
    return { success: true, data: entries };
  }

  @Post('create')
  async create(@Body() body: any) {
    if (!body?.variant || !body?.userId || !body?.displayName) {
      return { success: false, error: 'BAD_REQUEST' };
    }
    const match = await this.service.create({
      variant: body.variant,
      difficulty: body.difficulty,
      hostUserId: body.userId,
      hostDisplayName: body.displayName,
    });
    return { success: true, data: match };
  }

  @Post('join/:code')
  async join(@Param('code') code: string, @Body() body: any) {
    if (!body?.userId || !body?.displayName) {
      return { success: false, error: 'BAD_REQUEST' };
    }
    const match = await this.service.join(code, body.userId, body.displayName);
    return { success: true, data: match };
  }

  @Post('quick-match')
  async quickMatch(@Body() body: any) {
    if (!body?.variant || !body?.userId || !body?.displayName) {
      return { success: false, error: 'BAD_REQUEST' };
    }
    const match = await this.service.quickMatch({
      variant: body.variant,
      difficulty: body.difficulty,
      hostUserId: body.userId,
      hostDisplayName: body.displayName,
    });
    return { success: true, data: match };
  }

  @Post(':code/progress')
  async updateProgress(@Param('code') code: string, @Body() body: any) {
    if (!body?.userId || body?.pairsFound == null || body?.moves == null) {
      return { success: false, error: 'BAD_REQUEST' };
    }
    const match = await this.service.updateProgress(code, body.userId, {
      pairsFound: body.pairsFound,
      moves: body.moves,
      finished: !!body.finished,
    });
    return { success: true, data: match };
  }

  @Get(':code')
  async getOne(@Param('code') code: string) {
    const match = await this.service.getByCode(code);
    return { success: true, data: match };
  }

  @Sse(':code/stream')
  stream(@Param('code') code: string): Observable<{ data: ConcentrationMatch }> {
    return this.service.streamMatch(code);
  }

  @Get('list/waiting')
  async listWaiting(@Query('variant') variant?: string, @Query('limit') limitQ?: string) {
    const limit = parseInt(limitQ ?? '10', 10);
    const matches = await this.service.listWaiting(variant, isNaN(limit) ? 10 : limit);
    return { success: true, data: matches };
  }
}
