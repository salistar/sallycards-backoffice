/**
 * @file apps/web/app/okey/room/[code]/page.tsx
 * @description Table Okey multijoueur temps réel (serveur autoritatif /game,
 *   gameType okey, 4 sièges) + appel audio/vidéo TURN + chat. Rend la vue
 *   game:state reçue : pioche, défausse, chevalet, terminer (Okey).
 */
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { ArrowLeft, RefreshCw, Copy, Check } from 'lucide-react';
import { Tile, tileLabel, tileImage } from '../../lib/engine';
import { resolveGameToken, forceRefreshGameToken } from '../../../games/socketAuth';
import VoiceCall from '../../../games/Voice';
import Chat from '../../../games/Chat';
import ChallengeLosers from '../../../games/ChallengeLosers';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
const NAVY = '#0A1535'; const GOLD = '#FCD34D'; const BLUE = '#93C5FD'; const FELT = '#0E5A36';

export default function OkeyRoom() {
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
      s.on('connect', () => { setConnected(true); setAuthError(false); s!.emit('game:join', { roomCode: code, gameType: 'okey' }); });
      s.on('disconnect', () => setConnected(false));
      s.on('game:state', (st: any) => setSnap(st));
      s.on('connect_error', async (err: any) => {
        if (cancelled || refreshing) return;
        if (/token|auth/i.test(String(err?.message || ''))) {
          refreshing = true;
          const fresh = await forceRefreshGameToken();
          refreshing = false;
          if (cancelled) return;
          if (fresh) { tokenRef.current = fresh; setToken(fresh); } // la reconnexion auto reprend le nouveau token
          else { setAuthError(true); s!.disconnect(); }
        }
      });
    })();
    return () => { cancelled = true; if (s) s.disconnect(); socketRef.current = null; };
  }, [code]);

  const me = snap?.players.find((p: any) => p.id === snap.youId) || null;
  const myIdx = snap && me ? snap.players.indexOf(me) : -1;
  const opponents = snap ? snap.players.filter((p: any) => p.id !== snap.youId) : [];
  const myTurn = !!(snap && me && snap.currentId === me.id && snap.phase !== 'over');
  const myHand: Tile[] = me?.hand || [];
  const top: Tile | null = snap?.discardTop || null;

  const act = (action: any) => { if (myTurn) socketRef.current?.emit('game:action', { roomCode: code, action }); };
  const rematch = () => socketRef.current?.emit('game:start', { roomCode: code });
  const copyCode = () => navigator.clipboard?.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {});

  return (
    <main style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${NAVY}, #07112a)`, padding: '18px 14px 40px' }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
          <Link href="/okey/room" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: BLUE, textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}><ArrowLeft style={{ width: 16, height: 16 }} /> Lobby</Link>
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

        <div style={{ marginBottom: 12 }}><VoiceCall roomCode={`okey-${code}`} token={token} /></div>
        <Chat roomId={`okey-${code}`} token={token} />

        {/* Opponents */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
          {opponents.map((p: any) => (
            <div key={p.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: snap.currentId === p.id && snap.phase !== 'over' ? 'rgba(252,211,77,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${snap.currentId === p.id && snap.phase !== 'over' ? GOLD : 'rgba(255,255,255,0.1)'}`, borderRadius: 999, padding: '5px 12px' }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.76rem' }}>{p.isBot ? '🤖' : '🧑'} {p.name}</span><span style={{ color: BLUE, fontSize: '0.64rem' }}>· {p.count}🀫</span>
            </div>
          ))}
        </div>

        {/* Center : pioche + défausse */}
        <div style={{ background: `radial-gradient(circle at 50% 40%, ${FELT}, #093d24)`, borderRadius: 24, border: '6px solid #5b3a1a', padding: 18, marginBottom: 14, display: 'flex', gap: 24, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
          {!snap && <span style={{ color: 'rgba(255,255,255,0.6)' }}>{connected ? 'Distribution…' : 'Connexion…'}</span>}
          {snap && (
            <>
              <div style={{ textAlign: 'center' }}>
                <button onClick={() => act({ type: 'DRAW', from: 'pile' })} disabled={!(myTurn && snap.phase === 'draw')} style={{ width: 54, height: 74, borderRadius: 10, padding: 0, overflow: 'hidden', background: '#fff', border: `2px solid ${myTurn && snap.phase === 'draw' ? GOLD : '#4b5563'}`, cursor: myTurn && snap.phase === 'draw' ? 'pointer' : 'default' }}><Image src="/cards/french52/back.png" alt="pioche" width={54} height={74} style={{ display: 'block', width: 54, height: 74, objectFit: 'cover' }} /></button>
                <div style={{ color: BLUE, fontSize: '0.7rem', marginTop: 4 }}>Pioche ({snap.drawCount})</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                {top ? <TileView t={top} onClick={() => act({ type: 'DRAW', from: 'discard' })} interactive={myTurn && snap.phase === 'draw'} /> : <div style={{ width: 54, height: 74, borderRadius: 10, border: '2px dashed rgba(255,255,255,0.2)' }} />}
                <div style={{ color: BLUE, fontSize: '0.7rem', marginTop: 4 }}>Défausse</div>
              </div>
            </>
          )}
        </div>

        <div style={{ color: BLUE, fontSize: '0.82rem', marginBottom: 8, minHeight: 18 }}>
          {!snap ? '' : snap.phase === 'over' ? snap.lastEvent : myTurn ? (snap.phase === 'draw' ? 'À vous : piochez (pile ou défausse).' : 'Défaussez une tuile, ou terminez si vos groupes sont valides.') : `Tour de ${snap.players[snap.turn]?.name}…`}
        </div>

        {snap && me && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#fff', fontWeight: 800 }}>Votre chevalet ({myHand.length})</span>
              <button onClick={() => act({ type: 'FINISH' })} disabled={!(myTurn && snap.phase === 'discard')} style={{ background: myTurn && snap.phase === 'discard' ? `linear-gradient(90deg, ${GOLD}, #F59E0B)` : 'rgba(255,255,255,0.08)', color: myTurn && snap.phase === 'discard' ? NAVY : '#64748B', border: 'none', borderRadius: 10, padding: '8px 16px', fontWeight: 800, cursor: myTurn && snap.phase === 'discard' ? 'pointer' : 'default' }}>Terminer (Okey)</button>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', minHeight: 80 }}>
              {myHand.map((t) => <TileView key={t.id} t={t} onClick={() => act({ type: 'DISCARD', tileId: t.id })} interactive={myTurn && snap.phase === 'discard'} />)}
            </div>
          </>
        )}

        {snap?.phase === 'over' && (
          <div style={{ marginTop: 20, textAlign: 'center', background: 'rgba(0,0,0,0.4)', borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 44 }}>{snap.winner === myIdx ? '🏆' : snap.winner == null ? '🤝' : '🙃'}</div>
            <h2 style={{ color: '#fff', fontWeight: 900, fontSize: '1.4rem', margin: '8px 0' }}>{snap.winner === myIdx ? 'Okey ! Vous gagnez' : snap.winner == null ? 'Match nul (pioche vide)' : `${snap.players[snap.winner]?.name} gagne`}</h2>
            <button onClick={rematch} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: NAVY, fontWeight: 900, border: 'none', borderRadius: 12, padding: '12px 28px', cursor: 'pointer' }}><RefreshCw style={{ width: 18, height: 18 }} /> Revanche</button>
            {snap.winner === myIdx && <ChallengeLosers gameType="okey" loserIds={opponents.filter((p: any) => !p.isBot).map((p: any) => p.id)} />}
          </div>
        )}
      </div>
    </main>
  );
}

function TileView({ t, onClick, interactive }: { t: Tile; onClick?: () => void; interactive?: boolean }) {
  const w = 48, h = 67;
  return (
    <button onClick={onClick} disabled={!interactive} style={{ width: w, height: h, borderRadius: 8, background: '#fff', border: interactive ? `2px solid ${GOLD}` : '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: interactive ? 'pointer' : 'default', boxShadow: '0 3px 8px rgba(0,0,0,0.4)', padding: 0, overflow: 'hidden' }}>
      {t.joker
        ? <span style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#FCD34D,#F59E0B)', color: '#5b3a1a', fontWeight: 900, fontSize: 26 }}>★</span>
        : <Image src={tileImage(t)} alt={tileLabel(t)} width={w} height={h} style={{ display: 'block', width: w, height: h, objectFit: 'cover' }} />}
    </button>
  );
}
