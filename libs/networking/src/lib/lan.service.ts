/**
 * LAN discovery service for local WiFi multiplayer.
 *
 * Uses Zeroconf/mDNS (via react-native-zeroconf) for service discovery
 * and a direct TCP/WebSocket connection for game data.
 */

const SALLY_SERVICE_TYPE = '_sallycards._tcp.';
const SALLY_DOMAIN = 'local.';

export interface LANGame {
  id: string;
  host: string;
  port: number;
  name: string;
  gameType: string;
  roomCode: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
}

type GameFoundCallback = (game: LANGame) => void;
type GameLostCallback = (gameId: string) => void;

/**
 * LAN service for discovering and connecting to local games over WiFi.
 */
export class LANService {
  private zeroconf: unknown = null;
  private isDiscovering = false;
  private isPublished = false;
  private discoveredGames: Map<string, LANGame> = new Map();
  private socket: WebSocket | null = null;

  // Event handlers
  private gameFoundHandlers: Set<GameFoundCallback> = new Set();
  private gameLostHandlers: Set<GameLostCallback> = new Set();

  constructor() {
    this.initZeroconf();
  }

  private async initZeroconf(): Promise<void> {
    try {
      const { default: Zeroconf } = await import('react-native-zeroconf' as string);
      this.zeroconf = new Zeroconf();
      this.setupZeroconfListeners();
    } catch {
      console.warn('[LANService] Zeroconf not available on this platform');
    }
  }

  private setupZeroconfListeners(): void {
    if (!this.zeroconf) return;

    const zc = this.zeroconf as {
      on: (event: string, callback: (...args: unknown[]) => void) => void;
    };

    zc.on('resolved', (service: unknown) => {
      const svc = service as {
        name: string;
        host: string;
        port: number;
        txt?: Record<string, string>;
      };

      // Parse TXT records for game info
      const txt = svc.txt ?? {};
      const game: LANGame = {
        id: svc.name,
        host: svc.host,
        port: svc.port,
        name: txt.name ?? svc.name,
        gameType: txt.gameType ?? 'unknown',
        roomCode: txt.roomCode ?? '',
        hostName: txt.hostName ?? '',
        playerCount: parseInt(txt.playerCount ?? '0', 10),
        maxPlayers: parseInt(txt.maxPlayers ?? '4', 10),
      };

      this.discoveredGames.set(game.id, game);
      this.gameFoundHandlers.forEach((handler) => handler(game));
    });

    zc.on('removed', (name: string) => {
      this.discoveredGames.delete(name);
      this.gameLostHandlers.forEach((handler) => handler(name));
    });

    zc.on('error', (error: unknown) => {
      console.error('[LANService] Zeroconf error:', error);
    });
  }

  // ── Publishing ────────────────────────────────────────────────────────────

  /**
   * Publish a game on the local network via mDNS/Zeroconf.
   */
  async publishGame(
    port: number,
    gameInfo: {
      name: string;
      gameType: string;
      roomCode: string;
      hostName: string;
      playerCount: number;
      maxPlayers: number;
    },
  ): Promise<void> {
    if (!this.zeroconf) {
      throw new Error('Zeroconf not available');
    }

    const zc = this.zeroconf as {
      publishService: (
        type: string,
        protocol: string,
        domain: string,
        name: string,
        port: number,
        txt: Record<string, string>,
      ) => void;
    };

    try {
      zc.publishService(
        SALLY_SERVICE_TYPE,
        'tcp',
        SALLY_DOMAIN,
        gameInfo.name,
        port,
        {
          gameType: gameInfo.gameType,
          roomCode: gameInfo.roomCode,
          hostName: gameInfo.hostName,
          playerCount: String(gameInfo.playerCount),
          maxPlayers: String(gameInfo.maxPlayers),
        },
      );
      this.isPublished = true;
      console.log(`[LANService] Published game on port ${port}`);
    } catch (error) {
      console.error('[LANService] Failed to publish:', error);
      throw error;
    }
  }

  /**
   * Stop publishing the game.
   */
  async unpublishGame(): Promise<void> {
    if (!this.zeroconf || !this.isPublished) return;

    const zc = this.zeroconf as { unpublishService: (name: string) => void };
    try {
      zc.unpublishService(SALLY_SERVICE_TYPE);
      this.isPublished = false;
      console.log('[LANService] Unpublished game');
    } catch {
      // Ignore
    }
  }

  // ── Discovery ─────────────────────────────────────────────────────────────

  /**
   * Start discovering games on the local network.
   */
  async discoverGames(): Promise<LANGame[]> {
    if (!this.zeroconf) {
      console.warn('[LANService] Zeroconf not available');
      return [];
    }

    if (this.isDiscovering) {
      return Array.from(this.discoveredGames.values());
    }

    const zc = this.zeroconf as {
      scan: (type: string, protocol: string, domain: string) => void;
    };

    this.discoveredGames.clear();
    this.isDiscovering = true;

    zc.scan(SALLY_SERVICE_TYPE, 'tcp', SALLY_DOMAIN);

    // Return currently known games (more will arrive via callbacks)
    return Array.from(this.discoveredGames.values());
  }

  /**
   * Stop discovering games.
   */
  async stopDiscovery(): Promise<void> {
    if (!this.zeroconf || !this.isDiscovering) return;

    const zc = this.zeroconf as { stop: () => void };
    try {
      zc.stop();
    } catch {
      // Ignore
    }
    this.isDiscovering = false;
  }

  // ── Connection ────────────────────────────────────────────────────────────

  /**
   * Connect to a LAN game via WebSocket.
   */
  async connectToGame(host: string, port: number): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`ws://${host}:${port}`);

      ws.onopen = () => {
        this.socket = ws;
        console.log(`[LANService] Connected to ${host}:${port}`);
        resolve(ws);
      };

      ws.onerror = (error) => {
        console.error(`[LANService] Connection failed to ${host}:${port}:`, error);
        reject(new Error(`Failed to connect to ${host}:${port}`));
      };

      ws.onclose = () => {
        if (this.socket === ws) {
          this.socket = null;
        }
      };
    });
  }

  /**
   * Disconnect from the current LAN game.
   */
  disconnectFromGame(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────

  /**
   * Clean up all resources.
   */
  async destroy(): Promise<void> {
    await this.stopDiscovery();
    await this.unpublishGame();
    this.disconnectFromGame();
    this.discoveredGames.clear();
    this.gameFoundHandlers.clear();
    this.gameLostHandlers.clear();
  }

  // ── Event Registration ────────────────────────────────────────────────────

  onGameFound(callback: GameFoundCallback): () => void {
    this.gameFoundHandlers.add(callback);
    return () => this.gameFoundHandlers.delete(callback);
  }

  onGameLost(callback: GameLostCallback): () => void {
    this.gameLostHandlers.add(callback);
    return () => this.gameLostHandlers.delete(callback);
  }

  // ── Getters ───────────────────────────────────────────────────────────────

  getDiscoveredGames(): LANGame[] {
    return Array.from(this.discoveredGames.values());
  }

  getIsDiscovering(): boolean {
    return this.isDiscovering;
  }

  getIsPublished(): boolean {
    return this.isPublished;
  }
}
