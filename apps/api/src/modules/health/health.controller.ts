import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  MongooseHealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly mongoose: MongooseHealthIndicator,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Liveness probe' })
  liveness() {
    return this.health.check([]);
  }

  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe (MongoDB + Redis)' })
  readiness() {
    return this.health.check([
      () => this.mongoose.pingCheck('mongodb'),
      async (): Promise<HealthIndicatorResult> => {
        const redisUrl = this.configService.get<string>('REDIS_URL');
        const redis = redisUrl
          ? new Redis(redisUrl, { lazyConnect: true, connectTimeout: 3000, maxRetriesPerRequest: 1 })
          : new Redis({
              host: this.configService.get<string>('REDIS_HOST', 'localhost'),
              port: this.configService.get<number>('REDIS_PORT', 6379),
              lazyConnect: true,
              connectTimeout: 3000,
              maxRetriesPerRequest: 1,
            });
        try {
          await redis.connect();
          await redis.ping();
          return { redis: { status: 'up' } };
        } catch {
          return { redis: { status: 'down' } };
        } finally {
          redis.disconnect();
        }
      },
    ]);
  }
}
