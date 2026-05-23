/**
 * @file apps/web/app/ronda/room/[code]/page.tsx
 * @description Table Ronda multijoueur temps réel (serveur autoritatif /game,
 *   gameType ronda, 2-4 sièges) + chat + voix TURN. Capture par valeur, décompte
 *   de manche. Le serveur ne révèle que la main du joueur concerné.
 */
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { ArrowLeft, RefreshCw, Copy, Check } from 'lucide-react';
import { Card, cardImage, VALUE_NAME } from '../../lib/engine';
import { resolveGameToken, forceRefreshGameToken } from '../../../games/socketAuth';
import VoiceCall from '../../../games/Voice';
import Chat from '../../../games/Chat';
import ChallengeLosers from '../../../games/ChallengeLosers';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
const NAVY = '#0A1535'; const GOLD = '#FCD34D'; const BLUE = '#93C5FD'; const FELT = '#7c3a08';

export default function RondaRoom() {
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
      s.on('connect', () => { setConnected(true); setAuthError(false); s!.emit('game:join', { roomCode: code, gameType: 'ronda' }); });
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
  const myHand: Card[] = me?.hand || [];
  const table: Card[] = snap?.table || [];

  const emit = (action: any) => socketRef.current?.emit('game:action', { roomCode: code, action });
  const rematch = () => socketRef.current?.emit('game:start', { roomCode: code });
  const copyCode = () => navigator.clipboard?.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {});

  return (
    <main style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${NAVY}, #2a1505)`, padding: '18px 14px 40px' }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
          <Link href="/ronda/room" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: BLUE, textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}><ArrowLeft style={{ width: 16, height: 16 }} /> Lobby</Link>
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

        <div style={{ marginBottom: 12 }}><VoiceCall roomCode={`ronda-${code}`} token={token} /></div>
        <Chat roomId={`ronda-${code}`} token={token} />

        {!snap && <div style={{ color: BLUE, textAlign: 'center', padding: 30 }}>{connected ? 'Distribution…' : 'Connexion…'}</div>}

        {snap && (
          <>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
              {snap.players.map((p: any, i: number) => {
                const active = snap.turn === i && snap.phase === 'playing';
                return (
                  <div key={p.id} style={{ flex: 1, minWidth: 110, background: active ? 'rgba(252,211,77,0.16)' : 'rgba(255,255,255,0.05)', border: `1px solid ${active ? GOLD : 'rgba(255,255,255,0.12)'}`, borderRadius: 12, padding: '8px 12px' }}>
                    <div style={{ color: '#fff', fontSize: '0.72rem', fontWeight: 700 }}>{p.id === snap.youId ? '🧑 Vous' : (p.isBot ? '🤖 ' + p.name : '🧑 ' + p.name)}{p.ronda ? ' · ronda' : ''}{p.tringa ? ' · tringa' : ''}</div>
                    <div style={{ color: GOLD, fontWeight: 900, fontSize: '1.3rem' }}>{p.score} <span style={{ color: '#64748B', fontSize: '0.64rem', fontWeight: 600 }}>/ {snap.target} · {p.captureCount}🃏 · {p.handCount}🂠</span></div>
                  </div>
                );
              })}
            </div>

            <div style={{ background: `radial-gradient(circle at 50% 40%, ${FELT}, #1c0d02)`, borderRadius: 24, border: '6px solid #5b3a1a', padding: 18, marginBottom: 14, minHeight: 120 }}>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Centre ({table.length}) · pioche {snap.deckCount}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', minHeight: 78, alignItems: 'center' }}>
                {table.length === 0 && <span style={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>Centre vide</span>}
                {table.map((c) => <CardImg key={c.id} card={c} size={52} />)}
              </div>
            </div>

            <div style={{ color: snap.phase === 'round_end' ? GOLD : BLUE, fontSize: '0.85rem', marginBottom: 8, minHeight: 18, fontWeight: snap.phase === 'round_end' ? 800 : 500 }}>
              {snap.phase === 'over' ? snap.lastEvent : myTurn ? 'À toi : pose une carte (capture si même valeur au centre).' : snap.lastEvent}
            </div>

            <div style={{ color: '#fff', fontWeight: 800, marginBottom: 8 }}>Votre main ({myHand.length})</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', minHeight: 84 }}>
              {myHand.map((c) => {
                const canCapture = table.some((t) => t.value === c.value);
                return (
                  <button key={c.id} onClick={() => myTurn && emit({ type: 'PLAY_CARD', cardId: c.id })} disabled={!myTurn} style={{ border: canCapture && myTurn ? '2px solid #4ADE80' : '1px solid #cbd5e1', borderRadius: 8, padding: 0, background: '#fff', cursor: myTurn ? 'pointer' : 'default', transform: myTurn ? 'translateY(-3px)' : 'none', transition: 'transform .12s', boxShadow: '0 3px 8px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
                    <Image src={cardImage(c)} alt={VALUE_NAME[c.value]} width={58} height={86} style={{ display: 'block', width: 58, height: 86, objectFit: 'cover' }} />
                  </button>
                );
              })}
              {myHand.length === 0 && <span style={{ color: BLUE }}>—</span>}
            </div>

            {snap.phase === 'round_end' && snap.roundScores && (
              <div style={{ background: 'rgba(252,211,77,0.1)', border: `1px solid ${GOLD}55`, borderRadius: 12, padding: 14, marginTop: 14 }}>
                <div style={{ color: GOLD, fontWeight: 800, marginBottom: 6 }}>Fin de manche — décompte</div>
                {snap.roundScores.map((s: any) => { const p = snap.players.find((pp: any) => pp.id === s.playerId); const tags = [s.mostCards && 'cartes', s.mostOros && 'oros', s.settebello && '7♦', s.mostSevens && '7s', s.rondaBonus && 'ronda', s.tringaBonus && 'tringa'].filter(Boolean).join(' · '); return <div key={s.playerId} style={{ color: '#CBD5E1', fontSize: '0.82rem' }}>{p?.name} : +{s.total} {tags ? `(${tags})` : ''}</div>; })}
              </div>
            )}

            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 12, marginTop: 14, maxHeight: 120, overflowY: 'auto' }}>
              {(snap.log || []).map((l: string, i: number) => <div key={i} style={{ color: i === 0 ? '#fff' : '#94A3B8', fontSize: '0.8rem', padding: '2px 0' }}>{l}</div>)}
            </div>

            {snap.phase === 'over' && (
              <div style={{ marginTop: 18, textAlign: 'center', background: 'rgba(0,0,0,0.45)', borderRadius: 16, padding: 24 }}>
                <div style={{ fontSize: 44 }}>{snap.winner === myIdx ? '🏆' : '🙃'}</div>
                <h2 style={{ color: '#fff', fontWeight: 900, fontSize: '1.35rem', margin: '8px 0' }}>{snap.winner === myIdx ? 'Vous gagnez !' : `${snap.players[snap.winner]?.name} gagne`}</h2>
                <div style={{ color: BLUE, marginBottom: 14 }}>{snap.players.map((p: any) => `${p.name}: ${p.score}`).join(' · ')}</div>
                <button onClick={rematch} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: NAVY, fontWeight: 900, border: 'none', borderRadius: 12, padding: '12px 28px', cursor: 'pointer' }}><RefreshCw style={{ width: 18, height: 18 }} /> Revanche</button>
                {snap.winner === myIdx && <ChallengeLosers gameType="ronda" loserIds={snap.players.filter((p: any) => p.id !== snap.youId && !p.isBot).map((p: any) => p.id)} />}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function CardImg({ card, size }: { card: Card; size: number }) {
  return <span style={{ display: 'inline-block', borderRadius: 6, overflow: 'hidden', background: '#fff', boxShadow: '0 4px 10px rgba(0,0,0,0.4)' }}><Image src={cardImage(card)} alt="" width={size} height={Math.round(size * 1.5)} style={{ display: 'block', width: size, height: 'auto' }} /></span>;
}
