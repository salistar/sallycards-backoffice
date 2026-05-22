import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RankingsPeriodService } from './rankings-period.service';
import { Period } from './schemas/rankings-period.schema';

@ApiTags('Rankings (periods)')
@Controller('rankings')
export class RankingsPeriodController {
  constructor(private readonly svc: RankingsPeriodService) {}

  @Get(':gameType')
  @ApiOperation({ summary: 'Top 100 du classement pour la periode courante' })
  @ApiQuery({ name: 'period', enum: ['daily', 'weekly', 'monthly', 'weekend', 'season'] })
  async top(@Param('gameType') gameType: string, @Query('period') period: Period = 'daily') {
    return this.svc.top(gameType, period);
  }

  @Get(':gameType/me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mon rang dans la periode courante' })
  async me(@Req() req: any, @Param('gameType') gameType: string, @Query('period') period: Period = 'daily') {
    return this.svc.myRank(req.user.userId, gameType, period);
  }
}
