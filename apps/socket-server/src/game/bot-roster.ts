/**
 * @file apps/socket-server/src/game/bot-roster.ts
 * @description Rosters de bots (≥10 par jeu) côté serveur, pour nommer les IA
 *   qui remplissent les sièges vacants des rooms multijoueur.
 */
export const BOT_ROSTERS: Record<string, string[]> = {
  belote: ['Pierre', 'Marie', 'Jean', 'Sophie', 'Lucas', 'Emma', 'Hugo', 'Léa', 'Nathan', 'Camille', 'Antoine', 'Manon'],
  scopa: ['Marco', 'Sofia', 'Luca', 'Giulia', 'Paolo', 'Chiara', 'Matteo', 'Elena', 'Davide', 'Rosa', 'Franco', 'Bianca'],
  tarot: ['Henri', 'Claire', 'Julien', 'Nadia', 'Thomas', 'Inès', 'Rachid', 'Yasmine', 'Omar', 'Salma', 'Karim', 'Fatima'],
};

export function pickBots(gameType: string, n: number): string[] {
  const roster = [...(BOT_ROSTERS[gameType] || BOT_ROSTERS.belote)];
  for (let i = roster.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [roster[i], roster[j]] = [roster[j], roster[i]]; }
  return roster.slice(0, Math.max(0, n));
}
