import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { SupportService } from './support.service';

@ApiTags('Support')
@Controller('support')
export class SupportController {
  constructor(private readonly svc: SupportService) {}

  @Post('tickets')
  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Crée un ticket de support (auth optionnelle)' })
  async create(@Req() req: any, @Body() body: any) {
    const userId = req.user?.userId ?? null;
    const email = req.user?.email ?? body?.email;
    return this.svc.createTicket(userId, body?.subject, body?.message, email);
  }
}
