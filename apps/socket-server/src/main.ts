import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Logger, INestApplication } from '@nestjs/common';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { ServerOptions } from 'socket.io';
import { AppModule } from './app.module';

class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter> | undefined;

  constructor(
    app: INestApplication,
    private readonly redisUrl: string,
  ) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    const pubClient = new Redis(this.redisUrl);
    const subClient = pubClient.duplicate();
    await Promise.all([
      new Promise<void>((resolve) => pubClient.on('ready', resolve)),
      new Promise<void>((resolve) => subClient.on('ready', resolve)),
    ]);
    this.adapterConstructor = createAdapter(pubClient as any, subClient as any) as any;
  }

  override createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, options);
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }
    return server;
  }
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const port = configService.get<number>('PORT', 3001);
  const redisUrl = configService.get<string>('REDIS_URL', 'redis://localhost:6379');
  const corsOrigins = configService.get<string>('CORS_ORIGINS', '*');

  // CORS
  app.enableCors({
    origin: corsOrigins === '*' ? true : corsOrigins.split(','),
    credentials: true,
  });

  // Redis adapter for horizontal scaling
  try {
    const redisAdapter = new RedisIoAdapter(app, redisUrl);
    await redisAdapter.connectToRedis();
    app.useWebSocketAdapter(redisAdapter);
    logger.log('Redis adapter connected for Socket.IO');
  } catch (err) {
    logger.warn(
      `Redis connection failed: ${err instanceof Error ? err.message : 'unknown error'}. ` +
        'Falling back to in-memory adapter. Horizontal scaling will NOT work.',
    );
    // Default in-memory adapter is used automatically if none is configured
  }

  // Health endpoint
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/health', (_req: any, res: any) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const server = await app.listen(port);
  logger.log(`Socket server listening on port ${port}`);

  // Graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    logger.log(`${signal} received, shutting down gracefully...`);
    try {
      await app.close();
      process.exit(0);
    } catch (err) {
      logger.error(`Error during shutdown: ${err instanceof Error ? err.message : 'unknown error'}`);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

bootstrap();
