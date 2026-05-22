/**
 * @file apps/web/app/belote/_components/Screen.tsx
 * @description Wrapper commun des écrans data Belote (Phase 2).
 *   - garde auth (redirige vers /auth/login?game=belote si non connecté)
 *   - header thème bleu nuit + bouton retour vers /belote
 *   - gère états loading / erreur / vide de façon homogène
 */
'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';

export const NAVY = '#0A1535';
export const CARD = '#152A47';
export const GOLD = '#FCD34D';
export const BLUE = '#93C5FD';

export function Screen({
  title,
  icon,
  subtitle,
  children,
}: {
  title: string;
  icon?: ReactNode;
  subtitle?: string;
  children: ReactNode;
}) {
  const { user, isLoading } = useAuth();

  if (!isLoading && !user) {
    return (
      <main style={shell}>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <p style={{ color: BLUE, marginBottom: 18 }}>Connecte-toi pour accéder à cet écran.</p>
          <Link href="/auth/login?game=belote" style={ctaBtn}>Se connecter</Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${NAVY}, #152A47)`, padding: '28px 18px 64px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <Link href="/belote" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: BLUE, textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem', marginBottom: 18 }}>
          <ArrowLeft style={{ width: 16, height: 16 }} /> Retour au hub Belote
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          {icon}
          <h1 style={{ color: '#fff', fontSize: '1.9rem', fontWeight: 900, margin: 0 }}>{title}</h1>
        </div>
        {subtitle && <p style={{ color: BLUE, fontSize: '0.92rem', margin: '0 0 22px' }}>{subtitle}</p>}
        {!subtitle && <div style={{ height: 22 }} />}
        {children}
      </div>
    </main>
  );
}

/** Bandeau d'état réutilisable (loading / erreur / vide). */
export function StateNote({ kind, text }: { kind: 'loading' | 'error' | 'empty'; text: string }) {
  const palette = {
    loading: { bg: 'rgba(147,197,253,0.10)', bd: '#93C5FD55', fg: BLUE },
    error: { bg: 'rgba(248,113,113,0.12)', bd: '#F8717155', fg: '#FCA5A5' },
    empty: { bg: 'rgba(255,255,255,0.05)', bd: 'rgba(255,255,255,0.12)', fg: '#CBD5E1' },
  }[kind];
  return (
    <div style={{ background: palette.bg, border: `1px solid ${palette.bd}`, borderRadius: 12, padding: 18, color: palette.fg, fontWeight: 600, textAlign: 'center' }}>
      {text}
    </div>
  );
}

export const cardBox: React.CSSProperties = {
  background: CARD,
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 14,
  padding: 16,
};

const shell: React.CSSProperties = {
  minHeight: '100vh',
  background: `linear-gradient(160deg, ${NAVY}, #1E3A8A 60%, ${NAVY})`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
};

const ctaBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`,
  color: NAVY,
  fontWeight: 900,
  padding: '12px 28px',
  borderRadius: 12,
  textDecoration: 'none',
};
