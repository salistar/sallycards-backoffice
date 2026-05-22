/**
 * @file apps/web/app/belote/room/_voice.tsx
 * @description Appel vocal WebRTC (mesh audio) pour la room Belote (Phase 3).
 *   Signaling via le gateway /webrtc du socket-server ; relai média par le
 *   serveur TURN/STUN SALISTAR (ICE servers récupérés sur /api/turn-creds).
 *   Le serveur ne voit jamais l'audio — pur P2P relayé par TURN si nécessaire.
 */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Mic, MicOff, PhoneOff, Phone } from 'lucide-react';
import { apiClient } from '../../lib/api';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
const GOLD = '#FCD34D';
const BLUE = '#93C5FD';

interface PeerEntry { username: string; pc: RTCPeerConnection; stream: MediaStream }

export default function VoiceCall({ roomCode, token }: { roomCode: string; token: string | null }) {
  const [inCall, setInCall] = useState(false);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [peerNames, setPeerNames] = useState<string[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, PeerEntry>>(new Map());
  const iceRef = useRef<RTCIceServer[]>([{ urls: 'stun:stun.l.google.com:19302' }]);
  const audioHostRef = useRef<HTMLDivElement | null>(null);

  const refreshNames = useCallback(() => {
    setPeerNames(Array.from(peersRef.current.values()).map((p) => p.username));
  }, []);

  const attachRemote = useCallback((socketId: string, stream: MediaStream) => {
    if (!audioHostRef.current) return;
    let el = document.getElementById(`aud-${socketId}`) as HTMLAudioElement | null;
    if (!el) {
      el = document.createElement('audio');
      el.id = `aud-${socketId}`;
      el.autoplay = true;
      (el as any).playsInline = true;
      audioHostRef.current.appendChild(el);
    }
    el.srcObject = stream;
  }, []);

  const makePeer = useCallback((socketId: string, username: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection({ iceServers: iceRef.current });
    const remoteStream = new MediaStream();
    localStreamRef.current?.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current!));
    pc.ontrack = (ev) => {
      ev.streams[0]?.getTracks().forEach((t) => remoteStream.addTrack(t));
      attachRemote(socketId, ev.streams[0] || remoteStream);
    };
    pc.onicecandidate = (ev) => {
      if (ev.candidate) socketRef.current?.emit('webrtc:ice', { roomCode, to: socketId, candidate: ev.candidate });
    };
    peersRef.current.set(socketId, { username, pc, stream: remoteStream });
    refreshNames();
    return pc;
  }, [roomCode, attachRemote, refreshNames]);

  const closePeer = useCallback((socketId: string) => {
    const p = peersRef.current.get(socketId);
    if (p) { try { p.pc.close(); } catch { /* */ } peersRef.current.delete(socketId); refreshNames(); }
    document.getElementById(`aud-${socketId}`)?.remove();
  }, [refreshNames]);

  const hangUp = useCallback(() => {
    peersRef.current.forEach((_, sid) => closePeer(sid));
    peersRef.current.clear();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    socketRef.current?.emit('webrtc:leave', { roomCode });
    socketRef.current?.disconnect();
    socketRef.current = null;
    setInCall(false);
    setMuted(false);
    setPeerNames([]);
  }, [roomCode, closePeer]);

  const joinCall = useCallback(async () => {
    setError(null);
    if (!token) { setError('Non authentifié'); return; }
    try {
      // 1) ICE servers SALISTAR
      try {
        const creds = await apiClient.apiGet<{ iceServers: RTCIceServer[] }>('/api/turn-creds');
        if (creds?.iceServers?.length) iceRef.current = creds.iceServers;
      } catch { /* fallback STUN public */ }

      // 2) micro
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;

      // 3) signaling
      const s = io(`${SOCKET_URL}/webrtc`, { transports: ['websocket'], auth: { token } });
      socketRef.current = s;

      s.on('connect', () => s.emit('webrtc:join', { roomCode }));

      // arrivant : on initie une offre vers chaque pair existant
      s.on('webrtc:peers', async ({ peers }: { peers: { socketId: string; username: string }[] }) => {
        for (const peer of peers || []) {
          const pc = makePeer(peer.socketId, peer.username || 'Joueur');
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          s.emit('webrtc:offer', { roomCode, to: peer.socketId, sdp: offer });
        }
        setInCall(true);
      });

      // un nouveau pair arrive : on attend son offre
      s.on('webrtc:joined', (_p: any) => { /* l'arrivant initie */ });

      s.on('webrtc:offer', async ({ from, sdp, fromUsername }: any) => {
        const pc = peersRef.current.get(from)?.pc || makePeer(from, fromUsername || 'Joueur');
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        s.emit('webrtc:answer', { roomCode, to: from, sdp: answer });
        setInCall(true);
      });

      s.on('webrtc:answer', async ({ from, sdp }: any) => {
        const pc = peersRef.current.get(from)?.pc;
        if (pc) await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      });

      s.on('webrtc:ice', async ({ from, candidate }: any) => {
        const pc = peersRef.current.get(from)?.pc;
        if (pc && candidate) { try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch { /* */ } }
      });

      s.on('webrtc:left', ({ socketId }: any) => closePeer(socketId));
      s.on('connect_error', () => setError('Connexion à l’appel impossible'));

      setInCall(true);
    } catch (e: any) {
      setError(e?.name === 'NotAllowedError' ? 'Micro refusé' : (e?.message || 'Échec de l’appel'));
      hangUp();
    }
  }, [token, roomCode, makePeer, closePeer, hangUp]);

  const toggleMute = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMuted(!track.enabled);
  }, []);

  useEffect(() => () => { hangUp(); }, [hangUp]);

  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <div ref={audioHostRef} style={{ display: 'none' }} />
      {!inCall ? (
        <button onClick={joinCall} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: '#0A1535', fontWeight: 800, border: 'none', borderRadius: 999, padding: '8px 16px', cursor: 'pointer' }}>
          <Phone style={{ width: 16, height: 16 }} /> Rejoindre l’appel vocal
        </button>
      ) : (
        <>
          <span style={{ color: '#4ADE80', fontWeight: 700, fontSize: '0.8rem' }}>● En appel</span>
          <button onClick={toggleMute} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: muted ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.1)', color: muted ? '#FCA5A5' : '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999, padding: '8px 14px', cursor: 'pointer', fontWeight: 700 }}>
            {muted ? <MicOff style={{ width: 16, height: 16 }} /> : <Mic style={{ width: 16, height: 16 }} />} {muted ? 'Muet' : 'Micro'}
          </button>
          <button onClick={hangUp} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.85)', color: '#fff', border: 'none', borderRadius: 999, padding: '8px 14px', cursor: 'pointer', fontWeight: 700 }}>
            <PhoneOff style={{ width: 16, height: 16 }} /> Raccrocher
          </button>
          <span style={{ color: BLUE, fontSize: '0.78rem' }}>
            {peerNames.length > 0 ? `Avec ${peerNames.join(', ')}` : 'En attente d’un autre joueur…'}
          </span>
        </>
      )}
      {error && <span style={{ color: '#FCA5A5', fontSize: '0.78rem' }}>{error}</span>}
    </div>
  );
}
