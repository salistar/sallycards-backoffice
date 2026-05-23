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
};

export function metaOf(gameType: string): GameMeta {
  return GAME_META[gameType] || { gameType, label: gameType, emoji: '🎴', accent: ['#3B82F6', '#1E40AF'], tagline: '' };
}
