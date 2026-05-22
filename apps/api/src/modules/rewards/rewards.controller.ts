import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RewardsService } from './rewards.service';

@ApiTags('Rewards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rewards')
export class RewardsController {
  constructor(private readonly svc: RewardsService) {}

  @Get('vouchers')
  @ApiOperation({ summary: 'Mes bons d\'achat' })
  async list(@Req() req: any) {
    return this.svc.myVouchers(req.user.userId);
  }

  @Post('vouchers/:code/claim')
  @ApiOperation({ summary: 'Reclamer un bon (passe en claimed)' })
  async claim(@Req() req: any, @Param('code') code: string) {
    return this.svc.claim(code, req.user.userId);
  }
}
