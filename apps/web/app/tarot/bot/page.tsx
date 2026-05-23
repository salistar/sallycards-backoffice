/**
 * @file apps/web/app/tarot/bot/page.tsx
 * @description Tarot vs Bots — le joueur est le preneur face à 3 défenseurs IA.
 *   Plis avec obligation de suivre / monter à l'atout, Excuse, bouts, contrat de
 *   points. Cartes rendues en style (pas d'assets tarot) : couleurs ♠♥♦♣,
 *   atouts dorés numérotés, Excuse spéciale. Plateau propre au Tarot.
 */
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import {
  TarotState, TCard, newGame, playHuman, botTurn, rematch, legalCards,
  cardPoints, isBout,
} from '../lib/engine';
import TarotCard from '../lib/TarotCardView';

const NAVY = '#0A1535';
const GOLD = '#FCD34D';
const BLUE = '#93C5FD';
const FELT = '#2a1145';

export default function TarotVsBot() {
  const [st, setSt] = useState<TarotState>(() => newGame());

  useEffect(() => {
    if (st.phase === 'playing' && st.turn !== 0) {
      const t = setTimeout(() => setSt((s) => botTurn(s)), 800);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [st]);

  const me = st.players[0];
  const myTurn = st.phase === 'playing' && st.turn === 0;
  const legal = myTurn ? new Set(legalCards(st, 0).map((c) => c.id)) : new Set<string>();
  const takerBouts = [...st.wonTaker, ...st.ecart].filter(isBout).length;
  const takerPts = Math.round([...st.wonTaker, ...st.ecart].reduce((s, c) => s + cardPoints(c), 0) * 10) / 10;

  return (
    <main style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${NAVY}, #100422)`, padding: '20px 14px 40px' }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <Link href="/tarot" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: BLUE, textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}><ArrowLeft style={{ width: 16, height: 16 }} /> Hub</Link>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: '1.1rem' }}>🃏 Tarot · vs Bots</h1>
          <button onClick={() => setSt(rematch())} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999, padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}><RefreshCw style={{ width: 14, height: 14 }} /> Nouvelle donne</button>
        </div>

        {/* Contrat / points preneur */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ background: 'rgba(252,211,77,0.14)', border: `1px solid ${GOLD}55`, borderRadius: 12, padding: '8px 14px' }}>
            <div style={{ color: '#94A3B8', fontSize: '0.64rem', textTransform: 'uppercase', letterSpacing: 1 }}>Vous (preneur)</div>
            <div style={{ color: GOLD, fontWeight: 900, fontSize: '1.1rem' }}>{takerPts} pts · {takerBouts} bout{takerBouts > 1 ? 's' : ''}</div>
          </div>
          <span style={{ color: BLUE, fontSize: '0.8rem' }}>Contrat : 56 (0 bout) → 36 (3 bouts)</span>
        </div>

        {/* Défenseurs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          {st.players.slice(1).map((p, i) => {
            const idx = i + 1;
            return (
              <div key={p.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: st.turn === idx && st.phase === 'playing' ? 'rgba(252,211,77,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${st.turn === idx && st.phase === 'playing' ? GOLD : 'rgba(255,255,255,0.1)'}`, borderRadius: 999, padding: '5px 12px' }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.76rem' }}>🤖 {p.name}</span>
                <span style={{ color: BLUE, fontSize: '0.64rem' }}>· {p.hand.length}</span>
              </div>
            );
          })}
        </div>

        {/* Pli en cours */}
        <div style={{ background: `radial-gradient(circle at 50% 40%, ${FELT}, #16082b)`, borderRadius: 24, border: '6px solid #3a1f5e', minHeight: 150, padding: 16, marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          {st.trick.length === 0 && <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{myTurn ? 'À vous d’entamer' : 'En attente…'}</span>}
          {st.trick.map((e) => (
            <div key={e.card.id} style={{ textAlign: 'center' }}>
              <TarotCard card={e.card} size={64} />
              <div style={{ color: BLUE, fontSize: '0.62rem', marginTop: 4 }}>{st.players[e.p].name.replace('Bot ', '')}</div>
            </div>
          ))}
        </div>

        {/* Ma main */}
        <div style={{ color: '#fff', fontWeight: 800, marginBottom: 8 }}>Votre main ({me.hand.length}) {myTurn ? '· à vous' : ''}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', minHeight: 96 }}>
          {me.hand.map((c) => {
            const ok = myTurn && legal.has(c.id);
            const dim = myTurn && !ok;
            return (
              <button key={c.id} onClick={() => ok && setSt(playHuman(st, c.id))} disabled={!ok}
                style={{ border: 'none', background: 'transparent', padding: 0, cursor: ok ? 'pointer' : 'default', transform: ok ? 'translateY(-5px)' : 'none', transition: 'transform .15s', opacity: dim ? 0.4 : 1, borderRadius: 8, boxShadow: ok ? `0 0 0 2px ${GOLD}` : 'none' }}>
                <TarotCard card={c} size={58} />
              </button>
            );
          })}
        </div>

        {/* Résultat */}
        {st.phase === 'game_over' && st.result && (
          <div style={{ marginTop: 20, textAlign: 'center', background: 'rgba(0,0,0,0.45)', borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 44 }}>{st.result.takerWins ? '🏆' : '😔'}</div>
            <h2 style={{ color: '#fff', fontWeight: 900, fontSize: '1.4rem', margin: '8px 0' }}>{st.result.takerWins ? 'Contrat réussi !' : 'Contrat chuté'}</h2>
            <p style={{ color: BLUE, marginBottom: 16 }}>{st.result.takerPoints} pts / {st.result.target} requis · {st.result.bouts} bout(s)</p>
            <button onClick={() => setSt(rematch())} style={{ background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: NAVY, fontWeight: 900, border: 'none', borderRadius: 12, padding: '12px 28px', cursor: 'pointer' }}>Nouvelle donne</button>
          </div>
        )}
      </div>
    </main>
  );
}

