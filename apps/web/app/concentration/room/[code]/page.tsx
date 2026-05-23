/**
 * @file apps/web/app/concentration/room/[code]/page.tsx
 * @description Table Concentration multijoueur temps réel (serveur autoritatif
 *   /game, gameType concentration, jusqu'à 4 sièges) + chat + voix TURN. Le
 *   serveur ne révèle que les cartes retournées/appariées. Le plus de paires gagne.
 */
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { ArrowLeft, RefreshCw, Copy, Check } from 'lucide-react';
import { CARD_BACK } from '../../lib/engine';
import { resolveGameToken, forceRefreshGameToken } from '../../../games/socketAuth';
import VoiceCall from '../../../games/Voice';
import Chat from '../../../games/Chat';
import ChallengeLosers from '../../../games/ChallengeLosers';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
const NAVY = '#0A1535'; const GOLD = '#FCD34D'; const BLUE = '#93C5FD'; const FELT = '#14532d';
const OWNER_COLOR = ['#84CC16', '#F97316', '#38BDF8', '#A78BFA'];

export default function ConcentrationRoom() {
  const params = useParams<{ code: string }>();
  const code = (params?.code || '').toString().toUpperCase();
  const [snap, setSnap] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  const [copied, setCopied] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!code) return;
    let cancelled = false; let refreshing = false; let s: Socket | null = null;
    (async () => {
      const tok = await resolveGameToken();
      if (cancelled) return;
      if (!tok) { setAuthError(true); return; }
      tokenRef.current = tok; setToken(tok);
      s = io(`${SOCKET_URL}/game`, { transports: ['websocket'], auth: (cb: any) => cb({ token: tokenRef.current }) });
      socketRef.current = s;
      s.on('connect', () => { setConnected(true); setAuthError(false); s!.emit('game:join', { roomCode: code, gameType: 'concentration' }); });
      s.on('disconnect', () => setConnected(false));
      s.on('game:state', (st: any) => setSnap(st));
      s.on('connect_error', async (err: any) => {
        if (cancelled || refreshing) return;
        if (/token|auth/i.test(String(err?.message || ''))) {
          refreshing = true;
          const fresh = await forceRefreshGameToken();
          refreshing = false;
          if (cancelled) return;
          if (fresh) { tokenRef.current = fresh; setToken(fresh); }
          else { setAuthError(true); s!.disconnect(); }
        }
      });
    })();
    return () => { cancelled = true; if (s) s.disconnect(); socketRef.current = null; };
  }, [code]);

  const me = snap?.players.find((p: any) => p.id === snap.youId) || null;
  const myIdx = snap && me ? snap.players.indexOf(me) : -1;
  const myTurn = !!(snap && me && snap.phase === 'playing' && snap.currentId === me.id);
  const canFlip = myTurn && (snap?.step === 'flip1' || snap?.step === 'flip2');

  const emit = (action: any) => socketRef.current?.emit('game:action', { roomCode: code, action });
  const rematch = () => socketRef.current?.emit('game:start', { roomCode: code });
  const copyCode = () => navigator.clipboard?.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {});

  return (
    <main style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${NAVY}, #06210f)`, padding: '18px 14px 40px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
          <Link href="/concentration/room" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: BLUE, textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}><ArrowLeft style={{ width: 16, height: 16 }} /> Lobby</Link>
          <button onClick={copyCode} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.08)', color: '#fff', border: `1px solid ${GOLD}55`, borderRadius: 999, padding: '6px 14px', cursor: 'pointer', fontWeight: 800, letterSpacing: 2 }}>{copied ? <Check style={{ width: 15, height: 15, color: '#4ADE80' }} /> : <Copy style={{ width: 15, height: 15, color: GOLD }} />} {code}</button>
          <span style={{ color: connected ? '#4ADE80' : '#FCA5A5', fontSize: '0.78rem', fontWeight: 700 }}>{connected ? '● connecté' : '○ connexion…'}</span>
        </div>

        {authError && (
          <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 12, padding: 16, marginBottom: 12, textAlign: 'center' }}>
            <div style={{ color: '#fff', fontWeight: 800, marginBottom: 6 }}>Connecte-toi pour jouer en multijoueur</div>
            <div style={{ color: BLUE, fontSize: '0.85rem', marginBottom: 10 }}>Ta session a expiré ou tu n’es pas connecté.</div>
            <Link href="/auth/login" style={{ display: 'inline-block', background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: NAVY, fontWeight: 800, padding: '8px 20px', borderRadius: 10, textDecoration: 'none' }}>Se connecter</Link>
          </div>
        )}

        <div style={{ marginBottom: 12 }}><VoiceCall roomCode={`concentration-${code}`} token={token} /></div>
        <Chat roomId={`concentration-${code}`} token={token} />

        {!snap && <div style={{ color: BLUE, textAlign: 'center', padding: 30 }}>{connected ? 'Distribution…' : 'Connexion…'}</div>}

        {snap && (
          <>
            <div style={{ display: 'flex', gap: 8, margin: '12px 0', flexWrap: 'wrap' }}>
              {snap.players.map((p: any, i: number) => {
                const active = snap.turn === i && snap.phase === 'playing';
                return (
                  <div key={p.id} style={{ flex: 1, minWidth: 110, background: active ? 'rgba(252,211,77,0.16)' : 'rgba(255,255,255,0.05)', border: `1px solid ${active ? GOLD : OWNER_COLOR[i] + '66'}`, borderRadius: 12, padding: '8px 12px' }}>
                    <div style={{ color: OWNER_COLOR[i], fontSize: '0.64rem', fontWeight: 800 }}>{p.id === snap.youId ? '🧑 Vous' : (p.isBot ? '🤖 ' + p.name : '🧑 ' + p.name)}{active ? ' · à lui' : ''}</div>
                    <div style={{ color: '#fff', fontWeight: 900, fontSize: '1.3rem' }}>{p.pairs} <span style={{ color: '#64748B', fontSize: '0.66rem', fontWeight: 600 }}>paires</span></div>
                  </div>
                );
              })}
            </div>

            <div style={{ color: BLUE, fontSize: '0.84rem', marginBottom: 10, minHeight: 18 }}>{myTurn ? 'À toi : retourne 2 cartes.' : snap.lastEvent}</div>

            <div style={{ background: `radial-gradient(circle at 50% 30%, ${FELT}, #07210f)`, borderRadius: 20, border: '5px solid #1d6b38', padding: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${snap.cols}, 1fr)`, gap: 8, justifyItems: 'center' }}>
                {snap.grid.map((slot: any, i: number) => {
                  const show = slot.faceUp || slot.matched;
                  const clickable = canFlip && !slot.faceUp && !slot.matched;
                  return (
                    <button key={slot.id} onClick={() => clickable && emit({ type: 'FLIP', index: i })} disabled={!clickable} style={{ width: 54, height: 76, borderRadius: 8, padding: 0, overflow: 'hidden', cursor: clickable ? 'pointer' : 'default', border: slot.matched && slot.owner !== null ? `2px solid ${OWNER_COLOR[slot.owner]}` : '1px solid rgba(255,255,255,0.15)', background: show ? '#fff' : 'transparent', opacity: slot.matched ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 8px rgba(0,0,0,0.4)' }}>
                      {show ? <span style={{ fontSize: 30 }}>{slot.symbol}</span> : <Image src={CARD_BACK} alt="" width={54} height={76} style={{ display: 'block', width: 54, height: 76, objectFit: 'cover' }} />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 12, marginTop: 14, maxHeight: 120, overflowY: 'auto' }}>
              {(snap.log || []).map((l: string, i: number) => <div key={i} style={{ color: i === 0 ? '#fff' : '#94A3B8', fontSize: '0.8rem', padding: '2px 0' }}>{l}</div>)}
            </div>

            {snap.phase === 'over' && (
              <div style={{ marginTop: 18, textAlign: 'center', background: 'rgba(0,0,0,0.45)', borderRadius: 16, padding: 24 }}>
                <div style={{ fontSize: 44 }}>{snap.winner === myIdx ? '🏆' : '🙃'}</div>
                <h2 style={{ color: '#fff', fontWeight: 900, fontSize: '1.35rem', margin: '8px 0' }}>{snap.winner === myIdx ? 'Vous gagnez !' : `${snap.players[snap.winner]?.name} gagne`}</h2>
                <div style={{ color: BLUE, marginBottom: 14 }}>{snap.players.map((p: any) => `${p.name}: ${p.pairs}`).join(' · ')}</div>
                <button onClick={rematch} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: NAVY, fontWeight: 900, border: 'none', borderRadius: 12, padding: '12px 28px', cursor: 'pointer' }}><RefreshCw style={{ width: 18, height: 18 }} /> Revanche</button>
                {snap.winner === myIdx && <ChallengeLosers gameType="concentration" loserIds={snap.players.filter((p: any) => p.id !== snap.youId && !p.isBot).map((p: any) => p.id)} />}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
