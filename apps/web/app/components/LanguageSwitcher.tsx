'use client';

/**
 * @file components/LanguageSwitcher.tsx
 * @description Sélecteur de langue UNIQUE — pas de doublon "FR FR".
 *
 * Affiche un seul label "FR ▼" / "EN ▼" / "AR ▼" (le drapeau emoji est
 * réservé au dropdown ouvert). Au-dessus de tout (z-index 100).
 */

import { useState, useEffect } from 'react';
import { LANGUAGES, changeWebLanguage, type WebLocale } from '../lib/i18n';

interface Props {
  variant?: 'light' | 'dark';
}

export default function LanguageSwitcher({ variant = 'light' }: Props) {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<WebLocale>('fr');

  useEffect(() => {
    import('../lib/i18n').then((mod) => {
      setLang(mod.default.language as WebLocale);
      mod.default.on('languageChanged', (lng: string) => setLang(lng as WebLocale));
    });
  }, []);

  const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  const handleSelect = (code: WebLocale) => {
    changeWebLanguage(code);
    setLang(code);
    setOpen(false);
  };

  const isLight = variant === 'light';

  return (
    <div className="relative" style={{ zIndex: 100 }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all duration-300 border"
        style={{
          color: isLight ? '#F8FAFC' : '#0A1535',
          backgroundColor: isLight ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
          borderColor: isLight ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
          minWidth: '64px',
          justifyContent: 'center',
        }}
        aria-label="Language selector"
      >
        <span>{current.code.toUpperCase()}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0" style={{ zIndex: 99 }} onClick={() => setOpen(false)} />
          <div
            className="absolute end-0 mt-2 w-44 rounded-xl border shadow-2xl overflow-hidden"
            style={{
              top: '100%',
              backgroundColor: '#FFFFFF',
              borderColor: 'rgba(0,0,0,0.1)',
              zIndex: 101,
              boxShadow: '0 16px 48px rgba(10,21,53,0.25)',
            }}
          >
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => handleSelect(l.code)}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors duration-200"
                style={{
                  color: l.code === current.code ? '#2563EB' : '#0A1535',
                  backgroundColor: l.code === current.code ? 'rgba(37,99,235,0.06)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (l.code !== current.code) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)';
                }}
                onMouseLeave={(e) => {
                  if (l.code !== current.code) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span style={{ fontSize: '18px', lineHeight: 1 }} aria-hidden>
                  {l.flag}
                </span>
                <span>{l.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
