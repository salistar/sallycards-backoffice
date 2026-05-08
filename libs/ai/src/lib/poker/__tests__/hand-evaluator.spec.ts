import { Card } from '@sally/shared/types';
import { evaluateHand, compareHands, getHandStrength } from '../hand-evaluator';

function card(suit: 'hearts' | 'diamonds' | 'clubs' | 'spades', value: number): Card {
  return {
    id: `french52-${suit}-${value}`,
    suit,
    value,
    deck: 'french52',
  };
}

describe('Hand Evaluator', () => {
  // --- Royal Flush ---

  it('should detect a Royal Flush', () => {
    const hand = [
      card('hearts', 1),  // Ace
      card('hearts', 13), // King
      card('hearts', 12), // Queen
      card('hearts', 11), // Jack
      card('hearts', 10), // Ten
    ];
    const result = evaluateHand(hand);
    expect(result.rank).toBe('royal_flush');
    expect(result.rankValue).toBe(10);
  });

  // --- Straight Flush ---

  it('should detect a Straight Flush', () => {
    const hand = [
      card('clubs', 9),
      card('clubs', 8),
      card('clubs', 7),
      card('clubs', 6),
      card('clubs', 5),
    ];
    const result = evaluateHand(hand);
    expect(result.rank).toBe('straight_flush');
    expect(result.rankValue).toBe(9);
  });

  it('should detect a wheel Straight Flush (A-2-3-4-5)', () => {
    const hand = [
      card('spades', 1),
      card('spades', 2),
      card('spades', 3),
      card('spades', 4),
      card('spades', 5),
    ];
    const result = evaluateHand(hand);
    expect(result.rank).toBe('straight_flush');
    expect(result.tiebreaker[0]).toBe(5); // 5-high
  });

  // --- Four of a Kind ---

  it('should detect Four of a Kind', () => {
    const hand = [
      card('hearts', 8),
      card('diamonds', 8),
      card('clubs', 8),
      card('spades', 8),
      card('hearts', 3),
    ];
    const result = evaluateHand(hand);
    expect(result.rank).toBe('four_of_a_kind');
    expect(result.rankValue).toBe(8);
  });

  // --- Full House ---

  it('should detect a Full House', () => {
    const hand = [
      card('hearts', 10),
      card('diamonds', 10),
      card('clubs', 10),
      card('spades', 6),
      card('hearts', 6),
    ];
    const result = evaluateHand(hand);
    expect(result.rank).toBe('full_house');
    expect(result.rankValue).toBe(7);
  });

  // --- Flush ---

  it('should detect a Flush', () => {
    const hand = [
      card('diamonds', 1),
      card('diamonds', 10),
      card('diamonds', 7),
      card('diamonds', 4),
      card('diamonds', 2),
    ];
    const result = evaluateHand(hand);
    expect(result.rank).toBe('flush');
    expect(result.rankValue).toBe(6);
  });

  // --- Straight ---

  it('should detect a Straight', () => {
    const hand = [
      card('hearts', 9),
      card('diamonds', 8),
      card('clubs', 7),
      card('spades', 6),
      card('hearts', 5),
    ];
    const result = evaluateHand(hand);
    expect(result.rank).toBe('straight');
    expect(result.rankValue).toBe(5);
  });

  it('should detect Ace-low straight (A-2-3-4-5)', () => {
    const hand = [
      card('hearts', 1),
      card('diamonds', 2),
      card('clubs', 3),
      card('spades', 4),
      card('hearts', 5),
    ];
    const result = evaluateHand(hand);
    expect(result.rank).toBe('straight');
    expect(result.tiebreaker[0]).toBe(5); // 5-high straight
  });

  it('should detect Ace-high straight (10-J-Q-K-A)', () => {
    const hand = [
      card('hearts', 10),
      card('diamonds', 11),
      card('clubs', 12),
      card('spades', 13),
      card('hearts', 1),
    ];
    const result = evaluateHand(hand);
    expect(result.rank).toBe('straight');
    expect(result.tiebreaker[0]).toBe(14); // Ace-high
  });

  // --- Three of a Kind ---

  it('should detect Three of a Kind', () => {
    const hand = [
      card('hearts', 7),
      card('diamonds', 7),
      card('clubs', 7),
      card('spades', 12),
      card('hearts', 3),
    ];
    const result = evaluateHand(hand);
    expect(result.rank).toBe('three_of_a_kind');
    expect(result.rankValue).toBe(4);
  });

  // --- Two Pair ---

  it('should detect Two Pair', () => {
    const hand = [
      card('hearts', 11),
      card('diamonds', 11),
      card('clubs', 4),
      card('spades', 4),
      card('hearts', 1),
    ];
    const result = evaluateHand(hand);
    expect(result.rank).toBe('two_pair');
    expect(result.rankValue).toBe(3);
  });

  // --- One Pair ---

  it('should detect One Pair', () => {
    const hand = [
      card('hearts', 9),
      card('diamonds', 9),
      card('clubs', 1),
      card('spades', 7),
      card('hearts', 3),
    ];
    const result = evaluateHand(hand);
    expect(result.rank).toBe('one_pair');
    expect(result.rankValue).toBe(2);
  });

  // --- High Card ---

  it('should detect High Card', () => {
    const hand = [
      card('hearts', 1),
      card('diamonds', 10),
      card('clubs', 7),
      card('spades', 4),
      card('hearts', 2),
    ];
    const result = evaluateHand(hand);
    expect(result.rank).toBe('high_card');
    expect(result.rankValue).toBe(1);
  });

  // --- Hand comparison ---

  it('should rank higher flush above lower flush', () => {
    const highFlush = evaluateHand([
      card('hearts', 1),
      card('hearts', 13),
      card('hearts', 10),
      card('hearts', 7),
      card('hearts', 4),
    ]);
    const lowFlush = evaluateHand([
      card('clubs', 12),
      card('clubs', 10),
      card('clubs', 8),
      card('clubs', 5),
      card('clubs', 3),
    ]);
    expect(compareHands(highFlush, lowFlush)).toBe(1);
    expect(compareHands(lowFlush, highFlush)).toBe(-1);
  });

  it('should correctly compare full house vs flush', () => {
    const fullHouse = evaluateHand([
      card('hearts', 10),
      card('diamonds', 10),
      card('clubs', 10),
      card('spades', 5),
      card('hearts', 5),
    ]);
    const flush = evaluateHand([
      card('hearts', 1),
      card('hearts', 13),
      card('hearts', 10),
      card('hearts', 7),
      card('hearts', 4),
    ]);
    expect(compareHands(fullHouse, flush)).toBe(1);
  });

  it('should compare identical ranks by tiebreaker', () => {
    const highPair = evaluateHand([
      card('hearts', 1),
      card('diamonds', 1),
      card('clubs', 13),
      card('spades', 12),
      card('hearts', 10),
    ]);
    const lowPair = evaluateHand([
      card('hearts', 13),
      card('diamonds', 13),
      card('clubs', 12),
      card('spades', 10),
      card('hearts', 8),
    ]);
    expect(compareHands(highPair, lowPair)).toBe(1);
  });

  it('should return 0 for identical hands', () => {
    const hand1 = evaluateHand([
      card('hearts', 9),
      card('diamonds', 8),
      card('clubs', 7),
      card('spades', 6),
      card('hearts', 5),
    ]);
    const hand2 = evaluateHand([
      card('clubs', 9),
      card('spades', 8),
      card('hearts', 7),
      card('diamonds', 6),
      card('clubs', 5),
    ]);
    expect(compareHands(hand1, hand2)).toBe(0);
  });

  // --- 7-card evaluation (best 5 from 7) ---

  it('should find the best 5-card hand from 7 cards', () => {
    const hand = [
      card('hearts', 1),  // Ace
      card('hearts', 13), // King
      card('hearts', 12), // Queen
      card('hearts', 11), // Jack
      card('hearts', 10), // Ten - Royal Flush in hearts!
      card('clubs', 2),
      card('diamonds', 5),
    ];
    const result = evaluateHand(hand);
    expect(result.rank).toBe('royal_flush');
  });

  it('should find full house when buried in 7 cards', () => {
    const hand = [
      card('hearts', 10),
      card('diamonds', 10),
      card('clubs', 10),
      card('spades', 6),
      card('hearts', 6),
      card('clubs', 3),
      card('diamonds', 2),
    ];
    const result = evaluateHand(hand);
    expect(result.rank).toBe('full_house');
  });

  it('should pick the best pair from 7 cards', () => {
    const hand = [
      card('hearts', 1),   // Ace pair
      card('diamonds', 1),
      card('clubs', 13),
      card('spades', 11),
      card('hearts', 9),
      card('clubs', 7),
      card('diamonds', 4),
    ];
    const result = evaluateHand(hand);
    expect(result.rank).toBe('one_pair');
    expect(result.tiebreaker[0]).toBe(14); // Pair of Aces
  });

  // --- Edge cases ---

  it('should throw for fewer than 5 cards', () => {
    expect(() =>
      evaluateHand([card('hearts', 1), card('diamonds', 2), card('clubs', 3)])
    ).toThrow();
  });

  it('should detect two pair vs one pair correctly', () => {
    const twoPair = evaluateHand([
      card('hearts', 10),
      card('diamonds', 10),
      card('clubs', 5),
      card('spades', 5),
      card('hearts', 1),
    ]);
    const onePair = evaluateHand([
      card('hearts', 1),
      card('diamonds', 1),
      card('clubs', 13),
      card('spades', 12),
      card('hearts', 10),
    ]);
    // Aces beat tens, but two pair beats one pair
    expect(compareHands(twoPair, onePair)).toBe(1);
  });

  // --- Hand strength utility ---

  it('should return higher strength for better hands', () => {
    const royalFlush = evaluateHand([
      card('hearts', 1),
      card('hearts', 13),
      card('hearts', 12),
      card('hearts', 11),
      card('hearts', 10),
    ]);
    const highCard = evaluateHand([
      card('hearts', 1),
      card('diamonds', 10),
      card('clubs', 7),
      card('spades', 4),
      card('hearts', 2),
    ]);

    expect(getHandStrength(royalFlush)).toBeGreaterThan(
      getHandStrength(highCard)
    );
  });

  it('should return a value between 0 and 1', () => {
    const hand = evaluateHand([
      card('hearts', 7),
      card('diamonds', 7),
      card('clubs', 5),
      card('spades', 3),
      card('hearts', 2),
    ]);
    const strength = getHandStrength(hand);
    expect(strength).toBeGreaterThanOrEqual(0);
    expect(strength).toBeLessThanOrEqual(1);
  });

  // --- Description formatting ---

  it('should provide human-readable descriptions', () => {
    const hand = evaluateHand([
      card('hearts', 1),
      card('hearts', 13),
      card('hearts', 12),
      card('hearts', 11),
      card('hearts', 10),
    ]);
    expect(hand.description).toBe('Royal Flush');
  });

  it('should describe pairs correctly', () => {
    const hand = evaluateHand([
      card('hearts', 13),
      card('diamonds', 13),
      card('clubs', 10),
      card('spades', 7),
      card('hearts', 3),
    ]);
    expect(hand.description).toContain('Pair');
    expect(hand.description).toContain('Kings');
  });
});
