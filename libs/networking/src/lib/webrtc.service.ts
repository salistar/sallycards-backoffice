import type { Socket } from 'socket.io-client';

export interface WebRTCConfig {
  iceServers?: RTCIceServer[];
  dataChannelLabel?: string;
}

type DataHandler = (peerId: string, data: unknown) => void;
type PeerStateHandler = (peerId: string, state: RTCPeerConnectionState) => void;
type StreamHandler = (peerId: string, stream: MediaStream) => void;

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

/**
 * WebRTC service for P2P connections.
 *
 * Uses the signaling socket (Socket.IO) for offer/answer/ICE exchange,
 * then establishes direct peer-to-peer data channels and optional media streams.
 */
export class WebRTCService {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private localStream: MediaStream | null = null;
  private iceServers: RTCIceServer[];
  private dataChannelLabel: string;

  // Event handlers
  private onDataHandlers: Set<DataHandler> = new Set();
  private onPeerStateHandlers: Set<PeerStateHandler> = new Set();
  private onStreamHandlers: Set<StreamHandler> = new Set();

  constructor(
    private signalingSocket: Socket,
    config?: WebRTCConfig,
  ) {
    this.iceServers = config?.iceServers ?? DEFAULT_ICE_SERVERS;
    this.dataChannelLabel = config?.dataChannelLabel ?? 'sally-data';

    this.setupSignaling();
  }

  // ── Signaling Setup ───────────────────────────────────────────────────────

  private setupSignaling(): void {
    this.signalingSocket.on('webrtc:offer', (payload: { peerId: string; offer: RTCSessionDescriptionInit }) => {
      this.handleOffer(payload.peerId, payload.offer);
    });

    this.signalingSocket.on('webrtc:answer', (payload: { peerId: string; answer: RTCSessionDescriptionInit }) => {
      this.handleAnswer(payload.peerId, payload.answer);
    });

    this.signalingSocket.on('webrtc:ice-candidate', (payload: { peerId: string; candidate: RTCIceCandidateInit }) => {
      this.handleIceCandidate(payload.peerId, payload.candidate);
    });
  }

  // ── Peer Connection Management ────────────────────────────────────────────

  private createPeerConnection(peerId: string): RTCPeerConnection {
    const existingPc = this.peerConnections.get(peerId);
    if (existingPc) {
      existingPc.close();
    }

    const pc = new RTCPeerConnection({ iceServers: this.iceServers });

    // ICE candidate exchange
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.signalingSocket.emit('webrtc:ice-candidate', {
          peerId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // Connection state tracking
    pc.onconnectionstatechange = () => {
      this.onPeerStateHandlers.forEach((handler) => handler(peerId, pc.connectionState));

      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.cleanupPeer(peerId);
      }
    };

    // Incoming data channels
    pc.ondatachannel = (event) => {
      this.setupDataChannel(peerId, event.channel);
    };

    // Incoming remote streams
    pc.ontrack = (event) => {
      if (event.streams[0]) {
        this.onStreamHandlers.forEach((handler) => handler(peerId, event.streams[0]));
      }
    };

    // Add local stream tracks if available
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    this.peerConnections.set(peerId, pc);
    return pc;
  }

  private setupDataChannel(peerId: string, channel: RTCDataChannel): void {
    channel.onopen = () => {
      console.log(`[WebRTC] Data channel open with ${peerId}`);
    };

    channel.onclose = () => {
      console.log(`[WebRTC] Data channel closed with ${peerId}`);
      this.dataChannels.delete(peerId);
    };

    channel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.onDataHandlers.forEach((handler) => handler(peerId, data));
      } catch {
        this.onDataHandlers.forEach((handler) => handler(peerId, event.data));
      }
    };

