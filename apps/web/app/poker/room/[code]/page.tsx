/**
 * @file apps/web/app/poker/room/[code]/page.tsx
 * @description Table Poker Texas Hold'em multijoueur temps réel (serveur
 *   autoritatif /game, gameType poker, 2-4 sièges) + chat + voix TURN. Enchères,
 *   flop/turn/river, abattage. Le serveur masque les cartes privées des autres.
 */
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { ArrowLeft, RefreshCw, Copy, Check } from 'lucide-react';
import { Card, cardImage, CARD_BACK, evaluateHand, HAND_FR } from '../../lib/engine';
import { resolveGameToken, forceRefreshGameToken } from '../../../games/socketAuth';
import VoiceCall from '../../../games/Voice';
import Chat from '../../../games/Chat';
import ChallengeLosers from '../../../games/ChallengeLosers';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
const NAVY = '#0A1535'; const GOLD = '#FCD34D'; const BLUE = '#93C5FD'; const FELT = '#7F1D1D';

export default function PokerRoom() {
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
      s.on('connect', () => { setConnected(true); setAuthError(false); s!.emit('game:join', { roomCode: code, gameType: 'poker' }); });
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
  const others = snap ? snap.players.filter((p: any) => p.id !== snap.youId) : [];
  const betting = snap && ['preflop', 'flop', 'turn', 'river'].includes(snap.phase);
  const myTurn = !!(snap && me && betting && snap.currentId === me.id && !me.folded && !me.isAllIn);
  const toCall = me ? snap.currentBet - me.currentBet : 0;
  const show = snap && (snap.phase === 'showdown' || snap.phase === 'game_over');
  const community: Card[] = snap?.communityCards || [];

  const emit = (action: any) => socketRef.current?.emit('game:action', { roomCode: code, action });
  const rematch = () => socketRef.current?.emit('game:start', { roomCode: code });
  const copyCode = () => navigator.clipboard?.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {});
  const myEval = me?.hand && me.hand.length === 2 ? evaluateHand(me.hand, community) : null;

  return (
    <main style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${NAVY}, #2a0a0a)`, padding: '18px 14px 40px' }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
          <Link href="/poker/room" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: BLUE, textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}><ArrowLeft style={{ width: 16, height: 16 }} /> Lobby</Link>
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

        <div style={{ marginBottom: 12 }}><VoiceCall roomCode={`poker-${code}`} token={token} /></div>
        <Chat roomId={`poker-${code}`} token={token} />

        {!snap && <div style={{ color: BLUE, textAlign: 'center', padding: 30 }}>{connected ? 'Distribution…' : 'Connexion…'}</div>}

        {snap && (
          <>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
              {others.map((p: any) => {
                const active = snap.currentId === p.id && betting;
                return (
                  <div key={p.id} style={{ background: active ? 'rgba(252,211,77,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${active ? GOLD : 'rgba(255,255,255,0.12)'}`, borderRadius: 12, padding: '6px 10px', opacity: p.folded ? 0.5 : 1 }}>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.74rem' }}>{p.isBot ? '🤖' : '🧑'} {p.name} · {p.chips}🪙</div>
                    <div style={{ display: 'flex', gap: 3, marginTop: 4, alignItems: 'center' }}>
                      {p.hand ? p.hand.map((c: Card) => <CardImg key={c.id} card={c} size={30} />) : Array.from({ length: p.handCount || 0 }).map((_, k) => <MiniBack key={k} />)}
                      {p.currentBet > 0 && <span style={{ color: GOLD, fontSize: '0.66rem', marginLeft: 4 }}>mise {p.currentBet}</span>}
                      {p.folded && <span style={{ color: '#FCA5A5', fontSize: '0.66rem', marginLeft: 4 }}>couché</span>}
                      {p.isAllIn && <span style={{ color: '#FDE68A', fontSize: '0.66rem', marginLeft: 4 }}>TAPIS</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ background: `radial-gradient(circle at 50% 40%, ${FELT}, #3b0a0a)`, borderRadius: 24, border: '6px solid #5b1a1a', padding: 18, marginBottom: 14, minHeight: 150 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: GOLD, fontWeight: 800, fontSize: '0.8rem', marginBottom: 10 }}>
                <span>Pot : {snap.pot}</span><span>Mise : {snap.currentBet}</span><span style={{ textTransform: 'capitalize' }}>{snap.phase}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', minHeight: 84, alignItems: 'center', flexWrap: 'wrap' }}>
                {community.length === 0 && <span style={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>En attente du flop…</span>}
                {community.map((c) => <CardImg key={c.id} card={c} size={56} />)}
              </div>
              <div style={{ color: '#FDE68A', fontSize: '0.8rem', textAlign: 'center', marginTop: 10, minHeight: 16 }}>{snap.lastAction}</div>
            </div>

            {show && (
              <div style={{ background: 'rgba(252,211,77,0.12)', border: `1px solid ${GOLD}66`, borderRadius: 12, padding: 14, marginBottom: 12, textAlign: 'center' }}>
                <div style={{ color: GOLD, fontWeight: 900, fontSize: '1.05rem' }}>
                  {snap.phase === 'game_over' ? `🏆 Partie terminée — ${snap.players.find((p: any) => p.id === snap.winnerId)?.name || '?'} remporte tout !` : `🏆 ${snap.players.find((p: any) => p.id === snap.winnerId)?.name || '?'} gagne le pot (${snap.pot})`}
                </div>
                {snap.winnerHandDescription && snap.phase !== 'game_over' && <div style={{ color: '#CBD5E1', fontSize: '0.85rem', marginTop: 4 }}>{snap.winnerHandDescription}</div>}
                {snap.phase === 'game_over' && <button onClick={rematch} style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 8, background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: NAVY, fontWeight: 900, border: 'none', borderRadius: 12, padding: '10px 24px', cursor: 'pointer' }}><RefreshCw style={{ width: 18, height: 18 }} /> Nouvelle partie</button>}
                {snap.phase === 'showdown' && <div style={{ color: '#94A3B8', fontSize: '0.78rem', marginTop: 6 }}>Nouvelle manche…</div>}
                {snap.phase === 'game_over' && snap.winnerId === snap.youId && <ChallengeLosers gameType="poker" loserIds={others.filter((p: any) => !p.isBot).map((p: any) => p.id)} />}
              </div>
            )}

            <div style={{ color: '#fff', fontWeight: 800, marginBottom: 8 }}>
              Vous · {me?.chips ?? 0} jetons {me?.currentBet ? `· mise ${me.currentBet}` : ''} {me?.folded ? '· couché' : me?.isAllIn ? '· TAPIS' : ''}
              {myEval && !me?.folded && <span style={{ color: GOLD, marginLeft: 8 }}>· {HAND_FR[myEval.rank]}</span>}
            </div>
            <div style={{ display: 'flex', gap: 8, minHeight: 78 }}>
              {(me?.hand || []).map((c: Card) => <CardImg key={c.id} card={c} size={54} />)}
              {(!me?.hand || me.hand.length === 0) && <span style={{ color: BLUE }}>—</span>}
            </div>

            {myTurn && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                <button onClick={() => emit({ type: 'FOLD' })} style={btn('#DC2626')}>Se coucher</button>
                {toCall === 0
                  ? <>
                      <button onClick={() => emit({ type: 'CHECK' })} style={btn('#334155')}>Check</button>
                      <button onClick={() => emit({ type: 'BET', amount: Math.min(snap.bigBlind * 2, me.chips) })} style={btn('#16A34A')}>Miser {Math.min(snap.bigBlind * 2, me.chips)}</button>
                    </>
                  : <button onClick={() => emit({ type: 'CALL' })} style={btn('#16A34A')}>Suivre {Math.min(toCall, me.chips)}</button>}
                {snap.currentBet > 0 && toCall < me.chips && <button onClick={() => emit({ type: 'RAISE', amount: Math.min(snap.currentBet + snap.bigBlind * 2, me.chips + me.currentBet) })} style={btn('#7C3AED')}>Relancer à {Math.min(snap.currentBet + snap.bigBlind * 2, me.chips + me.currentBet)}</button>}
                <button onClick={() => emit(snap.currentBet > 0 ? { type: 'RAISE', amount: me.chips + me.currentBet } : { type: 'BET', amount: me.chips })} style={btn('#B45309')}>Tapis ({me.chips})</button>
              </div>
            )}

            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 10, marginTop: 14, color: BLUE, fontSize: '0.78rem' }}>Manche {snap.roundNumber} · blinds {snap.smallBlind}/{snap.bigBlind}</div>
          </>
        )}
      </div>
    </main>
  );
}

function CardImg({ card, size }: { card: Card; size: number }) {
  return <span style={{ display: 'inline-block', borderRadius: 5, overflow: 'hidden', background: '#fff', boxShadow: '0 3px 8px rgba(0,0,0,0.4)' }}><Image src={cardImage(card)} alt="" width={size} height={Math.round(size * 1.45)} style={{ display: 'block', width: size, height: 'auto' }} /></span>;
}
function MiniBack() { return <span style={{ display: 'inline-block', borderRadius: 4, overflow: 'hidden' }}><Image src={CARD_BACK} alt="" width={30} height={43} style={{ display: 'block' }} /></span>; }
function btn(bg: string): React.CSSProperties { return { background: bg, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem' }; }
