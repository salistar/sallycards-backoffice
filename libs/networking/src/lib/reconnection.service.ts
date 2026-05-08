import type { Socket } from 'socket.io-client';

const DEFAULT_MAX_RETRIES = 10;
const DEFAULT_BASE_DELAY = 1_000;
const MAX_DELAY = 30_000;
const JITTER_FACTOR = 0.3;

export interface ReconnectionConfig {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
}

export interface ReconnectionState {
  isReconnecting: boolean;
  attempt: number;
  maxRetries: number;
  nextRetryMs: number;
}

type StateChangeHandler = (state: ReconnectionState) => void;

/**
 * Reconnection service with exponential backoff and jitter.
 *
 * Handles reconnecting sockets and re-syncing game state
 * after a connection loss.
 */
export class ReconnectionService {
  private maxRetries: number;
  private baseDelay: number;
  private maxDelay: number;
  private currentAttempt = 0;
  private isReconnecting = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private stateChangeHandlers: Set<StateChangeHandler> = new Set();

  constructor(config?: ReconnectionConfig) {
    this.maxRetries = config?.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.baseDelay = config?.baseDelay ?? DEFAULT_BASE_DELAY;
    this.maxDelay = config?.maxDelay ?? MAX_DELAY;
  }

  /**
   * Attempt to reconnect a disconnected socket.
   * Uses exponential backoff with jitter.
   * Returns true if reconnection succeeded, false if all retries exhausted.
   */
  async attemptReconnect(socket: Socket): Promise<boolean> {
    if (this.isReconnecting) {
      return false;
    }

    this.isReconnecting = true;
    this.currentAttempt = 0;

    return new Promise<boolean>((resolve) => {
      const tryConnect = () => {
        if (this.currentAttempt >= this.maxRetries) {
          this.isReconnecting = false;
          this.notifyStateChange();
          console.error(
            `[ReconnectionService] Max retries (${this.maxRetries}) exhausted`,
          );
          resolve(false);
          return;
        }

        this.currentAttempt++;
        const delay = this.getRetryDelay(this.currentAttempt);
        this.notifyStateChange();

        console.log(
          `[ReconnectionService] Attempt ${this.currentAttempt}/${this.maxRetries} in ${delay}ms`,
        );

        this.reconnectTimer = setTimeout(() => {
          if (socket.connected) {
            this.isReconnecting = false;
            this.currentAttempt = 0;
            this.notifyStateChange();
            resolve(true);
            return;
          }

          // Attempt connection
          socket.connect();

          // Listen for the result
          const onConnect = () => {
            cleanup();
            this.isReconnecting = false;
            this.currentAttempt = 0;
            this.notifyStateChange();
            console.log('[ReconnectionService] Reconnected successfully');
            resolve(true);
          };

          const onError = () => {
            cleanup();
            tryConnect(); // try again
          };

          const cleanup = () => {
            socket.off('connect', onConnect);
            socket.off('connect_error', onError);
          };

          socket.once('connect', onConnect);
          socket.once('connect_error', onError);
        }, delay);
      };

      tryConnect();
    });
  }

  /**
   * Request full game state from the server after reconnection.
   * Emits a resync request and waits for the server response.
   */
  async resyncGameState(
    socket: Socket,
    roomCode: string,
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Game state resync timed out'));
      }, 10_000);

      socket.emit('game:resync', { roomCode }, (state: unknown) => {
        clearTimeout(timeout);
        if (state) {
          console.log('[ReconnectionService] Game state resynced');
          resolve(state);
        } else {
          reject(new Error('Server returned null state'));
        }
      });
    });
  }

  /**
   * Calculate retry delay using exponential backoff with jitter.
   *
   * delay = min(baseDelay * 2^(attempt-1), maxDelay) * (1 + random * jitter)
   */
  getRetryDelay(attempt: number): number {
    const exponentialDelay = this.baseDelay * Math.pow(2, attempt - 1);
    const clampedDelay = Math.min(exponentialDelay, this.maxDelay);
    const jitter = 1 + (Math.random() * 2 - 1) * JITTER_FACTOR;
    return Math.round(clampedDelay * jitter);
  }

  /**
   * Cancel any ongoing reconnection attempt.
   */
  cancel(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.isReconnecting = false;
    this.currentAttempt = 0;
    this.notifyStateChange();
  }

  /**
   * Get current reconnection state.
   */
  getState(): ReconnectionState {
    return {
      isReconnecting: this.isReconnecting,
      attempt: this.currentAttempt,
      maxRetries: this.maxRetries,
      nextRetryMs: this.isReconnecting
        ? this.getRetryDelay(this.currentAttempt + 1)
        : 0,
    };
  }

  /**
   * Listen for reconnection state changes.
   */
  onStateChange(handler: StateChangeHandler): () => void {
    this.stateChangeHandlers.add(handler);
    return () => this.stateChangeHandlers.delete(handler);
  }

  private notifyStateChange(): void {
    const state = this.getState();
    this.stateChangeHandlers.forEach((handler) => handler(state));
  }

  /**
   * Clean up.
   */
  destroy(): void {
    this.cancel();
    this.stateChangeHandlers.clear();
  }
}
