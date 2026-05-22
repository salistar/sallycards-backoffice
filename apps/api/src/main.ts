import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // Body parser limits — bumped to 60MB pour supporter l'import de seeds Spider
  // pré-générés (cf POST /deal-seeds/spider-v2/import). N'affecte que la
  // taille MAX acceptée ; les requêtes normales restent légères.
  app.use(json({ limit: '60mb' }));
  app.use(urlencoded({ limit: '60mb', extended: true }));

  // Security
  app.use(helmet());

  // CORS — origines autorisées = CORS_ORIGINS (env) + domaines prod salistar.com
  // en dur (le web prod marche quel que soit le .env.production du VPS).
  const envOrigins = configService
    .get<string>('CORS_ORIGINS', 'http://localhost:4000,http://localhost:8081')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const prodOrigins = [
    'https://sallycards.salistar.com',
    'https://salistar.com',
    'https://www.salistar.com',
    'https://backoffice.salistar.com',
  ];
  app.enableCors({
    origin: Array.from(new Set([...envOrigins, ...prodOrigins])),
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global filters & interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor(), new LoggingInterceptor());

  // Swagger — exposed in ALL envs (the salistar.com Monitoring dashboard
  // links to /api/docs). The doc itself is read-only.
  {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('SallyCards API')
      .setDescription('API pour la suite de jeux de cartes SallyCards')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentification')
      .addTag('users', 'Gestion des utilisateurs')
      .addTag('games', 'Gestion des parties')
      .addTag('rooms', 'Salons de jeu')
      .addTag('leaderboard', 'Classements')
      .addTag('assets', 'Assets cartes')
      .addTag('health', 'Santé du service')
      .addTag('Infra Monitoring', 'Heartbeats + uptime stats')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);

    // Convenience redirect: GET /api -> /api/docs.
    const httpAdapter = app.getHttpAdapter().getInstance();
    httpAdapter.get('/api', (_req: any, res: any) => res.redirect('/api/docs'));

    logger.log(`Swagger docs available at /api/docs [${nodeEnv}]`);
  }

  await app.listen(port);
  logger.log(`SallyCards API running on port ${port} [${nodeEnv}]`);
}

bootstrap();
