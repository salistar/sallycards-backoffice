// بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
// SallyCards Solitaire — Klondike Score Service
// Implémente exactement la grille de score de la spec section 2.4.
//
// Cette table de score est la référence Klondike Windows historique :
//   - Carte vers fondation       : +10
//   - Carte fondation → tableau  : -15  (pénalité, décourage le retrait)
//   - Retournement face cachée   : +5   (libère une face-down)
//   - Carte défausse → tableau   : +5   (encourage le jeu actif)
//   - Recyclage pioche mode 1c   : -100 (à partir du 2e recyclage)
//   - Recyclage pioche mode 3c   : -20  (à partir du 2e recyclage)
//   - Bonus temps                : +700_000 / sec restantes (si <30s — quasi mythique)
//   - Bonus victoire (multi)     : +150 / carte (vainqueur uniquement)

import { Injectable, Logger } from '@nestjs/common';

/** Type d'événement de score qui peut survenir pendant une partie Klondike. */
export type KlondikeScoreEvent =
  | { type: 'CARD_TO_FOUNDATION' }
  | { type: 'FOUNDATION_TO_TABLEAU' }
  | { type: 'FACE_DOWN_FLIPPED' }
  | { type: 'WASTE_TO_TABLEAU' }
  | { type: 'STOCK_RECYCLE'; mode: 1 | 3; cycleNumber: number };

/** Configuration immuable du barème Klondike (spec section 2.4). */
export const KLONDIKE_SCORE_TABLE = Object.freeze({
  CARD_TO_FOUNDATION: 10,
  FOUNDATION_TO_TABLEAU: -15,
  FACE_DOWN_FLIPPED: 5,
  WASTE_TO_TABLEAU: 5,
  STOCK_RECYCLE_1C: -100, // mode 1 carte (Easy)
  STOCK_RECYCLE_3C: -20,  // mode 3 cartes (Hard)
  TIME_BONUS_PER_SEC: 700_000, // bonus temps (>= 30s = 0)
  VICTORY_PER_CARD: 150,        // multi-vainqueur
} as const);

@Injectable()
export class KlondikeScoreService {
  private readonly logger = new Logger(KlondikeScoreService.name);

  /**
   * Applique un événement de score à un total courant.
   * Pure function — facile à tester unitairement.
   *
   * @param current Score actuel (peut être négatif après pénalités).
   * @param event   Événement à appliquer.
   * @returns Nouveau score après application.
   */
  applyEvent(current: number, event: KlondikeScoreEvent): number {
    const t = KLONDIKE_SCORE_TABLE;
    let delta = 0;
    switch (event.type) {
      case 'CARD_TO_FOUNDATION':
        delta = t.CARD_TO_FOUNDATION;
        break;
      case 'FOUNDATION_TO_TABLEAU':
        delta = t.FOUNDATION_TO_TABLEAU;
        break;
      case 'FACE_DOWN_FLIPPED':
        delta = t.FACE_DOWN_FLIPPED;
        break;
      case 'WASTE_TO_TABLEAU':
        delta = t.WASTE_TO_TABLEAU;
        break;
      case 'STOCK_RECYCLE':
        // 1er recyclage gratuit, pénalité dès le 2e (spec)
        if (event.cycleNumber >= 2) {
          delta = event.mode === 1 ? t.STOCK_RECYCLE_1C : t.STOCK_RECYCLE_3C;
        }
        break;
    }
    if (process.env.NODE_ENV !== 'production') {
      // [DEV] Log détaillé pour debug score : visible uniquement hors prod.
      this.logger.debug(
        `Klondike score: ${current} ${delta >= 0 ? '+' : ''}${delta} = ${current + delta} (${event.type})`,
      );
    }
    return current + delta;
  }

  /**
   * Calcule le bonus temps : non-zéro uniquement si la partie a été
   * gagnée en moins de 30 secondes (rappel : 700_000 / sec restantes).
   *
   * @param durationMs Durée totale en millisecondes.
   * @returns Bonus à ajouter au score final.
   */
  computeTimeBonus(durationMs: number): number {
    const seconds = Math.floor(durationMs / 1000);
    if (seconds >= 30) return 0;
    const remaining = 30 - seconds;
    const bonus = remaining * KLONDIKE_SCORE_TABLE.TIME_BONUS_PER_SEC;
    this.logger.log(`Time bonus: ${seconds}s écoulées → ${remaining}s restantes → +${bonus} pts`);
    return bonus;
  }

  /**
   * Calcule le bonus de victoire en multijoueur.
   * Le vainqueur gagne 150 points par carte placée en fondation
   * (= 7800 si toutes les 52 cartes y sont, soit une victoire complète).
   *
   * @param foundationCardsCount Nombre de cartes en fondation au moment du win.
   * @returns Bonus de victoire.
   */
  computeVictoryBonus(foundationCardsCount: number): number {
    return foundationCardsCount * KLONDIKE_SCORE_TABLE.VICTORY_PER_CARD;
  }

  /**
   * Calcule le score final d'une partie en additionnant le score courant,
   * le bonus temps et (en multijoueur) le bonus victoire.
   *
   * Utilisé à la fin de partie pour persister `final_score` en base.
   */
  computeFinalScore(opts: {
    currentScore: number;
    durationMs: number;
    isMultiplayerWinner: boolean;
    foundationCardsCount: number;
  }): { finalScore: number; breakdown: Record<string, number> } {
    const timeBonus = this.computeTimeBonus(opts.durationMs);
    const victoryBonus = opts.isMultiplayerWinner
      ? this.computeVictoryBonus(opts.foundationCardsCount)
      : 0;
    const finalScore = opts.currentScore + timeBonus + victoryBonus;
    const breakdown = {
      base: opts.currentScore,
      timeBonus,
      victoryBonus,
      total: finalScore,
    };
    this.logger.log(`Klondike final score breakdown: ${JSON.stringify(breakdown)}`);
    return { finalScore, breakdown };
  }
}
