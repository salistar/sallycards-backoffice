'use client';

import { useState, useEffect } from 'react';
import { LANGUAGES, changeWebLanguage, type WebLocale } from '../lib/i18n';

interface Props {
  variant?: 'light' | 'dark';
}

export default function LanguageSwitcher({ variant = 'dark' }: Props) {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<WebLocale>('fr');

  useEffect(() => {
    import('../lib/i18n').then((mod) => {
      setLang(mod.default.language as WebLocale);
      mod.default.on('languageChanged', (lng: string) => setLang(lng as WebLocale));
    });
  }, []);

  const current = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  const handleSelect = (code: WebLocale) => {
    changeWebLanguage(code);
    setLang(code);
    setOpen(false);
  };

  const textColor = variant === 'light' ? 'text-gray-600' : 'text-gray-600';
  const hoverBg = 'hover:bg-gray-50';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold ${textColor} ${hoverBg} transition-all duration-300`}
      >
        <span>{current.flag}</span>
        <span className="hidden sm:inline">{current.code.toUpperCase()}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-44 rounded-xl bg-white border border-gray-200 shadow-lg z-50 overflow-hidden">
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                onClick={() => handleSelect(l.code)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold hover:bg-gray-50 transition-all duration-300 ${
                  l.code === current.code ? 'text-emerald-600' : 'text-gray-700'
                }`}
              >
                <span>{l.flag}</span>
                <span>{l.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
