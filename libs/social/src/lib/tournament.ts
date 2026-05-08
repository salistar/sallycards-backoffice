// ---------------------------------------------------------------------------
// Tournament System – brackets, round-robin, swiss pairings
// ---------------------------------------------------------------------------

export interface Tournament {
  id: string;
  name: string;
  gameType: string;
  format: 'single_elimination' | 'round_robin' | 'swiss';
  maxParticipants: number;
  participants: TournamentParticipant[];
  rounds: TournamentRound[];
  status: 'registration' | 'in_progress' | 'completed';
  entryFee: number; // Sally Coins
  prizes: { place: number; coins: number }[];
  startsAt: number;
}

export interface TournamentParticipant {
  userId: string;
  username: string;
  seed: number;
}

export interface TournamentMatch {
  player1Id: string;
  player2Id: string;
  winnerId?: string;
  score?: string;
}

export interface TournamentRound {
  roundNumber: number;
  matches: TournamentMatch[];
}

// ---- Helpers ---------------------------------------------------------------

let _tourneyCounter = 0;

function nextId(): string {
  _tourneyCounter += 1;
  return `tourney_${Date.now()}_${_tourneyCounter}`;
}

/** Shuffle array in-place (Fisher-Yates). */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Next power of two >= n */
function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

// ---- Bracket generators ----------------------------------------------------

function generateSingleElimination(
  participants: TournamentParticipant[],
): TournamentRound[] {
  // Sort by seed (lower = better), then pad to power-of-two with byes.
  const sorted = [...participants].sort((a, b) => a.seed - b.seed);
  const size = nextPow2(sorted.length);
  const padded: (TournamentParticipant | null)[] = [...sorted];
  while (padded.length < size) padded.push(null);

  const rounds: TournamentRound[] = [];
  let currentIds = padded.map((p) => p?.userId ?? 'BYE');

  let roundNum = 1;
  while (currentIds.length > 1) {
    const matches: TournamentMatch[] = [];
    const nextRoundIds: string[] = [];

    for (let i = 0; i < currentIds.length; i += 2) {
      const p1 = currentIds[i];
      const p2 = currentIds[i + 1];

      // Auto-advance byes
      if (p2 === 'BYE') {
        matches.push({ player1Id: p1, player2Id: 'BYE', winnerId: p1 });
        nextRoundIds.push(p1);
      } else if (p1 === 'BYE') {
        matches.push({ player1Id: 'BYE', player2Id: p2, winnerId: p2 });
        nextRoundIds.push(p2);
      } else {
        matches.push({ player1Id: p1, player2Id: p2 });
        nextRoundIds.push(''); // TBD
      }
    }

    rounds.push({ roundNumber: roundNum, matches });
    currentIds = nextRoundIds;
    roundNum += 1;
  }

  return rounds;
}

function generateRoundRobin(
  participants: TournamentParticipant[],
): TournamentRound[] {
  const ids = participants.map((p) => p.userId);
  // If odd number, add a BYE
  if (ids.length % 2 !== 0) ids.push('BYE');

  const n = ids.length;
  const totalRounds = n - 1;
  const rounds: TournamentRound[] = [];

  // Circle method for round-robin scheduling
  const fixed = ids[0];
  const rotating = ids.slice(1);

  for (let r = 0; r < totalRounds; r++) {
    const matches: TournamentMatch[] = [];
    const current = [fixed, ...rotating];

    for (let i = 0; i < n / 2; i++) {
      const p1 = current[i];
      const p2 = current[n - 1 - i];
      if (p1 === 'BYE' || p2 === 'BYE') continue; // skip bye rounds
      matches.push({ player1Id: p1, player2Id: p2 });
    }

    rounds.push({ roundNumber: r + 1, matches });

    // Rotate: move last to front (after fixed)
    rotating.unshift(rotating.pop()!);
  }

  return rounds;
}

function generateSwiss(
  participants: TournamentParticipant[],
): TournamentRound[] {
  // Swiss: just generate round 1 (subsequent rounds generated after results).
  const sorted = [...participants].sort((a, b) => a.seed - b.seed);
  const half = Math.ceil(sorted.length / 2);
  const top = sorted.slice(0, half);
  const bottom = sorted.slice(half);

  const matches: TournamentMatch[] = [];
  for (let i = 0; i < top.length; i++) {
    if (bottom[i]) {
      matches.push({
        player1Id: top[i].userId,
        player2Id: bottom[i].userId,
      });
    }
  }

  const numRounds = Math.ceil(Math.log2(participants.length));
  const rounds: TournamentRound[] = [{ roundNumber: 1, matches }];

  // Placeholder empty rounds – filled in as results come in
  for (let r = 2; r <= numRounds; r++) {
    rounds.push({ roundNumber: r, matches: [] });
  }

  return rounds;
}

// ---- Public API ------------------------------------------------------------

/**
 * Generate the bracket / schedule for a tournament.
 */
export function generateBracket(
  participants: TournamentParticipant[],
  format: Tournament['format'],
): TournamentRound[] {
  switch (format) {
    case 'single_elimination':
      return generateSingleElimination(participants);
    case 'round_robin':
      return generateRoundRobin(participants);
    case 'swiss':
      return generateSwiss(participants);
    default:
      return generateSingleElimination(participants);
  }
}

/**
 * Record a match winner and advance in the bracket.
 * Returns the updated tournament.
 */
export function advanceWinner(
  tournament: Tournament,
  roundIndex: number,
  matchIndex: number,
  winnerId: string,
): Tournament {
  const round = tournament.rounds[roundIndex];
  if (!round) return tournament;

  const match = round.matches[matchIndex];
  if (!match) return tournament;

  match.winnerId = winnerId;

  // For single-elimination, propagate winner to next round
  if (tournament.format === 'single_elimination') {
    const nextRound = tournament.rounds[roundIndex + 1];
    if (nextRound) {
      const nextMatchIdx = Math.floor(matchIndex / 2);
      const nextMatch = nextRound.matches[nextMatchIdx];
      if (nextMatch) {
        if (matchIndex % 2 === 0) {
          nextMatch.player1Id = winnerId;
        } else {
          nextMatch.player2Id = winnerId;
        }
      }
    }
  }

  // Check if tournament is completed
  const lastRound = tournament.rounds[tournament.rounds.length - 1];
  const allDone = lastRound.matches.every((m) => m.winnerId);
  if (allDone) {
    tournament.status = 'completed';
  }

  return tournament;
}

/**
 * Create a new tournament shell.
 */
export function createTournament(
  name: string,
  gameType: string,
  format: Tournament['format'],
  maxParticipants: number,
  entryFee: number,
  prizes: { place: number; coins: number }[],
  startsAt: number,
): Tournament {
  return {
    id: nextId(),
    name,
    gameType,
    format,
    maxParticipants,
    participants: [],
    rounds: [],
    status: 'registration',
    entryFee,
    prizes,
    startsAt,
  };
}

/**
 * Register a participant. Returns false if tournament is full.
 */
export function registerParticipant(
  tournament: Tournament,
  participant: TournamentParticipant,
): boolean {
  if (tournament.participants.length >= tournament.maxParticipants) return false;
  if (tournament.status !== 'registration') return false;
  tournament.participants.push(participant);
  return true;
}

/**
 * Start the tournament – generates the bracket and sets status.
 */
export function startTournament(tournament: Tournament): Tournament {
  if (tournament.participants.length < 2) return tournament;
  tournament.rounds = generateBracket(tournament.participants, tournament.format);
  tournament.status = 'in_progress';
  return tournament;
}
