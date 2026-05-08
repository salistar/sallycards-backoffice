'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import LanguageSwitcher from './LanguageSwitcher';

export default function AdminHeader() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = segments.map((seg, i) => ({
    label: seg.charAt(0).toUpperCase() + seg.slice(1),
    href: '/' + segments.slice(0, i + 1).join('/'),
  }));

  return (
    <header
      style={{
        height: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        flexShrink: 0,
        backgroundColor: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid #e5e7eb',
      }}
    >
      {/* Breadcrumbs */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {i > 0 && <span style={{ color: '#d1d5db' }}>/</span>}
            {i === breadcrumbs.length - 1 ? (
              <span style={{ fontWeight: 900, color: '#111827' }}>{crumb.label}</span>
            ) : (
              <Link href={crumb.href} style={{ color: '#9ca3af', fontWeight: 700, textDecoration: 'none', transition: 'color 0.3s ease-out' }}>
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          {/* Search icon */}
          <svg
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 16,
              height: 16,
              color: searchFocused ? '#10b981' : '#9ca3af',
              pointerEvents: 'none',
              transition: 'color 0.3s ease-out',
            }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={t('admin.search')}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{
              width: 240,
              paddingLeft: 40,
              paddingRight: 16,
              paddingTop: 10,
              paddingBottom: 10,
              borderRadius: 12,
              fontSize: 14,
              color: '#111827',
              outline: 'none',
              backgroundColor: '#f9fafb',
              border: searchFocused ? '2px solid #10b981' : '2px solid #e5e7eb',
              fontWeight: 500,
              transition: 'all 0.3s ease-out',
              boxShadow: searchFocused ? '0 0 0 4px rgba(16,185,129,0.1)' : 'none',
            }}
          />
        </div>

        <LanguageSwitcher />

        <Link
          href="/"
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: '#6b7280',
            textDecoration: 'none',
            transition: 'color 0.3s ease-out',
          }}
        >
          {t('common.viewSite')}
        </Link>
      </div>
    </header>
  );
}
