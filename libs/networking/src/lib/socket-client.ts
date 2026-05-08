import { io, Socket } from 'socket.io-client';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from '@sally/types';

type SallySocket = Socket<ServerToClientEvents, ClientToServerEvents>;
type Namespace = '/' | '/game' | '/lobby' | '/chat' | '/presence';

const RECONNECT_BASE_DELAY = 1_000;
const RECONNECT_MAX_DELAY = 30_000;
const RECONNECT_MULTIPLIER = 2;

export class SocketClient {
  private sockets: Map<string, SallySocket> = new Map();

  constructor(
    private baseUrl: string,
    private token: string,
  ) {}

  /**
   * Connect to a namespace with auto-reconnection using exponential backoff.
   */
  connect(namespace: Namespace): SallySocket {
    const existing = this.sockets.get(namespace);
    if (existing?.connected) {
      return existing;
    }

    // Disconnect stale socket if it exists
    if (existing) {
      existing.disconnect();
      this.sockets.delete(namespace);
    }

    const url = namespace === '/' ? this.baseUrl : `${this.baseUrl}${namespace}`;

    const socket: SallySocket = io(url, {
      auth: { token: this.token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: RECONNECT_BASE_DELAY,
      reconnectionDelayMax: RECONNECT_MAX_DELAY,
      randomizationFactor: 0.3,
      timeout: 10_000,
    }) as SallySocket;

    // Exponential backoff via socket.io's built-in reconnection config
    // is already set above. We add logging hooks for observability.
    socket.io.on('reconnect_attempt', (attempt: number) => {
      const delay = Math.min(
        RECONNECT_BASE_DELAY * Math.pow(RECONNECT_MULTIPLIER, attempt - 1),
        RECONNECT_MAX_DELAY,
      );
      console.log(
        `[SocketClient] Reconnection attempt ${attempt} for ${namespace} (delay: ${delay}ms)`,
      );
    });

    socket.io.on('reconnect', (attempt: number) => {
      console.log(
        `[SocketClient] Reconnected to ${namespace} after ${attempt} attempts`,
      );
    });

    socket.io.on('reconnect_failed', () => {
      console.error(`[SocketClient] Reconnection failed for ${namespace}`);
    });

    socket.on('connect', () => {
      console.log(`[SocketClient] Connected to ${namespace}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[SocketClient] Disconnected from ${namespace}: ${reason}`);
    });

    socket.on('connect_error', (error) => {
      console.error(`[SocketClient] Connection error on ${namespace}:`, error.message);
    });

    this.sockets.set(namespace, socket);
    return socket;
  }

  /**
   * Update the auth token for all sockets (e.g. after token refresh).
   */
  updateToken(token: string): void {
    this.token = token;
    this.sockets.forEach((socket) => {
      socket.auth = { token };
    });
  }

  /**
   * Disconnect from a specific namespace.
   */
  disconnect(namespace: string): void {
    const socket = this.sockets.get(namespace);
    if (socket) {
      socket.disconnect();
      this.sockets.delete(namespace);
    }
  }

  /**
   * Disconnect from all namespaces.
   */
  disconnectAll(): void {
    this.sockets.forEach((socket) => {
      socket.disconnect();
    });
    this.sockets.clear();
  }

  /**
   * Get the socket instance for a namespace.
   */
  getSocket(namespace: string): SallySocket | undefined {
    return this.sockets.get(namespace);
  }

  /**
   * Check if a namespace is currently connected.
   */
  isConnected(namespace: string): boolean {
    const socket = this.sockets.get(namespace);
    return socket?.connected ?? false;
  }

  /**
   * Get base URL.
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}
