/**
 * @file apps/web/app/games/socketAuth.ts
 * @description Résolution du JWT pour les connexions socket (jeu/chat/voix).
 *   L'access token expire vite (~15 min) : on le rafraîchit via /auth/refresh
 *   (refreshToken stocké) avant de se connecter, et de nouveau si la connexion
 *   est rejetée (connect_error « token expiré »). Évite le « connexion… » infini
 *   du multijoueur quand le token a expiré.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

function jwtExp(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1] || ''));
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

/** Token expiré ou expire dans moins de `skewSec` secondes ? */
function isStale(token: string, skewSec = 30): boolean {
  const exp = jwtExp(token);
  if (!exp) return false; // pas d'exp lisible → on tente tel quel
  return exp * 1000 < Date.now() + skewSec * 1000;
}

/** Appelle /auth/refresh avec le refreshToken stocké, met à jour le localStorage. */
export async function forceRefreshGameToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;
  try {
    const r = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!r.ok) return null;
    const j = await r.json();
    const d = j.data ?? j;
    if (d?.accessToken) {
      localStorage.setItem('accessToken', d.accessToken);
      if (d.refreshToken) localStorage.setItem('refreshToken', d.refreshToken);
      return d.accessToken;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** Renvoie un access token valide (rafraîchi si expiré), ou null si non connecté. */
export async function resolveGameToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('accessToken');
  if (token && !isStale(token)) return token;
  const refreshed = await forceRefreshGameToken();
  return refreshed ?? token; // fallback : tente l'ancien si pas de refresh
}
