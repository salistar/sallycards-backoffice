/**
 * @file apps/web/app/scopa/room/[code]/page.tsx
 * @description Table Scopa multijoueur temps réel (serveur autoritatif /game,
 *   gameType scopa) + appel audio/vidéo TURN. Rend la vue game:state reçue.
 */
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { ArrowLeft, RefreshCw, Copy, Check } from 'lucide-react';
import { cardImage, Card } from '../../lib/engine';
import VoiceCall from '../../../games/Voice';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
const NAVY = '#0A1535'; const GOLD = '#FCD34D'; const BLUE = '#93C5FD'; const FELT = '#0E5A36';

export default function ScopaRoom() {
  const params = useParams<{ code: string }>();
  const code = (params?.code || '').toString().toUpperCase();
  const [snap, setSnap] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => { setToken(typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null); }, []);
  useEffect(() => {
    if (!token || !code) return;
    const s = io(`${SOCKET_URL}/game`, { transports: ['websocket'], auth: { token } });
    socketRef.current = s;
    s.on('connect', () => { setConnected(true); s.emit('game:join', { roomCode: code, gameType: 'scopa' }); });
    s.on('disconnect', () => setConnected(false));
    s.on('game:state', (st: any) => setSnap(st));
    return () => { s.disconnect(); socketRef.current = null; };
  }, [token, code]);

  const me = snap?.players.find((p: any) => p.id === snap.youId) || null;
  const myIdx = snap && me ? snap.players.indexOf(me) : -1;
  const opp = snap ? snap.players[1 - myIdx] : null;
  const myTurn = !!(snap && me && snap.currentId === me.id && snap.phase === 'playing');
  const myHand: Card[] = (me?.hand || []).filter((c: any) => !c.hidden);

  const play = (cardId: string) => { if (myTurn) socketRef.current?.emit('game:action', { roomCode: code, action: { type: 'PLAY_CARD', cardId } }); };
  const rematch = () => socketRef.current?.emit('game:start', { roomCode: code });
  const copyCode = () => navigator.clipboard?.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {});

  return (
    <main style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${NAVY}, #07112a)`, padding: '18px 14px 40px' }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
          <Link href="/scopa/room" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: BLUE, textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}><ArrowLeft style={{ width: 16, height: 16 }} /> Lobby</Link>
          <button onClick={copyCode} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.08)', color: '#fff', border: `1px solid ${GOLD}55`, borderRadius: 999, padding: '6px 14px', cursor: 'pointer', fontWeight: 800, letterSpacing: 2 }}>{copied ? <Check style={{ width: 15, height: 15, color: '#4ADE80' }} /> : <Copy style={{ width: 15, height: 15, color: GOLD }} />} {code}</button>
          <span style={{ color: connected ? '#4ADE80' : '#FCA5A5', fontSize: '0.78rem', fontWeight: 700 }}>{connected ? '● connecté' : '○ connexion…'}</span>
        </div>

        <div style={{ marginBottom: 12 }}><VoiceCall roomCode={code} token={token} /></div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <Pill label={me?.name || 'Vous'} value={snap ? snap.scores[myIdx] : 0} accent={snap?.winner === myIdx} sub={me ? `${me.capturedCount} cartes${me.scope ? ` · 🧹×${me.scope}` : ''}` : ''} />
          <Pill label={opp?.name || 'Adversaire'} value={snap ? snap.scores[1 - myIdx] : 0} accent={!!snap && snap.winner != null && snap.winner !== myIdx} sub={opp ? `${opp.capturedCount} cartes${opp.scope ? ` · 🧹×${opp.scope}` : ''}` : ''} />
          <div style={{ flex: 1, minWidth: 120, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, color: BLUE, fontSize: '0.8rem' }}><span>Objectif {snap?.target ?? 11}</span><span>Manche {snap?.roundNumber ?? '—'}</span></div>
        </div>

        <div style={{ background: `radial-gradient(circle at 50% 40%, ${FELT}, #093d24)`, borderRadius: 24, border: '6px solid #5b3a1a', minHeight: 140, padding: 16, marginBottom: 12, boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5)' }}>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Centre ({snap?.table.length ?? 0})</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', minHeight: 78, alignItems: 'center' }}>
            {!snap && <span style={{ color: 'rgba(255,255,255,0.6)' }}>{connected ? 'Distribution…' : 'Connexion…'}</span>}
            {snap?.table.map((c: Card) => <CardImg key={c.id} card={c} size={52} />)}
            {snap && snap.table.length === 0 && <span style={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>Centre vide</span>}
          </div>
        </div>

        {snap?.phase === 'round_end' && snap.lastBreakdown && (
          <div style={{ background: 'rgba(252,211,77,0.1)', border: `1px solid ${GOLD}55`, borderRadius: 12, padding: 14, marginBottom: 12 }}>
            <div style={{ color: GOLD, fontWeight: 800, marginBottom: 6 }}>Fin de manche — {snap.lastBreakdown.pts[0]} / {snap.lastBreakdown.pts[1]}</div>
            <div style={{ color: '#CBD5E1', fontSize: '0.82rem' }}>{snap.lastBreakdown.labels.join(' · ') || 'Aucun point'} · nouvelle donne…</div>
          </div>
        )}

        {snap && (
          <>
            <div style={{ color: '#fff', fontWeight: 800, marginBottom: 8 }}>Votre main {myTurn ? '· à vous' : ''}</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', minHeight: 100 }}>
              {myHand.map((c) => (
                <button key={c.id} onClick={() => play(c.id)} disabled={!myTurn} style={{ border: 'none', background: 'transparent', padding: 0, cursor: myTurn ? 'pointer' : 'default', transform: myTurn ? 'translateY(-4px)' : 'none', transition: 'transform .15s', boxShadow: myTurn ? `0 0 0 2px ${GOLD}` : 'none', borderRadius: 8 }}><CardImg card={c} size={70} /></button>
              ))}
              {myHand.length === 0 && <span style={{ color: BLUE }}>Distribution…</span>}
            </div>
          </>
        )}

        {snap?.phase === 'game_over' && (
          <div style={{ marginTop: 20, textAlign: 'center', background: 'rgba(0,0,0,0.4)', borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 44 }}>{snap.winner === myIdx ? '🏆' : '🤝'}</div>
            <h2 style={{ color: '#fff', fontWeight: 900, fontSize: '1.4rem', margin: '8px 0' }}>{snap.winner === myIdx ? 'Vous avez gagné !' : 'L’adversaire gagne'}</h2>
            <p style={{ color: BLUE, marginBottom: 16 }}>Score {snap.scores[myIdx]} – {snap.scores[1 - myIdx]}</p>
            <button onClick={rematch} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: NAVY, fontWeight: 900, border: 'none', borderRadius: 12, padding: '12px 28px', cursor: 'pointer' }}><RefreshCw style={{ width: 18, height: 18 }} /> Revanche</button>
          </div>
        )}
      </div>
    </main>
  );
}

function Pill({ label, value, accent, sub }: { label: string; value: number; accent?: boolean; sub?: string }) {
  return <div style={{ background: accent ? 'rgba(252,211,77,0.18)' : 'rgba(255,255,255,0.06)', border: `1px solid ${accent ? GOLD : 'rgba(255,255,255,0.12)'}`, borderRadius: 12, padding: '8px 14px' }}><div style={{ color: '#94A3B8', fontSize: '0.64rem', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div><div style={{ color: accent ? GOLD : '#fff', fontWeight: 900, fontSize: '1.3rem' }}>{value}</div>{sub && <div style={{ color: BLUE, fontSize: '0.66rem' }}>{sub}</div>}</div>;
}
function CardImg({ card, size }: { card: Card; size: number }) {
  return <span style={{ display: 'inline-block', borderRadius: 6, overflow: 'hidden', background: '#fff', boxShadow: '0 4px 10px rgba(0,0,0,0.4)' }}><Image src={cardImage(card)} alt="" width={size} height={Math.round(size * 1.5)} style={{ display: 'block', width: size, height: 'auto' }} /></span>;
}
