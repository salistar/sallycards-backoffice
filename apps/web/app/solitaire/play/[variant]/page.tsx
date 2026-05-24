/**
 * @file apps/web/app/solitaire/play/[variant]/page.tsx
 * @description Page de jeu pour une variante de solitaire. Charge la variante
 *   via le registre et affiche le plateau de la bonne famille (tableau/paires).
 */
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getVariant, spiderSuits } from '../../lib/registry';
import TableauBoard from '../../lib/TableauBoard';
import PairsBoard from '../../lib/PairsBoard';
import SpiderBoard from '../../lib/SpiderBoard';
import ClockBoard from '../../lib/ClockBoard';
import MazeBoard from '../../lib/MazeBoard';

const NAVY = '#0A1535'; const BLUE = '#93C5FD';

export default function PlayVariant() {
  const params = useParams<{ variant: string }>();
  const key = (params?.variant || '').toString();
  const info = getVariant(key);

  return (
    <main style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${NAVY}, #07112a)`, padding: '18px 14px 50px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <Link href="/solitaire" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: BLUE, textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem', marginBottom: 14 }}><ArrowLeft style={{ width: 16, height: 16 }} /> Toutes les variantes</Link>
        {!info ? (
          <div style={{ color: '#fff', textAlign: 'center', padding: 40 }}>Variante inconnue. <Link href="/solitaire" style={{ color: BLUE }}>Retour</Link></div>
        ) : info.family === 'pairs' ? (
          <PairsBoard variantKey={info.key} label={info.label} />
        ) : info.family === 'spider' ? (
          <SpiderBoard suitMode={spiderSuits(info.key)} label={info.label} />
        ) : info.family === 'dist' ? (
          <ClockBoard variantKey={info.key} label={info.label} />
        ) : info.family === 'maze' ? (
          <MazeBoard variantKey={info.key} label={info.label} />
        ) : (
          <TableauBoard variantKey={info.key} label={info.label} />
        )}
      </div>
    </main>
  );
}
