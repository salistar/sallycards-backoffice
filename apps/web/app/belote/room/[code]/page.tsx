/**
 * @file apps/web/app/belote/room/[code]/page.tsx
 * @description Table Belote multijoueur temps réel (Phase 3). Le SERVEUR fait
 *   foi : on se connecte au namespace /game, on émet game:join puis game:action,
 *   et on rend la vue personnalisée reçue via game:state (ma main visible, celles
 *   des autres masquées). Web ↔ mobile dans la même room + appel vocal TURN/STUN.
 */
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { ArrowLeft, RefreshCw, Copy, Check } from 'lucide-react';
import {
  getPlayableCards, cardImage, CARD_BACK,
  SUITS, SUIT_NAMES, SUIT_SYMBOL, Suit, Card,
} from '../../lib/engine';
import VoiceCall from '../_voice';
import Chat from '../../../games/Chat';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
const NAVY = '#0A1535';
const GOLD = '#FCD34D';
const BLUE = '#93C5FD';
const FELT = '#0E5A36';

type HiddenCard = { hidden: true; id: string };
interface SeatPlayer { id: string; name: string; isBot: boolean; team: number; hand: (Card | HiddenCard)[] }
interface Snapshot {
  youId: string;
  phase: 'waiting' | 'bidding' | 'playing' | 'trick_end' | 'round_end' | 'game_over';
  players: SeatPlayer[];
  currentPlayerIndex: number;
  trumpSuit: Suit | null;
  currentTrick: { playerId: string; card: Card }[];
  teamScores: [number, number];
  roundNumber: number;
  winnerId: string | null;
  lastTrickWinner: string | null;
  bids: { playerId: string; suit: Suit | null }[];
}

