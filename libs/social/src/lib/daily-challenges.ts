// ---------------------------------------------------------------------------
// Daily Challenges – one challenge per game type, refreshed daily
// ---------------------------------------------------------------------------

export interface DailyChallenge {
  id: string;
  gameType: string;
  description: Record<string, string>;
  condition: { type: string; value: number };
  rewardCoins: number;
  date: string; // ISO date  e.g. "2026-04-03"
}

// ---- Challenge templates ---------------------------------------------------

interface ChallengeTemplate {
  gameType: string;
  variants: {
    description: Record<string, string>;
    condition: { type: string; value: number };
    rewardCoins: number;
  }[];
}

const TEMPLATES: ChallengeTemplate[] = [
  {
    gameType: 'RONDA',
    variants: [
      {
        description: {
          en: 'Win 3 Ronda games',
          fr: 'Gagne 3 parties de Ronda',
        },
        condition: { type: 'win_count', value: 3 },
        rewardCoins: 100,
      },
      {
        description: {
          en: 'Score 25 or more in a Ronda game',
          fr: 'Marque 25 ou plus dans une partie de Ronda',
        },
        condition: { type: 'win_with_score', value: 25 },
        rewardCoins: 150,
      },
      {
        description: {
          en: 'Perform 2 table sweeps in Ronda',
          fr: 'Effectue 2 balayages de table à Ronda',
        },
        condition: { type: 'sweep_count', value: 2 },
        rewardCoins: 120,
      },
    ],
  },
  {
    gameType: 'KDOUB',
    variants: [
      {
        description: {
          en: 'Win 2 Kdoub games',
          fr: 'Gagne 2 parties de Kdoub',
        },
        condition: { type: 'win_count', value: 2 },
        rewardCoins: 100,
      },
      {
        description: {
          en: 'Win a Kdoub trick using a trump card',
          fr: 'Gagne un pli de Kdoub avec un atout',
        },
        condition: { type: 'trump_trick', value: 1 },
        rewardCoins: 80,
      },
      {
        description: {
          en: 'Score 100+ points in a Kdoub game',
          fr: 'Marque 100+ points dans une partie de Kdoub',
        },
        condition: { type: 'win_with_score', value: 100 },
        rewardCoins: 150,
      },
    ],
  },
  {
    gameType: 'BELOTE',
    variants: [
      {
        description: {
          en: 'Win 2 Belote games',
          fr: 'Gagne 2 parties de Belote',
        },
        condition: { type: 'win_count', value: 2 },
        rewardCoins: 100,
      },
      {
        description: {
          en: 'Declare a combination in Belote',
          fr: 'Déclare une combinaison à la Belote',
        },
        condition: { type: 'declare_combo', value: 1 },
        rewardCoins: 80,
      },
      {
        description: {
          en: 'Win 5 tricks in a single Belote round',
          fr: 'Gagne 5 plis dans un seul tour de Belote',
        },
        condition: { type: 'tricks_in_round', value: 5 },
        rewardCoins: 120,
      },
    ],
  },
  {
    gameType: 'POKER',
    variants: [
      {
        description: {
          en: 'Win 3 Poker hands',
          fr: 'Gagne 3 mains de Poker',
        },
        condition: { type: 'win_count', value: 3 },
        rewardCoins: 100,
      },
      {
        description: {
          en: 'Win a hand with a pair or better',
          fr: 'Gagne une main avec une paire ou mieux',
        },
        condition: { type: 'hand_rank_min', value: 2 },
        rewardCoins: 80,
      },
      {
        description: {
          en: 'Win a pot of 500+ chips',
          fr: 'Gagne un pot de 500+ jetons',
        },
        condition: { type: 'win_pot_size', value: 500 },
        rewardCoins: 150,
      },
    ],
  },
  {
    gameType: 'SOLITAIRE',
    variants: [
      {
        description: {
          en: 'Complete a Solitaire game',
          fr: 'Termine une partie de Solitaire',
        },
        condition: { type: 'win_count', value: 1 },
        rewardCoins: 80,
      },
      {
        description: {
          en: 'Complete Solitaire in under 5 minutes',
          fr: 'Termine le Solitaire en moins de 5 minutes',
        },
        condition: { type: 'time_under_seconds', value: 300 },
        rewardCoins: 150,
      },
    ],
  },
  {
    gameType: 'SCOPA',
    variants: [
      {
        description: {
          en: 'Win 2 Scopa games',
          fr: 'Gagne 2 parties de Scopa',
        },
        condition: { type: 'win_count', value: 2 },
        rewardCoins: 100,
      },
      {
        description: {
          en: 'Capture the Settebello in a Scopa game',
          fr: 'Capture le Settebello dans une partie de Scopa',
        },
        condition: { type: 'capture_settebello', value: 1 },
        rewardCoins: 120,
      },
    ],
  },
  {
    gameType: 'TRIX',
    variants: [
      {
        description: {
          en: 'Win 2 Trix games',
          fr: 'Gagne 2 parties de Trix',
        },
        condition: { type: 'win_count', value: 2 },
        rewardCoins: 100,
      },
      {
        description: {
          en: 'Avoid taking any hearts in a Trix round',
          fr: 'Évite de prendre des coeurs dans un tour de Trix',
        },
        condition: { type: 'no_hearts_round', value: 1 },
        rewardCoins: 130,
      },
    ],
  },
  {
    gameType: 'TARNEEB',
    variants: [
      {
        description: {
          en: 'Win 2 Tarneeb games',
          fr: 'Gagne 2 parties de Tarneeb',
        },
        condition: { type: 'win_count', value: 2 },
        rewardCoins: 100,
      },
      {
        description: {
          en: 'Win the bid and fulfil your contract',
          fr: 'Remporte l\'enchère et remplis ton contrat',
        },
        condition: { type: 'bid_win', value: 1 },
        rewardCoins: 130,
      },
    ],
  },
  {
    gameType: 'HAND',
    variants: [
      {
        description: {
          en: 'Win 2 Hand games',
          fr: 'Gagne 2 parties de Hand',
        },
        condition: { type: 'win_count', value: 2 },
        rewardCoins: 100,
      },
      {
        description: {
          en: 'Win 4 tricks in a single Hand round',
          fr: 'Gagne 4 plis dans un seul tour de Hand',
        },
        condition: { type: 'tricks_in_round', value: 4 },
        rewardCoins: 120,
      },
    ],
  },
];

