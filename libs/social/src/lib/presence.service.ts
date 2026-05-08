// ---------------------------------------------------------------------------
// Presence Service – online / in-game / idle / offline tracking
// ---------------------------------------------------------------------------

export type UserStatus = 'online' | 'in_game' | 'idle' | 'offline';

export interface PresenceInfo {
  userId: string;
  status: UserStatus;
  currentGame?: { gameType: string; roomCode: string };
  lastSeen: number;
}

// ---- In-memory store (swap with Redis / Firebase in production) ------------

const presenceStore: Map<string, PresenceInfo> = new Map();

// ---- PresenceService -------------------------------------------------------

export class PresenceService {
  /**
   * Update a user's status.
   */
  setStatus(
    userId: string,
    status: UserStatus,
    currentGame?: { gameType: string; roomCode: string },
  ): void {
    presenceStore.set(userId, {
      userId,
      status,
      currentGame: status === 'in_game' ? currentGame : undefined,
      lastSeen: Date.now(),
    });
  }

  /**
   * Get a single user's presence info.
   */
  getStatus(userId: string): PresenceInfo | null {
    return presenceStore.get(userId) ?? null;
  }

  /**
   * Batch-fetch presence for a list of friend IDs.
   */
  getFriendsStatuses(friendIds: string[]): PresenceInfo[] {
    return friendIds
      .map((id) => presenceStore.get(id))
      .filter((p): p is PresenceInfo => p !== undefined);
  }

  /**
   * Mark a user as offline explicitly (e.g. on disconnect).
   */
  goOffline(userId: string): void {
    const existing = presenceStore.get(userId);
    if (existing) {
      existing.status = 'offline';
      existing.currentGame = undefined;
      existing.lastSeen = Date.now();
    } else {
      presenceStore.set(userId, {
        userId,
        status: 'offline',
        lastSeen: Date.now(),
      });
    }
  }

  /**
   * Auto-idle users who haven't pinged in `thresholdMs` milliseconds.
   * Call periodically (e.g. every 60 s).
   */
  sweepIdle(thresholdMs: number = 5 * 60 * 1000): void {
    const now = Date.now();
    presenceStore.forEach((info) => {
      if (
        info.status !== 'offline' &&
        now - info.lastSeen > thresholdMs
      ) {
        info.status = 'idle';
        info.currentGame = undefined;
      }
    });
  }
}
