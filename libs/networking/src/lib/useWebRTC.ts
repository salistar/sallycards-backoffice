import { useCallback, useEffect, useRef, useState } from 'react';
import { useSocket } from './useSocket';
import { WebRTCService } from './webrtc.service';

export interface PeerInfo {
  connected: boolean;
  stream?: MediaStream;
}

export interface UseWebRTCReturn {
  peers: Map<string, PeerInfo>;
  sendData: (peerId: string, data: unknown) => void;
  broadcastData: (data: unknown) => void;
  localStream: MediaStream | null;
  startAudio: () => Promise<void>;
  stopAudio: () => void;
  isMuted: boolean;
  toggleMute: () => void;
}

/**
 * React hook for WebRTC peer-to-peer connections.
 *
 * Manages peer connections, data channels, and audio streams
 * using the /game namespace socket for signaling.
 */
export function useWebRTC(roomId: string): UseWebRTCReturn {
  const { socket } = useSocket('/game');
  const [peers, setPeers] = useState<Map<string, PeerInfo>>(new Map());
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const serviceRef = useRef<WebRTCService | null>(null);

  // Initialize WebRTC service when socket is available
  useEffect(() => {
    if (!socket) return;

    const service = new WebRTCService(socket);
    serviceRef.current = service;

    // Listen for peer state changes
    const unsubState = service.onPeerStateChange((peerId, state) => {
      setPeers((prev) => {
        const next = new Map(prev);
        const existing = next.get(peerId);
        if (state === 'connected') {
          next.set(peerId, { connected: true, stream: existing?.stream });
        } else if (state === 'failed' || state === 'closed' || state === 'disconnected') {
          next.delete(peerId);
        } else {
          next.set(peerId, { connected: false, stream: existing?.stream });
        }
        return next;
      });
    });

    // Listen for remote streams
    const unsubStream = service.onRemoteStream((peerId, stream) => {
      setPeers((prev) => {
        const next = new Map(prev);
        const existing = next.get(peerId);
        next.set(peerId, { connected: existing?.connected ?? true, stream });
        return next;
      });
    });

    // Request peer list from server to establish connections
    socket.emit('webrtc:join', { roomId });

    // Handle peer list from server
    const handlePeerList = (peerIds: string[]) => {
      peerIds.forEach((peerId) => {
        service.createOffer(peerId).catch((err) => {
          console.error(`[useWebRTC] Failed to create offer for ${peerId}:`, err);
        });
      });
    };

    socket.on('webrtc:peers', handlePeerList);

    return () => {
      unsubState();
      unsubStream();
      socket.off('webrtc:peers', handlePeerList);
      service.closeAll();
      serviceRef.current = null;
      setPeers(new Map());
    };
  }, [socket, roomId]);

  const sendData = useCallback((peerId: string, data: unknown) => {
    serviceRef.current?.sendData(peerId, data);
  }, []);

  const broadcastData = useCallback((data: unknown) => {
    serviceRef.current?.broadcastData(data);
  }, []);

  const startAudio = useCallback(async () => {
    if (!serviceRef.current) return;
    const stream = await serviceRef.current.getLocalStream(true, false);
    setLocalStream(stream);
    setIsMuted(false);
  }, []);

  const stopAudio = useCallback(() => {
    serviceRef.current?.stopLocalStream();
    setLocalStream(null);
    setIsMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    if (!localStream) return;
    const audioTracks = localStream.getAudioTracks();
    audioTracks.forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsMuted((prev) => !prev);
  }, [localStream]);

  return {
    peers,
    sendData,
    broadcastData,
    localStream,
    startAudio,
    stopAudio,
    isMuted,
    toggleMute,
  };
}
