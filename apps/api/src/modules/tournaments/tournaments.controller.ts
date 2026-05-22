import { Controller, Get, Post, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TournamentsService } from './tournaments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Tournaments')
@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly service: TournamentsService) {}

  @Get('active')
  @ApiOperation({ summary: 'Liste des tournois ouverts/en cours' })
  async listActive() {
    return { success: true, data: await this.service.listActive() };
  }

  @Get()
  @ApiOperation({ summary: 'Liste des tournois actifs (format mobile/friendly)' })
  async list(@Query('gameType') gameType?: string) {
    const items = await this.service.listActive();
    return items
      .filter((t: any) => !gameType || t.variant === gameType)
      .map((t: any) => ({
        _id: t.code,
        name: `Tournoi ${t.type}`,
        scope: t.type,
        status: t.status === 'closed' ? 'finished' : t.status,
        participantsCount: t.entries?.length ?? 0,
        maxParticipants: 100,
        startsAt: new Date(t.startsAt).toISOString(),
        prizes: (t.prizes ?? []).map((p: any) => ({ rank: p.rank, reward: `${p.gold} gold` })),
      }));
  }

  @Post(':code/join')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Inscrit le joueur courant à un tournoi' })
  async join(@Param('code') code: string, @Req() req: any, @Body() body: any) {
    const displayName = body?.displayName || req.user?.username || 'Joueur';
    return this.service.join(code, req.user.userId, displayName);
  }

  @Get('daily/:variant')
  @ApiOperation({ summary: 'Récupère ou crée le tournoi du jour' })
  async getDaily(@Param('variant') variant: string) {
    const t = await this.service.getOrCreateDaily(variant);
    return { success: true, data: t };
  }

  @Get('weekly/:variant')
  @ApiOperation({ summary: 'Récupère ou crée le tournoi de la semaine' })
  async getWeekly(@Param('variant') variant: string) {
    const t = await this.service.getOrCreateWeekly(variant);
    return { success: true, data: t };
  }

  @Get(':code')
  @ApiOperation({ summary: 'Détails d\'un tournoi (avec ranking trié)' })
  async getOne(@Param('code') code: string) {
    return { success: true, data: await this.service.getByCode(code) };
  }

  @Post(':code/submit')
  @ApiOperation({ summary: 'Soumet un score à un tournoi' })
  async submitScore(@Param('code') code: string, @Body() body: any) {
    if (!body?.userId || !body?.displayName || body?.score == null) {
      return { success: false, error: 'BAD_REQUEST' };
    }
    const t = await this.service.submitScore(code, body.userId, body.displayName, {
      score: body.score, moves: body.moves ?? 0, durationMs: body.durationMs ?? 0,
    });
    return { success: true, data: t };
  }

  @Post(':code/close')
  @ApiOperation({ summary: 'Force la clôture d\'un tournoi (admin / cron)' })
  async close(@Param('code') code: string) {
    return { success: true, data: await this.service.closeTournament(code) };
  }
}
