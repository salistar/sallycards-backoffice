// بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
// SallyCards Solitaire — TURN Credentials Endpoint
// Génère les credentials TURN tournants pour coturn (RFC 7635 / use-auth-secret).
//
// Référence spec section 6.3 : "credentials TURN doivent tourner toutes les 24h
// Endpoint /api/turn-creds génère HMAC-SHA1 signé avec un shared secret".

import {
  Controller,
  Get,
  Logger,
  UnauthorizedException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import * as crypto from 'crypto';

/**
 * Réponse renvoyée au client mobile/web pour configurer son RTCPeerConnection.
 * Le client utilise directement `iceServers` dans `new RTCPeerConnection({ iceServers })`.
 */
export interface TurnCredentialsResponse {
  iceServers: Array<{
    urls: string | string[];
    username?: string;
    credential?: string;
  }>;
  /** Timestamp Unix d'expiration des credentials (24h après génération). */
  ttlExpiresAt: number;
}

@Controller('api/turn-creds')
export class TurnCredentialsController {
  private readonly logger = new Logger(TurnCredentialsController.name);

  /** Durée de vie d'un credential TURN avant expiration (spec : 24h). */
  private readonly TTL_SECONDS = 24 * 60 * 60;

  /**
   * Génère un username/credential temporaire compatible coturn `use-auth-secret`.
   *
   * Format username : `<unix_ts_expiration>:<userId>` — l'authentification coturn
   * utilise le timestamp pour expirer automatiquement le credential côté serveur.
   *
   * Format credential : base64( HMAC-SHA1( username, sharedSecret ) ).
   *
   * Le shared secret est partagé entre l'API et coturn via `static-auth-secret`
   * dans /etc/turnserver.conf.
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  getCredentials(@Req() req: any): TurnCredentialsResponse {
    const userId = req.user?.id ?? req.user?.userId;
    if (!userId) {
      this.logger.warn('TURN creds requested without authenticated user');
      throw new UnauthorizedException('Auth requise pour générer des credentials TURN');
    }

    const sharedSecret = process.env.TURN_SECRET;
    if (!sharedSecret) {
      this.logger.error('TURN_SECRET non défini — endpoint TURN désactivé');
      throw new UnauthorizedException('TURN credentials indisponibles (config serveur)');
    }

    // Username : "<expiration_timestamp>:<userId>"
    const expiration = Math.floor(Date.now() / 1000) + this.TTL_SECONDS;
    const username = `${expiration}:${userId}`;

    // Credential : HMAC-SHA1 du username, signé avec le shared secret, encodé base64.
    const hmac = crypto.createHmac('sha1', sharedSecret);
    hmac.update(username);
    const credential = hmac.digest('base64');

    const turnHost = process.env.TURN_HOST ?? 'turn.salistar.com';
    const turnPort = process.env.TURN_PORT ?? '3478';
    const turnTlsPort = process.env.TURN_TLS_PORT ?? '5349';

    const response: TurnCredentialsResponse = {
      iceServers: [
        // UNIQUEMENT STUN/TURN SALISTAR auto-hébergé (coturn Hetzner, sous notre
        // contrôle). Pas de STUN/TURN tiers (ni Google, ni Jitsi).
        {
          urls: [
            `stun:${turnHost}:${turnPort}`,
            `turn:${turnHost}:${turnPort}?transport=udp`,
            `turn:${turnHost}:${turnPort}?transport=tcp`,
            // TURNS = TURN sur TLS, contourne firewalls restrictifs.
            `turns:${turnHost}:${turnTlsPort}?transport=tcp`,
          ],
          username,
          credential,
        },
      ],
      ttlExpiresAt: expiration,
    };

    this.logger.log(
      `TURN creds générés pour user=${userId} expire=${new Date(expiration * 1000).toISOString()}`,
    );

    return response;
  }
}