export default function RoomTable() {
  const params = useParams<{ code: string }>();
  const code = (params?.code || '').toString().toUpperCase();

  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    setToken(typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
  }, []);

  useEffect(() => {
    if (!token || !code) return;
    const s = io(`${SOCKET_URL}/game`, { transports: ['websocket'], auth: { token } });
    socketRef.current = s;
    s.on('connect', () => { setConnected(true); s.emit('game:join', { roomCode: code }); });
    s.on('disconnect', () => setConnected(false));
    s.on('game:state', (snapshot: Snapshot) => setSnap(snapshot));
    s.on('game:error', () => { /* ignore : géré par l'UI d'attente */ });
    return () => { s.disconnect(); socketRef.current = null; };
  }, [token, code]);

  const me = snap?.players.find((p) => p.id === snap.youId) || null;
  const mySeat = snap && me ? snap.players.indexOf(me) : -1;
  const current = snap ? snap.players[snap.currentPlayerIndex] : null;
  const isMyTurn = !!(snap && me && current?.id === me.id);

  const myHand = (me?.hand || []).filter((c): c is Card => !(c as HiddenCard).hidden);
  const leadSuit = snap && snap.currentTrick.length > 0 ? snap.currentTrick[0].card.suit : null;
  const playable = useMemo(
    () => (isMyTurn && snap?.phase === 'playing' ? getPlayableCards(myHand, leadSuit, snap?.trumpSuit ?? null, snap?.currentTrick ?? []) : []),
    [isMyTurn, snap?.phase, myHand, leadSuit, snap?.trumpSuit],
  );
  const playableIds = new Set(playable.map((c) => c.id));

  const emitAction = (action: any) => socketRef.current?.emit('game:action', { roomCode: code, action });
  const playCard = (cardId: string) => { if (isMyTurn && snap?.phase === 'playing' && playableIds.has(cardId)) emitAction({ type: 'PLAY_CARD', cardId }); };
  const bid = (suit: Suit | null) => { if (isMyTurn && snap?.phase === 'bidding') emitAction({ type: 'BID', suit }); };
  const rematch = () => socketRef.current?.emit('game:start', { roomCode: code });

  const copyCode = () => { navigator.clipboard?.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {}); };

  // Sièges relatifs : moi en bas, partenaire en haut, adversaires sur les côtés
  const seatAt = (offset: number): SeatPlayer | null => (snap && mySeat >= 0 ? snap.players[(mySeat + offset) % 4] : null);
  const partner = seatAt(2);
  const right = seatAt(1);
  const left = seatAt(3);

  const myTeam = me?.team ?? 0;

  return (
    <main style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${NAVY}, #07112a)`, padding: '18px 14px 40px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
          <Link href="/belote/room" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: BLUE, textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}>
            <ArrowLeft style={{ width: 16, height: 16 }} /> Lobby
          </Link>
          <button onClick={copyCode} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.08)', color: '#fff', border: `1px solid ${GOLD}55`, borderRadius: 999, padding: '6px 14px', cursor: 'pointer', fontWeight: 800, letterSpacing: 2 }}>
            {copied ? <Check style={{ width: 15, height: 15, color: '#4ADE80' }} /> : <Copy style={{ width: 15, height: 15, color: GOLD }} />} {code}
          </button>
          <span style={{ color: connected ? '#4ADE80' : '#FCA5A5', fontSize: '0.78rem', fontWeight: 700 }}>
            {connected ? '● connecté' : '○ connexion…'}
          </span>
        </div>

        {/* Appel vocal */}
        <div style={{ marginBottom: 12 }}>
          <VoiceCall roomCode={code} token={token} />
        </div>
        <Chat roomId={`belote-${code}`} token={token} />

        {/* Scoreboard + atout */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <ScorePill label="Votre équipe" value={snap?.teamScores[myTeam] ?? 0} accent={snap?.winnerId === `team-${myTeam}`} />
          <ScorePill label="Adversaires" value={snap?.teamScores[(myTeam + 1) % 2] ?? 0} accent={!!snap?.winnerId && snap?.winnerId !== `team-${myTeam}`} />
          <div style={{ flex: 1, minWidth: 120, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, color: BLUE, fontSize: '0.82rem' }}>
            {snap?.trumpSuit ? <>Atout : <strong style={{ color: GOLD }}>{SUIT_SYMBOL[snap.trumpSuit]} {SUIT_NAMES[snap.trumpSuit]}</strong></> : <>Manche {snap?.roundNumber ?? '—'}</>}
          </div>
        </div>

        {/* Table */}
        <div style={{ position: 'relative', background: `radial-gradient(circle at 50% 40%, ${FELT}, #093d24)`, borderRadius: 24, border: '6px solid #5b3a1a', minHeight: 340, padding: 16, boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5)' }}>
          {!snap && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>
              {connected ? 'Distribution…' : 'Connexion à la room…'}
            </div>
          )}
          {snap && (
            <>
              <Seat player={partner} pos="top" active={current?.id === partner?.id} />
              <Seat player={left} pos="left" active={current?.id === left?.id} />
              <Seat player={right} pos="right" active={current?.id === right?.id} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {snap.currentTrick.length === 0 && snap.phase !== 'bidding' && <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>En attente…</span>}
                  {snap.currentTrick.map((e) => (
                    <CardImg key={e.card.id} card={e.card} size={56} highlight={e.playerId === snap.lastTrickWinner && snap.phase === 'trick_end'} />
                  ))}
                </div>
              </div>
              {snap.phase === 'bidding' && (
                <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.45)', borderRadius: 999, padding: '6px 16px', color: '#fff', fontSize: '0.8rem', fontWeight: 700 }}>
                  Enchères — {current?.name} {isMyTurn ? '· à vous' : '…'}
                </div>
              )}
            </>
          )}
        </div>

        {/* Ma main */}
        {snap && (
          <div style={{ marginTop: 18 }}>
            <div style={{ color: '#fff', fontWeight: 800, marginBottom: 8 }}>
              Votre main {isMyTurn && snap.phase === 'playing' ? '· à vous de jouer' : ''}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', minHeight: 96 }}>
              {myHand.map((c) => {
                const canPlay = playableIds.has(c.id);
                const dimmed = snap.phase === 'playing' && isMyTurn && !canPlay;
                const interactive = isMyTurn && snap.phase === 'playing' && canPlay;
                return (
                  <button key={c.id} onClick={() => playCard(c.id)} disabled={!interactive}
                    style={{ border: 'none', background: 'transparent', padding: 0, cursor: interactive ? 'pointer' : 'default', transform: interactive ? 'translateY(-6px)' : 'none', transition: 'transform .15s', opacity: dimmed ? 0.45 : 1, boxShadow: interactive ? `0 0 0 2px ${GOLD}` : 'none', borderRadius: 8 }}>
                    <CardImg card={c} size={68} />
                  </button>
                );
              })}
              {myHand.length === 0 && <span style={{ color: BLUE }}>Plus de cartes en main.</span>}
            </div>

            {snap.phase === 'bidding' && isMyTurn && (
              <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                {SUITS.map((s: Suit) => (
                  <button key={s} onClick={() => bid(s)} style={{ background: 'rgba(252,211,77,0.15)', color: GOLD, border: `1px solid ${GOLD}55`, borderRadius: 10, padding: '8px 14px', fontWeight: 800, cursor: 'pointer' }}>
                    {SUIT_SYMBOL[s]} {SUIT_NAMES[s]}
                  </button>
                ))}
                <button onClick={() => bid(null)} style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 10, padding: '8px 16px', fontWeight: 800, cursor: 'pointer' }}>Passer</button>
              </div>
            )}
          </div>
        )}

        {/* Fin de partie */}
        {snap?.phase === 'game_over' && (
          <div style={{ marginTop: 20, textAlign: 'center', background: 'rgba(0,0,0,0.4)', borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 44 }}>{snap.winnerId === `team-${myTeam}` ? '🏆' : '🤝'}</div>
            <h2 style={{ color: '#fff', fontWeight: 900, fontSize: '1.4rem', margin: '8px 0' }}>
              {snap.winnerId === `team-${myTeam}` ? 'Votre équipe gagne !' : 'L’équipe adverse gagne'}
            </h2>
            <p style={{ color: BLUE, marginBottom: 16 }}>Score {snap.teamScores[myTeam]} – {snap.teamScores[(myTeam + 1) % 2]}</p>
            <button onClick={rematch} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: NAVY, fontWeight: 900, border: 'none', borderRadius: 12, padding: '12px 28px', cursor: 'pointer' }}>
              <RefreshCw style={{ width: 18, height: 18 }} /> Revanche
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function ScorePill({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div style={{ background: accent ? 'rgba(252,211,77,0.18)' : 'rgba(255,255,255,0.06)', border: `1px solid ${accent ? GOLD : 'rgba(255,255,255,0.12)'}`, borderRadius: 12, padding: '8px 14px' }}>
      <div style={{ color: '#94A3B8', fontSize: '0.64rem', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ color: accent ? GOLD : '#fff', fontWeight: 900, fontSize: '1.3rem' }}>{value}</div>
    </div>
  );
}

