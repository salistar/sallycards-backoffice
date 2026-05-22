import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Comme JwtAuthGuard mais NE rejette PAS si le token est absent/invalide.
 * Si un token valide est présent, req.user est peuplé ; sinon req.user reste
 * undefined et la requête passe quand même. Utile pour les endpoints publics
 * qui personnalisent la réponse quand l'utilisateur est connecté.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Toujours laisser passer — l'attachement de l'user est best-effort.
  override handleRequest(_err: any, user: any) {
    return user || null;
  }

  override canActivate(context: ExecutionContext) {
    return super.canActivate(context) as any;
  }
}
