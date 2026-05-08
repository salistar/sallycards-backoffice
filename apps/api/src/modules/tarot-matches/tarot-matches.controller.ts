import { Controller, Get, Post, Body, Param, Query, Sse } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { TarotMatchesService } from './tarot-matches.service';
import { TarotLeaderboardService } from './tarot-leaderboard.service';
import { TarotMatch, TarotContract } from './schemas/tarot-match.schema';

@ApiTags('Tarot Matches')
@Controller('tarot-matches')
export class TarotMatchesController {
  constructor(
    private readonly service: TarotMatchesService,
    private readonly leaderboard: TarotLeaderboardService,
  ) {}

  @Post('score-submit')
  async submitScore(@Body() body: any) {
    if (!body?.userId || !body?.variant || body?.score == null) {
      return { success: false, error: 'BAD_REQUEST' };
    }
    const score = await this.leaderboard.submitScore({
      userId: body.userId,
      displayName: body.displayName ?? 'Anon',
      variant: body.variant,
      contract: body.contract,
      score: body.score,
      boutsCaptured: body.boutsCaptured ?? 0,
      pointsCaptured: body.pointsCaptured ?? 0,
      chelemAnnounced: !!body.chelemAnnounced,
      petitAuBout: !!body.petitAuBout,
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

  @Get('leaderboard/:variant/chelem')
  async getChelemLb(@Param('variant') variant: string, @Query('limit') limitQ?: string) {
    const limit = parseInt(limitQ ?? '100', 10);
    const entries = await this.leaderboard.getChelemLeaderboard(variant, isNaN(limit) ? 100 : limit);
    return { success: true, data: entries };
  }

  @Get('leaderboard/:variant/user/:userId')
  async getUserRank(@Param('variant') variant: string, @Param('userId') userId: string) {
    const r = await this.leaderboard.getUserRank(userId, variant);
    return { success: true, data: r };
  }

  @Post('create')
  async create(@Body() body: any) {
    if (!body?.variant || !body?.userId || !body?.displayName) {
      return { success: false, error: 'BAD_REQUEST' };
    }
    const match = await this.service.create({
      variant: body.variant,
      playerCount: body.playerCount,
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

  @Post(':code/bid')
  @ApiOperation({ summary: 'Annonce un contrat (petite, garde, gardeSans, gardeContre, pass)' })
  async bid(@Param('code') code: string, @Body() body: any) {
    if (!body?.userId || !body?.contract) return { success: false, error: 'BAD_REQUEST' };
    const allowed: TarotContract[] = ['pass', 'petite', 'garde', 'gardeSans', 'gardeContre'];
    if (!allowed.includes(body.contract)) return { success: false, error: 'BAD_CONTRACT' };
    const match = await this.service.bid(code, body.userId, body.contract, !!body.chelem);
    return { success: true, data: match };
  }

  @Post('quick-match')
  async quickMatch(@Body() body: any) {
    if (!body?.variant || !body?.userId || !body?.displayName) {
      return { success: false, error: 'BAD_REQUEST' };
    }
    const match = await this.service.quickMatch({
      variant: body.variant,
      playerCount: body.playerCount,
      hostUserId: body.userId,
      hostDisplayName: body.displayName,
    });
    return { success: true, data: match };
  }

  @Post(':code/progress')
  async updateProgress(@Param('code') code: string, @Body() body: any) {
    if (!body?.userId || body?.trickCount == null) {
      return { success: false, error: 'BAD_REQUEST' };
    }
    const match = await this.service.updateProgress(code, body.userId, {
      trickCount: body.trickCount,
      pointsCaptured: body.pointsCaptured ?? 0,
      boutsCaptured: body.boutsCaptured ?? 0,
      petitAuBout: !!body.petitAuBout,
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
  stream(@Param('code') code: string): Observable<{ data: TarotMatch }> {
    return this.service.streamMatch(code);
  }

  @Get('list/waiting')
  async listWaiting(@Query('variant') variant?: string, @Query('limit') limitQ?: string) {
    const limit = parseInt(limitQ ?? '10', 10);
    const matches = await this.service.listWaiting(variant, isNaN(limit) ? 10 : limit);
    return { success: true, data: matches };
  }
}
