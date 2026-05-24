/**
 * @file apps/web/app/solitaire/lib/PairsBoard.tsx
 * @description Plateau générique pour la famille « paires » (_genericPairs) :
 *   Pyramid, Monte Carlo, Nestor, Decade, Quinze, Aces Up, TriPeaks-paires…
 *   Clique deux cartes accessibles qui forment une paire (somme/rang/suite),
 *   ou une carte auto-retirable (ex. Roi). Pioche/recyclage, chrono, victoire.
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { PairsGameState, PairsAction, CardLocation } from './engines/_genericPairs';
import { isAccessible } from './engines/_genericPairs';
import { PlayingCard, CardBackView } from './CardView';
import { loadVariant } from './registry';
import { solvablePairs } from './solvableGen';

const GOLD = '#FCD34D'; const BLUE = '#93C5FD'; const FELT = '#0E5A36';

export default function PairsBoard({ variantKey, label }: { variantKey: string; label: string }) {
  const reducerRef = useRef<(s: PairsGameState, a: PairsAction) => PairsGameState>((s) => s);
  const [st, setSt] = useState<PairsGameState | null>(null);
  const [secs, setSecs] = useState(0);

  const fresh = () => { const l = loadVariant(variantKey); if (!l) return; reducerRef.current = l.reducer; setSt(solvablePairs(l.state.config)); setSecs(0); };
  useEffect(fresh, [variantKey]);
  useEffect(() => { if (!st || st.won) return; const t = setInterval(() => setSecs((s) => s + 1), 1000); return () => clearInterval(t); }, [st]);

  if (!st) return null;
  const cfg = st.config;
  const dispatch = (a: PairsAction) => setSt((s) => (s ? reducerRef.current(s, a) : s));
  const selKey = st.selected ? JSON.stringify(st.selected) : '';
  const isColumns = cfg.layoutKind === 'columns';
  const W = 46, H = 66;

  const Slot = ({ card, loc }: { card: any; loc: CardLocation }) => {
    if (!card) return <div style={{ width: W, height: H, borderRadius: 6, border: '1px dashed rgba(255,255,255,0.12)' }} />;
    const acc = isAccessible(loc, st);
    const selected = selKey === JSON.stringify(loc);
    return (
      <button onClick={() => dispatch({ type: 'SELECT', loc })} disabled={!acc} style={{ border: 'none', background: 'transparent', padding: 0, cursor: acc ? 'pointer' : 'default' }}>
        <PlayingCard card={card} w={W} h={H} sel={selected} dim={!acc} />
      </button>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ color: '#fff', fontWeight: 900, fontSize: '1.05rem' }}>{label}</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: BLUE, fontSize: '0.8rem' }}>
          <span>⏱ {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}</span>
          <span>· {st.removed.length} retirées</span>
          <button onClick={fresh} style={{ ...ctrl, background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: '#0A1535', border: 'none' }}><RefreshCw style={{ width: 14, height: 14 }} /> Nouvelle</button>
        </div>
      </div>

      <div style={{ background: `radial-gradient(circle at 50% 0%, ${FELT}, #093d24)`, borderRadius: 18, border: '5px solid #5b3a1a', padding: 16, overflowX: 'auto' }}>
        {/* Layout */}
        {isColumns ? (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {st.layout.map((column, c) => (
              <div key={c} style={{ position: 'relative', width: W, minHeight: H }}>
                {column.map((card, i) => <div key={i} style={{ position: 'absolute', top: i * 20, left: 0 }}><Slot card={card} loc={{ kind: 'layout', row: c, col: i }} /></div>)}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
            {st.layout.map((row, r) => (
              <div key={r} style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                {row.map((card, c) => <Slot key={c} card={card} loc={{ kind: 'layout', row: r, col: c }} />)}
              </div>
            ))}
          </div>
        )}

        {/* Pioche / défausse */}
        {cfg.stockEnabled && (
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center', marginTop: 16 }}>
            <button onClick={() => dispatch(st.stock.length > 0 ? { type: 'DRAW_STOCK' } : { type: 'RECYCLE_WASTE' })} style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}>
              {st.stock.length > 0 ? <CardBackView w={W} h={H} /> : <div style={{ width: W, height: H, borderRadius: 6, border: '1px dashed rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>↻</div>}
            </button>
            <div style={{ textAlign: 'center' }}>
              {st.waste.length > 0 ? <Slot card={st.waste[st.waste.length - 1]} loc={{ kind: 'waste' }} /> : <div style={{ width: W, height: H, borderRadius: 6, border: '1px dashed rgba(255,255,255,0.18)' }} />}
              <div style={{ color: BLUE, fontSize: '0.64rem', marginTop: 3 }}>défausse</div>
            </div>
            <div style={{ color: BLUE, fontSize: '0.74rem' }}>pioche {st.stock.length}</div>
          </div>
        )}
      </div>

      {st.won && (
        <div style={{ marginTop: 16, textAlign: 'center', background: 'rgba(0,0,0,0.45)', borderRadius: 16, padding: 24 }}>
          <div style={{ fontSize: 44 }}>🏆</div>
          <h2 style={{ color: '#fff', fontWeight: 900, fontSize: '1.4rem', margin: '8px 0' }}>Résolu · {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}</h2>
          <button onClick={fresh} style={{ background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: '#0A1535', fontWeight: 900, border: 'none', borderRadius: 12, padding: '12px 28px', cursor: 'pointer' }}>Rejouer</button>
        </div>
      )}
    </div>
  );
}
const ctrl: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999, padding: '6px 12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem' };
