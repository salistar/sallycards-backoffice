// بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
// SallyCards Solitaire — Match Invite (lien direct WhatsApp/SMS)
// Spec section 8.2 : token JWT court (1h TTL) qui réserve une room.
//
// Flow :
//   1. Joueur A appelle POST /api/match/invite → reçoit { url, token, expiresAt }
//   2. Joueur A partage l'URL via WhatsApp/SMS
//   3. Joueur B ouvre l'URL → frontend décode le token (sans signature, juste pour
//      afficher info)
//   4. Si non connecté → écran login/signup
//   5. Si connecté → POST /api/match/invite/:token/accept
//   6. Serveur valide la signature, ajoute B comme player2, démarre le match.

import {
  Controller,
  Post,
  Get,
  Param,
  Req,
  Body,
  Logger,
  UseGuards,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface InviteTokenPayload {
  /** ID du match créé en attente. */
  matchId: string;
  /** Joueur initiateur (player1). */
  inviterId: string;
  /** Issued at (Unix seconds). */
  iat: number;
  /** Expiration (Unix seconds, +3600s par défaut). */
  exp: number;
}

/**
 * DTO d'entrée pour la création d'invitation.
 * Les valeurs par défaut sont définies serveur-side pour éviter abus (ex. créer
 * 10000 invitations qui ne seront jamais utilisées).
 */
interface CreateInviteDto {
  /** Variante de solitaire jouée (ex. "klondike", "spider-1"). Default = "klondike". */
  variant?: string;
  /** Mode duel : 'casual' (sans ELO) ou 'ranked' (avec impact ELO). */
  mode?: 'casual' | 'ranked';
}

@Controller('api/match/invite')
export class MatchInviteController {
  private readonly logger = new Logger(MatchInviteController.name);

  /** Durée de vie du lien d'invitation : 1h (spec section 8.2). */
  private readonly TTL_SECONDS = 60 * 60;

  constructor(private readonly jwt: JwtService) {}

  /**
   * Crée une invitation. Le user authentifié devient `inviterId` (player1).
   * Retourne l'URL à partager + le token + la date d'expiration.
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async createInvite(@Req() req: any, @Body() dto: CreateInviteDto = {}) {
    const inviterId = req.user?.id ?? req.user?.userId;
    if (!inviterId) {
      throw new UnauthorizedException('Auth requise pour créer une invitation');
    }

    // Pour MVP : le matchId est généré ici et sera créé en BD lors de l'accept.
    // Une approche plus robuste serait de créer le match en BD dès l'invitation
    // avec status='pending_invite' — ce que je conseille pour la prod.
    const matchId = `inv-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    const tokenPayload: Omit<InviteTokenPayload, 'iat' | 'exp'> = {
      matchId,
      inviterId,
    };

    // jwt.signAsync utilise la config globale du JwtModule (secret + expiresIn).
    // On override expiresIn pour 1h (spec).
    const token = await this.jwt.signAsync(tokenPayload, {
      expiresIn: `${this.TTL_SECONDS}s`,
    });

    const baseUrl = process.env.PUBLIC_WEB_URL ?? 'https://sallycards.salistar.ma';
    const url = `${baseUrl}/match/invite/${token}`;
    const expiresAt = Math.floor(Date.now() / 1000) + this.TTL_SECONDS;

    this.logger.log(
      `Invite créée par ${inviterId} : matchId=${matchId} variant=${dto.variant ?? 'klondike'} expire=${new Date(expiresAt * 1000).toISOString()}`,
    );

    return {
      url,
      token,
      matchId,
      expiresAt,
      variant: dto.variant ?? 'klondike',
      mode: dto.mode ?? 'casual',
    };
  }

  /**
   * Décode (sans valider la signature) un token d'invitation pour permettre au
   * frontend d'afficher des infos avant la connexion (nom de l'inviteur, etc.).
   *
   * SÉCURITÉ : ce endpoint ne CRÉE rien et n'expose que des métadonnées publiques.
   * La validation cryptographique se fait à l'accept.
   */
  @Get(':token/info')
  async getInviteInfo(@Param('token') token: string) {
    try {
      // decode (NOT verify) — on accepte les tokens expirés ici, le accept les rejettera.
      const decoded = this.jwt.decode(token) as InviteTokenPayload | null;
      if (!decoded || typeof decoded !== 'object') {
        throw new BadRequestException('Token malformé');
      }
      return {
        matchId: decoded.matchId,
        inviterId: decoded.inviterId,
        expiresAt: decoded.exp,
        isExpired: decoded.exp < Math.floor(Date.now() / 1000),
      };
    } catch (e) {
      this.logger.warn(`Tentative décodage token invalide: ${(e as Error).message}`);
      throw new BadRequestException('Lien d\'invitation invalide');
    }
  }

  /**
   * Accepte une invitation : le user authentifié devient player2.
   * Vérifie la signature JWT (rejette tokens expirés ou modifiés).
   */
  @Post(':token/accept')
  @UseGuards(JwtAuthGuard)
  async acceptInvite(@Param('token') token: string, @Req() req: any) {
    const accepterId = req.user?.id ?? req.user?.userId;
    if (!accepterId) {
      throw new UnauthorizedException('Auth requise');
    }

    let payload: InviteTokenPayload;
    try {
      payload = await this.jwt.verifyAsync(token);
    } catch (e) {
      this.logger.warn(`Token invite invalide/expiré : ${(e as Error).message}`);
      throw new BadRequestException('Lien d\'invitation invalide ou expiré');
    }

    if (payload.inviterId === accepterId) {
      throw new ConflictException('Tu ne peux pas accepter ta propre invitation');
    }

    this.logger.log(
      `Invite acceptée : matchId=${payload.matchId} inviter=${payload.inviterId} accepter=${accepterId}`,
    );

    // TODO(SallyCards-MVP) : ici, créer le match en BD avec player1=inviterId,
    // player2=accepterId, mode=duel_casual, status=active. Renvoyer l'objet match.
    // Voir solitaire-matches.service.ts pour le pattern existant.
    return {
      ok: true,
      matchId: payload.matchId,
      players: [payload.inviterId, accepterId],
      message: 'Invitation acceptée — match prêt à démarrer',
    };
  }
}
