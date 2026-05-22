/**
 * @file apps/web/app/belote/bot/page.tsx
 * @description Belote vs Bot (Phase 2) — partie complète jouable au navigateur
 *   contre 3 IA, en utilisant le moteur pur-TS partagé avec le mobile
 *   (./lib/engine). 1 humain (équipe A) + 1 partenaire bot + 2 adversaires bots.
 *   Enchères d'atout, plis avec obligation de suivre, scoring, fin de manche.
 */
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useReducer, useState } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import {
  GameState, gameReducer, initGame,
  botBid, botPlay, getPlayableCards, getCurrentPlayer,
  cardImage, SUITS, SUIT_NAMES, SUIT_SYMBOL, Suit, Card,
} from '../lib/engine';

const NAVY = '#0A1535';
const GOLD = '#FCD34D';
const BLUE = '#93C5FD';
const FELT = '#0E5A36';

const HUMAN_ID = 'player-1';

function start(): GameState {
  return initGame(['Vous'], 3, 10);
}

export default function BeloteVsBot() {
  // Remonter le <Board> via une key réinitialise complètement la partie.
  const [gameId, setGameId] = useState(0);
  return <Board key={gameId} onNewGame={() => setGameId((n) => n + 1)} />;
}

function Board({ onNewGame }: { onNewGame: () => void }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, start);

  const current = getCurrentPlayer(state);
  const isHumanTurn = current?.id === HUMAN_ID;
  const human = state.players.find((p) => p.id === HUMAN_ID)!;

  // ── Pilote IA + auto-avancement ───────────────────────────────
  useEffect(() => {
    if (state.phase === 'game_over') return undefined;

    // Auto: fin de pli → pli suivant
    if (state.phase === 'trick_end') {
      const t = setTimeout(() => dispatch({ type: 'NEXT_TRICK' }), 1100);
      return () => clearTimeout(t);
    }
    // Auto: fin de manche → nouvelle manche
    if (state.phase === 'round_end') {
      const t = setTimeout(() => dispatch({ type: 'NEW_ROUND' }), 1600);
      return () => clearTimeout(t);
    }

    const cur = getCurrentPlayer(state);
    if (!cur || !cur.isBot) return undefined;

    if (state.phase === 'bidding') {
      const t = setTimeout(() => {
        const suit = botBid(cur, state.bids);
        dispatch({ type: 'BID', playerId: cur.id, suit });
      }, 750);
      return () => clearTimeout(t);
    }
    if (state.phase === 'playing') {
      const t = setTimeout(() => {
        try {
          const { cardId } = botPlay(state);
          dispatch({ type: 'PLAY_CARD', playerId: cur.id, cardId });
        } catch { /* noop */ }
      }, 800);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [state]);

  const leadSuit = state.currentTrick.length > 0 ? state.currentTrick[0].card.suit : null;
  const playable = useMemo(
    () => (isHumanTurn && state.phase === 'playing'
      ? getPlayableCards(human.hand, leadSuit, state.trumpSuit, state.currentTrick)
      : []),
    [isHumanTurn, state.phase, human.hand, leadSuit, state.trumpSuit, state.currentTrick]
  );
  const playableIds = new Set(playable.map((c) => c.id));

  const seatOf = (idx: number) => state.players[idx];
  // sièges : 0=bas (humain), 2=haut (partenaire), 1=droite, 3=gauche
  const partner = seatOf(2);
  const right = seatOf(1);
  const left = seatOf(3);

  return (
    <main style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${NAVY}, #07112a)`, padding: '20px 14px 40px' }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Link href="/belote" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: BLUE, textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}>
            <ArrowLeft style={{ width: 16, height: 16 }} /> Hub
          </Link>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: '1.1rem' }}>Belote · vs Bot</h1>
          <button onClick={onNewGame} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999, padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>
            <RefreshCw style={{ width: 14, height: 14 }} /> Nouvelle partie
          </button>
        </div>

        {/* Scoreboard + trump */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <ScorePill label="Équipe A (vous)" value={state.teamScores[0]} accent={state.winnerId === 'team-0'} />
          <ScorePill label="Équipe B" value={state.teamScores[1]} accent={state.winnerId === 'team-1'} />
          <div style={{ flex: 1, minWidth: 120, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, color: BLUE, fontSize: '0.82rem' }}>
            {state.trumpSuit
              ? <>Atout : <strong style={{ color: GOLD }}>{SUIT_SYMBOL[state.trumpSuit]} {SUIT_NAMES[state.trumpSuit]}</strong></>
              : <>Manche {state.roundNumber}</>}
          </div>
        </div>

        {/* Felt table */}
        <div style={{ position: 'relative', background: `radial-gradient(circle at 50% 40%, ${FELT}, #093d24)`, borderRadius: 24, border: '6px solid #5b3a1a', minHeight: 360, padding: 16, boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5)' }}>
          {/* Partner top */}
          <Seat player={partner} position="top" trick={state.currentTrick} active={current?.id === partner.id} />
          {/* Left / Right */}
          <Seat player={left} position="left" trick={state.currentTrick} active={current?.id === left.id} />
          <Seat player={right} position="right" trick={state.currentTrick} active={current?.id === right.id} />

          {/* Center : current trick */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {state.currentTrick.length === 0 && state.phase !== 'bidding' && (
                <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem' }}>En attente…</span>
              )}
              {state.currentTrick.map((e) => (
                <CardImg key={e.card.id} card={e.card} size={58} highlight={e.playerId === state.lastTrickWinner && state.phase === 'trick_end'} />
              ))}
            </div>
          </div>

          {/* Bidding banner */}
          {state.phase === 'bidding' && (
            <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.45)', borderRadius: 999, padding: '6px 16px', color: '#fff', fontSize: '0.8rem', fontWeight: 700 }}>
              Enchères — {current?.name} {current?.isBot ? 'choisit…' : 'à vous'}
            </div>
          )}
        </div>

        {/* Human hand */}
        <div style={{ marginTop: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: '#fff', fontWeight: 800 }}>Votre main {isHumanTurn && state.phase === 'playing' ? '· à vous de jouer' : ''}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', minHeight: 96 }}>
            {human.hand.map((c) => {
              const canPlay = playableIds.has(c.id);
              const dimmed = state.phase === 'playing' && isHumanTurn && !canPlay;
              return (
                <button
                  key={c.id}
                  onClick={() => isHumanTurn && state.phase === 'playing' && canPlay && dispatch({ type: 'PLAY_CARD', playerId: HUMAN_ID, cardId: c.id })}
                  disabled={!(isHumanTurn && state.phase === 'playing' && canPlay)}
                  style={{
                    border: 'none', background: 'transparent', padding: 0, borderRadius: 8,
                    cursor: isHumanTurn && state.phase === 'playing' && canPlay ? 'pointer' : 'default',
                    transform: canPlay && isHumanTurn && state.phase === 'playing' ? 'translateY(-6px)' : 'none',
                    transition: 'transform .15s', opacity: dimmed ? 0.45 : 1,
                    boxShadow: canPlay && isHumanTurn && state.phase === 'playing' ? `0 0 0 2px ${GOLD}` : 'none',
                  }}>
                  <CardImg card={c} size={70} />
                </button>
              );
            })}
            {human.hand.length === 0 && <span style={{ color: BLUE }}>Plus de cartes en main.</span>}
          </div>

          {/* Human bidding controls */}
          {state.phase === 'bidding' && isHumanTurn && (
            <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {SUITS.map((s: Suit) => (
                <button key={s} onClick={() => dispatch({ type: 'BID', playerId: HUMAN_ID, suit: s })}
                  style={{ background: 'rgba(252,211,77,0.15)', color: GOLD, border: `1px solid ${GOLD}55`, borderRadius: 10, padding: '8px 14px', fontWeight: 800, cursor: 'pointer' }}>
                  {SUIT_SYMBOL[s]} {SUIT_NAMES[s]}
                </button>
              ))}
              <button onClick={() => dispatch({ type: 'BID', playerId: HUMAN_ID, suit: null })}
                style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 10, padding: '8px 16px', fontWeight: 800, cursor: 'pointer' }}>
                Passer
              </button>
            </div>
          )}
        </div>

        {/* Game over */}
        {state.phase === 'game_over' && (
          <div style={{ marginTop: 20, textAlign: 'center', background: 'rgba(0,0,0,0.4)', borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 44 }}>{state.winnerId === 'team-0' ? '🏆' : '🤖'}</div>
            <h2 style={{ color: '#fff', fontWeight: 900, fontSize: '1.4rem', margin: '8px 0' }}>
              {state.winnerId === 'team-0' ? 'Vous avez gagné !' : 'L’équipe B l’emporte'}
            </h2>
            <p style={{ color: BLUE, marginBottom: 16 }}>Score final {state.teamScores[0]} – {state.teamScores[1]}</p>
            <button onClick={onNewGame} style={{ background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: NAVY, fontWeight: 900, border: 'none', borderRadius: 12, padding: '12px 28px', cursor: 'pointer' }}>
              Rejouer
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
      <div style={{ color: '#94A3B8', fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ color: accent ? GOLD : '#fff', fontWeight: 900, fontSize: '1.3rem' }}>{value}</div>
    </div>
  );
}

function Seat({ player, position, trick, active }:
  { player: any; position: 'top' | 'left' | 'right'; trick: any[]; active: boolean }) {
  const pos: React.CSSProperties =
    position === 'top' ? { top: 10, left: '50%', transform: 'translateX(-50%)' }
    : position === 'left' ? { left: 10, top: '50%', transform: 'translateY(-50%)' }
    : { right: 10, top: '50%', transform: 'translateY(-50%)' };
  return (
    <div style={{ position: 'absolute', ...pos, textAlign: 'center' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: active ? 'rgba(252,211,77,0.22)' : 'rgba(0,0,0,0.35)', border: `1px solid ${active ? GOLD : 'transparent'}`, borderRadius: 999, padding: '4px 12px' }}>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem' }}>{player.name}</span>
        <span style={{ color: BLUE, fontSize: '0.66rem' }}>· {player.hand.length}🂠</span>
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
