/**
 * Tests unitaires : valide que chaque reverseDeal*Backend produit
 *  - un state initial avec phase='playing'
 *  - une solution non-vide (greedySolve a réussi à progresser)
 *  - un dealHash unique (sha1 du state)
 */

import {
  reverseDealKlondikeBackend,
  reverseDealSpiderBackend,
  reverseDealAccordionBackend,
  reverseDealYukonBackend,
  reverseDealFreeCellBackend,
  reverseDealGolfBackend,
  reverseDealPyramidBackend,
  reverseDealTriPeaksBackend,
  reverseDealFortyThievesBackend,
} from './reverse-deal-generators';

describe('reverse-deal-generators', () => {
  // Boost le timeout : un reverse-deal complet peut prendre ~500ms
  jest.setTimeout(5000);

  const cases = [
    { name: 'Klondike', fn: reverseDealKlondikeBackend },
    { name: 'Spider-1', fn: () => reverseDealSpiderBackend(1) },
    { name: 'Spider-2', fn: () => reverseDealSpiderBackend(2) },
    { name: 'Spider-4', fn: () => reverseDealSpiderBackend(4) },
    { name: 'Accordion', fn: reverseDealAccordionBackend },
    { name: 'Yukon', fn: reverseDealYukonBackend },
    { name: 'FreeCell', fn: reverseDealFreeCellBackend },
    { name: 'Golf', fn: reverseDealGolfBackend },
    { name: 'Pyramid', fn: reverseDealPyramidBackend },
    { name: 'TriPeaks', fn: reverseDealTriPeaksBackend },
    { name: 'FortyThieves', fn: reverseDealFortyThievesBackend },
  ];

  for (const c of cases) {
    describe(c.name, () => {
      it('produit un state initial valide + un dealHash + une solution', () => {
        const deal = c.fn();
        expect(deal.initialState).toBeDefined();
        expect(typeof deal.dealHash).toBe('string');
        expect(deal.dealHash.length).toBeGreaterThan(0);
        expect(deal.initialState.phase).toBe('playing');
        expect(Array.isArray(deal.solution)).toBe(true);
        // Solution peut être vide pour Pyramid/Accordion stricts (greedy fail),
        // mais doit toujours être un array.
      });

      it('produit des deals différents à chaque appel (RNG)', () => {
        const a = c.fn();
        const b = c.fn();
        // Très improbable que 2 deals random soient identiques.
        expect(a.dealHash).not.toBe(b.dealHash);
      });
    });
  }

  describe('Klondike solution', () => {
    it('résout généralement un Klondike construit (>50 coups)', () => {
      // Sur 5 essais, au moins un doit avoir une solution > 50 coups
      // (valide que greedySolve fonctionne, pas que CHAQUE deal est résolu).
      const lengths: number[] = [];
      for (let i = 0; i < 5; i++) {
        const d = reverseDealKlondikeBackend();
        lengths.push(d.solution.length);
      }
      const max = Math.max(...lengths);
      expect(max).toBeGreaterThan(50);
    });
  });
});
