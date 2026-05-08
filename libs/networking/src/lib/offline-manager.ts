import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

const QUEUE_STORAGE_KEY = '@sally/offline_queue';
const MAX_QUEUE_SIZE = 500;

export interface QueuedAction {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  timestamp: number;
  retries: number;
}

type ConnectivityCallback = (isOnline: boolean) => void;
type SyncHandler = (action: QueuedAction) => Promise<boolean>;

/**
 * Offline-first manager for SallyCards.
 *
 * Queues actions when offline, persists them to AsyncStorage,
 * and syncs them when connectivity is restored.
 */
export class OfflineManager {
  private _isOnline = true;
  private queue: QueuedAction[] = [];
  private connectivityHandlers: Set<ConnectivityCallback> = new Set();
  private syncHandler: SyncHandler | null = null;
  private unsubscribeNetInfo: (() => void) | null = null;
  private isSyncing = false;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    // Load persisted queue
    await this.loadQueue();

    // Monitor connectivity
    this.unsubscribeNetInfo = NetInfo.addEventListener((state: NetInfoState) => {
      const wasOffline = !this._isOnline;
      this._isOnline = state.isConnected ?? false;

      this.connectivityHandlers.forEach((handler) => handler(this._isOnline));

      // Auto-sync when coming back online
      if (wasOffline && this._isOnline && this.queue.length > 0) {
        this.syncPendingActions().catch((err) => {
          console.error('[OfflineManager] Auto-sync failed:', err);
        });
      }
    });

    // Initial connectivity check
    const state = await NetInfo.fetch();
    this._isOnline = state.isConnected ?? false;
  }

  // ── Queue Management ──────────────────────────────────────────────────────

  /**
   * Queue an action for later sync.
   */
  queueAction(action: { type: string; payload: Record<string, unknown>; timestamp?: number }): void {
    if (this.queue.length >= MAX_QUEUE_SIZE) {
      console.warn('[OfflineManager] Queue is full, dropping oldest action');
      this.queue.shift();
    }

    const queuedAction: QueuedAction = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type: action.type,
      payload: action.payload,
      timestamp: action.timestamp ?? Date.now(),
      retries: 0,
    };

    this.queue.push(queuedAction);
    this.persistQueue();
  }

  /**
   * Get the number of pending (unsynced) actions.
   */
  getPendingCount(): number {
    return this.queue.length;
  }

  /**
   * Get all pending actions (read-only).
   */
  getPendingActions(): readonly QueuedAction[] {
    return this.queue;
  }

  /**
   * Clear the queue (e.g. after logout).
   */
  async clearQueue(): Promise<void> {
    this.queue = [];
    await this.persistQueue();
  }

  // ── Sync ──────────────────────────────────────────────────────────────────

  /**
   * Register a handler that processes each queued action during sync.
   * The handler should return true on success, false on failure.
   */
  setSyncHandler(handler: SyncHandler): void {
    this.syncHandler = handler;
  }

  /**
   * Attempt to sync all queued actions.
   * Returns counts of synced and failed actions.
   */
  async syncPendingActions(): Promise<{ synced: number; failed: number }> {
    if (!this._isOnline) {
      return { synced: 0, failed: this.queue.length };
    }

    if (this.isSyncing) {
      return { synced: 0, failed: 0 };
    }

    if (!this.syncHandler) {
      console.warn('[OfflineManager] No sync handler registered');
      return { synced: 0, failed: this.queue.length };
    }

    this.isSyncing = true;
    let synced = 0;
    let failed = 0;
    const failedActions: QueuedAction[] = [];

    // Process queue in order
    for (const action of this.queue) {
      try {
        const success = await this.syncHandler(action);
        if (success) {
          synced++;
        } else {
          action.retries++;
          if (action.retries < 3) {
            failedActions.push(action);
          }
          failed++;
        }
      } catch (error) {
        console.error(`[OfflineManager] Sync failed for action ${action.id}:`, error);
        action.retries++;
        if (action.retries < 3) {
          failedActions.push(action);
        }
        failed++;
      }
    }

    // Replace queue with only failed actions that can be retried
    this.queue = failedActions;
    await this.persistQueue();

    this.isSyncing = false;
    console.log(`[OfflineManager] Sync complete: ${synced} synced, ${failed} failed`);
    return { synced, failed };
  }

  // ── Connectivity ──────────────────────────────────────────────────────────

  get isOnline(): boolean {
    return this._isOnline;
  }

  /**
   * Register a callback for connectivity changes.
   */
  onConnectivityChange(callback: ConnectivityCallback): () => void {
    this.connectivityHandlers.add(callback);
    return () => this.connectivityHandlers.delete(callback);
  }

  // ── Persistence ───────────────────────────────────────────────────────────

  private async loadQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[OfflineManager] Failed to load queue:', error);
      this.queue = [];
    }
  }

  private async persistQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('[OfflineManager] Failed to persist queue:', error);
    }
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────

  destroy(): void {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
      this.unsubscribeNetInfo = null;
    }
    this.connectivityHandlers.clear();
    this.syncHandler = null;
  }
}
