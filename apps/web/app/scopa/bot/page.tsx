/**
 * @file apps/web/app/scopa/bot/page.tsx
 * @description Scopa vs Bot — table jouable au navigateur. Capture par valeur ou
 *   par somme, balayage = Scopa, scoring de manche (cartes/denari/settebello/
 *   primiera). Plateau propre à la Scopa (centre + main de 3 cartes).
 */
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { ScopaState, newGame, playHuman, botTurn, newRound, rematch, findCapture, cardImage, Card } from '../lib/engine';

const NAVY = '#0A1535';
const GOLD = '#FCD34D';
const BLUE = '#93C5FD';
const FELT = '#0E5A36';

export default function ScopaVsBot() {
  const [st, setSt] = useState<ScopaState>(() => newGame(11));

  // Bot + auto-avancement des manches
  useEffect(() => {
    if (st.phase === 'playing' && st.turn === 1) {
      const t = setTimeout(() => setSt((s) => botTurn(s)), 850);
      return () => clearTimeout(t);
    }
    if (st.phase === 'round_end') {
      const t = setTimeout(() => setSt((s) => newRound(s)), 2600);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [st]);

  const me = st.players[0];
  const bot = st.players[1];
  const myTurn = st.phase === 'playing' && st.turn === 0;

  return (
    <main style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${NAVY}, #07112a)`, padding: '20px 14px 40px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Link href="/scopa" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: BLUE, textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}><ArrowLeft style={{ width: 16, height: 16 }} /> Hub</Link>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: '1.1rem' }}>🧹 Scopa · vs Bot</h1>
          <button onClick={() => setSt(rematch(st))} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999, padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}><RefreshCw style={{ width: 14, height: 14 }} /> Nouvelle partie</button>
        </div>

        {/* Scores */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <ScorePill label="Vous" value={st.scores[0]} accent={st.winner === 0} />
          <ScorePill label="Bot" value={st.scores[1]} accent={st.winner === 1} />
          <div style={{ flex: 1, minWidth: 120, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, color: BLUE, fontSize: '0.8rem' }}>
            <span>Objectif {st.target} pts</span><span>Manche {st.roundNumber}</span>
          </div>
        </div>

        {/* Bot info */}
        <SeatInfo player={bot} active={st.turn === 1 && st.phase === 'playing'} />

        {/* Table */}
        <div style={{ position: 'relative', background: `radial-gradient(circle at 50% 40%, ${FELT}, #093d24)`, borderRadius: 24, border: '6px solid #5b3a1a', minHeight: 150, padding: 16, margin: '12px 0', boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5)' }}>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Centre ({st.table.length})</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', minHeight: 78, alignItems: 'center' }}>
            {st.table.map((c) => <CardImg key={c.id} card={c} size={52} />)}
            {st.table.length === 0 && <span style={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>Centre vide</span>}
          </div>
        </div>

        {/* Round breakdown */}
        {st.phase === 'round_end' && st.lastBreakdown && (
          <div style={{ background: 'rgba(252,211,77,0.1)', border: `1px solid ${GOLD}55`, borderRadius: 12, padding: 14, marginBottom: 12 }}>
            <div style={{ color: GOLD, fontWeight: 800, marginBottom: 6 }}>Fin de manche — {st.lastBreakdown.pts[0]} / {st.lastBreakdown.pts[1]}</div>
            <div style={{ color: '#CBD5E1', fontSize: '0.82rem' }}>{st.lastBreakdown.labels.join(' · ') || 'Aucun point'} · nouvelle donne…</div>
          </div>
        )}

        {/* My hand */}
        <SeatInfo player={me} active={myTurn} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', minHeight: 100, marginTop: 8 }}>
          {me.hand.map((c) => {
            const cap = findCapture(c.value, st.table);
            const interactive = myTurn;
            return (
              <button key={c.id} onClick={() => myTurn && setSt(playHuman(st, c.id))} disabled={!interactive}
                style={{ border: 'none', background: 'transparent', padding: 0, cursor: interactive ? 'pointer' : 'default', transform: interactive ? 'translateY(-4px)' : 'none', transition: 'transform .15s', boxShadow: interactive && cap ? `0 0 0 2px ${GOLD}` : 'none', borderRadius: 8, position: 'relative' }}>
                <CardImg card={c} size={72} />
                {myTurn && cap && <span style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', background: GOLD, color: NAVY, fontSize: 9, fontWeight: 900, padding: '1px 6px', borderRadius: 999, whiteSpace: 'nowrap' }}>prend {cap.length}</span>}
              </button>
            );
          })}
          {me.hand.length === 0 && <span style={{ color: BLUE }}>Distribution…</span>}
        </div>

        {/* Game over */}
        {st.phase === 'game_over' && (
          <div style={{ marginTop: 20, textAlign: 'center', background: 'rgba(0,0,0,0.4)', borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 44 }}>{st.winner === 0 ? '🏆' : '🤖'}</div>
            <h2 style={{ color: '#fff', fontWeight: 900, fontSize: '1.4rem', margin: '8px 0' }}>{st.winner === 0 ? 'Vous avez gagné !' : 'Le bot l’emporte'}</h2>
            <p style={{ color: BLUE, marginBottom: 16 }}>Score final {st.scores[0]} – {st.scores[1]}</p>
            <button onClick={() => setSt(rematch(st))} style={{ background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: NAVY, fontWeight: 900, border: 'none', borderRadius: 12, padding: '12px 28px', cursor: 'pointer' }}>Rejouer</button>
          </div>
        )}
      </div>
    </main>
  );
}

function ScorePill({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return <div style={{ background: accent ? 'rgba(252,211,77,0.18)' : 'rgba(255,255,255,0.06)', border: `1px solid ${accent ? GOLD : 'rgba(255,255,255,0.12)'}`, borderRadius: 12, padding: '8px 14px' }}><div style={{ color: '#94A3B8', fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div><div style={{ color: accent ? GOLD : '#fff', fontWeight: 900, fontSize: '1.3rem' }}>{value}</div></div>;
}
function SeatInfo({ player, active }: { player: { name: string; isBot: boolean; captured: Card[]; scope: number }; active: boolean }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: active ? 'rgba(252,211,77,0.18)' : 'rgba(255,255,255,0.05)', border: `1px solid ${active ? GOLD : 'rgba(255,255,255,0.1)'}`, borderRadius: 999, padding: '5px 14px' }}>
      <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.82rem' }}>{player.isBot ? '🤖 ' : ''}{player.name}</span>
      <span style={{ color: BLUE, fontSize: '0.72rem' }}>· {player.captured.length} cartes{player.scope ? ` · 🧹×${player.scope}` : ''}</span>
    </div>
  );
}
function CardImg({ card, size }: { card: Card; size: number }) {
  return <span style={{ display: 'inline-block', borderRadius: 6, overflow: 'hidden', background: '#fff', boxShadow: '0 4px 10px rgba(0,0,0,0.4)' }}><Image src={cardImage(card)} alt="" width={size} height={Math.round(size * 1.5)} style={{ display: 'block', width: size, height: 'auto' }} /></span>;
}
