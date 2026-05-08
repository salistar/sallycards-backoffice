// Generic Monte Carlo Tree Search (MCTS) implementation

export interface MCTSNode<TState, TMove> {
  state: TState;
  move: TMove | null;       // move that led to this state
  parent: MCTSNode<TState, TMove> | null;
  children: MCTSNode<TState, TMove>[];
  visits: number;
  wins: number;
  untriedMoves: TMove[];
  playerWhoMoved: string | null;
}

export interface MCTSGameAdapter<TState, TMove> {
  /** Get all valid moves for the given player in this state. */
  getValidMoves(state: TState, playerId: string): TMove[];

  /** Apply a move and return the resulting new state (must not mutate original). */
  applyMove(state: TState, move: TMove, playerId: string): TState;

  /** Check if the game has ended. */
  isTerminal(state: TState): boolean;

  /** Get the result for the given player: 1 = win, 0 = loss, 0.5 = draw. */
  getResult(state: TState, playerId: string): number;

  /** Get the ID of the player whose turn it is. */
  getCurrentPlayer(state: TState): string;

  /** Deep clone the state. */
  cloneState(state: TState): TState;
}

export class MCTS<TState, TMove> {
  constructor(
    private adapter: MCTSGameAdapter<TState, TMove>,
    private playerId: string,
    private simulationCount: number = 1000,
    private explorationConstant: number = 1.414,
  ) {}

  /**
   * Run MCTS from the given root state and return the best move.
   */
  findBestMove(rootState: TState): TMove {
    const currentPlayer = this.adapter.getCurrentPlayer(rootState);
    const validMoves = this.adapter.getValidMoves(rootState, currentPlayer);

    if (validMoves.length === 0) {
      throw new Error('MCTS: No valid moves available');
    }
    if (validMoves.length === 1) {
      return validMoves[0];
    }

    // Create root node
    const root: MCTSNode<TState, TMove> = {
      state: this.adapter.cloneState(rootState),
      move: null,
      parent: null,
      children: [],
      visits: 0,
      wins: 0,
      untriedMoves: [...validMoves],
      playerWhoMoved: null,
    };

    // Run simulations
    for (let i = 0; i < this.simulationCount; i++) {
      // 1. Selection - walk tree using UCB1
      let node = this.select(root);

      // 2. Expansion - add a new child node if not terminal
      if (node.untriedMoves.length > 0 && !this.adapter.isTerminal(node.state)) {
        node = this.expand(node);
      }

      // 3. Simulation - random playout to terminal state
      const result = this.simulate(node.state);

      // 4. Backpropagation - update win/visit counts up the tree
      this.backpropagate(node, result);
    }

    // Return the move with the highest visit count (most robust child)
    let bestChild: MCTSNode<TState, TMove> | null = null;
    let bestVisits = -1;

    for (const child of root.children) {
      if (child.visits > bestVisits) {
        bestVisits = child.visits;
        bestChild = child;
      }
    }

    if (!bestChild || bestChild.move === null) {
      // Fallback: random move
      return validMoves[Math.floor(Math.random() * validMoves.length)];
    }

    return bestChild.move;
  }

  /**
   * UCB1 formula: exploitation + exploration.
   * wins/visits + C * sqrt(ln(parent.visits) / visits)
   */
  private ucb1(node: MCTSNode<TState, TMove>): number {
    if (node.visits === 0) {
      return Infinity;
    }
    const parentVisits = node.parent ? node.parent.visits : node.visits;
    const exploitation = node.wins / node.visits;
    const exploration = this.explorationConstant * Math.sqrt(Math.log(parentVisits) / node.visits);
    return exploitation + exploration;
  }

  /**
   * Selection phase: walk down the tree, choosing children with highest UCB1,
   * until we reach a node that has untried moves or is terminal.
   */
  private select(node: MCTSNode<TState, TMove>): MCTSNode<TState, TMove> {
    let current = node;
    while (
      current.untriedMoves.length === 0 &&
      current.children.length > 0 &&
      !this.adapter.isTerminal(current.state)
    ) {
      let bestChild: MCTSNode<TState, TMove> = current.children[0];
      let bestUcb = -Infinity;

      for (const child of current.children) {
        const ucb = this.ucb1(child);
        if (ucb > bestUcb) {
          bestUcb = ucb;
          bestChild = child;
        }
      }
      current = bestChild;
    }
    return current;
  }

  /**
   * Expansion phase: pick a random untried move, apply it, create a child node.
   */
  private expand(node: MCTSNode<TState, TMove>): MCTSNode<TState, TMove> {
    const moveIndex = Math.floor(Math.random() * node.untriedMoves.length);
    const move = node.untriedMoves[moveIndex];
    // Remove move from untried list
    node.untriedMoves.splice(moveIndex, 1);

    const currentPlayer = this.adapter.getCurrentPlayer(node.state);
    const newState = this.adapter.applyMove(
      this.adapter.cloneState(node.state),
      move,
      currentPlayer,
    );

    const nextPlayer = this.adapter.getCurrentPlayer(newState);
    const childValidMoves = this.adapter.isTerminal(newState)
      ? []
      : this.adapter.getValidMoves(newState, nextPlayer);

    const child: MCTSNode<TState, TMove> = {
      state: newState,
      move,
      parent: node,
      children: [],
      visits: 0,
      wins: 0,
      untriedMoves: childValidMoves,
      playerWhoMoved: currentPlayer,
    };

    node.children.push(child);
    return child;
  }

  /**
   * Simulation phase: from the given state, play random moves until a terminal
   * state is reached, then return the result for our player.
   */
  private simulate(startState: TState): number {
    let state = this.adapter.cloneState(startState);
    let depth = 0;
    const maxDepth = 200; // safety limit

    while (!this.adapter.isTerminal(state) && depth < maxDepth) {
      const currentPlayer = this.adapter.getCurrentPlayer(state);
      const moves = this.adapter.getValidMoves(state, currentPlayer);

      if (moves.length === 0) {
        break;
      }

      const randomMove = moves[Math.floor(Math.random() * moves.length)];
      state = this.adapter.applyMove(state, randomMove, currentPlayer);
      depth++;
    }

    return this.adapter.getResult(state, this.playerId);
  }

  /**
   * Backpropagation phase: walk up from the given node to the root,
   * updating visit counts and win counts.
   */
  private backpropagate(node: MCTSNode<TState, TMove> | null, result: number): void {
    let current = node;
    while (current !== null) {
      current.visits++;
      // The result is from the perspective of this.playerId.
      // If the player who moved into this node IS our player, add result directly.
      // If not, add the inverse (1 - result).
      if (current.playerWhoMoved === this.playerId) {
        current.wins += result;
      } else if (current.playerWhoMoved !== null) {
        current.wins += 1 - result;
      } else {
        // Root node: just add result
        current.wins += result;
      }
      current = current.parent;
    }
  }

  /**
   * Get statistics about the search for debugging.
   */
  getSearchStats(root: MCTSNode<TState, TMove>): {
    totalVisits: number;
    childStats: { move: TMove | null; visits: number; winRate: number }[];
  } {
    return {
      totalVisits: root.visits,
      childStats: root.children.map((c) => ({
        move: c.move,
        visits: c.visits,
        winRate: c.visits > 0 ? c.wins / c.visits : 0,
      })),
    };
  }
}
