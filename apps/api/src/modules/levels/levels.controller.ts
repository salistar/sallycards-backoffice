import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LevelsService } from './levels.service';

@ApiTags('Levels')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('levels')
export class LevelsController {
  constructor(private readonly svc: LevelsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Ma progression XP/niveau pour un jeu' })
  async me(@Req() req: any, @Query('gameType') gameType: string) {
    return this.svc.getOrCreate(req.user.userId, gameType);
  }
}
