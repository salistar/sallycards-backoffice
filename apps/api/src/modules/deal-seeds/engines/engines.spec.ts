/**
 * Tests rapides pour les engines portés depuis le mobile.
 * Vérifie que `gameReducer(state, RESET)` produit un state valide
 * et que `findHint()` ne plante pas sur un état initial.
 */

import * as Klondike from './klondikeEngine';
import * as Spider from './spiderEngine';
import * as Yukon from './yukonEngine';
import * as FreeCell from './freecellEngine';
import * as Golf from './golfEngine';
import * as Pyramid from './pyramidEngine';
import * as TriPeaks from './tripeaksEngine';
import * as FortyThieves from './fortyThievesEngine';
import * as Accordion from './accordionEngine';

describe('engines portés', () => {
  jest.setTimeout(8000);

  const engines = [
    { name: 'Klondike', e: Klondike },
    { name: 'Spider', e: Spider },
    { name: 'Yukon', e: Yukon },
    { name: 'FreeCell', e: FreeCell },
    { name: 'Golf', e: Golf },
    { name: 'Pyramid', e: Pyramid },
    { name: 'TriPeaks', e: TriPeaks },
    { name: 'FortyThieves', e: FortyThieves },
    { name: 'Accordion', e: Accordion },
  ];

  for (const { name, e } of engines) {
    describe(name, () => {
      it('expose gameReducer + findHint + createInitialState', () => {
        expect(typeof (e as any).gameReducer).toBe('function');
        expect(typeof (e as any).findHint).toBe('function');
        expect(typeof (e as any).createInitialState).toBe('function');
      });

      it('createInitialState produit un state avec phase=playing', () => {
        const s = (e as any).createInitialState();
        expect(s.phase).toBe('playing');
      });

      it('findHint ne plante pas sur l\'état initial', () => {
        const s = (e as any).createInitialState();
        expect(() => (e as any).findHint(s)).not.toThrow();
      });

      it('gameReducer respecte RESET → nouveau state playing', () => {
        const s = (e as any).createInitialState();
        const r = (e as any).gameReducer(s, { type: 'RESET' });
        expect(r.phase).toBe('playing');
      });
    });
  }
});
