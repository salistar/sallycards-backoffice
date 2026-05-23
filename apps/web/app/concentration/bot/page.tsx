/**
 * @file apps/web/app/concentration/bot/page.tsx
 * @description Concentration (mémoire) vs Bots — tour par tour. Retourne 2 cartes,
 *   trouve les paires (rejoue si paire), le plus de paires gagne.
 */
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { CState, Slot, CARD_BACK, newGame, flip, resolveReveal, botStep } from '../lib/engine';

const NAVY = '#0A1535'; const GOLD = '#FCD34D'; const BLUE = '#93C5FD'; const FELT = '#14532d';
const OWNER_COLOR = ['#84CC16', '#F97316', '#38BDF8', '#A78BFA'];
const GRIDS: { label: string; rows: number; cols: number }[] = [
  { label: 'Facile (16)', rows: 4, cols: 4 },
  { label: 'Moyen (24)', rows: 4, cols: 6 },
  { label: 'Difficile (36)', rows: 6, cols: 6 },
];

export default function ConcentrationVsBot() {
  const [dim, setDim] = useState(1);
  const [st, setSt] = useState<CState>(() => newGame(GRIDS[1].rows, GRIDS[1].cols));

  useEffect(() => {
    if (st.phase === 'over') return;
    if (st.step === 'reveal') { const t = setTimeout(() => setSt((s) => resolveReveal(s)), 1100); return () => clearTimeout(t); }
    if (st.players[st.turn]?.isBot) { const t = setTimeout(() => setSt((s) => botStep(s, 0.78)), 800); return () => clearTimeout(t); }
    return undefined;
  }, [st]);

  const myTurn = st.phase === 'playing' && st.turn === 0;
  const canFlip = myTurn && (st.step === 'flip1' || st.step === 'flip2');
  const restart = (d: number) => { setDim(d); setSt(newGame(GRIDS[d].rows, GRIDS[d].cols)); };

  return (
    <main style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${NAVY}, #06210f)`, padding: '20px 14px 40px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Link href="/concentration" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: BLUE, textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}><ArrowLeft style={{ width: 16, height: 16 }} /> Hub</Link>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: '1.05rem' }}>🧠 Concentration · vs Bot</h1>
          <button onClick={() => restart(dim)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999, padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}><RefreshCw style={{ width: 14, height: 14 }} /> Rejouer</button>
        </div>

        {/* Difficulté */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          {GRIDS.map((g, i) => (
            <button key={i} onClick={() => restart(i)} style={{ background: dim === i ? `linear-gradient(90deg, ${GOLD}, #F59E0B)` : 'rgba(255,255,255,0.08)', color: dim === i ? NAVY : '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999, padding: '5px 12px', fontWeight: 700, fontSize: '0.76rem', cursor: 'pointer' }}>{g.label}</button>
          ))}
        </div>

        {/* Scores */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          {st.players.map((p, i) => {
            const active = st.turn === i && st.phase === 'playing';
            return (
              <div key={p.id} style={{ flex: 1, minWidth: 120, background: active ? 'rgba(252,211,77,0.16)' : 'rgba(255,255,255,0.05)', border: `1px solid ${active ? GOLD : OWNER_COLOR[i] + '66'}`, borderRadius: 12, padding: '8px 14px' }}>
                <div style={{ color: OWNER_COLOR[i], fontSize: '0.66rem', fontWeight: 800 }}>{p.isBot ? '🤖' : '🧑'} {p.name}{active ? ' · à lui' : ''}</div>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: '1.4rem' }}>{p.pairs} <span style={{ color: '#64748B', fontSize: '0.7rem', fontWeight: 600 }}>paires</span></div>
              </div>
            );
          })}
        </div>

        <div style={{ color: BLUE, fontSize: '0.84rem', marginBottom: 10, minHeight: 18 }}>{st.lastEvent}</div>

        {/* Grille */}
        <div style={{ background: `radial-gradient(circle at 50% 30%, ${FELT}, #07210f)`, borderRadius: 20, border: '5px solid #1d6b38', padding: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${st.cols}, 1fr)`, gap: 8, justifyItems: 'center' }}>
            {st.grid.map((slot, i) => <CardTile key={slot.id} slot={slot} clickable={canFlip && !slot.faceUp && !slot.matched} onClick={() => canFlip && setSt(flip(st, i))} />)}
          </div>
        </div>

        {/* Journal */}
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 12, marginTop: 14, maxHeight: 120, overflowY: 'auto' }}>
          {st.log.map((l, i) => <div key={i} style={{ color: i === 0 ? '#fff' : '#94A3B8', fontSize: '0.8rem', padding: '2px 0' }}>{l}</div>)}
        </div>

        {st.phase === 'over' && (
          <div style={{ marginTop: 18, textAlign: 'center', background: 'rgba(0,0,0,0.45)', borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 44 }}>{st.winner === 0 ? '🏆' : '🤖'}</div>
            <h2 style={{ color: '#fff', fontWeight: 900, fontSize: '1.35rem', margin: '8px 0' }}>{st.winner === 0 ? 'Vous gagnez !' : `${st.players[st.winner ?? 0].name} gagne`}</h2>
            <div style={{ color: BLUE, marginBottom: 14 }}>{st.players.map((p) => `${p.name}: ${p.pairs}`).join(' · ')}</div>
            <button onClick={() => restart(dim)} style={{ background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: NAVY, fontWeight: 900, border: 'none', borderRadius: 12, padding: '12px 28px', cursor: 'pointer' }}>Rejouer</button>
          </div>
        )}
      </div>
    </main>
  );
}

function CardTile({ slot, clickable, onClick }: { slot: Slot; clickable: boolean; onClick: () => void }) {
  const show = slot.faceUp || slot.matched;
  return (
    <button onClick={onClick} disabled={!clickable} style={{ width: 54, height: 76, borderRadius: 8, padding: 0, overflow: 'hidden', cursor: clickable ? 'pointer' : 'default', border: slot.matched && slot.owner !== null ? `2px solid ${OWNER_COLOR[slot.owner]}` : '1px solid rgba(255,255,255,0.15)', background: show ? '#fff' : 'transparent', opacity: slot.matched ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 8px rgba(0,0,0,0.4)' }}>
      {show
        ? <span style={{ fontSize: 30 }}>{slot.symbol}</span>
        : <Image src={CARD_BACK} alt="" width={54} height={76} style={{ display: 'block', width: 54, height: 76, objectFit: 'cover' }} />}
    </button>
  );
}
