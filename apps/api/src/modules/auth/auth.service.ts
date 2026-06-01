import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const gameType = dto.gameType || 'ronda';
    const existing = await this.usersService.findByEmail(
      dto.email,
      gameType,
    );
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.usersService.create(
      {
        email: dto.email,
        username: dto.username,
        passwordHash,
      },
      gameType,
    );

    const tokens = await this.generateTokens(user);
    this.logger.log(`User registered: ${user._id} in ${gameType}_users`);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async login(user: any) {
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user);
    this.logger.log(`User logged in: ${user._id}`);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async validateUser(
    email: string,
    password: string,
    gameType?: string,
  ) {
    const user = await this.usersService.findByEmail(email, gameType);
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    return isMatch ? user : null;
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>(
          'JWT_REFRESH_SECRET',
          'changeme-refresh',
        ),
      });
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(_userId: string) {
    // In a production app, invalidate the refresh token in Redis
    this.logger.log(`User logged out: ${_userId}`);
    return { message: 'Logged out successfully' };
  }

  async createGuestSession(gameType?: string) {
    const guestId = randomUUID().slice(0, 8);
    // Generate random password hash for security (guests can't login with password)
    const passwordHash = await bcrypt.hash(randomUUID(), 12);
    const user = await this.usersService.create(
      {
        email: `guest_${guestId}@sally.local`,
        username: `Guest_${guestId}`,
        passwordHash,
        isGuest: true,
      },
      gameType || 'ronda',
    );

    const tokens = await this.generateTokens(user);
    this.logger.log(`Guest session created: ${user._id}`);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  /**
   * Google Sign-In : vérifie un id_token Google via l'endpoint tokeninfo,
   * crée ou trouve l'utilisateur, retourne les tokens JWT du backend.
   *
   * Pas de dépendance passport-google-oauth20 — vérification HTTP directe.
   */
  async loginWithGoogle(idToken: string, gameType: string = 'solitaire', allowGuestFallback = false) {
    // Note: silent guest fallback is DISABLED by default. Falling back silently
    // to a Guest_xxx account when Google fails is a UX bug — the user thinks
    // they signed in with Google but their displayed name is "Guest_xxx".
    // If the caller really wants the fallback (e.g. an explicit "skip Google"
    // affordance), they must pass allowGuestFallback=true.
    if (!idToken) {
      if (allowGuestFallback) {
        this.logger.log('🔐 Google sign-in : pas de token → fallback guest (explicite)');
        return this.createGuestSession(gameType);
      }
      throw new UnauthorizedException('idToken manquant');
    }

    // Vérification directe via Google tokeninfo (pas de package nécessaire)
    let payload: any;
    try {
      const res = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
      );
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Google tokeninfo HTTP ${res.status} ${body.slice(0, 200)}`);
      }
      payload = await res.json();
    } catch (err: any) {
      this.logger.warn(`Google sign-in : tokeninfo failed - ${err?.message ?? err}`);
      // We DELIBERATELY do NOT fallback to guest here, even if allowGuestFallback
      // is true: the user actually tried to sign in with Google and the verification
      // failed — we owe them an honest error so they can re-try or report it.
      throw new UnauthorizedException(
        `Google sign-in échoué (tokeninfo): ${err?.message ?? 'erreur réseau'}`,
      );
    }

    // Validation des claims essentiels
    if (!payload?.email || !payload?.email_verified || payload.email_verified === 'false') {
      throw new UnauthorizedException('Email Google non vérifié');
    }
    const expectedAud = this.configService.get<string>('GOOGLE_OAUTH_CLIENT_ID');
    if (expectedAud && payload.aud !== expectedAud) {
      throw new UnauthorizedException(`audience mismatch (attendu ${expectedAud})`);
    }

    // Find or create user
    const googleName = (payload.name || payload.email.split('@')[0]).slice(0, 30);
    let user = await this.usersService.findByEmail(payload.email, gameType);
    if (!user) {
      user = await this.usersService.create(
        {
          email: payload.email,
          username: googleName,
          passwordHash: 'oauth-google-' + randomUUID(), // pas de password réel
          provider: 'google',
          providerId: payload.sub,
          avatarUrl: payload.picture,
        } as any,
        gameType,
      );
      this.logger.log(`🔐 Google sign-up : ${payload.email} → "${googleName}" (${gameType})`);
    } else {
      // Re-sync displayName / avatar from Google on every sign-in: if the user
      // was created earlier as a Guest_xxxx (during the old silent-fallback bug)
      // their username would still be Guest_xxxx. Upgrade it to the real Google
      // name so the home screen no longer shows "Bienvenue, Guest_xxxx".
      const needsUpgrade =
        !user.username ||
        /^Guest_/.test(user.username) ||
        user.username === payload.email.split('@')[0];
      const patch: Record<string, any> = { provider: 'google', providerId: payload.sub };
      if (needsUpgrade && payload.name) patch.username = googleName;
      if (payload.picture && !(user as any).avatar) patch.avatar = payload.picture;
      if ((user as any).isGuest) patch.isGuest = false;
      try {
        await this.usersService.update(user._id.toString(), patch as any, gameType);
        if (patch.username) user.username = patch.username;
        if (patch.avatar) (user as any).avatar = patch.avatar;
        if (patch.isGuest === false) (user as any).isGuest = false;
      } catch (e: any) {
        this.logger.warn(`Google sign-in upgrade failed for ${payload.email}: ${e?.message}`);
      }
      this.logger.log(`🔐 Google sign-in : ${payload.email} → "${user.username}"`);
    }

    const tokens = await this.generateTokens(user);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  private async generateTokens(user: any) {
    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role || 'player',
      isGuest: user.isGuest || false,
    } as any;

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync({ ...payload } as Record<string, unknown>, {
        secret: this.configService.get<string>('JWT_SECRET', 'changeme'),
        expiresIn: this.configService.get<string>(
          'JWT_EXPIRES_IN',
          '15m',
        ) as any,
      }),
      this.jwtService.signAsync({ ...payload } as Record<string, unknown>, {
        secret: this.configService.get<string>(
          'JWT_REFRESH_SECRET',
          'changeme-refresh',
        ),
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_EXPIRES_IN',
          '7d',
        ) as any,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: any) {
    const obj = user.toObject ? user.toObject() : { ...user };
    delete obj.passwordHash;
    return obj;
  }
}
