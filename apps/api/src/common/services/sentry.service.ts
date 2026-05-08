/**
 * @file sentry.service.ts
 * @description Wrapper Sentry léger côté backend Nest.
 *
 * Détecte si `@sentry/node` est installé (try/require). Si oui, init avec
 * la DSN env `SENTRY_DSN`. Sinon, no-op : `captureException()` log juste.
 *
 * Activation prod :
 *   pnpm add @sentry/node
 *   SENTRY_DSN=https://xxx@sentry.io/yyy node dist/main
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface SentryModule {
  init: (config: { dsn: string; environment?: string; tracesSampleRate?: number }) => void;
  captureException: (err: any, context?: any) => string;
  captureMessage: (msg: string, level?: string) => string;
  setUser: (user: { id?: string; email?: string; username?: string } | null) => void;
  setTag: (key: string, value: string) => void;
}

@Injectable()
export class SentryService implements OnModuleInit {
  private readonly logger = new Logger(SentryService.name);
  private sentry: SentryModule | null = null;
  private enabled = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require('@sentry/node') as SentryModule;
      const dsn = this.configService.get<string>('SENTRY_DSN');
      if (!dsn) {
        this.logger.log('Sentry SDK installé mais SENTRY_DSN absent — désactivé.');
        return;
      }
      mod.init({
        dsn,
        environment: this.configService.get<string>('NODE_ENV', 'development'),
        tracesSampleRate: 0.1,
      });
      this.sentry = mod;
      this.enabled = true;
      this.logger.log(`✅ Sentry actif (env=${this.configService.get('NODE_ENV')})`);
    } catch {
      this.logger.log('Sentry SDK non installé — capture en mode local-log.');
    }
  }

  captureException(err: any, context?: any): void {
    if (this.enabled && this.sentry) {
      this.sentry.captureException(err, context);
    } else {
      this.logger.error(`[SENTRY-LOCAL] ${err?.message ?? err}`, context ? JSON.stringify(context) : '');
    }
  }

  captureMessage(msg: string, level: 'debug' | 'info' | 'warning' | 'error' = 'info'): void {
    if (this.enabled && this.sentry) {
      this.sentry.captureMessage(msg, level);
    } else {
      this.logger.log(`[SENTRY-LOCAL ${level}] ${msg}`);
    }
  }

  setUser(user: { id?: string; email?: string; username?: string } | null): void {
    if (this.enabled && this.sentry) this.sentry.setUser(user);
  }

  setTag(key: string, value: string): void {
    if (this.enabled && this.sentry) this.sentry.setTag(key, value);
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}
