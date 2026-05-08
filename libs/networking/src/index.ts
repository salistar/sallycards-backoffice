// @sally/networking
// Real-time networking layer for SallyCards multiplayer.

// ── Socket.IO Client ────────────────────────────────────────────────────────
export { SocketClient } from './lib/socket-client';
export { SocketProvider, useSocketClient } from './lib/SocketProvider';
export { useSocket } from './lib/useSocket';
export type { UseSocketReturn } from './lib/useSocket';

// ── Multiplayer Game ────────────────────────────────────────────────────────
export { useMultiplayerGame } from './lib/useMultiplayerGame';
export type {
  UseMultiplayerGameOptions,
  UseMultiplayerGameReturn,
} from './lib/useMultiplayerGame';

// ── WebRTC ──────────────────────────────────────────────────────────────────
export { WebRTCService } from './lib/webrtc.service';
export type { WebRTCConfig } from './lib/webrtc.service';
export { useWebRTC } from './lib/useWebRTC';
export type { PeerInfo, UseWebRTCReturn } from './lib/useWebRTC';

// ── Bluetooth LE ────────────────────────────────────────────────────────────
export {
  BluetoothService,
  SALLY_SERVICE_UUID,
  SALLY_TX_CHAR_UUID,
  SALLY_RX_CHAR_UUID,
} from './lib/bluetooth.service';
export type {
  NearbyDevice,
  GameAdvertisement,
} from './lib/bluetooth.service';
export { useBluetooth } from './lib/useBluetooth';
export type { UseBluetoothReturn } from './lib/useBluetooth';

// ── LAN Discovery ───────────────────────────────────────────────────────────
export { LANService } from './lib/lan.service';
export type { LANGame } from './lib/lan.service';

// ── Offline Manager ─────────────────────────────────────────────────────────
export { OfflineManager } from './lib/offline-manager';
export type { QueuedAction } from './lib/offline-manager';

// ── Reconnection ────────────────────────────────────────────────────────────
export { ReconnectionService } from './lib/reconnection.service';
export type {
  ReconnectionConfig,
  ReconnectionState,
} from './lib/reconnection.service';

// ── Network Quality ─────────────────────────────────────────────────────────
export { NetworkQualityMonitor } from './lib/network-quality';
export type { NetworkQuality, ConnectionType } from './lib/network-quality';
export { NetworkIndicator } from './lib/NetworkIndicator';

// ── Deep Linking ────────────────────────────────────────────────────────────
export {
  LINK_PREFIX,
  WEB_PREFIX,
  createGameLink,
  createChallengeLink,
  createProfileLink,
  createInviteLink,
  parseDeepLink,
} from './lib/deep-linking';
export type { DeepLinkType, ParsedDeepLink } from './lib/deep-linking';

// ── QR Code ─────────────────────────────────────────────────────────────────
export {
  generateRoomQRData,
  parseRoomQRData,
  isQRDataExpired,
} from './lib/qr-code';
export type { RoomQRData } from './lib/qr-code';
