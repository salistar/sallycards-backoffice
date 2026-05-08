import { Controller, Get, Post, Body, Param, Query, Sse } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { SolitaireMatchesService } from './solitaire-matches.service';
import { SolitaireLeaderboardService } from './solitaire-leaderboard.service';
import { SolitaireMatch } from './schemas/solitaire-match.schema';

@ApiTags('Solitaire Matches')
@Controller('solitaire-matches')
export class SolitaireMatchesController {
  constructor(
    private readonly service: SolitaireMatchesService,
    private readonly leaderboard: SolitaireLeaderboardService,
  ) {}

  @Post('score-submit')
  @ApiOperation({ summary: "Soumet un score solo (compte pour le leaderboard)" })
  async submitScore(@Body() body: any) {
    if (!body?.userId || !body?.variant || body?.score == null) {
      return { success: false, error: 'BAD_REQUEST' };
    }
    const score = await this.leaderboard.submitScore({
      userId: body.userId,
      displayName: body.displayName ?? 'Anon',
      variant: body.variant,
      difficulty: body.difficulty,
      score: body.score,
      moves: body.moves ?? 0,
      durationMs: body.durationMs ?? 0,
      won: body.won ?? true,
    });
    return { success: true, data: score };
  }

  @Get('leaderboard/:variant')
  @ApiOperation({ summary: 'Top N joueurs pour une variante' })
  async getLeaderboard(@Param('variant') variant: string, @Query('limit') limitQ?: string) {
    const limit = parseInt(limitQ ?? '100', 10);
    const entries = await this.leaderboard.getLeaderboard(variant, isNaN(limit) ? 100 : limit);
    return { success: true, data: entries };
  }

  @Get('leaderboard/:variant/user/:userId')
  @ApiOperation({ summary: "Rang d'un utilisateur pour une variante" })
  async getUserRank(@Param('variant') variant: string, @Param('userId') userId: string) {
    const r = await this.leaderboard.getUserRank(userId, variant);
    return { success: true, data: r };
  }

  @Get('leaderboard/:variant/time')
  @ApiOperation({ summary: 'Time-attack : top par durée ASC' })
  async getTimeLb(@Param('variant') variant: string, @Query('limit') limitQ?: string) {
    const limit = parseInt(limitQ ?? '100', 10);
    const entries = await this.leaderboard.getTimeLeaderboard(variant, isNaN(limit) ? 100 : limit);
    return { success: true, data: entries };
  }

  @Get('leaderboard/:variant/moves')
  @ApiOperation({ summary: 'Fewest-moves : top par coups ASC' })
  async getMovesLb(@Param('variant') variant: string, @Query('limit') limitQ?: string) {
    const limit = parseInt(limitQ ?? '100', 10);
    const entries = await this.leaderboard.getMovesLeaderboard(variant, isNaN(limit) ? 100 : limit);
    return { success: true, data: entries };
  }

  @Post('create')
  @ApiOperation({ summary: 'Créer une nouvelle partie 1v1 (en attente)' })
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
  @ApiOperation({ summary: 'Rejoindre une partie via son code' })
  async join(@Param('code') code: string, @Body() body: any) {
    if (!body?.userId || !body?.displayName) {
      return { success: false, error: 'BAD_REQUEST' };
    }
    const match = await this.service.join(code, body.userId, body.displayName);
    return { success: true, data: match };
  }

  @Post('quick-match')
  @ApiOperation({ summary: 'Quick Match : trouve OU crée une partie' })
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
  @ApiOperation({ summary: "Update du score/coups d'un joueur (avec anti-cheat optionnel via 'actions')" })
  async updateProgress(@Param('code') code: string, @Body() body: any) {
    if (!body?.userId || body?.score == null || body?.moves == null) {
      return { success: false, error: 'BAD_REQUEST' };
    }
    const match = await this.service.updateProgress(code, body.userId, {
      score: body.score,
      moves: body.moves,
      finished: !!body.finished,
      actions: Array.isArray(body.actions) ? body.actions : undefined,
    });
    return { success: true, data: match };
  }

  @Get(':code')
  @ApiOperation({ summary: 'Récupérer un match par code (polling status)' })
  async getOne(@Param('code') code: string) {
    const match = await this.service.getByCode(code);
    return { success: true, data: match };
  }

  @Sse(':code/stream')
  @ApiOperation({ summary: 'Server-Sent Events : push des updates en temps réel' })
  stream(@Param('code') code: string): Observable<{ data: SolitaireMatch }> {
    return this.service.streamMatch(code);
  }

  @Get('list/waiting')
  @ApiOperation({ summary: 'Liste les matches en attente' })
  async listWaiting(@Query('variant') variant?: string, @Query('limit') limitQ?: string) {
    const limit = parseInt(limitQ ?? '10', 10);
    const matches = await this.service.listWaiting(variant, isNaN(limit) ? 10 : limit);
    return { success: true, data: matches };
  }
}
