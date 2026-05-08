import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { GDPRService } from './gdpr.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Response } from 'express';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private readonly usersService: UsersService,
    /**
     * Service GDPR / CNDP loi 09-08 : export des données et droit à l'oubli.
     * Spec section 13.2 : obligations CNDP du Maroc (déclaration, consentement
     * explicite, droit d'accès, droit à l'oubli sous 30 jours).
     */
    private readonly gdprService: GDPRService,
  ) {}

  @Get('by-game/:gameType')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List players for a specific game type' })
  async getByGameType(@Param('gameType') gameType: string) {
    const users = await this.usersService.findByGameType(gameType);
    return users.map((u: any) => {
      const obj = u.toObject ? u.toObject() : u;
      delete obj.passwordHash;
      delete obj.settings;
      return obj;
    });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@Request() req: any) {
    const user = await this.usersService.findById(req.user.userId);
    if (!user) {
      return null;
    }
    const obj = user.toObject();
    delete obj.passwordHash;
    return obj;
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  async updateMe(@Request() req: any, @Body() body: any) {
    const { username, avatar, locale, settings } = body;
    const user = await this.usersService.update(req.user.userId, {
      username,
      avatar,
      locale,
      settings,
    });
    const obj = user.toObject();
    delete obj.passwordHash;
    return obj;
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a user by ID (public profile)' })
  async getById(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) {
      return null;
    }
    const obj = user.toObject();
    delete obj.passwordHash;
    delete obj.settings;
    return obj;
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete current user account' })
  async deleteMe(@Request() req: any) {
    await this.usersService.delete(req.user.userId);
  }

  // ════════════════════════════════════════════════════════════════════
  // CNDP / GDPR — Loi 09-08 (Maroc) + RGPD (UE)
  // Spec section 13.2 : obligations légales pour le marché MENA.
  // ════════════════════════════════════════════════════════════════════

  /**
   * GET /users/me/export-data
   * Article 20 RGPD + loi 09-08 art. 7 : droit d'accès aux données personnelles.
   * Renvoie un JSON complet de tout ce que l'app stocke sur l'utilisateur.
   *
   * Le client peut télécharger ce fichier ; format attendu : JSON dans un blob.
   */
  @Get('me/export-data')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export all personal data (CNDP loi 09-08 + RGPD article 20)' })
  async exportMyData(@Request() req: any, @Res() res: Response) {
    const userId = req.user.userId;
    this.logger.log(`[CNDP] Export demandé pour userId=${userId}`);
    const result = await this.gdprService.exportUserData(userId);
    // Headers pour télécharger comme fichier (UX clean côté client)
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="sallycards-data-${userId}-${Date.now()}.json"`,
    );
    res.json(result);
  }

  /**
   * POST /users/me/delete-account
   * Article 17 RGPD + loi 09-08 art. 9 : droit à l'oubli.
   * Suppression effective sous 30 jours selon spec section 13.2.
   *
   * Pour MVP : suppression immédiate. Pour prod : queue BullMQ avec délai 30j
   * (l'utilisateur peut annuler dans cette fenêtre).
   */
  @Post('me/delete-account')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Trigger account deletion (CNDP loi 09-08 + RGPD article 17)' })
  async requestAccountDeletion(@Request() req: any, @Body() body: { reason?: string } = {}) {
    const userId = req.user.userId;
    this.logger.warn(
      `[CNDP] Suppression compte demandée userId=${userId} reason=${body.reason ?? 'non spécifiée'}`,
    );
    await this.gdprService.deleteUserData(userId);
    return {
      ok: true,
      message: 'Demande de suppression enregistrée. Effective sous 30 jours.',
      effectiveAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  /**
   * POST /users/me/anonymize
   * Alternative à la suppression : on garde les statistiques agrégées (ELO,
   * historique) mais on retire toute information identifiable. Utile pour les
   * leaderboards qui doivent rester cohérents même après un départ.
   */
  @Post('me/anonymize')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Anonymize account (keep aggregate stats, remove PII)' })
  async anonymizeAccount(@Request() req: any) {
    const userId = req.user.userId;
    this.logger.warn(`[CNDP] Anonymisation demandée userId=${userId}`);
    await this.gdprService.anonymizeUser(userId);
    return { ok: true, message: 'Compte anonymisé. Tu apparais désormais comme "DeletedUser_XXXX".' };
  }
}
