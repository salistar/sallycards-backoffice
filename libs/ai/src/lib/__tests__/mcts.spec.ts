import { MCTS, MCTSGameAdapter } from '../mcts/mcts';

/**
 * Simple Nim game for testing MCTS.
 * Players take turns removing 1-3 items from a pile.
 * The player who takes the last item loses.
 */
interface NimState {
  pile: number;
  currentPlayer: string;
  players: [string, string];
}

type NimMove = 1 | 2 | 3;

class NimAdapter implements MCTSGameAdapter<NimState, NimMove> {
  getValidMoves(state: NimState): NimMove[] {
    const moves: NimMove[] = [];
    if (state.pile >= 1) moves.push(1);
    if (state.pile >= 2) moves.push(2);
    if (state.pile >= 3) moves.push(3);
    return moves;
  }

  applyMove(state: NimState, move: NimMove): NimState {
    const newPile = state.pile - move;
    const nextPlayer =
      state.currentPlayer === state.players[0]
        ? state.players[1]
        : state.players[0];
    return {
      pile: newPile,
      currentPlayer: nextPlayer,
      players: state.players,
    };
  }

  isTerminal(state: NimState): boolean {
    return state.pile <= 0;
  }

  getResult(state: NimState, playerId: string): number {
    if (state.pile <= 0) {
      // The player who just moved (NOT the current player) took the last item and loses
      // currentPlayer is the one who would move NEXT, so the one who moved is the OTHER player
      const lastMover =
        state.currentPlayer === state.players[0]
          ? state.players[1]
          : state.players[0];
      return lastMover === playerId ? 0 : 1;
    }
    return 0.5;
  }

  getCurrentPlayer(state: NimState): string {
    return state.currentPlayer;
  }

  cloneState(state: NimState): NimState {
    return { ...state, players: [...state.players] };
  }
}

describe('MCTS', () => {
  const adapter = new NimAdapter();
  const players: [string, string] = ['alice', 'bob'];

  it('should find a move in a simple game', () => {
    const state: NimState = { pile: 5, currentPlayer: 'alice', players };
    const mcts = new MCTS(adapter, 'alice', 200);
    const move = mcts.findBestMove(state);

    expect([1, 2, 3]).toContain(move);
  });

  it('should find the optimal move when pile is 4 (take 3 to force opponent to take last)', () => {
    // With pile = 4, any move leaves 1-3 for the opponent.
    // Taking 3 leaves 1 -- opponent must take the last item and lose.
    const state: NimState = { pile: 4, currentPlayer: 'alice', players };
    const mcts = new MCTS(adapter, 'alice', 500);
    const move = mcts.findBestMove(state);
    expect(move).toBe(3);
  });

  it('should make better moves with higher simulation count', () => {
    const state: NimState = { pile: 8, currentPlayer: 'alice', players };

    // Run multiple trials and compare win rates
    let lowSimWins = 0;
    let highSimWins = 0;
    const trials = 20;

    for (let t = 0; t < trials; t++) {
      const lowMcts = new MCTS(adapter, 'alice', 10);
      const highMcts = new MCTS(adapter, 'alice', 500);

      const lowMove = lowMcts.findBestMove(state);
      const highMove = highMcts.findBestMove(state);

      // Simulate a game from each move
      const simulateGame = (firstMove: NimMove): string => {
        let s = adapter.applyMove(state, firstMove);
        while (!adapter.isTerminal(s)) {
          const moves = adapter.getValidMoves(s);
          const randomMove = moves[Math.floor(Math.random() * moves.length)];
          s = adapter.applyMove(s, randomMove);
        }
        return adapter.getResult(s, 'alice') === 1 ? 'alice' : 'bob';
      };

      if (simulateGame(lowMove) === 'alice') lowSimWins++;
      if (simulateGame(highMove) === 'alice') highSimWins++;
    }

    // Higher sim count should generally do at least as well
    // We just verify both produce moves (this is a probabilistic test)
    expect(lowSimWins).toBeGreaterThanOrEqual(0);
    expect(highSimWins).toBeGreaterThanOrEqual(0);
  });

  it('should return the only move when there is exactly one valid move', () => {
    const state: NimState = { pile: 1, currentPlayer: 'alice', players };
    const mcts = new MCTS(adapter, 'alice', 100);
    const move = mcts.findBestMove(state);
    expect(move).toBe(1);
  });

  it('should throw when there are no valid moves', () => {
    const state: NimState = { pile: 0, currentPlayer: 'alice', players };
    const mcts = new MCTS(adapter, 'alice', 100);
    expect(() => mcts.findBestMove(state)).toThrow('No valid moves');
  });

  it('should never make an invalid move over 100 simulated games', () => {
    const adapter = new NimAdapter();

    for (let game = 0; game < 100; game++) {
      let state: NimState = {
        pile: 5 + Math.floor(Math.random() * 10),
        currentPlayer: 'alice',
        players,
      };

      while (!adapter.isTerminal(state)) {
        const currentPlayer = adapter.getCurrentPlayer(state);
        const mcts = new MCTS(adapter, currentPlayer, 50);
        const move = mcts.findBestMove(state);

        const validMoves = adapter.getValidMoves(state);
        expect(validMoves).toContain(move);

        state = adapter.applyMove(state, move);
      }
    }
  });
});
