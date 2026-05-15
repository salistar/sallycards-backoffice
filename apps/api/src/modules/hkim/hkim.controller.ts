/**
 * @file hkim.controller.ts
 * @description Endpoints des "hkim" MULTI-JEUX — protégés par JWT,
 * scoping par utilisateur. Chaque jeu a sa collection hkim_<jeu>.
 *
 * Routes (prefix global api/v1) :
 *   GET    /api/v1/hkim/:game?lat&lng        -> liste (auto-seed 10 si vide)
 *   GET    /api/v1/hkim/:game/summary        -> {total, done, pending, items}
 *   GET    /api/v1/hkim/:game/feed?limit     -> fil d'actualité (tous users)
 *   POST   /api/v1/hkim/:game/generate       -> régénère 10 autour de {lat,lng}
 *   POST   /api/v1/hkim/:game/seed-history   -> 10 historiques + autres users
 *   POST   /api/v1/hkim/:game/:id/complete   -> marque effectué
 *   GET    /api/v1/hkim/:game/:id/comments   -> commentaires
 *   POST   /api/v1/hkim/:game/:id/comments   -> ajoute un commentaire
 */
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HkimService } from './hkim.service';

@UseGuards(JwtAuthGuard)
@Controller('hkim')
export class HkimController {
  constructor(private readonly svc: HkimService) {}

  @Get(':game')
  list(
    @Param('game') game: string,
    @Request() req: any,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
  ) {
    return this.svc.listForUser(
      game,
      req.user.userId,
      lat != null ? parseFloat(lat) : undefined,
      lng != null ? parseFloat(lng) : undefined,
      req.user.username || 'Joueur',
    );
  }

  @Get(':game/summary')
  summary(@Param('game') game: string, @Request() req: any) {
    return this.svc.summary(game, req.user.userId);
  }

  @Get(':game/feed')
  feed(@Param('game') game: string, @Query('limit') limit?: string) {
    return this.svc.feed(game, limit ? parseInt(limit, 10) : 30);
  }

  @Post(':game/generate')
  generate(
    @Param('game') game: string,
    @Request() req: any,
    @Body() body: { lat: number; lng: number },
  ) {
    return this.svc.generate(
      game,
      req.user.userId,
      body.lat,
      body.lng,
      req.user.username || 'Joueur',
    );
  }

  @Post(':game/seed-history')
  seedHistory(
    @Param('game') game: string,
    @Request() req: any,
    @Body() body: { lat: number; lng: number },
  ) {
    return this.svc.seedHistory(
      game,
      req.user.userId,
      body.lat,
      body.lng,
      req.user.username || 'Joueur',
    );
  }

  @Post(':game/:id/complete')
  complete(
    @Param('game') game: string,
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.svc.complete(game, req.user.userId, id);
  }

  @Get(':game/:id/comments')
  getComments(@Param('game') game: string, @Param('id') id: string) {
    return this.svc.getComments(game, id);
  }

  @Post(':game/:id/comments')
  addComment(
    @Param('game') game: string,
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { text: string },
  ) {
    return this.svc.addComment(
      game,
      id,
      req.user.userId,
      req.user.username || 'Joueur',
      body.text,
    );
  }
}
