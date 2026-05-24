/**
 * @file apps/web/app/solitaire/lib/CardView.tsx
 * @description Rendu partagé d'une carte (fond BLANC obligatoire — les PNG
 *   french52 sont transparents, sans fond blanc elles paraissent « transparentes »
 *   sur le tapis). Coins arrondis, fine bordure, ombre, surbrillance sélection.
 *   Utilisé par tous les plateaux de solitaire pour un design cohérent.
 */
'use client';

import Image from 'next/image';
import type { Card } from './engines/_genericTableau';
import { cardImage, CARD_BACK } from './cards';

const GOLD = '#FCD34D';

export function PlayingCard({ card, w, h, sel, dim }: { card: Card; w: number; h: number; sel?: boolean; dim?: boolean }) {
  return (
    <span style={{ display: 'block', width: w, height: h, borderRadius: Math.round(w * 0.12), overflow: 'hidden', background: '#fff', border: sel ? `2px solid ${GOLD}` : '1px solid rgba(15,23,42,0.25)', boxShadow: sel ? `0 0 0 3px ${GOLD}88, 0 3px 8px rgba(0,0,0,0.5)` : '0 2px 6px rgba(0,0,0,0.45)', opacity: dim ? 0.55 : 1, transition: 'box-shadow .12s' }}>
      <Image src={cardImage(card)} alt="" width={w} height={h} style={{ display: 'block', width: w, height: h, objectFit: 'cover' }} />
    </span>
  );
}

export function CardBackView({ w, h }: { w: number; h: number }) {
  return (
    <span style={{ display: 'block', width: w, height: h, borderRadius: Math.round(w * 0.12), overflow: 'hidden', background: 'linear-gradient(135deg,#1e3a8a,#3b0764)', border: '1px solid rgba(255,255,255,0.25)', boxShadow: '0 2px 6px rgba(0,0,0,0.45)' }}>
      <Image src={CARD_BACK} alt="" width={w} height={h} style={{ display: 'block', width: w, height: h, objectFit: 'cover' }} />
    </span>
  );
}

export function EmptySlot({ w, h, label }: { w: number; h: number; label?: string }) {
  return <div style={{ width: w, height: h, borderRadius: Math.round(w * 0.12), border: '1px dashed rgba(255,255,255,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 13, fontWeight: 700 }}>{label || ''}</div>;
}
