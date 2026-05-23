/**
 * @file apps/web/app/tarot/room/[code]/page.tsx
 * @description Table Tarot multijoueur temps réel (serveur autoritatif /game,
 *   gameType tarot) + appel audio/vidéo TURN. Le siège 0 est le preneur ; les
 *   humains supplémentaires prennent des sièges de défenseurs (sinon bots).
 */
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { ArrowLeft, RefreshCw, Copy, Check } from 'lucide-react';
import { TCard, legalCards, cardLabel, SUIT_SYMBOL, SUIT_RED, isTrump, isExcuse, isBout } from '../../lib/engine';
import VoiceCall from '../../../games/Voice';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
const NAVY = '#0A1535'; const GOLD = '#FCD34D'; const BLUE = '#93C5FD'; const FELT = '#2a1145';

export default function TarotRoom() {
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
    s.on('connect', () => { setConnected(true); s.emit('game:join', { roomCode: code, gameType: 'tarot' }); });
    s.on('disconnect', () => setConnected(false));
    s.on('game:state', (st: any) => setSnap(st));
    return () => { s.disconnect(); socketRef.current = null; };
  }, [token, code]);

  const me = snap?.players.find((p: any) => p.id === snap.youId) || null;
  const myTurn = !!(snap && me && snap.currentId === me.id && snap.phase === 'playing');
  const myHand: TCard[] = (me?.hand || []).filter((c: any) => !c.hidden);
  const iAmTaker = !!(snap && me && snap.players[0]?.id === me.id);

  const legal = useMemo(() => {
    if (!myTurn || !snap) return new Set<string>();
    const fake: any = { players: [{ hand: myHand }], trick: snap.trick };
    return new Set(legalCards(fake, 0).map((c) => c.id));
  }, [myTurn, snap, myHand]);

  const play = (cardId: string) => { if (myTurn && legal.has(cardId)) socketRef.current?.emit('game:action', { roomCode: code, action: { type: 'PLAY_CARD', cardId } }); };
  const rematch = () => socketRef.current?.emit('game:start', { roomCode: code });
  const copyCode = () => navigator.clipboard?.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {});

  return (
    <main style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${NAVY}, #100422)`, padding: '18px 14px 40px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
          <Link href="/tarot/room" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: BLUE, textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}><ArrowLeft style={{ width: 16, height: 16 }} /> Lobby</Link>
          <button onClick={copyCode} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.08)', color: '#fff', border: `1px solid ${GOLD}55`, borderRadius: 999, padding: '6px 14px', cursor: 'pointer', fontWeight: 800, letterSpacing: 2 }}>{copied ? <Check style={{ width: 15, height: 15, color: '#4ADE80' }} /> : <Copy style={{ width: 15, height: 15, color: GOLD }} />} {code}</button>
          <span style={{ color: connected ? '#4ADE80' : '#FCA5A5', fontSize: '0.78rem', fontWeight: 700 }}>{connected ? '● connecté' : '○ connexion…'}</span>
        </div>

        <div style={{ marginBottom: 12 }}><VoiceCall roomCode={code} token={token} /></div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ background: 'rgba(252,211,77,0.14)', border: `1px solid ${GOLD}55`, borderRadius: 12, padding: '8px 14px' }}>
            <div style={{ color: '#94A3B8', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: 1 }}>Preneur</div>
            <div style={{ color: GOLD, fontWeight: 900, fontSize: '1rem' }}>{snap ? `${snap.takerPoints} pts · ${snap.takerBouts} bout(s)` : '—'}</div>
          </div>
          <span style={{ color: BLUE, fontSize: '0.8rem' }}>{iAmTaker ? 'Vous êtes le preneur' : 'Vous êtes défenseur'} · contrat 56→36</span>
        </div>

        {/* Autres joueurs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          {snap?.players.filter((p: any) => p.id !== snap.youId).map((p: any) => (
            <div key={p.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: snap.currentId === p.id && snap.phase === 'playing' ? 'rgba(252,211,77,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${snap.currentId === p.id && snap.phase === 'playing' ? GOLD : 'rgba(255,255,255,0.1)'}`, borderRadius: 999, padding: '5px 12px' }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.74rem' }}>{p.isBot ? '🤖 ' : ''}{p.name}{snap.players[0]?.id === p.id ? ' 👑' : ''}</span>
              <span style={{ color: BLUE, fontSize: '0.62rem' }}>· {p.count}</span>
            </div>
          ))}
        </div>

        {/* Pli */}
        <div style={{ background: `radial-gradient(circle at 50% 40%, ${FELT}, #16082b)`, borderRadius: 24, border: '6px solid #3a1f5e', minHeight: 140, padding: 16, marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          {!snap && <span style={{ color: 'rgba(255,255,255,0.6)' }}>{connected ? 'Distribution…' : 'Connexion…'}</span>}
          {snap && snap.trick.length === 0 && <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{myTurn ? 'À vous d’entamer' : 'En attente…'}</span>}
          {snap?.trick.map((e: any) => (
            <div key={e.card.id} style={{ textAlign: 'center' }}>
              <TarotCard card={e.card} size={62} />
              <div style={{ color: BLUE, fontSize: '0.6rem', marginTop: 4 }}>{snap.players[e.p]?.name.replace('Bot ', '')}</div>
            </div>
          ))}
        </div>

        {/* Ma main */}
        {snap && (
          <>
            <div style={{ color: '#fff', fontWeight: 800, marginBottom: 8 }}>Votre main ({myHand.length}) {myTurn ? '· à vous' : ''}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', minHeight: 90 }}>
              {myHand.map((c) => {
                const ok = myTurn && legal.has(c.id); const dim = myTurn && !ok;
                return <button key={c.id} onClick={() => play(c.id)} disabled={!ok} style={{ border: 'none', background: 'transparent', padding: 0, cursor: ok ? 'pointer' : 'default', transform: ok ? 'translateY(-5px)' : 'none', transition: 'transform .15s', opacity: dim ? 0.4 : 1, borderRadius: 8, boxShadow: ok ? `0 0 0 2px ${GOLD}` : 'none' }}><TarotCard card={c} size={56} /></button>;
              })}
            </div>
          </>
        )}

        {snap?.phase === 'game_over' && snap.result && (
          <div style={{ marginTop: 20, textAlign: 'center', background: 'rgba(0,0,0,0.45)', borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 44 }}>{snap.result.takerWins ? (iAmTaker ? '🏆' : '😔') : (iAmTaker ? '😔' : '🏆')}</div>
            <h2 style={{ color: '#fff', fontWeight: 900, fontSize: '1.4rem', margin: '8px 0' }}>{snap.result.takerWins ? 'Contrat réussi (preneur)' : 'Contrat chuté (défense gagne)'}</h2>
            <p style={{ color: BLUE, marginBottom: 16 }}>{snap.result.takerPoints} pts / {snap.result.target} requis · {snap.result.bouts} bout(s)</p>
            <button onClick={rematch} style={{ background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: NAVY, fontWeight: 900, border: 'none', borderRadius: 12, padding: '12px 28px', cursor: 'pointer' }}><RefreshCw style={{ width: 16, height: 16, display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />Nouvelle donne</button>
          </div>
        )}
      </div>
    </main>
  );
}

function TarotCard({ card, size }: { card: TCard; size: number }) {
  const h = Math.round(size * 1.5);
  const base: React.CSSProperties = { width: size, height: h, borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: 900, boxShadow: '0 4px 10px rgba(0,0,0,0.4)', userSelect: 'none' };
  if (isExcuse(card)) return <div style={{ ...base, background: 'linear-gradient(135deg, #fff, #e9d5ff)', color: '#7C3AED', border: '2px solid #7C3AED' }}><span style={{ fontSize: size * 0.5 }}>★</span><span style={{ fontSize: size * 0.18 }}>Excuse</span></div>;
  if (isTrump(card)) { const bout = isBout(card); return <div style={{ ...base, background: bout ? 'linear-gradient(135deg, #FCD34D, #F59E0B)' : 'linear-gradient(135deg, #Fde68a, #FCD34D)', color: '#5b3a1a', border: bout ? '2px solid #B45309' : '1px solid #d9a441' }}><span style={{ fontSize: size * 0.42 }}>{card.trump}</span><span style={{ fontSize: size * 0.16 }}>★ atout</span></div>; }
  const red = SUIT_RED[card.suit!];
  return <div style={{ ...base, background: '#fff', color: red ? '#DC2626' : '#1f2937', border: '1px solid #cbd5e1' }}><span style={{ fontSize: size * 0.34 }}>{cardLabel(card)}</span><span style={{ fontSize: size * 0.34 }}>{SUIT_SYMBOL[card.suit!]}</span></div>;
}
