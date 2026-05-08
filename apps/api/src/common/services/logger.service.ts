import { Injectable, Logger, LogLevel } from '@nestjs/common';

export interface GameEventLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  context: 'game';
  gameId: string;
  event: string;
  data: object;
}

export interface SecurityEventLog {
  timestamp: string;
  level: 'warn' | 'error';
  context: 'security';
  userId: string;
  event: string;
  ip?: string;
  details: object;
}

export interface PerformanceLog {
  timestamp: string;
  level: 'info' | 'warn';
  context: 'performance';
  endpoint: string;
  method?: string;
  durationMs: number;
  statusCode: number;
}

/**
 * Structured logging service for SallyCards API.
 * Outputs JSON in production for log aggregation (ELK, Loki, etc.)
 * and pretty-printed output in development.
 */
@Injectable()
export class AppLogger extends Logger {
  private readonly isProduction: boolean;
  private readonly logFormat: 'json' | 'pretty';

  constructor(context?: string) {
    super(context || 'SallyCards');
    this.isProduction = process.env.NODE_ENV === 'production';
    this.logFormat =
      (process.env.LOG_FORMAT as 'json' | 'pretty') || (this.isProduction ? 'json' : 'pretty');
  }

  /**
   * Log a game-related event (card played, round ended, game created, etc.)
   */
  logGameEvent(gameId: string, event: string, data: object = {}): void {
    const entry: GameEventLog = {
      timestamp: new Date().toISOString(),
      level: 'info',
      context: 'game',
      gameId,
      event,
      data,
    };

    if (this.logFormat === 'json') {
      process.stdout.write(JSON.stringify(entry) + '\n');
    } else {
      super.log(`[Game:${gameId}] ${event} ${JSON.stringify(data)}`, 'GameEngine');
    }
  }

  /**
   * Log a security-relevant event (login, failed auth, suspicious activity, etc.)
   */
  logSecurityEvent(userId: string, event: string, details: object = {}): void {
    const entry: SecurityEventLog = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      context: 'security',
      userId,
      event,
      details,
    };

    if (this.logFormat === 'json') {
      process.stdout.write(JSON.stringify(entry) + '\n');
    } else {
      super.warn(`[Security:${userId}] ${event} ${JSON.stringify(details)}`, 'Security');
    }
  }

  /**
   * Log an API performance metric.
   * Automatically warns if duration exceeds threshold.
   */
  logPerformance(
    endpoint: string,
    durationMs: number,
    statusCode: number,
    method?: string,
  ): void {
    const isSlowRequest = durationMs > 1000;

    const entry: PerformanceLog = {
      timestamp: new Date().toISOString(),
      level: isSlowRequest ? 'warn' : 'info',
      context: 'performance',
      endpoint,
      method,
      durationMs,
      statusCode,
    };

    if (this.logFormat === 'json') {
      process.stdout.write(JSON.stringify(entry) + '\n');
    } else {
      const msg = `${method || 'REQ'} ${endpoint} ${statusCode} ${durationMs}ms`;
      if (isSlowRequest) {
        super.warn(`[Perf] SLOW ${msg}`, 'Performance');
      } else {
        super.log(`[Perf] ${msg}`, 'Performance');
      }
    }
  }

  /**
   * Log a structured error with optional stack trace and metadata.
   */
  logError(message: string, error?: Error, meta?: object): void {
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      context: this.context || 'SallyCards',
      message,
      stack: error?.stack,
      ...meta,
    };

    if (this.logFormat === 'json') {
      process.stdout.write(JSON.stringify(entry) + '\n');
    } else {
      super.error(message, error?.stack, this.context);
    }
  }

  /**
   * Log a WebSocket event (connection, disconnection, room activity).
   */
  logSocketEvent(event: string, data: object = {}): void {
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      context: 'socket',
      event,
      ...data,
    };

    if (this.logFormat === 'json') {
      process.stdout.write(JSON.stringify(entry) + '\n');
    } else {
      super.log(`[Socket] ${event} ${JSON.stringify(data)}`, 'Socket');
    }
  }
}