function Seat({ player, pos, active }: { player: SeatPlayer | null; pos: 'top' | 'left' | 'right'; active: boolean }) {
  if (!player) return null;
  const style: React.CSSProperties =
    pos === 'top' ? { top: 10, left: '50%', transform: 'translateX(-50%)' }
    : pos === 'left' ? { left: 10, top: '50%', transform: 'translateY(-50%)' }
    : { right: 10, top: '50%', transform: 'translateY(-50%)' };
  return (
    <div style={{ position: 'absolute', ...style, textAlign: 'center' }}>
      <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginBottom: 6 }}>
        {player.hand.slice(0, 5).map((_, i) => (
          <Image key={i} src={CARD_BACK} alt="" width={20} height={30} style={{ borderRadius: 3, marginLeft: i ? -10 : 0 }} />
        ))}
      </div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: active ? 'rgba(252,211,77,0.22)' : 'rgba(0,0,0,0.35)', border: `1px solid ${active ? GOLD : 'transparent'}`, borderRadius: 999, padding: '4px 12px' }}>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.76rem' }}>{player.isBot ? '🤖 ' : ''}{player.name}</span>
        <span style={{ color: BLUE, fontSize: '0.64rem' }}>· {player.hand.length}</span>
      </div>
    </div>
  );
}

function CardImg({ card, size, highlight }: { card: Card; size: number; highlight?: boolean }) {
  return (
    <span style={{ display: 'inline-block', borderRadius: 6, overflow: 'hidden', background: '#fff', boxShadow: highlight ? `0 0 0 3px ${GOLD}` : '0 4px 10px rgba(0,0,0,0.4)' }}>
      <Image src={cardImage(card)} alt="" width={size} height={Math.round(size * 1.5)} style={{ display: 'block', width: size, height: 'auto' }} />
    </span>
  );
}
