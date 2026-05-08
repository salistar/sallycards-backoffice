import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../src/modules/auth/auth.module';
import { UsersModule } from '../src/modules/users/users.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;

  const testUser = {
    email: 'test@sally.cards',
    username: 'testplayer',
    password: 'Str0ngP@ssw0rd!',
  };

  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              MONGODB_URI: mongoUri,
              JWT_SECRET: 'test-secret',
              JWT_REFRESH_SECRET: 'test-refresh-secret',
              JWT_EXPIRES_IN: '15m',
              JWT_REFRESH_EXPIRES_IN: '7d',
            }),
          ],
        }),
        MongooseModule.forRoot(mongoUri),
        AuthModule,
        UsersModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await mongoServer.stop();
  });

  // --- Registration ---

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(HttpStatus.CREATED);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body.user.username).toBe(testUser.username);
      expect(res.body.user).not.toHaveProperty('passwordHash');

      accessToken = res.body.accessToken;
      refreshToken = res.body.refreshToken;
    });

    it('should return 409 for duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(HttpStatus.CONFLICT);
    });

    it('should reject registration with missing fields', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'missing@fields.com' })
        .expect((res) => {
          // Should be 400 or similar validation error
          expect(res.status).toBeGreaterThanOrEqual(400);
        });
    });
  });

  // --- Login ---

  describe('POST /auth/login', () => {
    it('should login successfully and return tokens', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(HttpStatus.OK);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body).toHaveProperty('user');

      accessToken = res.body.accessToken;
      refreshToken = res.body.refreshToken;
    });

    it('should return 401 for wrong password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testUser.email, password: 'WrongPassword123!' })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 for non-existent email', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nobody@sally.cards', password: 'whatever123' })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  // --- Token refresh ---

  describe('POST /auth/refresh', () => {
    it('should return new token pair with valid refresh token', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(HttpStatus.OK);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      // Tokens should be different
      expect(res.body.accessToken).not.toBe(accessToken);
    });

    it('should return 401 for invalid/expired refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid.token.here' })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  // --- Guest session ---

  describe('POST /auth/guest', () => {
    it('should create a guest session and return token', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/guest')
        .expect(HttpStatus.CREATED);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.username).toMatch(/^Guest_/);
    });
  });

  // --- Logout ---

  describe('POST /auth/logout', () => {
    it('should logout successfully with valid token', async () => {
      // First login to get a fresh token
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      const token = loginRes.body.accessToken;

      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);
    });

    it('should return 401 when logging out without token', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
