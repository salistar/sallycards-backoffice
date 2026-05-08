/**
 * QR code data utilities for SallyCards room sharing.
 *
 * Encodes/decodes room information as JSON for use with QR code
 * generators and scanners.
 */

export interface RoomQRData {
  roomCode: string;
  gameType: string;
  hostName: string;
  /** App version that generated the QR (for compatibility checks) */
  version?: string;
  /** Timestamp when the QR was generated */
  createdAt?: string;
}

const QR_DATA_VERSION = '1';

/**
 * Generate QR data string for a game room.
 *
 * The data is JSON-encoded and includes a version field for future
 * compatibility. QR code generation itself is handled by the UI layer
 * (e.g., react-native-qrcode-svg).
 */
export function generateRoomQRData(
  roomCode: string,
  gameType: string,
  hostName: string,
): string {
  const data: RoomQRData & { v: string } = {
    v: QR_DATA_VERSION,
    roomCode,
    gameType,
    hostName,
    createdAt: new Date().toISOString(),
  };

  return JSON.stringify(data);
}

/**
 * Parse QR data string back into room information.
 *
 * Returns null if the data is not valid SallyCards QR data.
 * Handles both versioned (v1+) and legacy unversioned formats.
 */
export function parseRoomQRData(data: string): RoomQRData | null {
  if (!data || typeof data !== 'string') return null;

  try {
    const parsed = JSON.parse(data);

    // Must have required fields
    if (
      typeof parsed.roomCode !== 'string' ||
      typeof parsed.gameType !== 'string' ||
      typeof parsed.hostName !== 'string'
    ) {
      return null;
    }

    // Validate room code format (alphanumeric, 4-8 chars)
    if (!/^[A-Za-z0-9]{4,8}$/.test(parsed.roomCode)) {
      return null;
    }

    return {
      roomCode: parsed.roomCode,
      gameType: parsed.gameType,
      hostName: parsed.hostName,
      version: parsed.v ?? undefined,
      createdAt: parsed.createdAt ?? undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Validate that QR data is not expired (older than 24 hours).
 */
export function isQRDataExpired(data: RoomQRData, maxAgeMs: number = 24 * 60 * 60 * 1000): boolean {
  if (!data.createdAt) return false; // No timestamp = not expired (legacy)

  const created = new Date(data.createdAt).getTime();
  if (isNaN(created)) return false;

  return Date.now() - created > maxAgeMs;
}
