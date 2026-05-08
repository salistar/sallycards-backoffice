import { Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChallengesService } from './challenges.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Challenges')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('challenges')
export class ChallengesController {
  constructor(private readonly svc: ChallengesService) {}

  @Get('daily/:gameType')
  @ApiOperation({ summary: 'Get today\'s daily challenge for a game' })
  async today(@Param('gameType') gameType: string) {
    return this.svc.today(gameType);
  }

  @Post('daily/:gameType/matchmake')
  @ApiOperation({ summary: 'Join the daily-challenge matchmaking queue' })
  async matchmake(@Param('gameType') gameType: string, @Request() req: any) {
    return this.svc.joinDailyMatchmaking(gameType, req.user.userId, req.user.username);
  }
}
