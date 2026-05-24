/**
 * @file apps/web/app/solitaire/lib/MazeBoard.tsx
 * @description Plateau Maze (6×9). Déplace une carte vers un trou : rang +1 de
 *   la carte à gauche OU rang -1 de celle à droite, même couleur (wrap-around).
 *   But : 4 suites A→Q par couleur. Cartes french52 réelles.
 */
'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { RefreshCw, Lightbulb } from 'lucide-react';
import type { Card } from './engines/_genericTableau';
import type { MazeGameState, MazeAction } from './engines/_mazeEngine';
import { listFillableHoles } from './engines/_mazeEngine';
import { cardImage } from './cards';
import { loadVariant } from './registry';
import { solvableMaze } from './solvableGen';

const GOLD = '#FCD34D'; const BLUE = '#93C5FD'; const FELT = '#0E5A36';

export default function MazeBoard({ variantKey, label }: { variantKey: string; label: string }) {
  const reducerRef = useRef<(s: MazeGameState, a: MazeAction) => MazeGameState>((s) => s);
  const [st, setSt] = useState<MazeGameState | null>(null);
  const [sel, setSel] = useState<{ r: number; c: number } | null>(null);
  const fresh = () => { const l = loadVariant(variantKey); if (!l) return; reducerRef.current = l.reducer; setSt(solvableMaze(l.state.config)); setSel(null); };
  useEffect(fresh, [variantKey]);
  if (!st) return null;

  const W = 48, H = 68;
  const click = (r: number, c: number) => {
    const cell = st.grid[r][c];
    if (cell) { setSel({ r, c }); return; }
    if (sel) { setSt((s) => (s ? reducerRef.current(s, { type: 'MOVE', fromRow: sel.r, fromCol: sel.c, toRow: r, toCol: c }) : s)); setSel(null); }
  };
  // Indice : trouve une carte qui peut remplir un trou et joue le coup.
  const hint = () => {
    for (let r = 0; r < st.config.rows; r++) for (let c = 0; c < st.config.cols; c++) {
      const card = st.grid[r][c]; if (!card) continue;
      const holes = listFillableHoles(st, card);
      if (holes.length) { const [tr, tc] = holes[0]; setSel(null); setSt((s) => (s ? reducerRef.current(s, { type: 'MOVE', fromRow: r, fromCol: c, toRow: tr, toCol: tc }) : s)); return; }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ color: '#fff', fontWeight: 900, fontSize: '1.05rem' }}>{label}</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: BLUE, fontSize: '0.8rem' }}>
          <span>{st.moveCount} coups</span>
          <button onClick={hint} style={ctrl}><Lightbulb style={{ width: 14, height: 14 }} /> Indice</button>
          <button onClick={fresh} style={{ ...ctrl, background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: '#0A1535', border: 'none' }}><RefreshCw style={{ width: 14, height: 14 }} /> Nouvelle</button>
        </div>
      </div>
      <div style={{ color: BLUE, fontSize: '0.8rem', marginBottom: 8 }}>Clique une carte puis un trou adjacent (rang ±1, même couleur).</div>

      <div style={{ background: `radial-gradient(circle at 50% 0%, ${FELT}, #093d24)`, borderRadius: 18, border: '5px solid #5b3a1a', padding: 14, overflowX: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
          {st.grid.map((row, r) => (
            <div key={r} style={{ display: 'flex', gap: 6 }}>
              {row.map((cell, c) => (
                <button key={c} onClick={() => click(r, c)} style={{ width: W, height: H, padding: 0, border: cell ? (sel && sel.r === r && sel.c === c ? `2px solid ${GOLD}` : '1px solid #cbd5e1') : '1px dashed rgba(255,255,255,0.2)', borderRadius: 5, background: cell ? '#fff' : 'rgba(255,255,255,0.04)', cursor: 'pointer', overflow: 'hidden' }}>
                  {cell ? <Image src={cardImage(cell as Card)} alt="" width={W} height={H} style={{ display: 'block', width: W, height: H }} /> : null}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {st.won && (
        <div style={{ marginTop: 16, textAlign: 'center', background: 'rgba(0,0,0,0.45)', borderRadius: 16, padding: 24 }}>
          <div style={{ fontSize: 44 }}>🏆</div>
          <h2 style={{ color: '#fff', fontWeight: 900, fontSize: '1.3rem', margin: '8px 0' }}>Maze résolu en {st.moveCount} coups !</h2>
          <button onClick={fresh} style={{ background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: '#0A1535', fontWeight: 900, border: 'none', borderRadius: 12, padding: '12px 28px', cursor: 'pointer' }}>Rejouer</button>
        </div>
      )}
    </div>
  );
}
const ctrl: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999, padding: '6px 12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem' };
