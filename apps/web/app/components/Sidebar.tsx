'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../lib/auth-context';
import { useState } from 'react';

const GAME_ITEMS = [
  { label: 'Ronda', icon: '🃏', key: 'ronda' },
  { label: 'Kdoub', icon: '🤥', key: 'kdoub' },
  { label: 'Belote', icon: '♣️', key: 'belote' },
  { label: 'Poker', icon: '♠️', key: 'poker' },
  { label: 'Tarot', icon: '👑', key: 'tarot' },
  { label: 'Scopa', icon: '🪙', key: 'scopa' },
  { label: 'Okey', icon: '🎴', key: 'okey' },
  { label: 'Memory', icon: '🧠', key: 'concentration' },
  { label: 'Solitaire', icon: '♦️', key: 'solitaire' },
  { label: 'Qui Est-Ce?', icon: '❓', key: 'quiestce' },
];

const ADMIN_ITEMS = [
  { labelKey: 'admin.dashboard', href: '/admin', icon: '📊' },
  { labelKey: 'admin.users', href: '/admin/users', icon: '👥' },
  { labelKey: 'admin.games', href: '/admin/games', icon: '🎮' },
  { labelKey: 'admin.leaderboard', href: '/admin/leaderboard', icon: '🏆' },
  { labelKey: 'admin.bots', href: '/admin/bots', icon: '🤖' },
  { labelKey: 'admin.assets', href: '/admin/assets', icon: '🖼️' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [hoveredGame, setHoveredGame] = useState<string | null>(null);
  const [logoutHover, setLogoutHover] = useState(false);

  return (
    <aside
      style={{
        width: 256,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e5e7eb',
      }}
    >
      {/* Logo */}
      <div
        style={{
          height: 80,
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #10b981, #059669)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <path d="M12 8v8M8 12h8" />
            </svg>
          </div>
          <div>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#111827', display: 'block', letterSpacing: '-0.03em' }}>
              Sally<span style={{ color: '#10b981' }}>Cards</span>
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af' }}>{t('admin.panel')}</span>
          </div>
        </Link>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px' }}>
        {/* Admin section */}
        <div>
          <p style={{ padding: '0 16px', fontSize: 10, fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 12 }}>
            {t('admin.section')}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {ADMIN_ITEMS.map((item) => {
              const isActive = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
              const isHovered = hoveredNav === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onMouseEnter={() => setHoveredNav(item.href)}
                  onMouseLeave={() => setHoveredNav(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 16px',
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 700,
                    textDecoration: 'none',
                    transition: 'all 0.3s ease-out',
                    backgroundColor: isActive ? '#ecfdf5' : isHovered ? '#f9fafb' : 'transparent',
                    color: isActive ? '#059669' : isHovered ? '#111827' : '#4b5563',
                    borderLeft: isActive ? '2px solid #10b981' : '2px solid transparent',
                  }}
                >
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Games section */}
        <div style={{ marginTop: 24 }}>
          <p style={{ padding: '0 16px', fontSize: 10, fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 12 }}>
            {t('admin.gamesSection')}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {GAME_ITEMS.map((game) => {
              const href = `/admin/games?type=${game.key}`;
              const isActive = pathname === '/admin/games' && typeof window !== 'undefined' && window.location.search.includes(game.key);
              const isHovered = hoveredGame === game.key;
              return (
                <Link
                  key={game.key}
                  href={href}
                  onMouseEnter={() => setHoveredGame(game.key)}
                  onMouseLeave={() => setHoveredGame(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 16px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'all 0.3s ease-out',
                    backgroundColor: isActive ? '#ecfdf5' : isHovered ? '#f9fafb' : 'transparent',
                    color: isActive ? '#059669' : isHovered ? '#374151' : '#6b7280',
                  }}
                >
                  <span style={{ fontSize: 14 }}>{game.icon}</span>
                  {game.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* User + Logout */}
      <div style={{ padding: 20, borderTop: '1px solid #e5e7eb' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: 12,
            borderRadius: 12,
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 900,
            }}
          >
            {user?.username?.[0]?.toUpperCase() || 'A'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.username || 'Admin'}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email || 'admin@sallycards.com'}
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          onMouseEnter={() => setLogoutHover(true)}
          onMouseLeave={() => setLogoutHover(false)}
          style={{
            marginTop: 12,
            width: '100%',
            fontSize: 12,
            fontWeight: 700,
            color: logoutHover ? '#ef4444' : '#9ca3af',
            backgroundColor: logoutHover ? '#fef2f2' : 'transparent',
            padding: '8px 0',
            borderRadius: 12,
            border: 'none',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.3s ease-out',
          }}
        >
          {t('admin.logout')}
        </button>
      </div>
    </aside>
  );
}
