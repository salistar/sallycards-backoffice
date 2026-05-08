import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BluetoothService,
  NearbyDevice,
  GameAdvertisement,
} from './bluetooth.service';

export interface UseBluetoothReturn {
  /** Discovered nearby devices */
  devices: NearbyDevice[];
  /** Whether we are currently scanning */
  isScanning: boolean;
  /** Whether we are currently advertising */
  isAdvertising: boolean;
  /** Connected device IDs */
  connectedDevices: string[];
  /** Start scanning for nearby SallyCards games */
  startScan: (timeoutMs?: number) => Promise<void>;
  /** Stop scanning */
  stopScan: () => void;
  /** Advertise as a game host */
  startAdvertising: (gameInfo: GameAdvertisement) => Promise<void>;
  /** Stop advertising */
  stopAdvertising: () => Promise<void>;
  /** Connect to a discovered device */
  connectToDevice: (deviceId: string) => Promise<void>;
  /** Send data to a connected device */
  sendData: (deviceId: string, data: Uint8Array) => Promise<void>;
  /** Disconnect from a device */
  disconnect: (deviceId: string) => Promise<void>;
  /** Register callback for incoming data */
  onDataReceived: (callback: (deviceId: string, data: Uint8Array) => void) => () => void;
}

/**
 * React hook wrapping BluetoothService for BLE nearby play.
 *
 * Manages the BLE service lifecycle, tracks discovered devices,
 * and handles cleanup on unmount.
 */
export function useBluetooth(): UseBluetoothReturn {
  const serviceRef = useRef<BluetoothService | null>(null);
  const [devices, setDevices] = useState<NearbyDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isAdvertising, setIsAdvertising] = useState(false);
  const [connectedDevices, setConnectedDevices] = useState<string[]>([]);

  // Initialize service
  useEffect(() => {
    const service = new BluetoothService();
    serviceRef.current = service;

    // Listen for new devices
    const unsubFound = service.onDeviceFound((device) => {
      setDevices((prev) => {
        if (prev.find((d) => d.id === device.id)) return prev;
        return [...prev, device];
      });
    });

    // Listen for disconnections
    const unsubDisconnected = service.onDisconnected((deviceId) => {
      setConnectedDevices((prev) => prev.filter((id) => id !== deviceId));
    });

    return () => {
      unsubFound();
      unsubDisconnected();
      service.destroy();
      serviceRef.current = null;
    };
  }, []);

  const startScan = useCallback(async (timeoutMs?: number) => {
    if (!serviceRef.current) return;
    setIsScanning(true);
    setDevices([]);
    try {
      await serviceRef.current.scanForDevices(timeoutMs);
    } finally {
      setIsScanning(false);
    }
  }, []);

  const stopScan = useCallback(() => {
    // Scanning auto-stops after timeout, but we update UI state
    setIsScanning(false);
  }, []);

  const startAdvertising = useCallback(async (gameInfo: GameAdvertisement) => {
    if (!serviceRef.current) return;
    await serviceRef.current.startAdvertising(gameInfo);
    setIsAdvertising(true);
  }, []);

  const stopAdvertising = useCallback(async () => {
    if (!serviceRef.current) return;
    await serviceRef.current.stopAdvertising();
    setIsAdvertising(false);
  }, []);

  const connectToDevice = useCallback(async (deviceId: string) => {
    if (!serviceRef.current) return;
    await serviceRef.current.connectToDevice(deviceId);
    setConnectedDevices((prev) => [...prev, deviceId]);
  }, []);

  const sendData = useCallback(async (deviceId: string, data: Uint8Array) => {
    if (!serviceRef.current) throw new Error('Bluetooth not initialized');
    await serviceRef.current.sendData(deviceId, data);
  }, []);

  const disconnect = useCallback(async (deviceId: string) => {
    if (!serviceRef.current) return;
    await serviceRef.current.disconnect(deviceId);
    setConnectedDevices((prev) => prev.filter((id) => id !== deviceId));
  }, []);

  const onDataReceived = useCallback(
    (callback: (deviceId: string, data: Uint8Array) => void): (() => void) => {
      if (!serviceRef.current) return () => {};
      return serviceRef.current.onDataReceived(callback);
    },
    [],
  );

  return {
    devices,
    isScanning,
    isAdvertising,
    connectedDevices,
    startScan,
    stopScan,
    startAdvertising,
    stopAdvertising,
    connectToDevice,
    sendData,
    disconnect,
    onDataReceived,
  };
}
