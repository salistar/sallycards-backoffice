/**
 * @file apps/web/app/belote/page.tsx
 * @description Hub web Belote (Phase 1) — accès login-gated + menu.
 *   Connecté au backend prod via apiClient. Les écrans data (Phase 2) et la
 *   table de jeu temps réel web↔mobile (Phase 3) viennent ensuite.
 */
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '../lib/auth-context';
import {
  LogIn, Plus, LogIn as Enter, Bot, BookOpen, Gift, Users, Trophy,
  Medal, Inbox, Activity, LogOut,
} from 'lucide-react';

const NAVY = '#0A1535';
const CARD = '#152A47';
const GOLD = '#FCD34D';
const BLUE = '#93C5FD';

interface MenuItem {
  key: string;
  label: string;
  sub: string;
  icon: any;
  grad: [string, string];
  href?: string;          // route existante (Phase 1)
  phase?: 2 | 3;          // sinon : badge "Bientôt"
}

const MENU: MenuItem[] = [
  { key: 'create', label: 'Créer une room', sub: 'Partie multijoueur privée/publique', icon: Plus, grad: ['#7C3AED', '#EC4899'], phase: 3 },
  { key: 'join', label: 'Rejoindre', sub: 'Avec un code à 6 caractères', icon: Enter, grad: ['#2563EB', '#06B6D4'], phase: 3 },
  { key: 'bot', label: 'vs Bot', sub: 'Joue contre l’IA', icon: Bot, grad: ['#10B981', '#059669'], phase: 2 },
  { key: 'rules', label: 'Règles', sub: 'Distribution, atouts, scoring', icon: BookOpen, grad: ['#0EA5E9', '#2563EB'], href: '/belote/rules' },
  { key: 'leaderboards', label: 'Classements', sub: 'Jour / semaine / mois / saison', icon: Medal, grad: ['#F59E0B', '#D97706'], href: '/leaderboard' },
  { key: 'rewards', label: 'Récompenses', sub: 'Vouchers & niveaux', icon: Gift, grad: ['#EAB308', '#CA8A04'], phase: 2 },
  { key: 'friends', label: 'Amis', sub: 'Liste & invitations', icon: Users, grad: ['#3B82F6', '#1D4ED8'], phase: 2 },
  { key: 'tournaments', label: 'Tournois', sub: 'Daily / weekly', icon: Trophy, grad: ['#EAB308', '#B45309'], phase: 2 },
  { key: 'inbox', label: 'Boîte', sub: 'Notifications', icon: Inbox, grad: ['#A855F7', '#7C3AED'], phase: 2 },
  { key: 'challenges', label: 'Défis sport', sub: 'Marche / course A→B', icon: Activity, grad: ['#22C55E', '#16A34A'], phase: 2 },
];

export default function BeloteHub() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [note, setNote] = useState<string | null>(null);

  // Non connecté → CTA login
  if (!user) {
    return (
      <main style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${NAVY}, #1E3A8A 60%, ${NAVY})`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 460 }}>
          <div style={{ fontSize: 64 }}>🃏</div>
          <h1 style={{ color: '#fff', fontSize: '2.2rem', fontWeight: 900, margin: '12px 0' }}>Belote — SallyCards</h1>
          <p style={{ color: BLUE, fontSize: '1rem', lineHeight: 1.6, marginBottom: 28 }}>
            Belote française classique · multijoueur · vs bot · défis sport. Connecte-toi pour jouer.
          </p>
          <Link href="/auth/login?game=belote" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: NAVY, fontWeight: 900, fontSize: '1.05rem', padding: '14px 32px', borderRadius: 14, textDecoration: 'none' }}>
            <LogIn style={{ width: 20, height: 20 }} /> Se connecter / S’inscrire
          </Link>
        </div>
      </main>
    );
  }

  const onMenu = (m: MenuItem) => {
    if (m.href) { router.push(m.href); return; }
    setNote(`« ${m.label} » arrive en Phase ${m.phase}. Le backend prod est déjà prêt — l’écran web suit.`);
  };

  return (
    <main style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${NAVY}, #152A47)`, padding: '32px 20px 60px' }}>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 900 }}>Belote</h1>
            <p style={{ color: BLUE, fontSize: '0.9rem' }}>Bonjour {(user as any).username || 'joueur'} · {(user as any).coins ?? 0} pièces</p>
          </div>
          <button onClick={() => logout()} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999, padding: '8px 16px', cursor: 'pointer', fontWeight: 700 }}>
            <LogOut style={{ width: 16, height: 16 }} /> Déconnexion
          </button>
        </div>

        {note && (
          <div style={{ background: 'rgba(252,211,77,0.12)', border: `1px solid ${GOLD}55`, borderRadius: 12, padding: 14, marginBottom: 20, color: GOLD, fontWeight: 600 }}>
            {note}
          </div>
        )}

        {/* Menu grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {MENU.map((m) => {
            const Icon = m.icon;
            return (
              <button key={m.key} onClick={() => onMenu(m)} style={{ textAlign: 'left', border: 'none', cursor: 'pointer', borderRadius: 16, overflow: 'hidden', padding: 0, background: CARD }}>
                <div style={{ background: `linear-gradient(135deg, ${m.grad[0]}, ${m.grad[1]})`, padding: 18, position: 'relative' }}>
                  <Icon style={{ width: 28, height: 28, color: '#fff' }} />
                  {m.phase && (
                    <span style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.35)', color: '#fff', fontSize: 10, fontWeight: 900, padding: '3px 8px', borderRadius: 999 }}>
                      PHASE {m.phase}
                    </span>
                  )}
                </div>
                <div style={{ padding: 14 }}>
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: '1rem' }}>{m.label}</div>
                  <div style={{ color: BLUE, fontSize: '0.8rem', marginTop: 3 }}>{m.sub}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}
