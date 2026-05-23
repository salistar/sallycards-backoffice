/**
 * @file apps/web/app/admin/layout.tsx
 * @description Shell admin bleu nuit (cohérent avec les apps de jeu). Sidebar de
 *   navigation + garde de connexion. Le rôle admin est appliqué côté serveur
 *   (AdminGuard) : un non-admin reçoit 403 sur les endpoints /admin.
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import {
  LayoutDashboard, Users, Bell, Trophy, Gift, Activity, BarChart3, LogOut, Shield,
} from 'lucide-react';

const NAVY = '#0A1535';
const GOLD = '#FCD34D';
const BLUE = '#93C5FD';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Utilisateurs', icon: Users },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
  { href: '/admin/tournaments', label: 'Tournois', icon: Trophy },
  { href: '/admin/gifts', label: 'Cadeaux', icon: Gift },
  { href: '/admin/activity', label: 'Activité', icon: Activity },
  { href: '/admin/stats', label: 'Statistiques', icon: BarChart3 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const pathname = usePathname();

  if (!isLoading && !user) {
    return (
      <main style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${NAVY}, #1E3A8A 60%, ${NAVY})`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <Shield style={{ width: 40, height: 40, color: GOLD, margin: '0 auto 12px' }} />
          <p style={{ color: BLUE, marginBottom: 18 }}>Espace admin — connecte-toi avec un compte administrateur.</p>
          <Link href="/auth/login?game=belote" style={{ background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: NAVY, fontWeight: 900, padding: '12px 28px', borderRadius: 12, textDecoration: 'none' }}>Se connecter</Link>
        </div>
      </main>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: `linear-gradient(160deg, ${NAVY}, #0c1c3a)` }}>
      <aside style={{ width: 232, background: '#0A1429', borderRight: '1px solid rgba(255,255,255,0.08)', padding: 18, display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22 }}>
          <Shield style={{ width: 24, height: 24, color: GOLD }} />
          <span style={{ color: '#fff', fontWeight: 900, fontSize: '1.1rem' }}>Sally<span style={{ color: GOLD }}>Admin</span></span>
        </div>
        <nav style={{ display: 'grid', gap: 4, flex: 1 }}>
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = pathname === n.href;
            return (
              <Link key={n.href} href={n.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: '0.88rem', color: active ? NAVY : '#CBD5E1', background: active ? `linear-gradient(90deg, ${GOLD}, #F59E0B)` : 'transparent' }}>
                <Icon style={{ width: 17, height: 17 }} /> {n.label}
              </Link>
            );
          })}
        </nav>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>
          <div style={{ color: BLUE, fontSize: '0.78rem', marginBottom: 8 }}>{(user as any)?.username || 'admin'}</div>
          <button onClick={() => logout()} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999, padding: '7px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', width: '100%' }}>
            <LogOut style={{ width: 15, height: 15 }} /> Déconnexion
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: '28px 28px 60px', minWidth: 0, overflow: 'auto' }}>{children}</main>
    </div>
  );
}
