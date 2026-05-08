import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TournamentsService } from './tournaments.service';

@ApiTags('Tournaments')
@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly service: TournamentsService) {}

  @Get('active')
  @ApiOperation({ summary: 'Liste des tournois ouverts/en cours' })
  async listActive() {
    return { success: true, data: await this.service.listActive() };
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
