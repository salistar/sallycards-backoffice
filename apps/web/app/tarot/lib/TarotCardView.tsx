/**
 * @file apps/web/app/tarot/lib/TarotCardView.tsx
 * @description Rendu d'une carte de Tarot avec de VRAIES cartes pour les
 *   couleurs (♠♥♦♣) via le jeu d'images french52. Le Cavalier (absent d'un jeu
 *   de 52), les 21 atouts et l'Excuse n'ont pas d'asset standard → cartes
 *   stylisées cohérentes (atouts dorés, Excuse spéciale).
 */
'use client';

import Image from 'next/image';
import { TCard, cardLabel, SUIT_SYMBOL, SUIT_RED, isTrump, isExcuse, isBout } from './engine';

const SUIT_LETTER: Record<string, string> = { pique: 'S', coeur: 'H', carreau: 'D', trefle: 'C' };
const RANK_CODE: Record<number, string> = { 1: 'A', 10: '0', 11: 'J', 13: 'Q', 14: 'K' };

/** Chemin french52 pour une carte couleur standard, ou null (Cavalier=12). */
export function frenchImage(card: TCard): string | null {
  if (card.kind !== 'suit') return null;
  if (card.rank === 12) return null; // Cavalier : pas dans un jeu de 52
  const code = RANK_CODE[card.rank!] || String(card.rank);
  return `/cards/french52/${code}${SUIT_LETTER[card.suit!]}.png`;
}

export default function TarotCardView({ card, size }: { card: TCard; size: number }) {
  const h = Math.round(size * 1.5);
  const base: React.CSSProperties = { width: size, height: h, borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: 900, boxShadow: '0 4px 10px rgba(0,0,0,0.4)', userSelect: 'none', overflow: 'hidden', background: '#fff' };

  // Vraie carte (couleur standard)
  const img = frenchImage(card);
  if (img) {
    return <span style={{ display: 'inline-block', borderRadius: 8, overflow: 'hidden', background: '#fff', boxShadow: '0 4px 10px rgba(0,0,0,0.4)' }}><Image src={img} alt="" width={size} height={h} style={{ display: 'block', width: size, height: 'auto' }} /></span>;
  }
  // Excuse
  if (isExcuse(card)) return <div style={{ ...base, background: 'linear-gradient(135deg, #fff, #e9d5ff)', color: '#7C3AED', border: '2px solid #7C3AED' }}><span style={{ fontSize: size * 0.5 }}>★</span><span style={{ fontSize: size * 0.18 }}>Excuse</span></div>;
  // Atout
  if (isTrump(card)) { const bout = isBout(card); return <div style={{ ...base, background: bout ? 'linear-gradient(135deg, #FCD34D, #F59E0B)' : 'linear-gradient(135deg, #Fde68a, #FCD34D)', color: '#5b3a1a', border: bout ? '2px solid #B45309' : '1px solid #d9a441' }}><span style={{ fontSize: size * 0.42 }}>{card.trump}</span><span style={{ fontSize: size * 0.16 }}>★ atout</span></div>; }
  // Cavalier (couleur, sans image) : style proche d'une carte
  const red = SUIT_RED[card.suit!];
  return (
    <div style={{ ...base, color: red ? '#DC2626' : '#1f2937', border: '1px solid #cbd5e1', position: 'relative' }}>
      <span style={{ position: 'absolute', top: 3, left: 4, fontSize: size * 0.2 }}>{cardLabel(card)}</span>
      <span style={{ fontSize: size * 0.42 }}>{SUIT_SYMBOL[card.suit!]}</span>
      <span style={{ fontSize: size * 0.16 }}>Cavalier</span>
    </div>
  );
}
