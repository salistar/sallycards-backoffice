import { Injectable } from '@nestjs/common';

@Injectable()
export class EloService {
  /**
   * Calculate the expected score for a player against an opponent.
   * Returns a value between 0 and 1 representing the probability of winning.
   */
  private expectedScore(playerElo: number, opponentElo: number): number {
    return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  }

  /**
   * K-factor selon la spec SallyCards Solitaire section 7.4 :
   *   - < 30 matches  → K = 32  (nouveaux joueurs, ratings volatiles pour calibrage rapide)
   *   - elo >= 1800   → K = 16  (joueurs experts, ratings stables)
   *   - sinon         → K = 24  (joueurs intermédiaires)
   *
   * NOTE : la version précédente utilisait <30/30-100/100+ ce qui ne correspondait
   * pas à la grille officielle. Cette version respecte la spec à la lettre.
   */
  private getKFactor(gamesPlayed: number, currentElo: number = 1200): number {
    if (gamesPlayed < 30) return 32;
    if (currentElo >= 1800) return 16;
    return 24;
  }

  /** Helper pour debug et tests : expose la formule du K-factor pour valider en suite. */
  public getKFactorPublic(gamesPlayed: number, currentElo: number = 1200): number {
    return this.getKFactor(gamesPlayed, currentElo);
  }

  /**
   * Calculate the new ELO rating after a game.
   *
   * @param playerElo    Current ELO of the player
   * @param opponentElo  Current ELO of the opponent
   * @param won          Whether the player won (true) or lost (false)
   * @param kFactor      Optional override for the K-factor; if omitted uses game-count logic
   * @returns            The new ELO rating (rounded to nearest integer)
   */
  calculateNewElo(
    playerElo: number,
    opponentElo: number,
    won: boolean,
    kFactor?: number,
  ): number {
    const expected = this.expectedScore(playerElo, opponentElo);
    const actual = won ? 1 : 0;
    const k = kFactor ?? 32; // default if no override
    return Math.round(playerElo + k * (actual - expected));
  }

  /**
   * Calculate the new ELO using game-count-based K-factor.
   *
   * @param playerElo    Current ELO of the player
   * @param opponentElo  Current ELO of the opponent
   * @param won          Whether the player won
   * @param gamesPlayed  Total games the player has played (determines K-factor)
   * @returns            The new ELO rating (rounded to nearest integer)
   */
  calculateNewEloAuto(
    playerElo: number,
    opponentElo: number,
    won: boolean,
    gamesPlayed: number,
  ): number {
    // Le K-factor dépend MAINTENANT à la fois du nombre de parties ET de l'ELO actuel
    // (spec section 7.4 : K=16 dès 1800 ELO, peu importe les matches joués).
    const k = this.getKFactor(gamesPlayed, playerElo);
    return this.calculateNewElo(playerElo, opponentElo, won, k);
  }

  /**
   * Calcule les deltas ELO pour un duel (winner/loser) en respectant la spec.
   * Retourne `{ winnerDelta, loserDelta }` à appliquer en BD.
   *
   * Cette méthode reproduit exactement la formule du PDF (section 7.4) :
   *   - expected = 1 / (1 + 10^((opp - self) / 400))
   *   - delta = K × (actual - expected)
   *   - K dépend de gamesPlayed et currentElo (cf. getKFactor)
   */
  computeDuelDeltas(opts: {
    winnerElo: number;
    loserElo: number;
    winnerMatches: number;
    loserMatches: number;
  }): { winnerDelta: number; loserDelta: number } {
    const expectedWinner = this.expectedScore(opts.winnerElo, opts.loserElo);
    const expectedLoser = this.expectedScore(opts.loserElo, opts.winnerElo);
    const kw = this.getKFactor(opts.winnerMatches, opts.winnerElo);
    const kl = this.getKFactor(opts.loserMatches, opts.loserElo);
    return {
      winnerDelta: Math.round(kw * (1 - expectedWinner)),
      loserDelta: Math.round(kl * (0 - expectedLoser)),
    };
  }

  /**
   * Calculate ELO changes for a draw.
   *
   * @param playerElo    Current ELO of the player
   * @param opponentElo  Current ELO of the opponent
   * @param kFactor      K-factor to use
   * @returns            The new ELO rating (rounded to nearest integer)
   */
  calculateDrawElo(
    playerElo: number,
    opponentElo: number,
    kFactor: number,
  ): number {
    const expected = this.expectedScore(playerElo, opponentElo);
    const actual = 0.5;
    return Math.round(playerElo + kFactor * (actual - expected));
  }
}
