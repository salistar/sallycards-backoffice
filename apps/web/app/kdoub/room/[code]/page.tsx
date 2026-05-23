/**
 * @file apps/web/app/kdoub/room/[code]/page.tsx
 * @description Table Kdoub multijoueur temps réel (serveur autoritatif /game,
 *   gameType kdoub, jusqu'à 4 sièges) + chat + voix TURN. Rend la vue game:state :
 *   tas face caché, valeur déclarée, main, déclaration/bluff et « Kdoub ! ».
 */
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { ArrowLeft, RefreshCw, Copy, Check, Megaphone } from 'lucide-react';
import { Card, CardValue, VALUES, VALUE_NAME, cardImage, CARD_BACK } from '../../lib/engine';
import { resolveGameToken, forceRefreshGameToken } from '../../../games/socketAuth';
import VoiceCall from '../../../games/Voice';
import Chat from '../../../games/Chat';
import ChallengeLosers from '../../../games/ChallengeLosers';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
const NAVY = '#0A1535'; const GOLD = '#FCD34D'; const BLUE = '#93C5FD'; const FELT = '#2a1145'; const PURPLE = '#8B5CF6';

export default function KdoubRoom() {
  const params = useParams<{ code: string }>();
  const code = (params?.code || '').toString().toUpperCase();
  const [snap, setSnap] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
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
      s.on('connect', () => { setConnected(true); setAuthError(false); s!.emit('game:join', { roomCode: code, gameType: 'kdoub' }); });
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
  const opponents = snap ? snap.players.filter((p: any) => p.id !== snap.youId) : [];
  const myHand: Card[] = me?.hand || [];
  const locked: CardValue | null = snap?.declaredValue ?? null;
  const myTurn = !!(snap && me && snap.phase === 'playing' && snap.currentId === me.id);
  const iAmDecider = !!(snap && me && snap.phase === 'challenge' && snap.deciderId === me.id);

  const emit = (action: any) => socketRef.current?.emit('game:action', { roomCode: code, action });
  const playCard = (cardId: string, declared: CardValue) => { setSel(null); emit({ type: 'PLAY', cardId, declaredValue: declared }); };
  const onCardClick = (c: Card) => {
    if (iAmDecider) { playCard(c.id, locked!); return; }
    if (!myTurn) return;
    if (locked !== null) playCard(c.id, locked);
    else setSel((cur) => (cur === c.id ? null : c.id));
  };
  const cryKdoub = () => { setSel(null); emit({ type: 'CHALLENGE' }); };
  const rematch = () => { setSel(null); socketRef.current?.emit('game:start', { roomCode: code }); };
  const copyCode = () => navigator.clipboard?.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {});

  return (
    <main style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${NAVY}, #1a0a2e)`, padding: '18px 14px 40px' }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
          <Link href="/kdoub/room" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: BLUE, textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}><ArrowLeft style={{ width: 16, height: 16 }} /> Lobby</Link>
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

        <div style={{ marginBottom: 12 }}><VoiceCall roomCode={`kdoub-${code}`} token={token} /></div>
        <Chat roomId={`kdoub-${code}`} token={token} />

        {!snap && <div style={{ color: BLUE, textAlign: 'center', padding: 30 }}>{connected ? 'Distribution…' : 'Connexion…'}</div>}

        {snap && (
          <>
            {/* Opponents */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
              {opponents.map((p: any) => {
                const active = snap.currentId === p.id && snap.phase !== 'over';
                return (
                  <div key={p.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: active ? 'rgba(252,211,77,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${active ? GOLD : 'rgba(255,255,255,0.1)'}`, borderRadius: 999, padding: '5px 12px' }}>
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.76rem' }}>{p.isBot ? '🤖' : '🧑'} {p.name}</span>
                    <span style={{ color: BLUE, fontSize: '0.64rem' }}>· {p.count}🂠 · {p.score}pts</span>
                  </div>
                );
              })}
            </div>

            {/* Center */}
            <div style={{ background: `radial-gradient(circle at 50% 40%, ${FELT}, #14071f)`, borderRadius: 24, border: '6px solid #3b1d5e', padding: 18, marginBottom: 12, display: 'flex', gap: 24, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', minHeight: 110 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ position: 'relative', width: 60, height: 84 }}>
                  {snap.pileCount === 0
                    ? <div style={{ width: 56, height: 80, borderRadius: 8, border: '2px dashed rgba(255,255,255,0.2)' }} />
                    : Array.from({ length: Math.min(snap.pileCount, 4) }).map((_, k) => (
                        <span key={k} style={{ position: 'absolute', left: k * 3, top: k * 2 }}>
                          <Image src={CARD_BACK} alt="" width={56} height={80} style={{ display: 'block', borderRadius: 8, boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }} />
                        </span>
                      ))}
                </div>
                <div style={{ color: BLUE, fontSize: '0.7rem', marginTop: 6 }}>Tas ({snap.pileCount})</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'inline-block', background: locked !== null ? `linear-gradient(135deg, ${PURPLE}, ${GOLD})` : 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 18px', minWidth: 90 }}>
                  <div style={{ color: locked !== null ? NAVY : '#94A3B8', fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>Valeur déclarée</div>
                  <div style={{ color: locked !== null ? NAVY : '#fff', fontWeight: 900, fontSize: '1.3rem' }}>{locked !== null ? VALUE_NAME[locked] : '—'}</div>
                </div>
              </div>
            </div>

            <div style={{ color: snap.phase === 'reveal' ? GOLD : BLUE, fontSize: '0.85rem', marginBottom: 8, minHeight: 20, fontWeight: snap.phase === 'reveal' ? 800 : 500 }}>
              {snap.phase === 'over' ? snap.lastEvent
                : iAmDecider ? '🔔 À toi : crie « Kdoub ! » pour contester, ou pose une carte pour enchaîner.'
                : myTurn ? (locked !== null ? `Pose une carte en déclarant « ${VALUE_NAME[locked as CardValue]} ».` : 'Choisis une carte puis la valeur à déclarer.')
                : snap.lastEvent}
            </div>

            {iAmDecider && (
              <button onClick={cryKdoub} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `linear-gradient(90deg, #EF4444, #B91C1C)`, color: '#fff', border: 'none', borderRadius: 12, padding: '10px 22px', fontWeight: 900, cursor: 'pointer', marginBottom: 12, boxShadow: '0 4px 14px rgba(239,68,68,0.5)' }}>
                <Megaphone style={{ width: 18, height: 18 }} /> KDOUB !
              </button>
            )}

            {myTurn && locked === null && sel && (
              <div style={{ background: 'rgba(139,92,246,0.12)', border: `1px solid ${PURPLE}66`, borderRadius: 12, padding: 12, marginBottom: 12 }}>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.82rem', marginBottom: 8 }}>Déclare une valeur (mens si tu veux) :</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {VALUES.map((v) => (
                    <button key={v} onClick={() => playCard(sel, v)} style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 12px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>{VALUE_NAME[v]}</button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ color: '#fff', fontWeight: 800, marginBottom: 8 }}>Votre main ({myHand.length}){me ? ` · ${me.score} pts` : ''}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', minHeight: 90 }}>
              {myHand.map((c) => {
                const playable = myTurn || iAmDecider;
                const chosen = sel === c.id;
                return (
                  <button key={c.id} onClick={() => onCardClick(c)} disabled={!playable} style={{ border: chosen ? `2px solid ${GOLD}` : '1px solid #cbd5e1', borderRadius: 8, padding: 0, background: '#fff', cursor: playable ? 'pointer' : 'default', transform: chosen ? 'translateY(-6px)' : 'none', transition: 'transform .12s', boxShadow: '0 3px 8px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
                    <Image src={cardImage(c)} alt={VALUE_NAME[c.value]} width={54} height={80} style={{ display: 'block', width: 54, height: 80, objectFit: 'cover' }} />
                  </button>
                );
              })}
              {myHand.length === 0 && <span style={{ color: BLUE }}>—</span>}
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 12, marginTop: 14, maxHeight: 130, overflowY: 'auto' }}>
              {(snap.log || []).map((l: string, i: number) => <div key={i} style={{ color: i === 0 ? '#fff' : '#94A3B8', fontSize: '0.8rem', padding: '2px 0' }}>{l}</div>)}
            </div>

            {snap.phase === 'over' && (
              <div style={{ marginTop: 18, textAlign: 'center', background: 'rgba(0,0,0,0.45)', borderRadius: 16, padding: 24 }}>
                <div style={{ fontSize: 44 }}>{snap.winner === myIdx ? '🏆' : '🙃'}</div>
                <h2 style={{ color: '#fff', fontWeight: 900, fontSize: '1.35rem', margin: '8px 0' }}>{snap.winner === myIdx ? 'Vous gagnez la partie !' : `${snap.players[snap.winner]?.name} gagne`}</h2>
                <div style={{ color: BLUE, marginBottom: 14, fontSize: '0.85rem' }}>{snap.players.map((p: any) => `${p.name}: ${p.score}`).join(' · ')}</div>
                <button onClick={rematch} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: NAVY, fontWeight: 900, border: 'none', borderRadius: 12, padding: '12px 28px', cursor: 'pointer' }}><RefreshCw style={{ width: 18, height: 18 }} /> Revanche</button>
                {snap.winner === myIdx && <ChallengeLosers gameType="kdoub" loserIds={opponents.filter((p: any) => !p.isBot).map((p: any) => p.id)} />}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
