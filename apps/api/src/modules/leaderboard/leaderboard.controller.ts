import {
  Controller,
  Get,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { LeaderboardService } from './leaderboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

type LeaderboardFilter = 'season' | 'weekly' | 'allTime';
type LeaderboardScope = 'world' | 'country' | 'city';

@ApiTags('Leaderboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('leaderboards')
export class LeaderboardController {
  constructor(
    private readonly leaderboardService: LeaderboardService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  private async getRequesterGeo(gameType: string, userId: string) {
    try {
      const { ObjectId } = require('mongodb');
      const _id = (() => { try { return new ObjectId(userId); } catch { return userId; } })();
      const u = await this.connection
        .collection(`${gameType}_users`)
        .findOne({ _id }, { projection: { location: 1 } });
      return {
        country: u?.location?.country,
        city: u?.location?.city,
      };
    } catch {
      return { country: undefined, city: undefined };
    }
  }

  @Get(':gameType')
  @ApiOperation({ summary: 'Get global leaderboard for a game type' })
  async getGlobalRanking(
    @Param('gameType') gameType: string,
    @Request() req: any,
    @Query('scope') scope?: LeaderboardScope,
    @Query('filter') filter?: LeaderboardFilter,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const geo = await this.getRequesterGeo(gameType, req.user.userId);
    return this.leaderboardService.getGlobalRanking(
      gameType,
      page,
      limit,
      filter ?? 'season',
      scope ?? 'world',
      geo.country,
      geo.city,
    );
  }

  @Get(':gameType/me')
  @ApiOperation({ summary: 'Get current user rank for a game type' })
  async getUserRank(
    @Param('gameType') gameType: string,
    @Request() req: any,
  ) {
    return this.leaderboardService.getUserRank(gameType, req.user.userId);
  }

  @Get(':gameType/my-rank')
  @ApiOperation({ summary: 'Alias: Get current user rank with filter' })
  async getMyRank(
    @Param('gameType') gameType: string,
    @Query('filter') filter: LeaderboardFilter,
    @Request() req: any,
  ) {
    return this.leaderboardService.getUserRank(
      gameType,
      req.user.userId,
      filter,
    );
  }
}
