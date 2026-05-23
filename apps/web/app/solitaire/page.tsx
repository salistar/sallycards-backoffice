/**
 * @file apps/web/app/solitaire/page.tsx
 * @description Hub Solitaire — catalogue de ~130 variantes jouables (familles
 *   tableau & paires), recherche, regroupement par catégorie, et accès aux
 *   écrans data (règles, classement, tournois, profil…). Style cohérent avec
 *   les autres jeux.
 */
'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Search, BookOpen, Medal, Trophy, Gift, Users, Inbox, User as UserIcon, Footprints } from 'lucide-react';
import { VARIANTS } from './lib/registry';

const NAVY = '#0A1535'; const GOLD = '#FCD34D'; const BLUE = '#93C5FD';
const SHORTCUTS = [
  { label: 'Règles', icon: BookOpen, href: '/solitaire/rules', grad: ['#0EA5E9', '#2563EB'] },
  { label: 'Classement', icon: Medal, href: '/solitaire/leaderboard', grad: ['#F59E0B', '#D97706'] },
  { label: 'Tournois', icon: Trophy, href: '/solitaire/tournaments', grad: ['#EAB308', '#B45309'] },
  { label: 'Récompenses', icon: Gift, href: '/solitaire/rewards', grad: ['#EAB308', '#CA8A04'] },
  { label: 'Amis', icon: Users, href: '/solitaire/friends', grad: ['#3B82F6', '#1D4ED8'] },
  { label: 'Boîte', icon: Inbox, href: '/solitaire/inbox', grad: ['#A855F7', '#7C3AED'] },
  { label: 'Défis & Mur', icon: Footprints, href: '/solitaire/hkim', grad: ['#14B8A6', '#0F766E'] },
  { label: 'Mon profil', icon: UserIcon, href: '/solitaire/profile', grad: ['#6366F1', '#4338CA'] },
  { label: 'Joueurs', icon: Users, href: '/solitaire/players', grad: ['#0EA5E9', '#0369A1'] },
];

export default function SolitaireHub() {
  const [q, setQ] = useState('');
  const flagships = VARIANTS.filter((v) => v.flagship);
  const groups = useMemo(() => {
    const term = q.trim().toLowerCase();
    const filtered = VARIANTS.filter((v) => !v.flagship && (term === '' || v.label.toLowerCase().includes(term) || v.key.includes(term)));
    const byCat: Record<string, typeof VARIANTS> = {};
    for (const v of filtered) (byCat[v.category] ||= []).push(v);
    return byCat;
  }, [q]);

  return (
    <main style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${NAVY}, #1E293B)`, padding: '28px 16px 60px' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <span style={{ fontSize: 34 }}>🃏</span>
          <h1 style={{ color: '#fff', fontSize: '2rem', fontWeight: 900 }}>Solitaire</h1>
          <span style={{ color: GOLD, fontWeight: 800, fontSize: '0.8rem', background: 'rgba(252,211,77,0.12)', border: `1px solid ${GOLD}55`, borderRadius: 999, padding: '4px 12px' }}>{VARIANTS.length} variantes</span>
        </div>
        <p style={{ color: BLUE, marginBottom: 20 }}>Choisis une variante et joue en solo. Cartes françaises, déplacement au clic, envoi auto aux fondations, annuler.</p>

        {/* Raccourcis */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
          {SHORTCUTS.map((s) => (
            <Link key={s.href} href={s.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: `linear-gradient(135deg, ${s.grad[0]}, ${s.grad[1]})`, color: '#fff', textDecoration: 'none', borderRadius: 12, padding: '9px 14px', fontWeight: 800, fontSize: '0.82rem' }}>
              <s.icon style={{ width: 16, height: 16 }} /> {s.label}
            </Link>
          ))}
        </div>

        {/* Vedettes */}
        <h2 style={{ color: GOLD, fontWeight: 800, fontSize: '1.05rem', marginBottom: 10 }}>★ Vedettes</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginBottom: 26 }}>
          {flagships.map((v) => <VariantCard key={v.key} v={v} featured />)}
        </div>

        {/* Recherche */}
        <div style={{ position: 'relative', marginBottom: 18, maxWidth: 420 }}>
          <Search style={{ width: 16, height: 16, color: '#64748B', position: 'absolute', left: 12, top: 13 }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Rechercher parmi ${VARIANTS.length} variantes…`} style={{ width: '100%', background: '#0F2238', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '11px 14px 11px 36px', color: '#fff', outline: 'none', fontSize: '0.9rem' }} />
        </div>

        {Object.entries(groups).map(([cat, list]) => (
          <div key={cat} style={{ marginBottom: 24 }}>
            <h2 style={{ color: '#fff', fontWeight: 800, fontSize: '1rem', marginBottom: 10 }}>{cat} <span style={{ color: '#64748B', fontWeight: 600, fontSize: '0.8rem' }}>({list.length})</span></h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 8 }}>
              {list.map((v) => <VariantCard key={v.key} v={v} />)}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

function VariantCard({ v, featured }: { v: { key: string; label: string }; featured?: boolean }) {
  return (
    <Link href={`/solitaire/play/${v.key}`} style={{ display: 'block', textDecoration: 'none', background: featured ? 'linear-gradient(135deg, rgba(252,211,77,0.18), rgba(245,158,11,0.1))' : 'rgba(255,255,255,0.05)', border: `1px solid ${featured ? '#FCD34D55' : 'rgba(255,255,255,0.1)'}`, borderRadius: 12, padding: '12px 14px' }}>
      <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.88rem' }}>{v.label}</div>
      <div style={{ color: BLUE, fontSize: '0.72rem', marginTop: 3 }}>Jouer →</div>
    </Link>
  );
}
