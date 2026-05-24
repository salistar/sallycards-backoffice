/**
 * @file apps/web/app/solitaire/lib/SpiderBoard.tsx
 * @description Plateau Spider (1/2/4 couleurs). Sélection→destination, donne au
 *   talon, suites K→A retirées automatiquement, annuler, chrono, victoire.
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import { RefreshCw, Undo2, Lightbulb } from 'lucide-react';
import type { Card } from './engines/_genericTableau';
import { reverseSpider, spiderReducer, isRun, SpiderState } from './spider';
import { PlayingCard, CardBackView, EmptySlot } from './CardView';

const GOLD = '#FCD34D'; const BLUE = '#93C5FD'; const FELT = '#0E5A36';

export default function SpiderBoard({ suitMode, label }: { suitMode: 1 | 2 | 4; label: string }) {
  const [st, setSt] = useState<SpiderState>(() => reverseSpider(suitMode));
  const [sel, setSel] = useState<{ col: number; idx: number } | null>(null);
  const [hist, setHist] = useState<SpiderState[]>([]);
  const [secs, setSecs] = useState(0);
  const liveRef = useRef(st);
  liveRef.current = st;

  const fresh = () => {
    // Donne GARANTIE résoluble (reverse-moves depuis l'état résolu).
    setSt(reverseSpider(suitMode)); setSel(null); setHist([]); setSecs(0);
  };
  useEffect(fresh, [suitMode]);
  useEffect(() => { if (st.won) return; const t = setInterval(() => setSecs((s) => s + 1), 1000); return () => clearInterval(t); }, [st.won]);

  const apply = (a: any) => { const ns = spiderReducer(liveRef.current, a); if (ns !== liveRef.current) { setHist((h) => [...h.slice(-60), liveRef.current]); setSt(ns); } };
  const undo = () => setHist((h) => { if (!h.length) return h; setSt(h[h.length - 1]); setSel(null); return h.slice(0, -1); });

  // Indice : déplacement même couleur (construit une suite) > déplacement vers
  // colonne vide qui dégage une carte > distribution.
  const hint = () => {
    let best: { from: number; idx: number; to: number; score: number } | null = null;
    for (let from = 0; from < 10; from++) { const pile = st.columns[from]; for (let idx = 0; idx < pile.length; idx++) { const run = pile.slice(idx); if (!isRun(run)) continue; for (let to = 0; to < 10; to++) { if (to === from) continue; const top = st.columns[to][st.columns[to].length - 1]; if (top && top.rank === run[0].rank + 1) { const same = top.suit === run[0].suit; const score = (same ? 100 : 1) + run.length; if (!best || score > best.score) best = { from, idx, to, score }; } } } }
    if (best) { setSel(null); apply({ type: 'MOVE', from: best.from, cardIdx: best.idx, to: best.to }); return; }
    for (let from = 0; from < 10; from++) { const pile = st.columns[from]; for (let idx = 0; idx < pile.length; idx++) { if (idx === 0) continue; const run = pile.slice(idx); if (!isRun(run)) continue; for (let to = 0; to < 10; to++) { if (to !== from && st.columns[to].length === 0) { setSel(null); apply({ type: 'MOVE', from, cardIdx: idx, to }); return; } } } }
    setSel(null); apply({ type: 'DEAL' });
  };

  const clickCard = (col: number, idx: number) => {
    if (sel) { apply({ type: 'MOVE', from: sel.col, cardIdx: sel.idx, to: col }); setSel(null); return; }
    const run = st.columns[col].slice(idx);
    if (isRun(run)) setSel({ col, idx });
  };
  const clickCol = (col: number) => { if (sel) { apply({ type: 'MOVE', from: sel.col, cardIdx: sel.idx, to: col }); setSel(null); } };

  const W = 60, H = 85;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ color: '#fff', fontWeight: 900, fontSize: '1.05rem' }}>{label}</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: BLUE, fontSize: '0.8rem' }}>
          <span>⏱ {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}</span>
          <span>· {st.completed}/8 suites · {st.moveCount} coups</span>
          <button onClick={undo} disabled={!hist.length} style={ctrl}><Undo2 style={ic} /> Annuler</button>
          <button onClick={hint} style={ctrl}><Lightbulb style={ic} /> Indice</button>
          <button onClick={fresh} style={{ ...ctrl, background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: '#0A1535', border: 'none' }}><RefreshCw style={ic} /> Nouvelle</button>
        </div>
      </div>

      <div style={{ background: `radial-gradient(circle at 50% 0%, ${FELT}, #093d24)`, borderRadius: 18, border: '5px solid #5b3a1a', padding: 16, width: 'fit-content', maxWidth: '100%', margin: '0 auto', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center' }}>
          <button onClick={() => apply({ type: 'DEAL' })} disabled={st.stock.length === 0} style={{ ...slot(W, H), cursor: st.stock.length ? 'pointer' : 'default', background: 'rgba(0,0,0,0.25)', border: 'none', padding: 0 }}>
            {st.stock.length > 0 ? <Back w={W} h={H} /> : <span style={{ color: '#fff' }}>∅</span>}
          </button>
          <span style={{ color: BLUE, fontSize: '0.78rem' }}>{st.stock.length} donne(s) restante(s) · clique pour distribuer</span>
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
          {st.columns.map((pile, col) => (
            <div key={col} onClick={() => pile.length === 0 && clickCol(col)} style={{ position: 'relative', width: W, height: pile.length ? cumTop(pile, pile.length - 1) + H : H, cursor: pile.length === 0 && sel ? 'pointer' : 'default' }}>
              {pile.length === 0 && <Empty w={W} h={H} />}
              {pile.map((card, idx) => (
                <div key={card.id} onClick={(e) => { e.stopPropagation(); clickCard(col, idx); }} style={{ position: 'absolute', top: cumTop(pile, idx), left: 0, cursor: 'pointer' }}>
                  {card.faceUp ? <CardV card={card} sel={!!sel && sel.col === col && idx >= sel.idx} w={W} h={H} /> : <Back w={W} h={H} />}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {st.won && (
        <div style={{ marginTop: 16, textAlign: 'center', background: 'rgba(0,0,0,0.45)', borderRadius: 16, padding: 24 }}>
          <div style={{ fontSize: 44 }}>🏆</div>
          <h2 style={{ color: '#fff', fontWeight: 900, fontSize: '1.4rem', margin: '8px 0' }}>Gagné en {st.moveCount} coups · {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}</h2>
          <button onClick={fresh} style={{ background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: '#0A1535', fontWeight: 900, border: 'none', borderRadius: 12, padding: '12px 28px', cursor: 'pointer' }}>Rejouer</button>
        </div>
      )}
    </div>
  );
}

function cumTop(pile: Card[], idx: number): number { let y = 0; for (let i = 1; i <= idx; i++) y += pile[i - 1].faceUp ? 25 : 11; return y; }
function slot(w: number, h: number): React.CSSProperties { return { width: w, height: h, borderRadius: Math.round(w * 0.12), border: '1px dashed rgba(255,255,255,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }; }
function CardV({ card, sel, w, h }: { card: Card; sel?: boolean; w: number; h: number }) { return <PlayingCard card={card} w={w} h={h} sel={sel} />; }
function Back({ w, h }: { w: number; h: number }) { return <CardBackView w={w} h={h} />; }
function Empty({ w, h }: { w: number; h: number }) { return <EmptySlot w={w} h={h} />; }
const ic: React.CSSProperties = { width: 14, height: 14 };
const ctrl: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999, padding: '6px 12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem' };
