/**
 * @file apps/web/app/solitaire/lib/ClockBoard.tsx
 * @description Plateau pour la famille « distribution/horloge » (Clock, Big Ben,
 *   Grandfather's Clock, Hickory Dickory Dock, Travellers). Mécanique
 *   révéler-et-placer : on retourne la carte courante vers sa pile cible.
 *   Real cards french52.
 */
'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { RefreshCw, Play, FastForward } from 'lucide-react';
import type { DistributionGameState, DistributionAction } from './engines/_genericDistribution';
import { cardImage, CARD_BACK } from './cards';
import { loadVariant } from './registry';

const GOLD = '#FCD34D'; const BLUE = '#93C5FD'; const FELT = '#0E5A36';

export default function ClockBoard({ variantKey, label }: { variantKey: string; label: string }) {
  const reducerRef = useRef<(s: DistributionGameState, a: DistributionAction) => DistributionGameState>((s) => s);
  const [st, setSt] = useState<DistributionGameState | null>(null);
  const fresh = () => { const l = loadVariant(variantKey); if (!l) return; reducerRef.current = l.reducer; setSt(l.state); };
  useEffect(fresh, [variantKey]);
  if (!st) return null;

  const step = () => setSt((s) => (s ? reducerRef.current(s, { type: 'REVEAL_AND_PLACE' }) : s));
  const auto = () => { let cur = st; for (let i = 0; i < 200 && !cur.won && !cur.lost; i++) cur = reducerRef.current(cur, { type: 'REVEAL_AND_PLACE' }); setSt(cur); };
  const W = 42, H = 60;
  const clockN = st.config.clockPiles;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ color: '#fff', fontWeight: 900, fontSize: '1.05rem' }}>{label}</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: BLUE, fontSize: '0.8rem' }}>
          <span>{st.exposedCount} cartes révélées · {st.moveCount} coups</span>
          <button onClick={step} disabled={st.won || st.lost} style={ctrl}><Play style={ic} /> Retourner</button>
          <button onClick={auto} disabled={st.won || st.lost} style={ctrl}><FastForward style={ic} /> Auto</button>
          <button onClick={fresh} style={{ ...ctrl, background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: '#0A1535', border: 'none' }}><RefreshCw style={ic} /> Nouvelle</button>
        </div>
      </div>

      <div style={{ background: `radial-gradient(circle at 50% 50%, ${FELT}, #093d24)`, borderRadius: 18, border: '5px solid #5b3a1a', padding: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(58px, 1fr))', gap: 10, justifyItems: 'center' }}>
          {st.piles.map((pile, i) => {
            const top = pile[pile.length - 1];
            const center = st.config.hasCenterPile && i === clockN;
            const isCur = top && st.currentCard && top.id === st.currentCard.id;
            return (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ position: 'relative', width: W, height: H, margin: '0 auto', boxShadow: isCur ? `0 0 0 3px ${GOLD}` : 'none', borderRadius: 6 }}>
                  {pile.length === 0 ? <div style={{ width: W, height: H, borderRadius: 6, border: '1px dashed rgba(255,255,255,0.2)' }} />
                    : top && top.faceUp ? <Img src={cardImage(top)} w={W} h={H} /> : <Img src={CARD_BACK} w={W} h={H} />}
                </div>
                <div style={{ color: center ? GOLD : BLUE, fontSize: '0.62rem', marginTop: 3 }}>{center ? 'centre' : `${i + 1}h`} · {pile.length}</div>
              </div>
            );
          })}
        </div>
      </div>

      {(st.won || st.lost) && (
        <div style={{ marginTop: 16, textAlign: 'center', background: 'rgba(0,0,0,0.45)', borderRadius: 16, padding: 24 }}>
          <div style={{ fontSize: 44 }}>{st.won ? '🏆' : '🛑'}</div>
          <h2 style={{ color: '#fff', fontWeight: 900, fontSize: '1.3rem', margin: '8px 0' }}>{st.won ? 'Résolu !' : 'Bloqué — réessaie une nouvelle donne'}</h2>
          <button onClick={fresh} style={{ background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: '#0A1535', fontWeight: 900, border: 'none', borderRadius: 12, padding: '12px 28px', cursor: 'pointer' }}>Nouvelle donne</button>
        </div>
      )}
    </div>
  );
}
function Img({ src, w, h }: { src: string; w: number; h: number }) { return <span style={{ display: 'block', borderRadius: 5, overflow: 'hidden' }}><Image src={src} alt="" width={w} height={h} style={{ display: 'block', width: w, height: h }} /></span>; }
const ic: React.CSSProperties = { width: 14, height: 14 };
const ctrl: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999, padding: '6px 12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem' };
