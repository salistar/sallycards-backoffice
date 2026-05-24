/**
 * @file apps/web/app/solitaire/lib/TableauBoard.tsx
 * @description Plateau générique pour la famille « tableau » (_genericTableau) :
 *   Klondike, FreeCell, Yukon, Forty Thieves, Canfield, Castles, Fans… Joue par
 *   sélection→destination (clic), avec pioche/recyclage, envoi auto aux
 *   fondations, annuler, chrono et détection de victoire.
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import { RefreshCw, Undo2, Sparkles } from 'lucide-react';
import type { GameState, Action, Card } from './engines/_genericTableau';
import { PlayingCard, CardBackView, EmptySlot } from './CardView';
import { loadVariant } from './registry';
import { solvableTableau } from './dealLoader';
import { reverseTableau } from './solvableGen';

const GOLD = '#FCD34D'; const BLUE = '#93C5FD'; const FELT = '#0E5A36';
type Sel = { z: 'tableau'; col: number; idx: number } | { z: 'waste' } | { z: 'free'; cell: number } | { z: 'reserve'; r: number } | null;

export default function TableauBoard({ variantKey, label }: { variantKey: string; label: string }) {
  const reducerRef = useRef<(s: GameState, a: Action) => GameState>((s) => s);
  const [st, setSt] = useState<GameState | null>(null);
  const [sel, setSel] = useState<Sel>(null);
  const [hist, setHist] = useState<GameState[]>([]);
  const [secs, setSecs] = useState(0);

  const fresh = () => {
    const l = loadVariant(variantKey);
    if (!l) return;
    reducerRef.current = l.reducer;
    // Donne GARANTIE RÉSOLUBLE (générique, toutes les variantes tableau).
    setSt(reverseTableau(l.state.config)); setSel(null); setHist([]); setSecs(0);
    // Si la variante a des donnes authentiques en base (deal_seeds), on les préfère.
    solvableTableau(variantKey, l.state.config).then((sv) => { if (sv) { setSt(sv); setSel(null); setHist([]); } });
  };
  useEffect(fresh, [variantKey]);
  useEffect(() => {
    if (!st || st.won) return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [st]);

  if (!st) return null;
  const cfg = st.config;

  const apply = (a: Action) => {
    const ns = reducerRef.current(st, a);
    if (ns !== st) { setHist((h) => [...h.slice(-60), st]); setSt(ns); return true; }
    return false;
  };
  const undo = () => setHist((h) => { if (h.length === 0) return h; setSt(h[h.length - 1]); setSel(null); return h.slice(0, -1); });

  // Envoi automatique de toutes les cartes jouables vers les fondations.
  const autoCollect = () => {
    let cur = st; let moved = true; const snapshots = [st];
    while (moved) {
      moved = false;
      const tryActs: Action[] = [];
      cur.waste.length && tryActs.push(...cur.foundations.map((_, fi) => ({ type: 'WASTE_TO_FOUNDATION', foundation: fi } as Action)));
      cur.freeCells.forEach((c, ci) => { if (c) cur.foundations.forEach((_, fi) => tryActs.push({ type: 'FREECELL_TO_FOUNDATION', cell: ci, foundation: fi })); });
      cur.reserves.forEach((p, ri) => { if (p.length) cur.foundations.forEach((_, fi) => tryActs.push({ type: 'RESERVE_TO_FOUNDATION', reserve: ri, foundation: fi })); });
      cur.tableau.forEach((p, col) => { if (p.length) cur.foundations.forEach((_, fi) => tryActs.push({ type: 'TABLEAU_TO_FOUNDATION', from: col, foundation: fi })); });
      for (const a of tryActs) { const ns = reducerRef.current(cur, a); if (ns !== cur) { cur = ns; moved = true; break; } }
    }
    if (cur !== st) { setHist((h) => [...h.slice(-60), st]); setSt(cur); setSel(null); }
  };

  const clickStock = () => { if (st.stock.length > 0) apply({ type: 'DRAW_STOCK' }); else if (st.waste.length > 0) apply({ type: 'RECYCLE_WASTE' }); setSel(null); };

  const toTableau = (to: number) => {
    if (!sel) return;
    let ok = false;
    if (sel.z === 'tableau') ok = apply({ type: 'TABLEAU_TO_TABLEAU', from: sel.col, cardIdx: sel.idx, to });
    else if (sel.z === 'waste') ok = apply({ type: 'WASTE_TO_TABLEAU', to });
    else if (sel.z === 'free') ok = apply({ type: 'FREECELL_TO_TABLEAU', cell: sel.cell, to });
    else if (sel.z === 'reserve') ok = apply({ type: 'RESERVE_TO_TABLEAU', reserve: sel.r, to });
    setSel(null); void ok;
  };
  const toFoundation = (fi: number) => {
    if (!sel) return;
    if (sel.z === 'tableau') apply({ type: 'TABLEAU_TO_FOUNDATION', from: sel.col, foundation: fi });
    else if (sel.z === 'waste') apply({ type: 'WASTE_TO_FOUNDATION', foundation: fi });
    else if (sel.z === 'free') apply({ type: 'FREECELL_TO_FOUNDATION', cell: sel.cell, foundation: fi });
    else if (sel.z === 'reserve') apply({ type: 'RESERVE_TO_FOUNDATION', reserve: sel.r, foundation: fi });
    setSel(null);
  };
  const clickTableauCard = (col: number, idx: number) => {
    const pile = st.tableau[col];
    if (sel) { toTableau(col); return; }
    const card = pile[idx];
    if (card && card.faceUp) setSel({ z: 'tableau', col, idx });
  };
  const clickFreeCell = (cell: number) => {
    if (sel) { if (sel.z === 'tableau') { apply({ type: 'TABLEAU_TO_FREECELL', from: sel.col, cell }); setSel(null); } else setSel(null); return; }
    if (st.freeCells[cell]) setSel({ z: 'free', cell });
  };
  const clickReserve = (r: number) => { if (sel) { setSel(null); return; } if (st.reserves[r]?.length) setSel({ z: 'reserve', r }); };
  const clickWaste = () => { if (sel) { setSel(null); return; } if (st.waste.length) setSel({ z: 'waste' }); };

  const selKey = sel ? JSON.stringify(sel) : '';
  const W = 54, H = 77;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ color: '#fff', fontWeight: 900, fontSize: '1.05rem' }}>{label}</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: BLUE, fontSize: '0.8rem' }}>
          <span>⏱ {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}</span>
          <span>· {st.moveCount} coups</span>
          <button onClick={undo} disabled={!hist.length} style={ctrl}><Undo2 style={ic} /> Annuler</button>
          <button onClick={autoCollect} style={ctrl}><Sparkles style={ic} /> Auto</button>
          <button onClick={fresh} style={{ ...ctrl, background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: '#0A1535', border: 'none' }}><RefreshCw style={ic} /> Nouvelle</button>
        </div>
      </div>

      <div style={{ background: `radial-gradient(circle at 50% 0%, ${FELT}, #093d24)`, borderRadius: 18, border: '5px solid #5b3a1a', padding: 16, width: 'fit-content', maxWidth: '100%', margin: '0 auto', overflowX: 'auto' }}>
        {/* Rangée du haut : pioche / défausse — cellules — fondations */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {cfg.stockEnabled && (
            <div onClick={clickStock} style={{ ...slot(W, H), cursor: 'pointer', background: 'rgba(0,0,0,0.25)' }}>
              {st.stock.length > 0 ? <Back w={W} h={H} /> : <span style={{ color: '#fff', fontSize: 18 }}>↻</span>}
            </div>
          )}
          {cfg.stockEnabled && (
            <div onClick={clickWaste} style={{ ...slot(W, H), cursor: 'pointer' }}>
              {st.waste.length > 0 ? <CardV card={st.waste[st.waste.length - 1]} sel={sel?.z === 'waste'} w={W} h={H} /> : <Empty w={W} h={H} />}
            </div>
          )}
          {st.freeCells.map((c, ci) => (
            <div key={'fc' + ci} onClick={() => clickFreeCell(ci)} style={{ ...slot(W, H), cursor: 'pointer', borderColor: '#60A5FA66' }}>
              {c ? <CardV card={c} sel={selKey === JSON.stringify({ z: 'free', cell: ci })} w={W} h={H} /> : <Empty w={W} h={H} label="cell" />}
            </div>
          ))}
          <div style={{ flex: 1, minWidth: 8 }} />
          {st.foundations.map((p, fi) => (
            <div key={'f' + fi} onClick={() => toFoundation(fi)} style={{ ...slot(W, H), cursor: sel ? 'pointer' : 'default', borderColor: `${GOLD}66` }}>
              {p.length > 0 ? <CardV card={p[p.length - 1]} w={W} h={H} /> : <Empty w={W} h={H} label="A" />}
            </div>
          ))}
        </div>

        {/* Réserves */}
        {st.reserves.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            {st.reserves.map((p, ri) => (
              <div key={'r' + ri} onClick={() => clickReserve(ri)} style={{ ...slot(W, H), cursor: 'pointer' }}>
                {p.length > 0 ? <CardV card={p[p.length - 1]} sel={selKey === JSON.stringify({ z: 'reserve', r: ri })} w={W} h={H} /> : <Empty w={W} h={H} />}
              </div>
            ))}
          </div>
        )}

        {/* Tableau */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          {st.tableau.map((pile, col) => (
            <div key={'t' + col} onClick={() => pile.length === 0 && toTableau(col)} style={{ position: 'relative', width: W, height: pile.length ? cumTop(pile, pile.length - 1) + H : H, cursor: pile.length === 0 && sel ? 'pointer' : 'default' }}>
              {pile.length === 0 && <Empty w={W} h={H} />}
              {pile.map((card, idx) => {
                return (
                  <div key={card.id} onClick={(e) => { e.stopPropagation(); clickTableauCard(col, idx); }} style={{ position: 'absolute', top: cumTop(pile, idx), left: 0, cursor: 'pointer' }}>
                    {card.faceUp ? <CardV card={card} sel={selKey === JSON.stringify({ z: 'tableau', col, idx }) || (sel?.z === 'tableau' && sel.col === col && idx > sel.idx)} w={W} h={H} /> : <Back w={W} h={H} />}
                  </div>
                );
              })}
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

function cumTop(pile: Card[], idx: number): number { let y = 0; for (let i = 1; i <= idx; i++) y += pile[i - 1].faceUp ? 22 : 9; return y; }
function slot(w: number, h: number): React.CSSProperties { return { width: w, height: h, borderRadius: Math.round(w * 0.12), border: '1px dashed rgba(255,255,255,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }; }
function CardV({ card, sel, w, h }: { card: Card; sel?: boolean; w: number; h: number }) { return <PlayingCard card={card} w={w} h={h} sel={sel} />; }
function Back({ w, h }: { w: number; h: number }) { return <CardBackView w={w} h={h} />; }
function Empty({ w, h, label }: { w: number; h: number; label?: string }) { return <EmptySlot w={w} h={h} label={label} />; }
const ic: React.CSSProperties = { width: 14, height: 14 };
const ctrl: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999, padding: '6px 12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem' };
