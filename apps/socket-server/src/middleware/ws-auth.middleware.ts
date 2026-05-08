import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

export interface AuthenticatedSocket extends Socket {
  userId: string;
  username: string;
}

export interface JwtPayload {
  sub: string;
  username: string;
  iat?: number;
  exp?: number;
}

const logger = new Logger('WsAuthMiddleware');

/**
 * Middleware factory that verifies a JWT from the socket handshake auth token.
 * Attach `userId` and `username` to the socket on success.
 */
export function createWsAuthMiddleware(jwtService: JwtService) {
  return (socket: Socket, next: (err?: Error) => void) => {
    const token =
      socket.handshake.auth?.token ??
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      logger.warn(
        `Connection rejected: no token provided (${socket.id}). Remote address: ${socket.handshake.address}`,
      );
      return next(
        new Error('Authentication failed: missing or invalid token'),
      );
    }

    try {
      const payload = jwtService.verify<JwtPayload>(token);

      // Validate required JWT fields
      if (!payload.sub || !payload.username) {
        logger.warn(
          `Connection rejected: invalid JWT payload (${socket.id}). Missing sub or username.`,
        );
        return next(
          new Error('Authentication failed: invalid token claims'),
        );
      }

      (socket as AuthenticatedSocket).userId = payload.sub;
      (socket as AuthenticatedSocket).username = payload.username;
      logger.debug(
        `Connection authenticated: ${payload.sub} (${socket.id})`,
      );
      next();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'unknown error';
      logger.warn(
        `Connection rejected: invalid token (${socket.id}). Reason: ${errorMessage}`,
      );
      return next(
        new Error('Authentication failed: invalid or expired token'),
      );
    }
  };
}
