/**
 * Bluetooth LE service for nearby device discovery and local multiplayer.
 *
 * Uses react-native-ble-plx for BLE operations on React Native.
 * On platforms without BLE support, methods gracefully degrade.
 */

const SALLY_SERVICE_UUID = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E';
const SALLY_TX_CHAR_UUID = '6E400002-B5A3-F393-E0A9-E50E24DCCA9E';
const SALLY_RX_CHAR_UUID = '6E400003-B5A3-F393-E0A9-E50E24DCCA9E';

const DEFAULT_SCAN_TIMEOUT = 10_000;
const MAX_BLE_PACKET_SIZE = 512;

export interface NearbyDevice {
  id: string;
  name: string;
  gameType: string;
  roomCode: string;
  hostName: string;
  availableSlots: number;
  signalStrength: number;
}

export interface GameAdvertisement {
  gameType: string;
  roomCode: string;
  hostName: string;
  availableSlots: number;
}

type DeviceFoundCallback = (device: NearbyDevice) => void;
type DataReceivedCallback = (deviceId: string, data: Uint8Array) => void;
type DisconnectedCallback = (deviceId: string) => void;

/**
 * BLE service for SallyCards nearby play.
 *
 * Handles device scanning, advertising, connecting, and data transfer
 * over Bluetooth Low Energy.
 */
export class BluetoothService {
  private isScanning = false;
  private isAdvertising = false;
  private connectedDevices: Map<string, unknown> = new Map();
  private scanTimeout: ReturnType<typeof setTimeout> | null = null;

  // Event handlers
  private deviceFoundHandlers: Set<DeviceFoundCallback> = new Set();
  private dataReceivedHandlers: Set<DataReceivedCallback> = new Set();
  private disconnectedHandlers: Set<DisconnectedCallback> = new Set();

  // Lazy-loaded BLE manager (react-native-ble-plx)
  private bleManager: unknown = null;

  constructor() {
    this.initBleManager();
  }

  private async initBleManager(): Promise<void> {
    try {
      // Dynamic import to avoid crashes on platforms without BLE
      const { BleManager } = await import('react-native-ble-plx');
      this.bleManager = new BleManager();
    } catch {
      console.warn('[BluetoothService] BLE not available on this platform');
    }
  }

  // ── Scanning ──────────────────────────────────────────────────────────────

  /**
   * Scan for nearby SallyCards devices broadcasting the Sally BLE service.
   */
  async scanForDevices(timeoutMs: number = DEFAULT_SCAN_TIMEOUT): Promise<NearbyDevice[]> {
    if (!this.bleManager) {
      console.warn('[BluetoothService] BLE not available');
      return [];
    }

    const devices: NearbyDevice[] = [];
    this.isScanning = true;

    return new Promise<NearbyDevice[]>((resolve) => {
      const manager = this.bleManager as {
        startDeviceScan: (
          uuids: string[] | null,
          options: unknown,
          callback: (error: unknown, device: unknown) => void,
        ) => void;
        stopDeviceScan: () => void;
      };

      manager.startDeviceScan(
        [SALLY_SERVICE_UUID],
        { allowDuplicates: false },
        (error: unknown, device: unknown) => {
          if (error) {
            console.error('[BluetoothService] Scan error:', error);
            return;
          }

          if (!device) return;

          const d = device as {
            id: string;
            name?: string;
            localName?: string;
            rssi?: number;
            manufacturerData?: string;
          };

          const parsed = this.parseAdvertisementData(d);
          if (parsed) {
            // Avoid duplicates
            if (!devices.find((existing) => existing.id === parsed.id)) {
              devices.push(parsed);
              this.deviceFoundHandlers.forEach((handler) => handler(parsed));
            }
          }
        },
      );

      // Stop scanning after timeout
      this.scanTimeout = setTimeout(() => {
        this.stopScan();
        resolve(devices);
      }, timeoutMs);
    });
  }

  private stopScan(): void {
    if (!this.isScanning) return;

    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }

