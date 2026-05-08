// @sally/social - Spectator Analytics (Prompt #135)
// Real-time analytics for spectators watching live games.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SpectatorStats {
  totalSpectators: number;
  peakSpectators: number;
  averageWatchTime: number;
  mostWatchedGame: string;
}

export interface SpectatorSession {
  odispectatorId: string;
  gameId: string;
  joinedAt: number;
  leftAt: number | null;
}

// ---------------------------------------------------------------------------
// Win Probability
// ---------------------------------------------------------------------------

/**
 * Estimate win probability for each player given the current game state.
 *
 * This is a simplified heuristic; real implementations would plug into a
 * game-specific evaluation function.  The returned map sums to 1.
 */
export function calculateWinProbability(
  state: any,
  gameType: string,
): Record<string, number> {
  const players: string[] = state?.playerIds ?? state?.players?.map((p: any) => p.id) ?? [];
  if (players.length === 0) return {};

  const scores: Record<string, number> = state?.scores ?? {};
  const totalScore = Object.values(scores).reduce((a: number, b: number) => a + b, 0);

  if (totalScore === 0) {
    // Equal probability when no score data exists
    const equal = 1 / players.length;
    return Object.fromEntries(players.map((id) => [id, equal]));
  }

  // Weight probability by current score share
  const raw: Record<string, number> = {};
  let sum = 0;
  for (const id of players) {
    const s = scores[id] ?? 0;
    // Add a small base so even 0-score players have some probability
    const weight = s + totalScore * 0.05;
    raw[id] = weight;
    sum += weight;
  }

  const result: Record<string, number> = {};
  for (const id of players) {
    result[id] = Math.round((raw[id] / sum) * 1000) / 1000;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Card Count Stats
// ---------------------------------------------------------------------------

/**
 * Derive card-count statistics from the game state.
 *
 * Expects `state` to carry `deck` (remaining cards array) and either
 * `hands` (Record<playerId, Card[]>) or `players` with a `hand` field.
 */
export function getCardCountStats(
  state: any,
): { remaining: number; perPlayer: Record<string, number> } {
  const remaining: number = state?.deck?.length ?? state?.remainingCards ?? 0;

  const perPlayer: Record<string, number> = {};

  if (state?.hands) {
    for (const [id, hand] of Object.entries(state.hands)) {
      perPlayer[id] = Array.isArray(hand) ? hand.length : 0;
    }
  } else if (Array.isArray(state?.players)) {
    for (const p of state.players) {
      perPlayer[p.id] = Array.isArray(p.hand) ? p.hand.length : 0;
    }
  }

  return { remaining, perPlayer };
}

// ---------------------------------------------------------------------------
// Aggregate helpers
// ---------------------------------------------------------------------------

/**
 * Compute aggregate SpectatorStats from a list of individual sessions.
 */
export function aggregateSpectatorStats(
  sessions: SpectatorSession[],
): SpectatorStats {
  if (sessions.length === 0) {
    return {
      totalSpectators: 0,
      peakSpectators: 0,
      averageWatchTime: 0,
      mostWatchedGame: '',
    };
  }

  const uniqueSpectators = new Set(sessions.map((s) => s.odispectatorId)).size;

  // Count concurrent viewers at each join timestamp to find peak
  const events: { time: number; delta: number }[] = [];
  for (const s of sessions) {
    events.push({ time: s.joinedAt, delta: 1 });
    if (s.leftAt !== null) {
      events.push({ time: s.leftAt, delta: -1 });
    }
  }
  events.sort((a, b) => a.time - b.time);

  let current = 0;
  let peak = 0;
  for (const e of events) {
    current += e.delta;
    if (current > peak) peak = current;
  }

  // Average watch time
  const now = Date.now();
  const totalTime = sessions.reduce((acc, s) => {
    const end = s.leftAt ?? now;
    return acc + (end - s.joinedAt);
  }, 0);
  const averageWatchTime = Math.round(totalTime / sessions.length);

  // Most watched game
  const gameCounts: Record<string, number> = {};
  for (const s of sessions) {
    gameCounts[s.gameId] = (gameCounts[s.gameId] ?? 0) + 1;
  }
  const mostWatchedGame = Object.entries(gameCounts).sort(
    (a, b) => b[1] - a[1],
  )[0]?.[0] ?? '';

  return {
    totalSpectators: uniqueSpectators,
    peakSpectators: peak,
    averageWatchTime,
    mostWatchedGame,
  };
}
