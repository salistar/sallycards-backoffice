/**
 * @file apps/web/app/games/socketAuth.ts
 * @description Résolution du JWT pour les connexions socket (jeu/chat/voix).
 *   L'access token expire vite (~15 min). On garantit TOUJOURS un token valide
 *   pour le multijoueur, dans cet ordre :
 *     1) access token courant s'il est encore valide,
 *     2) rafraîchissement via /auth/refresh (refreshToken stocké),
 *     3) sinon, création d'une session INVITÉ via /auth/guest.
 *   Ainsi le multijoueur fonctionne même sans connexion explicite (comme le
 *   mode vs-bot), au lieu de rester bloqué sur « connexion… ».
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

function store(d: any): string | null {
  if (d?.accessToken) {
    localStorage.setItem('accessToken', d.accessToken);
    if (d.refreshToken) localStorage.setItem('refreshToken', d.refreshToken);
    return d.accessToken;
  }
  return null;
}

/** Tente /auth/refresh avec le refreshToken stocké. */
async function tryRefresh(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;
  try {
    const r = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!r.ok) return null;
    const j = await r.json();
    return store(j.data ?? j);
  } catch {
    return null;
  }
}

/** Crée une session invité (compte temporaire) et stocke les tokens. */
async function tryGuest(): Promise<string | null> {
  try {
    const r = await fetch(`${API_BASE}/auth/guest`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
    });
    if (!r.ok) return null;
    const j = await r.json();
    return store(j.data ?? j);
  } catch {
    return null;
  }
}

/** Rafraîchit le token de jeu (refresh puis invité). Utilisé sur connect_error. */
export async function forceRefreshGameToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  return (await tryRefresh()) ?? (await tryGuest());
}

/** Renvoie un access token valide : courant, sinon rafraîchi, sinon invité. */
export async function resolveGameToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('accessToken');
  if (token && !isStale(token)) return token;
  return (await tryRefresh()) ?? (await tryGuest()) ?? token;
}
