/**
 * @file apps/web/app/solitaire/lib/flagships.ts
 * @description Variantes phares non présentes dans le catalogue généré
 *   (Klondike, FreeCell, Yukon), construites sur le moteur _genericTableau.
 */
import type { TableauConfig } from './engines/_genericTableau';

export interface Flagship { label: string; category: string; config: TableauConfig }

const base: Omit<TableauConfig, 'name'> = {
  decks: 1, tableauColumns: 7, tableauDealPattern: [1, 2, 3, 4, 5, 6, 7], tableauFaceUpFromBottom: 1,
  freeCells: 0, reservePiles: 0, reservePileSize: 0, reserveFaceUp: true,
  foundations: 4, foundationBaseRank: 1, foundationDirection: 'ascending',
  stackingRule: 'alternating-colors', stackingDirection: 'descending', emptyColumnRule: 'king-only',
  stockEnabled: true, stockDrawCount: 1, stockRecycle: 'unlimited', tableauRedeals: 0, multiCardMove: true,
};

export const FLAGSHIPS: Record<string, Flagship> = {
  'klondike-1': { label: 'Klondike (Pioche 1)', category: 'Klondike', config: { ...base, name: 'Klondike (Pioche 1)' } },
  'klondike-3': { label: 'Klondike (Pioche 3)', category: 'Klondike', config: { ...base, name: 'Klondike (Pioche 3)', stockDrawCount: 3 } },
  'klondike-vegas': { label: 'Klondike Vegas', category: 'Klondike', config: { ...base, name: 'Klondike Vegas', stockDrawCount: 3, stockRecycle: 'none' } },
  'freecell': {
    label: 'FreeCell', category: 'FreeCell',
    config: { ...base, name: 'FreeCell', tableauColumns: 8, tableauDealPattern: [7, 7, 7, 7, 6, 6, 6, 6], tableauFaceUpFromBottom: 'all', freeCells: 4, emptyColumnRule: 'any', stockEnabled: false },
  },
  'yukon': {
    label: 'Yukon', category: 'Yukon',
    config: { ...base, name: 'Yukon', tableauColumns: 7, tableauDealPattern: [1, 6, 7, 8, 9, 10, 11], tableauFaceUpFromBottom: 5, stockEnabled: false, multiCardMove: true },
  },
  'forty-thieves': {
    label: 'Forty Thieves', category: 'Forty Thieves',
    config: { ...base, name: 'Forty Thieves', decks: 2, tableauColumns: 10, tableauDealPattern: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4], tableauFaceUpFromBottom: 'all', foundations: 8, stackingRule: 'same-suit', emptyColumnRule: 'any', stockDrawCount: 1, stockRecycle: 'none' },
  },
};
