/**
 * @file apps/web/app/okey/bot/page.tsx
 * @description Okey vs Bots — pioche/défausse, terminer (Okey) quand la main
 *   forme des groupes valides. Plateau propre : pioche + défausse + chevalet.
 */
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { OkeyState, Tile, newGame, drawTile, discardTile, finish, botStep, finishDiscard, tileLabel, COLOR_HEX } from '../lib/engine';

const NAVY = '#0A1535'; const GOLD = '#FCD34D'; const BLUE = '#93C5FD'; const FELT = '#0E5A36';

export default function OkeyVsBot() {
  const [st, setSt] = useState<OkeyState>(() => newGame());

  useEffect(() => {
    if (st.phase !== 'over' && st.players[st.turn]?.isBot) {
      const t = setTimeout(() => setSt((s) => botStep(s)), 800);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [st]);

  const me = st.players[0];
  const myTurn = st.turn === 0 && st.phase !== 'over';
  const canFinish = myTurn && st.phase === 'discard' && !!finishDiscard(me.hand);
  const topDiscard = st.discardPile[st.discardPile.length - 1];

  return (
    <main style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${NAVY}, #07112a)`, padding: '20px 14px 40px' }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <Link href="/okey" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: BLUE, textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}><ArrowLeft style={{ width: 16, height: 16 }} /> Hub</Link>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: '1.1rem' }}>🀄 Okey · vs Bots</h1>
          <button onClick={() => setSt(newGame())} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999, padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}><RefreshCw style={{ width: 14, height: 14 }} /> Nouvelle partie</button>
        </div>

        {/* Opponents */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {st.players.slice(1).map((p, i) => (
            <div key={p.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: st.turn === i + 1 && st.phase !== 'over' ? 'rgba(252,211,77,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${st.turn === i + 1 && st.phase !== 'over' ? GOLD : 'rgba(255,255,255,0.1)'}`, borderRadius: 999, padding: '5px 12px' }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.76rem' }}>🤖 {p.name}</span><span style={{ color: BLUE, fontSize: '0.64rem' }}>· {p.hand.length}🀫</span>
            </div>
          ))}
        </div>

        {/* Center : pioche + défausse */}
        <div style={{ background: `radial-gradient(circle at 50% 40%, ${FELT}, #093d24)`, borderRadius: 24, border: '6px solid #5b3a1a', padding: 18, marginBottom: 14, display: 'flex', gap: 24, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <button onClick={() => myTurn && st.phase === 'draw' && setSt(drawTile(st, 'pile'))} disabled={!(myTurn && st.phase === 'draw')} style={{ width: 54, height: 74, borderRadius: 10, background: 'linear-gradient(135deg,#1f2937,#374151)', border: `2px solid ${myTurn && st.phase === 'draw' ? GOLD : '#4b5563'}`, color: '#fff', cursor: myTurn && st.phase === 'draw' ? 'pointer' : 'default', fontWeight: 800 }}>🀫</button>
            <div style={{ color: BLUE, fontSize: '0.7rem', marginTop: 4 }}>Pioche ({st.drawPile.length})</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            {topDiscard ? <TileView t={topDiscard} onClick={() => myTurn && st.phase === 'draw' && setSt(drawTile(st, 'discard'))} interactive={myTurn && st.phase === 'draw'} /> : <div style={{ width: 54, height: 74, borderRadius: 10, border: '2px dashed rgba(255,255,255,0.2)' }} />}
            <div style={{ color: BLUE, fontSize: '0.7rem', marginTop: 4 }}>Défausse</div>
          </div>
        </div>

        <div style={{ color: BLUE, fontSize: '0.82rem', marginBottom: 8, minHeight: 18 }}>
          {st.phase === 'over' ? '' : myTurn ? (st.phase === 'draw' ? 'À toi : pioche (pile ou défausse).' : 'Défausse une tuile, ou termine si tu as des groupes valides.') : `Tour de ${st.players[st.turn]?.name}…`}
        </div>

        {/* My rack */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: '#fff', fontWeight: 800 }}>Votre chevalet ({me.hand.length})</span>
          <button onClick={() => setSt(finish(st))} disabled={!canFinish} style={{ background: canFinish ? `linear-gradient(90deg, ${GOLD}, #F59E0B)` : 'rgba(255,255,255,0.08)', color: canFinish ? NAVY : '#64748B', border: 'none', borderRadius: 10, padding: '8px 16px', fontWeight: 800, cursor: canFinish ? 'pointer' : 'default' }}>Terminer (Okey)</button>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', minHeight: 80 }}>
          {me.hand.map((t) => <TileView key={t.id} t={t} onClick={() => myTurn && st.phase === 'discard' && setSt(discardTile(st, t.id))} interactive={myTurn && st.phase === 'discard'} />)}
        </div>

        {st.phase === 'over' && (
          <div style={{ marginTop: 20, textAlign: 'center', background: 'rgba(0,0,0,0.4)', borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 44 }}>{st.winner === 0 ? '🏆' : st.winner == null ? '🤝' : '🤖'}</div>
            <h2 style={{ color: '#fff', fontWeight: 900, fontSize: '1.4rem', margin: '8px 0' }}>{st.winner === 0 ? 'Okey ! Vous gagnez' : st.winner == null ? 'Match nul (pioche vide)' : `${st.players[st.winner].name} gagne`}</h2>
            <button onClick={() => setSt(newGame())} style={{ background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: NAVY, fontWeight: 900, border: 'none', borderRadius: 12, padding: '12px 28px', cursor: 'pointer' }}>Rejouer</button>
          </div>
        )}
      </div>
    </main>
  );
}

function TileView({ t, onClick, interactive }: { t: Tile; onClick?: () => void; interactive?: boolean }) {
  const bg = t.joker ? 'linear-gradient(135deg,#FCD34D,#F59E0B)' : '#fff';
  const col = t.joker ? '#5b3a1a' : COLOR_HEX[t.color!];
  return (
    <button onClick={onClick} disabled={!interactive} style={{ width: 46, height: 64, borderRadius: 8, background: bg, border: interactive ? `2px solid ${'#FCD34D'}` : '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: interactive ? 'pointer' : 'default', boxShadow: '0 3px 8px rgba(0,0,0,0.4)', padding: 0 }}>
      <span style={{ color: col, fontWeight: 900, fontSize: t.joker ? 24 : 20 }}>{tileLabel(t)}</span>
    </button>
  );
}
