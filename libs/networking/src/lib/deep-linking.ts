/**
 * Deep linking utilities for SallyCards.
 *
 * Supports both custom scheme (sallycards://) and universal links (https://sallycards.com/).
 */

export const LINK_PREFIX = 'sallycards://';
export const WEB_PREFIX = 'https://sallycards.com/';

// ── Link Types ──────────────────────────────────────────────────────────────

export type DeepLinkType = 'game' | 'challenge' | 'profile' | 'invite' | 'unknown';

export interface ParsedDeepLink {
  type: DeepLinkType;
  params: Record<string, string>;
}

// ── Link Creation ───────────────────────────────────────────────────────────

/**
 * Create a deep link to join a game room.
 * Returns both app and web URLs.
 */
export function createGameLink(
  roomCode: string,
  gameType: string,
): { appLink: string; webLink: string } {
  const params = new URLSearchParams({ code: roomCode, game: gameType });
  return {
    appLink: `${LINK_PREFIX}game/join?${params.toString()}`,
    webLink: `${WEB_PREFIX}game/join?${params.toString()}`,
  };
}

/**
 * Create a deep link to a challenge.
 */
export function createChallengeLink(
  challengeId: string,
): { appLink: string; webLink: string } {
  return {
    appLink: `${LINK_PREFIX}challenge/${challengeId}`,
    webLink: `${WEB_PREFIX}challenge/${challengeId}`,
  };
}

/**
 * Create a deep link to a user profile.
 */
export function createProfileLink(
  username: string,
): { appLink: string; webLink: string } {
  return {
    appLink: `${LINK_PREFIX}profile/${encodeURIComponent(username)}`,
    webLink: `${WEB_PREFIX}profile/${encodeURIComponent(username)}`,
  };
}

/**
 * Create a deep link for a room invite (includes room code and optional password hint).
 */
export function createInviteLink(
  roomCode: string,
  gameType: string,
  hostName: string,
): { appLink: string; webLink: string } {
  const params = new URLSearchParams({
    code: roomCode,
    game: gameType,
    host: hostName,
  });
  return {
    appLink: `${LINK_PREFIX}invite?${params.toString()}`,
    webLink: `${WEB_PREFIX}invite?${params.toString()}`,
  };
}

// ── Link Parsing ────────────────────────────────────────────────────────────

/**
 * Parse a deep link URL (either app scheme or web URL) into type + params.
 * Returns null if the URL is not a valid SallyCards deep link.
 */
export function parseDeepLink(url: string): ParsedDeepLink | null {
  if (!url) return null;

  let path: string;
  let searchParams: URLSearchParams;

  try {
    // Handle app scheme
    if (url.startsWith(LINK_PREFIX)) {
      const withoutScheme = url.slice(LINK_PREFIX.length);
      const [pathPart, queryPart] = withoutScheme.split('?');
      path = pathPart;
      searchParams = new URLSearchParams(queryPart ?? '');
    }
    // Handle web URL
    else if (url.startsWith(WEB_PREFIX)) {
      const parsed = new URL(url);
      path = parsed.pathname.replace(/^\//, '');
      searchParams = parsed.searchParams;
    }
    // Not a SallyCards link
    else {
      return null;
    }
  } catch {
    return null;
  }

  // Normalize path
  const segments = path.split('/').filter(Boolean);
  const params: Record<string, string> = {};

  // Copy search params
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  // Route: game/join?code=XXX&game=YYY
  if (segments[0] === 'game' && segments[1] === 'join') {
    return { type: 'game', params };
  }

  // Route: challenge/:id
  if (segments[0] === 'challenge' && segments[1]) {
    params.challengeId = segments[1];
    return { type: 'challenge', params };
  }

  // Route: profile/:username
  if (segments[0] === 'profile' && segments[1]) {
    params.username = decodeURIComponent(segments[1]);
    return { type: 'profile', params };
  }

  // Route: invite?code=XXX&game=YYY&host=ZZZ
  if (segments[0] === 'invite') {
    return { type: 'invite', params };
  }

  return { type: 'unknown', params };
}