    try {
      const manager = this.bleManager as { stopDeviceScan: () => void };
      manager.stopDeviceScan();
    } catch {
      // Ignore errors during stop
    }
    this.isScanning = false;
  }

  private parseAdvertisementData(device: {
    id: string;
    name?: string;
    localName?: string;
    rssi?: number;
    manufacturerData?: string;
  }): NearbyDevice | null {
    try {
      const name = device.localName || device.name || 'Unknown';
      if (!name.startsWith('Sally:')) return null;

      // Advertisement name format: "Sally:GameType:RoomCode:HostName:Slots"
      const parts = name.split(':');
      if (parts.length < 5) return null;

      return {
        id: device.id,
        name: parts[3],
        gameType: parts[1],
        roomCode: parts[2],
        hostName: parts[3],
        availableSlots: parseInt(parts[4], 10) || 0,
        signalStrength: device.rssi ?? -100,
      };
    } catch {
      return null;
    }
  }

  // ── Advertising ───────────────────────────────────────────────────────────

  /**
   * Advertise this device as a SallyCards game host.
   */
  async startAdvertising(gameInfo: GameAdvertisement): Promise<void> {
    if (!this.bleManager) {
      console.warn('[BluetoothService] BLE not available');
      return;
    }

    // BLE advertising uses local name to broadcast game info
    // Format: "Sally:GameType:RoomCode:HostName:Slots"
    const advertiseName = `Sally:${gameInfo.gameType}:${gameInfo.roomCode}:${gameInfo.hostName}:${gameInfo.availableSlots}`;

    try {
      // react-native-ble-plx doesn't support peripheral mode directly.
      // On React Native, use react-native-ble-advertiser or expo-ble-peripheral.
      const { default: BleAdvertiser } = await import('react-native-ble-advertiser' as string);
      await BleAdvertiser.setAdapterName(advertiseName);
      await BleAdvertiser.broadcast(SALLY_SERVICE_UUID, [], {});
      this.isAdvertising = true;
      console.log('[BluetoothService] Started advertising:', advertiseName);
    } catch (error) {
      console.error('[BluetoothService] Failed to start advertising:', error);
      throw new Error('BLE advertising not supported on this device');
    }
  }

  /**
   * Stop advertising.
   */
  async stopAdvertising(): Promise<void> {
    if (!this.isAdvertising) return;

    try {
      const { default: BleAdvertiser } = await import('react-native-ble-advertiser' as string);
      await BleAdvertiser.stopBroadcast();
      this.isAdvertising = false;
      console.log('[BluetoothService] Stopped advertising');
    } catch {
      // Ignore
    }
  }

  // ── Connection ────────────────────────────────────────────────────────────

  /**
   * Connect to a nearby SallyCards device.
   */
  async connectToDevice(deviceId: string): Promise<void> {
    if (!this.bleManager) {
      throw new Error('BLE not available');
    }

    const manager = this.bleManager as {
      connectToDevice: (id: string) => Promise<unknown>;
      discoverAllServicesAndCharacteristicsForDevice: (id: string) => Promise<unknown>;
      monitorCharacteristicForDevice: (
        deviceId: string,
        serviceUUID: string,
        charUUID: string,
        callback: (error: unknown, char: unknown) => void,
      ) => { remove: () => void };
      onDeviceDisconnected: (
        deviceId: string,
        callback: (error: unknown, device: unknown) => void,
      ) => { remove: () => void };
    };

    try {
      const device = await manager.connectToDevice(deviceId);
      await manager.discoverAllServicesAndCharacteristicsForDevice(deviceId);
      this.connectedDevices.set(deviceId, device);

      // Monitor for incoming data on RX characteristic
      manager.monitorCharacteristicForDevice(
        deviceId,
        SALLY_SERVICE_UUID,
        SALLY_RX_CHAR_UUID,
        (error: unknown, characteristic: unknown) => {
          if (error) {
            console.error('[BluetoothService] Monitor error:', error);
            return;
          }
          const char = characteristic as { value?: string };
          if (char?.value) {
            const data = this.base64ToUint8Array(char.value);
            this.dataReceivedHandlers.forEach((handler) => handler(deviceId, data));
          }
        },
      );

      // Listen for disconnection
      manager.onDeviceDisconnected(deviceId, () => {
        this.connectedDevices.delete(deviceId);
        this.disconnectedHandlers.forEach((handler) => handler(deviceId));
      });

      console.log(`[BluetoothService] Connected to ${deviceId}`);
    } catch (error) {
      console.error(`[BluetoothService] Failed to connect to ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Send data to a connected device via BLE characteristic write.
   */
  async sendData(deviceId: string, data: Uint8Array): Promise<void> {
    if (!this.bleManager) {
      throw new Error('BLE not available');
    }

    if (!this.connectedDevices.has(deviceId)) {
      throw new Error(`Not connected to device ${deviceId}`);
    }

    const manager = this.bleManager as {
      writeCharacteristicWithResponseForDevice: (
        deviceId: string,
        serviceUUID: string,
        charUUID: string,
        value: string,
      ) => Promise<unknown>;
    };

    // Split into BLE-sized packets if needed
    const packets = this.splitIntoPackets(data, MAX_BLE_PACKET_SIZE);

    for (const packet of packets) {
      const base64 = this.uint8ArrayToBase64(packet);
      await manager.writeCharacteristicWithResponseForDevice(
        deviceId,
        SALLY_SERVICE_UUID,
        SALLY_TX_CHAR_UUID,
        base64,
      );
    }
  }

  /**
   * Disconnect from a device.
   */
  async disconnect(deviceId: string): Promise<void> {
    if (!this.bleManager) return;

    const manager = this.bleManager as {
      cancelDeviceConnection: (id: string) => Promise<unknown>;
    };

    try {
      await manager.cancelDeviceConnection(deviceId);
    } catch {
      // Ignore - device may already be disconnected
    }

    this.connectedDevices.delete(deviceId);
    console.log(`[BluetoothService] Disconnected from ${deviceId}`);
  }

  /**
   * Disconnect from all devices and stop scanning/advertising.
   */
  async destroy(): Promise<void> {
    this.stopScan();
    await this.stopAdvertising();

    const deviceIds = Array.from(this.connectedDevices.keys());
    for (const id of deviceIds) {
      await this.disconnect(id);
    }

    if (this.bleManager) {
      try {
        const manager = this.bleManager as { destroy: () => void };
        manager.destroy();
      } catch {
        // Ignore
      }
    }

    this.deviceFoundHandlers.clear();
    this.dataReceivedHandlers.clear();
    this.disconnectedHandlers.clear();
  }

  // ── Event Handlers ────────────────────────────────────────────────────────

  onDeviceFound(callback: DeviceFoundCallback): () => void {
    this.deviceFoundHandlers.add(callback);
    return () => this.deviceFoundHandlers.delete(callback);
  }

  onDataReceived(callback: DataReceivedCallback): () => void {
    this.dataReceivedHandlers.add(callback);
    return () => this.dataReceivedHandlers.delete(callback);
  }

  onDisconnected(callback: DisconnectedCallback): () => void {
    this.disconnectedHandlers.add(callback);
    return () => this.disconnectedHandlers.delete(callback);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getIsScanning(): boolean {
    return this.isScanning;
  }

  getIsAdvertising(): boolean {
    return this.isAdvertising;
  }

  getConnectedDeviceIds(): string[] {
    return Array.from(this.connectedDevices.keys());
  }

  private splitIntoPackets(data: Uint8Array, maxSize: number): Uint8Array[] {
    const packets: Uint8Array[] = [];
    for (let offset = 0; offset < data.length; offset += maxSize) {
      packets.push(data.slice(offset, offset + maxSize));
    }
    return packets;
  }

  private uint8ArrayToBase64(data: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < data.length; i++) {
      binary += String.fromCharCode(data[i]);
    }
    return btoa(binary);
  }

  private base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}

export { SALLY_SERVICE_UUID, SALLY_TX_CHAR_UUID, SALLY_RX_CHAR_UUID };