// ---- Deterministic daily seed from date ------------------------------------

function dateSeed(date: Date): number {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  // Simple hash
  return ((y * 397) ^ (m * 31) ^ d) >>> 0;
}

function seededIndex(seed: number, max: number): number {
  return seed % max;
}

// ---- Public API ------------------------------------------------------------

/**
 * Generate one daily challenge per game type for the given date.
 * The variant chosen is deterministic (same date always produces the same set).
 */
export function generateDailyChallenges(date: Date): DailyChallenge[] {
  const seed = dateSeed(date);
  const isoDate = date.toISOString().slice(0, 10);

  return TEMPLATES.map((template, idx) => {
    const variantIdx = seededIndex(seed + idx, template.variants.length);
    const variant = template.variants[variantIdx];

    return {
      id: `daily_${isoDate}_${template.gameType}`,
      gameType: template.gameType,
      description: variant.description,
      condition: variant.condition,
      rewardCoins: variant.rewardCoins,
      date: isoDate,
    };
  });
}

/**
 * Check whether a game result satisfies a daily challenge.
 *
 * `gameResult` is an opaque bag – the caller is responsible for including the
 * keys that correspond to the challenge condition type.
 *
 * Supported condition types & expected gameResult keys:
 *   win_count        -> { wins: number }
 *   win_with_score   -> { score: number }
 *   sweep_count      -> { sweeps: number }
 *   trump_trick      -> { trumpTricks: number }
 *   declare_combo    -> { combos: number }
 *   tricks_in_round  -> { tricksInRound: number }
 *   hand_rank_min    -> { handRank: number }
 *   win_pot_size     -> { potSize: number }
 *   time_under_seconds -> { timeSeconds: number }
 *   capture_settebello -> { settebello: boolean }
 *   no_hearts_round  -> { heartsTaken: number }
 *   bid_win          -> { bidWon: boolean }
 */
export function checkChallengeCompletion(
  challenge: DailyChallenge,
  gameResult: Record<string, any>,
): boolean {
  const { type, value } = challenge.condition;

  switch (type) {
    case 'win_count':
      return (gameResult['wins'] ?? 0) >= value;
    case 'win_with_score':
      return (gameResult['score'] ?? 0) >= value;
    case 'sweep_count':
      return (gameResult['sweeps'] ?? 0) >= value;
    case 'trump_trick':
      return (gameResult['trumpTricks'] ?? 0) >= value;
    case 'declare_combo':
      return (gameResult['combos'] ?? 0) >= value;
    case 'tricks_in_round':
      return (gameResult['tricksInRound'] ?? 0) >= value;
    case 'hand_rank_min':
      return (gameResult['handRank'] ?? 0) >= value;
    case 'win_pot_size':
      return (gameResult['potSize'] ?? 0) >= value;
    case 'time_under_seconds':
      return (
        gameResult['timeSeconds'] !== undefined &&
        gameResult['timeSeconds'] <= value
      );
    case 'capture_settebello':
      return gameResult['settebello'] === true;
    case 'no_hearts_round':
      return (gameResult['heartsTaken'] ?? 1) === 0;
    case 'bid_win':
      return gameResult['bidWon'] === true;
    default:
      return false;
  }
}
