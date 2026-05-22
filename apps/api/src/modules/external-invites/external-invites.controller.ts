import { Body, Controller, Post, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExternalInvitesService } from './external-invites.service';

@ApiTags('External Invites')
@Controller('external-invites')
export class ExternalInvitesController {
  constructor(private readonly svc: ExternalInvitesService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Génère un lien magique d\'invitation (deep-link)' })
  async create(@Req() req: any, @Body() body: any) {
    return this.svc.create(req.user.userId, body?.game, body?.channel);
  }

  @Post(':token/claim')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Réclame une invitation après installation' })
  async claim(@Param('token') token: string, @Req() req: any) {
    return this.svc.claim(token, req.user.userId);
  }
}
