import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameType, GameState, Player, Move, ConnectionMode } from '@sally/types';
import { useSocket } from './useSocket';

export interface UseMultiplayerGameOptions {
  roomCode: string;
  gameType: GameType;
  onStateUpdate?: (state: GameState) => void;
  onGameEnd?: (result: { winnerId: string | null; finalState: GameState }) => void;
  onPlayerJoined?: (player: Player) => void;
  onPlayerLeft?: (playerId: string) => void;
  onError?: (error: string) => void;
}

export interface UseMultiplayerGameReturn {
  sendMove: (move: Omit<Move, 'timestamp'>) => void;
  sendReady: () => void;
  leaveRoom: () => void;
  gameState: GameState | null;
  players: Player[];
  isMyTurn: boolean;
  isConnected: boolean;
  latency: number;
  connectionMode: ConnectionMode;
}

/**
 * Core multiplayer game hook.
 *
 * Connects to the /game namespace, joins the room, and handles all game events.
 * Implements optimistic updates: applies moves locally, then waits for server
 * confirmation and rolls back if rejected.
 */
export function useMultiplayerGame(
  options: UseMultiplayerGameOptions,
): UseMultiplayerGameReturn {
  const { roomCode, onStateUpdate, onGameEnd, onPlayerJoined, onPlayerLeft, onError } = options;

  const { socket, isConnected, latency, emit, on, off } = useSocket('/game');

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [connectionMode] = useState<ConnectionMode>('SOCKET' as ConnectionMode);

  // Track pending optimistic moves for potential rollback
  const pendingMovesRef = useRef<Map<string, GameState>>(new Map());
  const myPlayerIdRef = useRef<string>('');

  // Stable callback refs
  const onStateUpdateRef = useRef(onStateUpdate);
  const onGameEndRef = useRef(onGameEnd);
  const onPlayerJoinedRef = useRef(onPlayerJoined);
  const onPlayerLeftRef = useRef(onPlayerLeft);
  const onErrorRef = useRef(onError);

  useEffect(() => { onStateUpdateRef.current = onStateUpdate; }, [onStateUpdate]);
  useEffect(() => { onGameEndRef.current = onGameEnd; }, [onGameEnd]);
  useEffect(() => { onPlayerJoinedRef.current = onPlayerJoined; }, [onPlayerJoined]);
  useEffect(() => { onPlayerLeftRef.current = onPlayerLeft; }, [onPlayerLeft]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  // Join room and register event listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Join the room
    emit('room:join', { code: roomCode }, (room: unknown) => {
      if (!room) {
        onErrorRef.current?.('Failed to join room');
        return;
      }
      const r = room as { players: Player[] };
      setPlayers(r.players ?? []);
    });

    // Game state update - authoritative state from server
    const handleState = (state: GameState) => {
      // Clear any pending optimistic moves since server state is authoritative
      pendingMovesRef.current.clear();
      setGameState(state);
      setPlayers(state.players);
      setIsMyTurn(state.currentPlayerId === myPlayerIdRef.current);
      onStateUpdateRef.current?.(state);
    };

    // Game started
    const handleStarted = (state: GameState) => {
      setGameState(state);
      setPlayers(state.players);
      setIsMyTurn(state.currentPlayerId === myPlayerIdRef.current);
      onStateUpdateRef.current?.(state);
    };

    // Incoming move from another player (or server confirmation of own move)
    const handleAction = (move: Move) => {
      // If this is our own move being confirmed, remove from pending
      if (move.playerId === myPlayerIdRef.current) {
        pendingMovesRef.current.delete(move.timestamp);
      }
    };

    // Game ended
    const handleEnded = (result: { winnerId: string | null; finalState: GameState }) => {
      setGameState(result.finalState);
      setPlayers(result.finalState.players);
      setIsMyTurn(false);
      onGameEndRef.current?.(result);
    };

    // Player joined
    const handlePlayerJoined = (payload: { room: unknown; player: Player }) => {
      setPlayers((prev) => {
        if (prev.find((p) => p.id === payload.player.id)) return prev;
        return [...prev, payload.player];
      });
      onPlayerJoinedRef.current?.(payload.player);
    };

    // Player left
    const handlePlayerLeft = (payload: { roomId: string; playerId: string }) => {
      setPlayers((prev) => prev.filter((p) => p.id !== payload.playerId));
      onPlayerLeftRef.current?.(payload.playerId);
    };

    // Error
    const handleError = (payload: { message: string }) => {
      // If we have pending optimistic moves, roll back
      const lastPending = Array.from(pendingMovesRef.current.entries()).pop();
      if (lastPending) {
        const [, previousState] = lastPending;
        setGameState(previousState);
        setPlayers(previousState.players);
        setIsMyTurn(previousState.currentPlayerId === myPlayerIdRef.current);
        pendingMovesRef.current.clear();
      }
      onErrorRef.current?.(payload.message);
    };

    on('game:state', handleState as (...args: unknown[]) => void);
    on('game:started', handleStarted as (...args: unknown[]) => void);
    on('game:action', handleAction as (...args: unknown[]) => void);
    on('game:ended', handleEnded as (...args: unknown[]) => void);
    on('room:joined', handlePlayerJoined as (...args: unknown[]) => void);
    on('room:left', handlePlayerLeft as (...args: unknown[]) => void);
    on('game:error', handleError as (...args: unknown[]) => void);

    return () => {
      off('game:state', handleState as (...args: unknown[]) => void);
      off('game:started', handleStarted as (...args: unknown[]) => void);
      off('game:action', handleAction as (...args: unknown[]) => void);
      off('game:ended', handleEnded as (...args: unknown[]) => void);
      off('room:joined', handlePlayerJoined as (...args: unknown[]) => void);
      off('room:left', handlePlayerLeft as (...args: unknown[]) => void);
      off('game:error', handleError as (...args: unknown[]) => void);
    };
  }, [socket, isConnected, roomCode, emit, on, off]);

  /**
   * Send a game move with optimistic update.
   * Stores the current state before applying, so we can rollback on error.
   */
  const sendMove = useCallback(
    (move: Omit<Move, 'timestamp'>) => {
      if (!isConnected) {
        onErrorRef.current?.('Not connected');
        return;
      }

      const timestamp = new Date().toISOString();
      const fullMove: Move = { ...move, timestamp };

      // Save current state for potential rollback
      if (gameState) {
        pendingMovesRef.current.set(timestamp, gameState);
      }

      // Optimistic: mark it as no longer our turn locally
      setIsMyTurn(false);

      // Send to server
      emit('game:action', fullMove);
    },
    [isConnected, gameState, emit],
  );

  const sendReady = useCallback(() => {
    emit('game:start', { roomId: roomCode });
  }, [emit, roomCode]);

  const leaveRoom = useCallback(() => {
    emit('room:leave', { roomId: roomCode });
    setGameState(null);
    setPlayers([]);
    setIsMyTurn(false);
  }, [emit, roomCode]);

  /**
   * Set the local player ID (call this after auth).
   */
  const setMyPlayerId = useCallback((id: string) => {
    myPlayerIdRef.current = id;
  }, []);

  // Expose setMyPlayerId on the socket for external use
  useEffect(() => {
    if (socket) {
      (socket as unknown as Record<string, unknown>).__setMyPlayerId = setMyPlayerId;
    }
  }, [socket, setMyPlayerId]);

  return {
    sendMove,
    sendReady,
    leaveRoom,
    gameState,
    players,
    isMyTurn,
    isConnected,
    latency,
    connectionMode,
  };
}