    this.dataChannels.set(peerId, channel);
  }

  private cleanupPeer(peerId: string): void {
    this.dataChannels.get(peerId)?.close();
    this.dataChannels.delete(peerId);
    this.peerConnections.get(peerId)?.close();
    this.peerConnections.delete(peerId);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Create an offer and send it to a peer via signaling.
   */
  async createOffer(peerId: string): Promise<void> {
    const pc = this.createPeerConnection(peerId);

    // Create data channel (initiator side)
    const channel = pc.createDataChannel(this.dataChannelLabel, {
      ordered: true,
    });
    this.setupDataChannel(peerId, channel);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    this.signalingSocket.emit('webrtc:offer', {
      peerId,
      offer: pc.localDescription!.toJSON(),
    });
  }

  /**
   * Handle an incoming offer from a peer.
   */
  async handleOffer(peerId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    const pc = this.createPeerConnection(peerId);

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    this.signalingSocket.emit('webrtc:answer', {
      peerId,
      answer: pc.localDescription!.toJSON(),
    });
  }

  /**
   * Handle an answer from a peer.
   */
  async handleAnswer(peerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const pc = this.peerConnections.get(peerId);
    if (!pc) {
      console.warn(`[WebRTC] No peer connection for ${peerId} on answer`);
      return;
    }
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  /**
   * Handle an ICE candidate from a peer.
   */
  async handleIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const pc = this.peerConnections.get(peerId);
    if (!pc) {
      console.warn(`[WebRTC] No peer connection for ${peerId} on ICE candidate`);
      return;
    }
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  }

  /**
   * Send data to a specific peer via data channel.
   */
  sendData(peerId: string, data: unknown): void {
    const channel = this.dataChannels.get(peerId);
    if (!channel || channel.readyState !== 'open') {
      console.warn(`[WebRTC] Data channel not open for ${peerId}`);
      return;
    }
    channel.send(JSON.stringify(data));
  }

  /**
   * Broadcast data to all connected peers.
   */
  broadcastData(data: unknown): void {
    const serialized = JSON.stringify(data);
    this.dataChannels.forEach((channel, peerId) => {
      if (channel.readyState === 'open') {
        channel.send(serialized);
      } else {
        console.warn(`[WebRTC] Skipping broadcast to ${peerId} - channel not open`);
      }
    });
  }

  /**
   * Get local audio/video stream.
   */
  async getLocalStream(audio: boolean, video: boolean): Promise<MediaStream> {
    if (this.localStream) {
      return this.localStream;
    }

    // React Native uses a polyfill for mediaDevices
    const stream = await (navigator.mediaDevices?.getUserMedia?.({
      audio,
      video,
    }) ?? Promise.reject(new Error('getUserMedia not available')));

    this.localStream = stream;

    // Add tracks to all existing peer connections
    this.peerConnections.forEach((pc) => {
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    });

    return stream;
  }

  /**
   * Stop the local media stream.
   */
  stopLocalStream(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
  }

  /**
   * Check if a peer has an open data channel.
   */
  isPeerConnected(peerId: string): boolean {
    const channel = this.dataChannels.get(peerId);
    return channel?.readyState === 'open';
  }

  /**
   * Get all connected peer IDs.
   */
  getConnectedPeers(): string[] {
    const peers: string[] = [];
    this.dataChannels.forEach((channel, peerId) => {
      if (channel.readyState === 'open') {
        peers.push(peerId);
      }
    });
    return peers;
  }

  /**
   * Close a specific peer connection.
   */
  closePeer(peerId: string): void {
    this.cleanupPeer(peerId);
  }

  /**
   * Close all peer connections and clean up.
   */
  closeAll(): void {
    this.peerConnections.forEach((_, peerId) => {
      this.cleanupPeer(peerId);
    });
    this.stopLocalStream();
    this.onDataHandlers.clear();
    this.onPeerStateHandlers.clear();
    this.onStreamHandlers.clear();
  }

  // ── Event Registration ────────────────────────────────────────────────────

  onData(handler: DataHandler): () => void {
    this.onDataHandlers.add(handler);
    return () => this.onDataHandlers.delete(handler);
  }

  onPeerStateChange(handler: PeerStateHandler): () => void {
    this.onPeerStateHandlers.add(handler);
    return () => this.onPeerStateHandlers.delete(handler);
  }

  onRemoteStream(handler: StreamHandler): () => void {
    this.onStreamHandlers.add(handler);
    return () => this.onStreamHandlers.delete(handler);
  }
}
