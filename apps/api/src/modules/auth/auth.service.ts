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
  async loginWithGoogle(idToken: string, gameType: string = 'solitaire', allowGuestFallback = true) {
    if (!idToken) {
      // Pas de token → fallback guest direct si autorisé
      if (allowGuestFallback) {
        this.logger.log('🔐 Google sign-in : pas de token → fallback guest');
        return this.createGuestSession();
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
        throw new Error(`Google tokeninfo HTTP ${res.status}`);
      }
      payload = await res.json();
    } catch (err: any) {
      this.logger.warn(`Google sign-in : tokeninfo failed - ${err?.message ?? err}`);
      if (allowGuestFallback) {
        this.logger.log('🔐 Google sign-in : tokeninfo échec → fallback guest');
        return this.createGuestSession();
      }
      throw new UnauthorizedException('Token Google invalide');
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
    let user = await this.usersService.findByEmail(payload.email, gameType);
    if (!user) {
      const username = (payload.name || payload.email.split('@')[0]).slice(0, 30);
      user = await this.usersService.create(
        {
          email: payload.email,
          username,
          passwordHash: 'oauth-google-' + randomUUID(), // pas de password réel
          provider: 'google',
          providerId: payload.sub,
          avatarUrl: payload.picture,
        } as any,
        gameType,
      );
      this.logger.log(`🔐 Google sign-up : ${payload.email} (${gameType})`);
    } else {
      this.logger.log(`🔐 Google sign-in : ${payload.email}`);
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
