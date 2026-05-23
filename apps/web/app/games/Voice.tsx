/**
 * @file apps/web/app/games/Voice.tsx
 * @description Appel audio+vidéo WebRTC (mesh) générique réutilisé par les rooms
 *   multijoueur (belote/scopa/tarot). Caméra+micro auto à l'entrée. Signaling
 *   /webrtc, ICE servers SALISTAR (/api/turn-creds).
 */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Phone } from 'lucide-react';
import { apiClient } from '../lib/api';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
const GOLD = '#FCD34D';
const BLUE = '#93C5FD';

interface RemotePeer { socketId: string; username: string; stream: MediaStream }

function VideoTile({ stream, label, muted, mirror, you }: { stream: MediaStream | null; label: string; muted?: boolean; mirror?: boolean; you?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => { if (ref.current && stream) ref.current.srcObject = stream; }, [stream]);
  return (
    <div style={{ position: 'relative', width: 132, height: 99, borderRadius: 12, overflow: 'hidden', background: '#06101f', border: `1px solid ${you ? GOLD : 'rgba(255,255,255,0.12)'}` }}>
      <video ref={ref} autoPlay playsInline muted={muted} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: mirror ? 'scaleX(-1)' : 'none' }} />
      <span style={{ position: 'absolute', bottom: 4, left: 6, color: '#fff', fontSize: '0.66rem', fontWeight: 800, textShadow: '0 1px 3px #000' }}>{label}</span>
    </div>
  );
}

