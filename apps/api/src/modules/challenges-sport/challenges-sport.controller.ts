import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChallengesSportService } from './challenges-sport.service';

@ApiTags('Challenges Sport')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('challenges/sport')
export class ChallengesSportController {
  constructor(private readonly svc: ChallengesSportService) {}

  @Post()
  @ApiOperation({ summary: 'Donner un defi sport (marche/course) au perdant' })
  async create(@Req() req: any, @Body() body: any) {
    return this.svc.create(req.user.userId, body);
  }

  @Post(':id/track')
  @ApiOperation({ summary: 'Envoyer un batch de points GPS' })
  async track(@Req() req: any, @Param('id') id: string, @Body() body: { points: any[] }) {
    return this.svc.track(id, req.user.userId, body.points || []);
  }

  @Post(':id/finish')
  @ApiOperation({ summary: 'Marquer le defi termine (succes ou abandon)' })
  async finish(@Req() req: any, @Param('id') id: string, @Body() body: { success: boolean; durationMs?: number }) {
    return this.svc.finish(id, req.user.userId, body.success, body.durationMs);
  }

  @Get('history')
  @ApiOperation({ summary: 'Historique des defis donnes + recus' })
  async history(@Req() req: any): Promise<any[]> {
    return this.svc.history(req.user.userId);
  }

  @Get('active')
  @ApiOperation({ summary: 'Defis en cours pour le user authentifie' })
  async active(@Req() req: any): Promise<any[]> {
    return this.svc.listActive(req.user.userId);
  }
}
