// ---------------------------------------------------------------------------
// Friends Service – friend requests, profiles & head-to-head stats
// ---------------------------------------------------------------------------

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  toUsername: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  createdAt: number;
}

export interface FriendProfile {
  userId: string;
  username: string;
  avatar: string;
  status: 'online' | 'in_game' | 'idle' | 'offline';
  currentGame?: { gameType: string; roomCode: string };
  stats: { gamesPlayed: number; winRate: number; elo: number };
}

// ---- Helpers ---------------------------------------------------------------

let _reqCounter = 0;

function generateRequestId(): string {
  _reqCounter += 1;
  return `fr_${Date.now()}_${_reqCounter}`;
}

// ---- In-memory stores (placeholder – swap for real persistence) ------------

const friendRequests: Map<string, FriendRequest> = new Map();
const headToHeadStore: Map<
  string,
  { wins1: number; wins2: number; draws: number }
> = new Map();

function h2hKey(a: string, b: string): string {
  return [a, b].sort().join(':');
}

// ---- Public API ------------------------------------------------------------

/**
 * Create a new friend request from one user to another.
 */
export function createFriendRequest(
  fromUser: { userId: string; username: string },
  toUser: { userId: string; username: string },
): FriendRequest {
  const request: FriendRequest = {
    id: generateRequestId(),
    fromUserId: fromUser.userId,
    fromUsername: fromUser.username,
    toUserId: toUser.userId,
    toUsername: toUser.username,
    status: 'pending',
    createdAt: Date.now(),
  };
  friendRequests.set(request.id, request);
  return request;
}

/**
 * Accept an existing friend request (mutates & returns it).
 */
export function acceptFriendRequest(request: FriendRequest): FriendRequest {
  request.status = 'accepted';
  friendRequests.set(request.id, request);
  return request;
}

/**
 * Reject an existing friend request.
 */
export function rejectFriendRequest(request: FriendRequest): FriendRequest {
  request.status = 'rejected';
  friendRequests.set(request.id, request);
  return request;
}

/**
 * Block the sender of a friend request.
 */
export function blockFriendRequest(request: FriendRequest): FriendRequest {
  request.status = 'blocked';
  friendRequests.set(request.id, request);
  return request;
}

/**
 * Return head-to-head record between two players.
 * The returned object always has `wins1` for the first userId arg.
 */
export function getHeadToHead(
  userId1: string,
  userId2: string,
): { wins1: number; wins2: number; draws: number } {
  const key = h2hKey(userId1, userId2);
  const stored = headToHeadStore.get(key);
  if (!stored) return { wins1: 0, wins2: 0, draws: 0 };

  // If the canonical order differs from the caller order, swap wins.
  const canonical = [userId1, userId2].sort();
  if (canonical[0] === userId1) return stored;
  return { wins1: stored.wins2, wins2: stored.wins1, draws: stored.draws };
}

/**
 * Record a game result between two players.
 */
export function recordHeadToHead(
  userId1: string,
  userId2: string,
  winnerId: string | null,
): void {
  const key = h2hKey(userId1, userId2);
  const canonical = [userId1, userId2].sort();
  const existing = headToHeadStore.get(key) ?? {
    wins1: 0,
    wins2: 0,
    draws: 0,
  };

  if (winnerId === null) {
    existing.draws += 1;
  } else if (winnerId === canonical[0]) {
    existing.wins1 += 1;
  } else {
    existing.wins2 += 1;
  }
  headToHeadStore.set(key, existing);
}

/**
 * Retrieve all pending friend requests for a given user.
 */
export function getPendingRequests(userId: string): FriendRequest[] {
  const results: FriendRequest[] = [];
  friendRequests.forEach((req) => {
    if (req.toUserId === userId && req.status === 'pending') {
      results.push(req);
    }
  });
  return results;
}

/**
 * Retrieve all accepted friends of a user.
 */
export function getFriendsList(userId: string): string[] {
  const friends: string[] = [];
  friendRequests.forEach((req) => {
    if (req.status !== 'accepted') return;
    if (req.fromUserId === userId) friends.push(req.toUserId);
    else if (req.toUserId === userId) friends.push(req.fromUserId);
  });
  return friends;
}
