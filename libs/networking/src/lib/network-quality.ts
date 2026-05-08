import type { Socket } from 'socket.io-client';
import NetInfo from '@react-native-community/netinfo';

export type NetworkQuality = 'good' | 'fair' | 'poor';
export type ConnectionType = 'wifi' | '4g' | '3g' | 'bluetooth' | 'lan' | 'unknown';

const GOOD_THRESHOLD = 100;
const FAIR_THRESHOLD = 300;
const MONITORING_INTERVAL = 5_000;
const LATENCY_HISTORY_SIZE = 10;

type QualityChangeHandler = (quality: NetworkQuality, latency: number) => void;

/**
 * Network quality monitor for SallyCards.
 *
 * Continuously measures latency via socket ping/pong and
 * reports connection quality levels.
 */
export class NetworkQualityMonitor {
  private latencyHistory: number[] = [];
  private currentLatency = 0;
  private currentQuality: NetworkQuality = 'good';
  private monitoringInterval: ReturnType<typeof setInterval> | null = null;
  private qualityChangeHandlers: Set<QualityChangeHandler> = new Set();
  private isMonitoring = false;

  // ── Latency Measurement ───────────────────────────────────────────────────

  /**
   * Measure round-trip latency via socket volatile emit with acknowledgement.
   */
  async measureLatency(socket: Socket): Promise<number> {
    return new Promise<number>((resolve) => {
      if (!socket.connected) {
        resolve(-1);
        return;
      }

      const start = Date.now();
      const timeout = setTimeout(() => {
        resolve(-1); // Timed out
      }, 5_000);

      socket.volatile.emit('ping', () => {
        clearTimeout(timeout);
        const latency = Date.now() - start;
        this.recordLatency(latency);
        resolve(latency);
      });
    });
  }

  private recordLatency(latency: number): void {
    this.latencyHistory.push(latency);
    if (this.latencyHistory.length > LATENCY_HISTORY_SIZE) {
      this.latencyHistory.shift();
    }

    // Use weighted average (recent measurements matter more)
    this.currentLatency = this.getWeightedAverage();

    const previousQuality = this.currentQuality;
    this.currentQuality = this.calculateQuality(this.currentLatency);

    if (this.currentQuality !== previousQuality) {
      this.qualityChangeHandlers.forEach((handler) =>
        handler(this.currentQuality, this.currentLatency),
      );
    }
  }

  private getWeightedAverage(): number {
    if (this.latencyHistory.length === 0) return 0;

    let totalWeight = 0;
    let weightedSum = 0;

    this.latencyHistory.forEach((latency, index) => {
      const weight = index + 1; // More recent = higher weight
      weightedSum += latency * weight;
      totalWeight += weight;
    });

    return Math.round(weightedSum / totalWeight);
  }

  private calculateQuality(latency: number): NetworkQuality {
    if (latency < 0) return 'poor';
    if (latency <= GOOD_THRESHOLD) return 'good';
    if (latency <= FAIR_THRESHOLD) return 'fair';
    return 'poor';
  }

  // ── Quality ───────────────────────────────────────────────────────────────

  /**
   * Get the current quality level based on recent latency measurements.
   */
  getQuality(): NetworkQuality {
    return this.currentQuality;
  }

  /**
   * Get the current average latency in milliseconds.
   */
  getLatency(): number {
    return this.currentLatency;
  }

  /**
   * Get the connection type from the device's network info.
   */
  async getConnectionType(): Promise<ConnectionType> {
    try {
      const state = await NetInfo.fetch();

      switch (state.type) {
        case 'wifi':
          return 'wifi';
        case 'cellular': {
          const gen = (state.details as { cellularGeneration?: string })?.cellularGeneration;
          if (gen === '4g' || gen === '5g') return '4g';
          if (gen === '3g') return '3g';
          return '4g'; // Default cellular to 4g
        }
        case 'bluetooth':
          return 'bluetooth';
        case 'ethernet':
          return 'lan';
        default:
          return 'unknown';
      }
    } catch {
      return 'unknown';
    }
  }

  // ── Continuous Monitoring ─────────────────────────────────────────────────

  /**
   * Start monitoring latency at regular intervals (every 5 seconds).
   */
  startMonitoring(socket: Socket): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;

    // Initial measurement
    this.measureLatency(socket);

    this.monitoringInterval = setInterval(() => {
      this.measureLatency(socket);
    }, MONITORING_INTERVAL);
  }

  /**
   * Stop monitoring.
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
  }

  // ── Events ────────────────────────────────────────────────────────────────

  /**
   * Listen for quality level changes.
   */
  onQualityChange(callback: QualityChangeHandler): () => void {
    this.qualityChangeHandlers.add(callback);
    return () => this.qualityChangeHandlers.delete(callback);
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────

  destroy(): void {
    this.stopMonitoring();
    this.qualityChangeHandlers.clear();
    this.latencyHistory = [];
  }
}