export default function VoiceCall({ roomCode, token }: { roomCode: string; token: string | null }) {
  const [inCall, setInCall] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remotes, setRemotes] = useState<RemotePeer[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, { username: string; pc: RTCPeerConnection; stream: MediaStream }>>(new Map());
  const iceRef = useRef<RTCIceServer[]>([{ urls: 'stun:stun.l.google.com:19302' }]);
  const startedRef = useRef(false);

  const syncRemotes = useCallback(() => {
    setRemotes(Array.from(peersRef.current.entries()).map(([socketId, p]) => ({ socketId, username: p.username, stream: p.stream })));
  }, []);

  const makePeer = useCallback((socketId: string, username: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection({ iceServers: iceRef.current });
    const remoteStream = new MediaStream();
    localStreamRef.current?.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current!));
    pc.ontrack = (ev) => {
      (ev.streams[0] || remoteStream).getTracks().forEach((t) => { if (!remoteStream.getTracks().includes(t)) remoteStream.addTrack(t); });
      const entry = peersRef.current.get(socketId);
      if (entry) { entry.stream = ev.streams[0] || remoteStream; peersRef.current.set(socketId, entry); }
      syncRemotes();
    };
    pc.onicecandidate = (ev) => { if (ev.candidate) socketRef.current?.emit('webrtc:ice', { roomCode, to: socketId, candidate: ev.candidate }); };
    peersRef.current.set(socketId, { username, pc, stream: remoteStream });
    syncRemotes();
    return pc;
  }, [roomCode, syncRemotes]);

  const closePeer = useCallback((socketId: string) => {
    const p = peersRef.current.get(socketId);
    if (p) { try { p.pc.close(); } catch { /* */ } peersRef.current.delete(socketId); syncRemotes(); }
  }, [syncRemotes]);

  const hangUp = useCallback(() => {
    peersRef.current.forEach((p) => { try { p.pc.close(); } catch { /* */ } });
    peersRef.current.clear(); syncRemotes();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null; setLocalStream(null);
    socketRef.current?.emit('webrtc:leave', { roomCode });
    socketRef.current?.disconnect(); socketRef.current = null;
    startedRef.current = false; setInCall(false);
  }, [roomCode, syncRemotes]);

  const start = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true; setError(null);
    if (!token) { setError('Non authentifié'); startedRef.current = false; return; }
    try {
      try { const creds = await apiClient.apiGet<{ iceServers: RTCIceServer[] }>('/api/turn-creds'); if (creds?.iceServers?.length) iceRef.current = creds.iceServers; } catch { /* */ }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: { width: 320, height: 240 } });
      localStreamRef.current = stream; setLocalStream(stream); setMicOn(true); setCamOn(true);
      const s = io(`${SOCKET_URL}/webrtc`, { transports: ['websocket'], auth: { token } });
      socketRef.current = s;
      s.on('connect', () => s.emit('webrtc:join', { roomCode }));
      s.on('webrtc:peers', async ({ peers }: { peers: { socketId: string; username: string }[] }) => {
        for (const peer of peers || []) {
          const pc = makePeer(peer.socketId, peer.username || 'Joueur');
          const offer = await pc.createOffer(); await pc.setLocalDescription(offer);
          s.emit('webrtc:offer', { roomCode, to: peer.socketId, sdp: offer });
        }
      });
      s.on('webrtc:offer', async ({ from, sdp, fromUsername }: any) => {
        const pc = peersRef.current.get(from)?.pc || makePeer(from, fromUsername || 'Joueur');
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer(); await pc.setLocalDescription(answer);
        s.emit('webrtc:answer', { roomCode, to: from, sdp: answer });
      });
      s.on('webrtc:answer', async ({ from, sdp }: any) => { const pc = peersRef.current.get(from)?.pc; if (pc) await pc.setRemoteDescription(new RTCSessionDescription(sdp)); });
      s.on('webrtc:ice', async ({ from, candidate }: any) => { const pc = peersRef.current.get(from)?.pc; if (pc && candidate) { try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch { /* */ } } });
      s.on('webrtc:left', ({ socketId }: any) => closePeer(socketId));
      s.on('connect_error', () => setError('Connexion à l’appel impossible'));
      setInCall(true);
    } catch (e: any) {
      startedRef.current = false;
      setError(e?.name === 'NotAllowedError' ? 'Caméra/micro refusés — autorise l’accès' : (e?.name === 'NotFoundError' ? 'Aucune caméra/micro' : (e?.message || 'Échec de l’appel')));
    }
  }, [token, roomCode, makePeer, closePeer]);

  useEffect(() => { if (token && roomCode) start(); return () => { hangUp(); }; /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [token, roomCode]);

  const toggleMic = useCallback(() => { const t = localStreamRef.current?.getAudioTracks()[0]; if (!t) return; t.enabled = !t.enabled; setMicOn(t.enabled); }, []);
  const toggleCam = useCallback(() => { const t = localStreamRef.current?.getVideoTracks()[0]; if (!t) return; t.enabled = !t.enabled; setCamOn(t.enabled); }, []);

  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 12 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {localStream && <VideoTile stream={localStream} label="Vous" muted mirror you />}
        {remotes.map((r) => <VideoTile key={r.socketId} stream={r.stream} label={r.username} />)}
        {!inCall && !error && <span style={{ color: BLUE, fontSize: '0.82rem' }}>Activation de la caméra…</span>}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#FCA5A5', fontSize: '0.8rem' }}>{error}</span>
            <button onClick={start} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: '#0A1535', fontWeight: 800, border: 'none', borderRadius: 999, padding: '6px 14px', cursor: 'pointer' }}><Phone style={{ width: 15, height: 15 }} /> Réessayer</button>
          </div>
        )}
      </div>
      {inCall && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={toggleMic} style={ctrl(!micOn)}>{micOn ? <Mic style={ic} /> : <MicOff style={ic} />} {micOn ? 'Micro' : 'Muet'}</button>
          <button onClick={toggleCam} style={ctrl(!camOn)}>{camOn ? <Video style={ic} /> : <VideoOff style={ic} />} {camOn ? 'Caméra' : 'Caméra off'}</button>
          <button onClick={hangUp} style={{ ...ctrl(false), background: 'rgba(239,68,68,0.85)', color: '#fff', border: 'none' }}><PhoneOff style={ic} /> Raccrocher</button>
          <span style={{ color: BLUE, fontSize: '0.76rem' }}>{remotes.length > 0 ? `${remotes.length} autre(s) en ligne` : 'En attente d’un autre joueur…'}</span>
        </div>
      )}
    </div>
  );
}
const ic: React.CSSProperties = { width: 16, height: 16 };
const ctrl = (active: boolean): React.CSSProperties => ({ display: 'inline-flex', alignItems: 'center', gap: 6, background: active ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.1)', color: active ? '#FCA5A5' : '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999, padding: '8px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' });
