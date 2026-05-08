import { Controller, Get, Post, Body, Param, Query, Sse } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { PokerMatchesService } from './poker-matches.service';
import { PokerLeaderboardService } from './poker-leaderboard.service';
import { PokerMatch, PokerVariant, PokerFormat } from './schemas/poker-match.schema';

@ApiTags('Poker Matches')
@Controller('poker-matches')
export class PokerMatchesController {
  constructor(
    private readonly service: PokerMatchesService,
    private readonly leaderboard: PokerLeaderboardService,
  ) {}

  @Post('score-submit')
  async submitScore(@Body() body: any) {
    if (!body?.userId || !body?.variant) {
      return { success: false, error: 'BAD_REQUEST' };
    }
    const score = await this.leaderboard.submitScore({
      userId: body.userId,
      displayName: body.displayName ?? 'Anon',
      variant: body.variant,
      format: body.format,
      netProfit: body.netProfit ?? 0,
      biggestPot: body.biggestPot ?? 0,
      handsPlayed: body.handsPlayed ?? 0,
      handsWon: body.handsWon ?? 0,
      royalFlushes: body.royalFlushes ?? 0,
      bluffsWon: body.bluffsWon ?? 0,
      durationMs: body.durationMs ?? 0,
    });
    return { success: true, data: score };
  }

  @Get('leaderboard/:variant')
  async getLeaderboard(@Param('variant') variant: string, @Query('limit') limitQ?: string) {
    const limit = parseInt(limitQ ?? '100', 10);
    const entries = await this.leaderboard.getLeaderboard(variant, isNaN(limit) ? 100 : limit);
    return { success: true, data: entries };
  }

  @Get('leaderboard/:variant/biggest-pots')
  async getBiggestPots(@Param('variant') variant: string, @Query('limit') limitQ?: string) {
    const limit = parseInt(limitQ ?? '100', 10);
    const entries = await this.leaderboard.getBiggestPots(variant, isNaN(limit) ? 100 : limit);
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
    const allowed: PokerVariant[] = ['holdem', 'omaha', 'omahaHiLo', 'fiveCardDraw', 'sevenCardStud', 'razz'];
    if (!allowed.includes(body.variant)) return { success: false, error: 'BAD_VARIANT' };
    const match = await this.service.create({
      variant: body.variant,
      format: body.format,
      smallBlind: body.smallBlind,
      bigBlind: body.bigBlind,
      buyIn: body.buyIn,
      maxPlayers: body.maxPlayers,
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
      format: body.format,
      hostUserId: body.userId,
      hostDisplayName: body.displayName,
    });
    return { success: true, data: match };
  }

  @Post(':code/action')
  @ApiOperation({ summary: 'Action joueur (check/bet/call/raise/fold/allin)' })
  async action(@Param('code') code: string, @Body() body: any) {
    if (!body?.userId || !body?.action) return { success: false, error: 'BAD_REQUEST' };
    const match = await this.service.action(code, body.userId, {
      action: body.action,
      amount: body.amount,
    });
    return { success: true, data: match };
  }

  @Post(':code/settle')
  @ApiOperation({ summary: 'Distribue le pot au gagnant après showdown' })
  async settle(@Param('code') code: string, @Body() body: any) {
    if (!body?.winnerId) return { success: false, error: 'BAD_REQUEST' };
    const match = await this.service.settleHand(code, {
      winnerId: body.winnerId,
      biggestPot: body.biggestPot ?? 0,
      royalFlush: !!body.royalFlush,
    });
    return { success: true, data: match };
  }

  @Post(':code/leave')
  async leave(@Param('code') code: string, @Body() body: any) {
    if (!body?.userId) return { success: false, error: 'BAD_REQUEST' };
    const match = await this.service.leave(code, body.userId);
    return { success: true, data: match };
  }

  @Get(':code')
  async getOne(@Param('code') code: string) {
    const match = await this.service.getByCode(code);
    return { success: true, data: match };
  }

  @Sse(':code/stream')
  stream(@Param('code') code: string): Observable<{ data: PokerMatch }> {
    return this.service.streamMatch(code);
  }

  @Get('list/waiting')
  async listWaiting(
    @Query('variant') variant?: string,
    @Query('format') format?: string,
    @Query('limit') limitQ?: string,
  ) {
    const limit = parseInt(limitQ ?? '10', 10);
    const matches = await this.service.listWaiting(variant, format, isNaN(limit) ? 10 : limit);
    return { success: true, data: matches };
  }
}
