/**
 * @file apps/web/app/games/meta.ts
 * @description Métadonnées des jeux web portés (au-delà de la Belote).
 *   Sert aux composants génériques (Hub, écrans data) pour scopa & tarot.
 */
export interface GameMeta {
  gameType: string;
  label: string;
  emoji: string;
  accent: [string, string];
  tagline: string;
}

export const GAME_META: Record<string, GameMeta> = {
  scopa: {
    gameType: 'scopa',
    label: 'Scopa',
    emoji: '🧹',
    accent: ['#F59E0B', '#B45309'],
    tagline: 'Capture italienne · 40 cartes · balayage parfait',
  },
  tarot: {
    gameType: 'tarot',
    label: 'Tarot',
    emoji: '🃏',
    accent: ['#EC4899', '#831843'],
    tagline: 'Tarot français · 78 cartes · bouts & atouts',
  },
  okey: {
    gameType: 'okey',
    label: 'Okey',
    emoji: '🀄',
    accent: ['#06B6D4', '#0E7490'],
    tagline: 'Rami turc · 106 tuiles · suites & brelans',
  },
  quiestce: {
    gameType: 'quiestce',
    label: 'Qui-est-ce ?',
    emoji: '🕵️',
    accent: ['#6366F1', '#312E81'],
    tagline: 'Déduction · pose des questions · devine le personnage',
  },
  kdoub: {
    gameType: 'kdoub',
    label: 'Kdoub',
    emoji: '🎭',
    accent: ['#8B5CF6', '#EC4899'],
    tagline: 'Bluff marocain · 40 cartes · mens, déclare, crie « Kdoub ! »',
  },
  kantcopy: {
    gameType: 'kantcopy',
    label: 'Kant Copy',
    emoji: '🤝',
    accent: ['#0EA5E9', '#14B8A6'],
    tagline: '2v2 · réunis un carré, signale ton partenaire, « Carte Copie ! »',
  },
  concentration: {
    gameType: 'concentration',
    label: 'Concentration',
    emoji: '🧠',
    accent: ['#84CC16', '#15803D'],
    tagline: 'Mémoire · retourne 2 cartes, trouve les paires, le plus de paires gagne',
  },
  poker: {
    gameType: 'poker',
    label: 'Poker',
    emoji: '🃏',
    accent: ['#DC2626', '#7F1D1D'],
    tagline: "Texas Hold'em No-Limit · 2 cartes · flop/turn/river · all-in",
  },
  ronda: {
    gameType: 'ronda',
    label: 'Ronda',
    emoji: '🎴',
    accent: ['#F59E0B', '#EF4444'],
    tagline: 'Ronda marocaine · 40 cartes · capture par valeur · ronda & tringa',
  },
};

export function metaOf(gameType: string): GameMeta {
  return GAME_META[gameType] || { gameType, label: gameType, emoji: '🎴', accent: ['#3B82F6', '#1E40AF'], tagline: '' };
}
