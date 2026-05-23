/**
 * @file posts.controller.ts
 * @description Mur de partage par jeu (auth).
 *   GET  /wall/:game?limit       → posts récents
 *   POST /wall/:game {text}      → publier
 *   POST /wall/:game/:id/like    → like / unlike
 */
import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PostsService } from './posts.service';

@ApiTags('Wall')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wall')
export class PostsController {
  constructor(private readonly svc: PostsService) {}

  @Get(':game')
  @ApiOperation({ summary: 'Posts récents du mur (par jeu)' })
  async list(@Param('game') game: string, @Query('limit') limit?: string) {
    return this.svc.list(game, limit ? parseInt(limit, 10) : 40);
  }

  @Post(':game')
  @ApiOperation({ summary: 'Publier un message sur le mur' })
  async create(@Param('game') game: string, @Req() req: any, @Body() body: { text: string }) {
    return this.svc.create(game, req.user.userId, req.user.username || 'Joueur', body?.text);
  }

  @Post(':game/:id/like')
  @ApiOperation({ summary: 'Like / unlike un post' })
  async like(@Param('id') id: string, @Req() req: any) {
    return this.svc.toggleLike(id, req.user.userId);
  }
}
