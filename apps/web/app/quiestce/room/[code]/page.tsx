/**
 * @file apps/web/app/quiestce/room/[code]/page.tsx
 * @description Table Qui-est-ce ? multijoueur temps réel (serveur autoritatif
 *   /game, gameType quiestce, 2 sièges) + appel audio/vidéo TURN + chat. Rend la
 *   vue game:state : grille de suspects, questions, deviner, journal.
 */
'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { ArrowLeft, RefreshCw, Copy, Check, HelpCircle } from 'lucide-react';
import { resolveGameToken, forceRefreshGameToken } from '../../../games/socketAuth';
import VoiceCall from '../../../games/Voice';
import Chat from '../../../games/Chat';
import ChallengeLosers from '../../../games/ChallengeLosers';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
const NAVY = '#0A1535'; const GOLD = '#FCD34D'; const BLUE = '#93C5FD';
const HAIR: Record<string, string> = { brun: '#7c4a1e', blond: '#f5d76e', roux: '#d2601a', blanc: '#e5e7eb' };

export default function QuiEstCeRoom() {
  const params = useParams<{ code: string }>();
  const code = (params?.code || '').toString().toUpperCase();
  const [snap, setSnap] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [guessMode, setGuessMode] = useState(false);
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
      s.on('connect', () => { setConnected(true); setAuthError(false); s!.emit('game:join', { roomCode: code, gameType: 'quiestce' }); });
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

  const persos: any[] = snap?.personnages || [];
  const questions: any[] = snap?.questions || [];
  const me = snap?.players.find((p: any) => p.id === snap.youId) || null;
  const myIdx = snap && me ? snap.players.indexOf(me) : -1;
  const opp = snap ? snap.players.find((p: any) => p.id !== snap.youId) : null;
  const myTurn = !!(snap && me && snap.currentId === me.id && snap.phase === 'playing');
  const alive = new Set<number>(me?.myCandidates || []);
  const secret = me && typeof me.secret === 'number' ? persos[me.secret] : null;

  const ask = (key: string) => { if (myTurn) socketRef.current?.emit('game:action', { roomCode: code, action: { type: 'ASK', key } }); };
  const doGuess = (persoId: number) => { if (myTurn) socketRef.current?.emit('game:action', { roomCode: code, action: { type: 'GUESS', persoId } }); };
  const rematch = () => { setGuessMode(false); socketRef.current?.emit('game:start', { roomCode: code }); };
  const copyCode = () => navigator.clipboard?.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {});

  return (
    <main style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${NAVY}, #0a0820)`, padding: '18px 14px 40px' }}>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
          <Link href="/quiestce/room" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: BLUE, textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}><ArrowLeft style={{ width: 16, height: 16 }} /> Lobby</Link>
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

        <div style={{ marginBottom: 12 }}><VoiceCall roomCode={`quiestce-${code}`} token={token} /></div>
        <Chat roomId={`quiestce-${code}`} token={token} />

        {!snap && <div style={{ color: BLUE, textAlign: 'center', padding: 30 }}>{connected ? 'Distribution des personnages…' : 'Connexion…'}</div>}

        {snap && (
          <>
            <div style={{ display: 'flex', gap: 10, margin: '12px 0', flexWrap: 'wrap', alignItems: 'center' }}>
              {secret && (
                <div style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.5)', borderRadius: 12, padding: '8px 14px' }}>
                  <div style={{ color: '#A5B4FC', fontSize: '0.64rem', textTransform: 'uppercase', letterSpacing: 1 }}>Ton personnage secret ({opp?.name || 'l’adversaire'} doit le deviner)</div>
                  <div style={{ color: '#fff', fontWeight: 800 }}>{secret.emoji} {secret.name}</div>
                </div>
              )}
              <span style={{ color: BLUE, fontSize: '0.82rem' }}>{alive.size} suspects restants · {myTurn ? 'à toi' : `tour de ${snap.players[snap.turn]?.name}`}</span>
            </div>

            {/* Grille */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(92px, 1fr))', gap: 8, marginBottom: 14 }}>
              {persos.map((p) => {
                const elim = !alive.has(p.id);
                const clickable = myTurn && guessMode && !elim;
                return (
                  <button key={p.id} onClick={() => clickable && doGuess(p.id)} disabled={!clickable}
                    style={{ position: 'relative', background: '#152A47', border: `1px solid ${clickable ? GOLD : 'rgba(255,255,255,0.1)'}`, borderRadius: 12, padding: '8px 4px', opacity: elim ? 0.25 : 1, cursor: clickable ? 'pointer' : 'default', textAlign: 'center' }}>
                    <div style={{ fontSize: 26 }}>{p.emoji}</div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.72rem' }}>{p.name}</div>
                    <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginTop: 3, alignItems: 'center' }}>
                      <span style={{ width: 9, height: 9, borderRadius: 999, background: HAIR[p.cheveux] }} title={p.cheveux} />
                      {p.lunettes && <span style={{ fontSize: 10 }}>👓</span>}
                      {p.chapeau && <span style={{ fontSize: 10 }}>🎩</span>}
                      {p.barbe && <span style={{ fontSize: 10 }}>🧔</span>}
                    </div>
                    {elim && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', fontSize: 28, fontWeight: 900 }}>✕</div>}
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            {snap.phase === 'playing' && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <button onClick={() => setGuessMode((g) => !g)} disabled={!myTurn} style={{ background: guessMode ? `linear-gradient(90deg, ${GOLD}, #F59E0B)` : 'rgba(255,255,255,0.08)', color: guessMode ? NAVY : '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px 16px', fontWeight: 800, cursor: myTurn ? 'pointer' : 'default' }}>
                  {guessMode ? '🎯 Clique un suspect pour deviner' : 'Mode deviner'}
                </button>
                {!guessMode && <span style={{ color: BLUE, fontSize: '0.8rem' }}>{myTurn ? 'Pose une question :' : 'En attente…'}</span>}
              </div>
            )}
            {snap.phase === 'playing' && !guessMode && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                {questions.map((q) => (
                  <button key={q.key} onClick={() => ask(q.key)} disabled={!myTurn} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(99,102,241,0.15)', color: '#C7D2FE', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 999, padding: '7px 14px', fontWeight: 700, fontSize: '0.82rem', cursor: myTurn ? 'pointer' : 'default' }}>
                    <HelpCircle style={{ width: 14, height: 14 }} /> {q.label}
                  </button>
                ))}
              </div>
            )}

            {/* Journal */}
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 12, maxHeight: 150, overflowY: 'auto' }}>
              {(snap.log || []).map((l: string, i: number) => <div key={i} style={{ color: i === 0 ? '#fff' : '#94A3B8', fontSize: '0.82rem', padding: '2px 0' }}>{l}</div>)}
            </div>

            {snap.phase === 'over' && (
              <div style={{ marginTop: 16, textAlign: 'center', background: 'rgba(0,0,0,0.45)', borderRadius: 16, padding: 24 }}>
                <div style={{ fontSize: 44 }}>{snap.winner === myIdx ? '🏆' : '🙃'}</div>
                <h2 style={{ color: '#fff', fontWeight: 900, fontSize: '1.4rem', margin: '8px 0' }}>{snap.winner === myIdx ? 'Tu as deviné !' : `${snap.players[snap.winner]?.name} a gagné`}</h2>
                <button onClick={rematch} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: NAVY, fontWeight: 900, border: 'none', borderRadius: 12, padding: '12px 28px', cursor: 'pointer' }}><RefreshCw style={{ width: 18, height: 18 }} /> Revanche</button>
                {snap.winner === myIdx && opp && !opp.isBot && <ChallengeLosers gameType="quiestce" loserIds={[opp.id]} />}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
