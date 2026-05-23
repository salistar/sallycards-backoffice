/**
 * @file apps/web/app/ronda/bot/page.tsx
 * @description Ronda vs Bots — capture par valeur. Pose une carte ; si sa valeur
 *   est au centre tu captures tout. Ronda/Tringa = bonus. Premier à 21 gagne.
 */
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { RState, Card, cardImage, CARD_BACK, VALUE_NAME, newGame, play, nextRound, botStep } from '../lib/engine';

const NAVY = '#0A1535'; const GOLD = '#FCD34D'; const BLUE = '#93C5FD'; const FELT = '#7c3a08';

export default function RondaVsBot() {
  const [st, setSt] = useState<RState>(() => newGame());

  useEffect(() => {
    if (st.phase === 'over') return;
    if (st.phase === 'round_end') { const t = setTimeout(() => setSt((s) => nextRound(s)), 2200); return () => clearTimeout(t); }
    if (st.players[st.turn]?.isBot) { const t = setTimeout(() => setSt((s) => botStep(s)), 850); return () => clearTimeout(t); }
    return undefined;
  }, [st]);

  const me = st.players[0];
  const myTurn = st.phase === 'playing' && st.turn === 0;

  return (
    <main style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${NAVY}, #2a1505)`, padding: '20px 14px 40px' }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Link href="/ronda" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: BLUE, textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}><ArrowLeft style={{ width: 16, height: 16 }} /> Hub</Link>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: '1.05rem' }}>🎴 Ronda · vs Bots</h1>
          <button onClick={() => setSt(newGame())} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999, padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}><RefreshCw style={{ width: 14, height: 14 }} /> Nouvelle partie</button>
        </div>

        {/* Scores joueurs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          {st.players.map((p, i) => {
            const active = st.turn === i && st.phase === 'playing';
            return (
              <div key={p.id} style={{ flex: 1, minWidth: 120, background: active ? 'rgba(252,211,77,0.16)' : 'rgba(255,255,255,0.05)', border: `1px solid ${active ? GOLD : 'rgba(255,255,255,0.12)'}`, borderRadius: 12, padding: '8px 12px' }}>
                <div style={{ color: '#fff', fontSize: '0.72rem', fontWeight: 700 }}>{i === 0 ? '🧑' : '🤖'} {p.name}{p.ronda ? ' · ronda' : ''}{p.tringa ? ' · tringa' : ''}</div>
                <div style={{ color: GOLD, fontWeight: 900, fontSize: '1.3rem' }}>{p.score} <span style={{ color: '#64748B', fontSize: '0.66rem', fontWeight: 600 }}>/ {st.target} · {p.captures.length}🃏</span></div>
              </div>
            );
          })}
        </div>

        {/* Centre */}
        <div style={{ background: `radial-gradient(circle at 50% 40%, ${FELT}, #1c0d02)`, borderRadius: 24, border: '6px solid #5b3a1a', padding: 18, marginBottom: 14, minHeight: 120 }}>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Centre ({st.table.length}) · pioche {st.deck.length}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', minHeight: 78, alignItems: 'center' }}>
            {st.table.length === 0 && <span style={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>Centre vide</span>}
            {st.table.map((c) => <CardImg key={c.id} card={c} size={52} />)}
          </div>
        </div>

        <div style={{ color: st.phase === 'round_end' ? GOLD : BLUE, fontSize: '0.85rem', marginBottom: 8, minHeight: 18, fontWeight: st.phase === 'round_end' ? 800 : 500 }}>
          {st.phase === 'over' ? st.lastEvent : myTurn ? 'À toi : pose une carte (capture si même valeur au centre).' : st.lastEvent}
        </div>

        {/* Ma main */}
        <div style={{ color: '#fff', fontWeight: 800, marginBottom: 8 }}>Votre main ({me.hand.length})</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', minHeight: 84 }}>
          {me.hand.map((c) => {
            const canCapture = st.table.some((t) => t.value === c.value);
            return (
              <button key={c.id} onClick={() => myTurn && setSt(play(st, c.id))} disabled={!myTurn} style={{ border: canCapture && myTurn ? `2px solid #4ADE80` : '1px solid #cbd5e1', borderRadius: 8, padding: 0, background: '#fff', cursor: myTurn ? 'pointer' : 'default', transform: myTurn ? 'translateY(-3px)' : 'none', transition: 'transform .12s', boxShadow: '0 3px 8px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
                <Image src={cardImage(c)} alt={VALUE_NAME[c.value]} width={58} height={86} style={{ display: 'block', width: 58, height: 86, objectFit: 'cover' }} />
              </button>
            );
          })}
        </div>

        {/* Décompte de manche */}
        {st.phase === 'round_end' && st.roundScores && (
          <div style={{ background: 'rgba(252,211,77,0.1)', border: `1px solid ${GOLD}55`, borderRadius: 12, padding: 14, marginTop: 14 }}>
            <div style={{ color: GOLD, fontWeight: 800, marginBottom: 6 }}>Fin de manche</div>
            {st.roundScores.map((s) => { const p = st.players.find((pp) => pp.id === s.playerId)!; const tags = [s.mostCards && 'cartes', s.mostOros && 'oros', s.settebello && '7♦', s.mostSevens && '7s', s.rondaBonus && 'ronda', s.tringaBonus && 'tringa'].filter(Boolean).join(' · '); return <div key={s.playerId} style={{ color: '#CBD5E1', fontSize: '0.82rem' }}>{p.name} : +{s.total} {tags ? `(${tags})` : ''}</div>; })}
          </div>
        )}

        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 12, marginTop: 14, maxHeight: 120, overflowY: 'auto' }}>
          {st.log.map((l, i) => <div key={i} style={{ color: i === 0 ? '#fff' : '#94A3B8', fontSize: '0.8rem', padding: '2px 0' }}>{l}</div>)}
        </div>

        {st.phase === 'over' && (
          <div style={{ marginTop: 18, textAlign: 'center', background: 'rgba(0,0,0,0.45)', borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 44 }}>{st.winner === 0 ? '🏆' : '🤖'}</div>
            <h2 style={{ color: '#fff', fontWeight: 900, fontSize: '1.35rem', margin: '8px 0' }}>{st.winner === 0 ? 'Vous gagnez !' : `${st.players[st.winner ?? 0].name} gagne`}</h2>
            <div style={{ color: BLUE, marginBottom: 14 }}>{st.players.map((p) => `${p.name}: ${p.score}`).join(' · ')}</div>
            <button onClick={() => setSt(newGame())} style={{ background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: NAVY, fontWeight: 900, border: 'none', borderRadius: 12, padding: '12px 28px', cursor: 'pointer' }}>Rejouer</button>
          </div>
        )}
      </div>
    </main>
  );
}

function CardImg({ card, size }: { card: Card; size: number }) {
  return <span style={{ display: 'inline-block', borderRadius: 6, overflow: 'hidden', background: '#fff', boxShadow: '0 4px 10px rgba(0,0,0,0.4)' }}><Image src={cardImage(card)} alt="" width={size} height={Math.round(size * 1.5)} style={{ display: 'block', width: size, height: 'auto' }} /></span>;
}
