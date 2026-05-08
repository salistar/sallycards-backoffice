import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DealSeedsService } from './deal-seeds.service';

@ApiTags('Deal Seeds')
@Controller('deal-seeds')
export class DealSeedsController {
  constructor(private readonly service: DealSeedsService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Compte de seeds par variante en BD' })
  async getStats() {
    return { success: true, data: await this.service.getStats() };
  }

  @Get('seeding-status')
  @ApiOperation({ summary: 'Statut de la génération en arrière-plan' })
  getSeedingStatus() {
    return { success: true, data: this.service.getSeedingStatus() };
  }

  @Get('seeding-history')
  @ApiOperation({ summary: "Historique des snapshots de remplissage de la BD (graphique)" })
  async getHistory(@Query('limit') limitQ?: string) {
    const limit = parseInt(limitQ ?? '100', 10);
    const data = await this.service.getHistory(isNaN(limit) ? 100 : limit);
    return { success: true, data };
  }

  @Get('daily/:variant')
  @ApiOperation({ summary: 'Daily Challenge : seed déterministe selon la date UTC' })
  async getDaily(@Param('variant') variant: string, @Query('date') dateQ?: string) {
    let date: Date | undefined;
    if (dateQ) {
      const d = new Date(dateQ);
      if (!isNaN(d.getTime())) date = d;
    }
    const seed = await this.service.getDailyChallenge(variant, date);
    if (!seed) return { success: false, error: 'NO_SEED', message: `Aucun seed pour ${variant}` };
    return { success: true, data: seed };
  }

  @Get('random/:variant')
  @ApiOperation({ summary: 'Retourne UN deal aléatoire pour la variante (publique, pas d\'auth)' })
  async getRandom(
    @Param('variant') variant: string,
    @Query('difficulty') difficulty?: string,
  ) {
    const seed = await this.service.getRandomSeed(variant, difficulty);
    if (!seed) {
      return { success: false, error: 'NO_SEED', message: `Aucun seed disponible pour ${variant}` };
    }
    return { success: true, data: seed };
  }

  @Get('list/:variant')
  @ApiOperation({ summary: 'Liste N seeds aléatoires pour la variante' })
  async list(
    @Param('variant') variant: string,
    @Query('limit') limitQ?: string,
  ) {
    const limit = parseInt(limitQ ?? '10', 10);
    const seeds = await this.service.listSeeds(variant, isNaN(limit) ? 10 : limit);
    return { success: true, data: seeds };
  }

  @Post('submit')
  @ApiOperation({ summary: 'Soumet un seed depuis le client (mobile populise BD)' })
  async submit(@Body() body: any) {
    if (!body?.variant || !body?.initialState || !body?.dealHash) {
      return { success: false, error: 'BAD_REQUEST' };
    }
    const result = await this.service.submitSeed({
      variant: body.variant,
      initialState: body.initialState,
      solution: body.solution ?? [],
      difficulty: body.difficulty ?? 'medium',
      dealHash: body.dealHash,
      metadata: body.metadata ?? {},
    });
    if ('duplicate' in result) {
      return { success: true, duplicate: true };
    }
    if ('updated' in result) {
      return { success: true, updated: true };
    }
    return { success: true, data: result };
  }

  // ───────────────────────────────────────────────────────────────────────
  // SPIDER V2 — deals pré-générés (collection spider_deals_v2)
  // ───────────────────────────────────────────────────────────────────────

  @Post('spider-v2/import')
  @ApiOperation({ summary: 'Importe un batch de deals Spider v2 (limite payload 60MB)' })
  async importSpiderV2(@Body() body: any) {
    if (!body || !Array.isArray(body.deals)) {
      return { success: false, error: 'BAD_REQUEST', message: 'Body must be { deals: [...] }' };
    }
    const result = await this.service.importSpiderV2Deals(body.deals);
    return { success: true, data: result };
  }

  @Get('spider-v2/random')
  @ApiOperation({ summary: 'Retourne UN deal Spider v2 aléatoire (filtres difficulty + variant optionnels)' })
  async getSpiderV2Random(
    @Query('difficulty') difficulty?: string,
    @Query('variant') variant?: string,
  ) {
    const deal = await this.service.getRandomSpiderV2(difficulty, variant);
    if (!deal) {
      const v = variant ? ` variant=${variant}` : '';
      const d = difficulty ? ` difficulty=${difficulty}` : '';
      return { success: false, error: 'NO_DEAL', message: `Aucun deal v2 disponible${v}${d}` };
    }
    return { success: true, data: deal };
  }

  @Get('spider-v2/stats')
  @ApiOperation({ summary: 'Stats : compte des deals par variant × difficulty' })
  async getSpiderV2Stats() {
    return { success: true, data: await this.service.statsSpiderV2() };
  }

  @Get('spider-v2/list')
  @ApiOperation({ summary: 'Liste N deals Spider v2 (id + difficulty pour sélection)' })
  async listSpiderV2(
    @Query('difficulty') difficulty?: string,
    @Query('limit') limitQ?: string,
    @Query('variant') variant?: string,
  ) {
    const limit = parseInt(limitQ ?? '10', 10);
    const deals = await this.service.listSpiderV2(difficulty, isNaN(limit) ? 10 : limit, variant);
    return { success: true, data: deals };
  }

  @Get('spider-v2/:dealId')
  @ApiOperation({ summary: 'Retourne UN deal Spider v2 complet (avec turns) par son _id' })
  async getSpiderV2ById(@Param('dealId') dealId: string) {
    const deal = await this.service.getSpiderV2ById(dealId);
    if (!deal) {
      return { success: false, error: 'NOT_FOUND', message: `Deal ${dealId} introuvable` };
    }
    return { success: true, data: deal };
  }
}
