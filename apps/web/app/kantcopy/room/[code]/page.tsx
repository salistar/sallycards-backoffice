/**
 * @file apps/web/app/kantcopy/room/[code]/page.tsx
 * @description Table Kant Copy multijoueur temps réel (serveur autoritatif
 *   /game, gameType kantcopy, 2v2 / 4 sièges) + chat + voix TURN. Pioche/défausse,
 *   signale ton carré, annonce « Carte Copie ! » ou vole le Kant adverse.
 */
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { ArrowLeft, RefreshCw, Copy, Check, Hand, Megaphone, Eye } from 'lucide-react';
import { Card, VALUE_NAME, cardImage, CARD_BACK } from '../../lib/engine';
import { resolveGameToken, forceRefreshGameToken } from '../../../games/socketAuth';
import VoiceCall from '../../../games/Voice';
import Chat from '../../../games/Chat';
import ChallengeLosers from '../../../games/ChallengeLosers';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
const NAVY = '#0A1535'; const GOLD = '#FCD34D'; const BLUE = '#93C5FD'; const FELT = '#075056';
const TEAM_COLOR: Record<string, string> = { A: '#0EA5E9', B: '#F97316' };

export default function KantcopyRoom() {
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
      s.on('connect', () => { setConnected(true); setAuthError(false); s!.emit('game:join', { roomCode: code, gameType: 'kantcopy' }); });
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
  const myTeam = me?.team;
  const others = snap ? snap.players.filter((p: any) => p.id !== snap.youId) : [];
  const partner = snap && me ? snap.players.find((p: any) => p.team === myTeam && p.id !== me.id) : null;
  const oppSignaled = snap && me ? snap.players.find((p: any) => p.team !== myTeam && p.signalSent) : null;
  const myTurn = !!(snap && me && snap.phase === 'playing' && snap.currentId === me.id);
  const myHand: Card[] = me?.hand || [];
  const top: Card | null = snap?.discardTop || null;

  const emit = (action: any) => socketRef.current?.emit('game:action', { roomCode: code, action });
  const rematch = () => socketRef.current?.emit('game:start', { roomCode: code });
  const copyCode = () => navigator.clipboard?.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {});

  return (
    <main style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${NAVY}, #05201f)`, padding: '18px 14px 40px' }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
          <Link href="/kantcopy/room" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: BLUE, textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}><ArrowLeft style={{ width: 16, height: 16 }} /> Lobby</Link>
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

        <div style={{ marginBottom: 12 }}><VoiceCall roomCode={`kantcopy-${code}`} token={token} /></div>
        <Chat roomId={`kantcopy-${code}`} token={token} />

        {!snap && <div style={{ color: BLUE, textAlign: 'center', padding: 30 }}>{connected ? 'Distribution…' : 'Connexion…'}</div>}

        {snap && (
          <>
            <div style={{ display: 'flex', gap: 10, margin: '12px 0' }}>
              <ScorePill team="A" score={snap.scoreA} target={snap.target} mine={myTeam === 'A'} />
              <ScorePill team="B" score={snap.scoreB} target={snap.target} mine={myTeam === 'B'} />
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {others.map((p: any) => {
                const active = snap.currentId === p.id && snap.phase === 'playing';
                const isPartner = p.team === myTeam;
                return (
                  <div key={p.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: active ? 'rgba(252,211,77,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${active ? GOLD : TEAM_COLOR[p.team] + '66'}`, borderRadius: 999, padding: '5px 12px' }}>
                    <span style={{ color: TEAM_COLOR[p.team], fontWeight: 800, fontSize: '0.7rem' }}>{p.team}</span>
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.76rem' }}>{isPartner ? '🤝' : (p.isBot ? '🤖' : '🧑')} {p.name}</span>
                    <span style={{ color: BLUE, fontSize: '0.64rem' }}>· {p.count}🂠</span>
                    {p.signalSent && <span title="a fait un signe" style={{ fontSize: 14 }}>👋</span>}
                  </div>
                );
              })}
            </div>

            {/* Centre */}
            <div style={{ background: `radial-gradient(circle at 50% 40%, ${FELT}, #032b2c)`, borderRadius: 24, border: '6px solid #0c4a4f', padding: 18, marginBottom: 12, display: 'flex', gap: 24, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', minHeight: 110 }}>
              <div style={{ textAlign: 'center' }}>
                <button onClick={() => myTurn && snap.step === 'draw' && emit({ type: 'DRAW', from: 'stock' })} disabled={!(myTurn && snap.step === 'draw')} style={{ width: 56, height: 80, borderRadius: 8, padding: 0, overflow: 'hidden', background: '#fff', border: `2px solid ${myTurn && snap.step === 'draw' ? GOLD : '#0c4a4f'}`, cursor: myTurn && snap.step === 'draw' ? 'pointer' : 'default' }}><Image src={CARD_BACK} alt="talon" width={56} height={80} style={{ display: 'block', width: 56, height: 80, objectFit: 'cover' }} /></button>
                <div style={{ color: BLUE, fontSize: '0.7rem', marginTop: 5 }}>Talon ({snap.stockCount})</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                {top
                  ? <button onClick={() => myTurn && snap.step === 'draw' && emit({ type: 'DRAW', from: 'discard' })} disabled={!(myTurn && snap.step === 'draw')} style={{ width: 56, height: 80, borderRadius: 8, padding: 0, overflow: 'hidden', background: '#fff', border: `2px solid ${myTurn && snap.step === 'draw' ? GOLD : '#cbd5e1'}`, cursor: myTurn && snap.step === 'draw' ? 'pointer' : 'default' }}><Image src={cardImage(top)} alt="" width={56} height={80} style={{ display: 'block', width: 56, height: 80, objectFit: 'cover' }} /></button>
                  : <div style={{ width: 56, height: 80, borderRadius: 8, border: '2px dashed rgba(255,255,255,0.2)' }} />}
                <div style={{ color: BLUE, fontSize: '0.7rem', marginTop: 5 }}>Défausse</div>
              </div>
            </div>

            <div style={{ color: snap.phase === 'revealing' ? GOLD : BLUE, fontSize: '0.85rem', marginBottom: 8, minHeight: 20, fontWeight: snap.phase === 'revealing' ? 800 : 500 }}>
              {snap.phase === 'over' ? snap.lastEvent
                : snap.phase === 'revealing' ? snap.lastEvent
                : myTurn ? (snap.step === 'draw' ? 'À toi : pioche au talon ou prends la défausse.' : 'Défausse une carte.')
                : snap.lastEvent}
            </div>

            {snap.phase === 'playing' && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {me?.hasKant && !me?.signalSent && (
                  <button onClick={() => emit({ type: 'SIGNAL' })} style={actBtn('#0EA5E9')}><Hand style={ic} /> 🤫 Signaler mon carré</button>
                )}
                {partner?.signalSent && (
                  <button onClick={() => emit({ type: 'ANNOUNCE', targetId: partner.id })} style={actBtn('#16A34A')}><Megaphone style={ic} /> Carte Copie ! (annoncer {partner.name})</button>
                )}
                {oppSignaled && (
                  <button onClick={() => emit({ type: 'ANNOUNCE', targetId: oppSignaled.id })} style={actBtn('#DC2626')}><Eye style={ic} /> 🦹 Voler {oppSignaled.name} !</button>
                )}
              </div>
            )}

            <div style={{ color: '#fff', fontWeight: 800, marginBottom: 8 }}>Votre main {me?.hasKant ? <span style={{ color: GOLD }}>· CARRÉ de {VALUE_NAME[me.kantValue as keyof typeof VALUE_NAME]} !</span> : ''}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', minHeight: 96 }}>
              {myHand.map((c) => {
                const canDiscard = myTurn && snap.step === 'discard';
                return (
                  <button key={c.id} onClick={() => canDiscard && emit({ type: 'DISCARD', cardId: c.id })} disabled={!canDiscard} style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: 0, background: '#fff', cursor: canDiscard ? 'pointer' : 'default', transform: canDiscard ? 'translateY(-3px)' : 'none', transition: 'transform .12s', boxShadow: canDiscard ? `0 0 0 2px ${GOLD}` : '0 3px 8px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
                    <Image src={cardImage(c)} alt={VALUE_NAME[c.value]} width={62} height={92} style={{ display: 'block', width: 62, height: 92, objectFit: 'cover' }} />
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
                {(() => { const myWin = (myTeam === 'A' && snap.scoreA > snap.scoreB) || (myTeam === 'B' && snap.scoreB > snap.scoreA); return (<>
                  <div style={{ fontSize: 44 }}>{myWin ? '🏆' : '🙃'}</div>
                  <h2 style={{ color: '#fff', fontWeight: 900, fontSize: '1.35rem', margin: '8px 0' }}>{myWin ? 'Votre équipe gagne !' : 'L’équipe adverse gagne'}</h2>
                  <div style={{ color: BLUE, marginBottom: 14 }}>Équipe A {snap.scoreA} – {snap.scoreB} Équipe B</div>
                  <button onClick={rematch} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: NAVY, fontWeight: 900, border: 'none', borderRadius: 12, padding: '12px 28px', cursor: 'pointer' }}><RefreshCw style={{ width: 18, height: 18 }} /> Revanche</button>
                  {myWin && <ChallengeLosers gameType="kantcopy" loserIds={others.filter((p: any) => p.team !== myTeam && !p.isBot).map((p: any) => p.id)} />}
                </>); })()}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function ScorePill({ team, score, target, mine }: { team: string; score: number; target: number; mine: boolean }) {
  return (
    <div style={{ flex: 1, background: `${TEAM_COLOR[team]}22`, border: `1px solid ${TEAM_COLOR[team]}`, borderRadius: 12, padding: '10px 14px' }}>
      <div style={{ color: TEAM_COLOR[team], fontSize: '0.66rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>Équipe {team}{mine ? ' · vous' : ''}</div>
      <div style={{ color: '#fff', fontWeight: 900, fontSize: '1.5rem' }}>{score} <span style={{ color: '#64748B', fontSize: '0.8rem', fontWeight: 600 }}>/ {target}</span></div>
    </div>
  );
}
const ic: React.CSSProperties = { width: 16, height: 16 };
function actBtn(bg: string): React.CSSProperties { return { display: 'inline-flex', alignItems: 'center', gap: 6, background: bg, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 16px', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem' }; }
