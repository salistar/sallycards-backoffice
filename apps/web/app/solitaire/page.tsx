/**
 * @file solitaire/page.tsx
 * @description Landing page web pour Solitaire — affiche les variantes
 * disponibles, les stats BD en temps réel, et un bouton Quick Match qui
 * génère un code de partie 1v1 (à entrer dans l'app mobile).
 */

'use client';

import { useEffect, useState } from 'react';
import GoogleSignIn from '../components/GoogleSignIn';
import { t, LOCALES, isRtl, type Locale } from './i18n';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

interface DealSeedStats {
  total: Record<string, number>;
  withSolution: Record<string, number>;
  coverage: Record<string, number>;
  grandTotal: number;
  grandWithSolution: number;
}

interface SeedingStatus {
  status: 'idle' | 'running' | 'done' | 'error';
  totalGenerated: number;
  startedAt: number | null;
  finishedAt: number | null;
}

const VARIANTS = [
  { key: 'klondike-1', label: 'Klondike (Pioche 1)', icon: '♠️' },
  { key: 'klondike-3', label: 'Klondike (Pioche 3)', icon: '♠️' },
  { key: 'klondike-vegas', label: 'Klondike Vegas', icon: '🎰' },
  { key: 'spider-1', label: 'Spider 1 couleur', icon: '🕷️' },
  { key: 'spider-2', label: 'Spider 2 couleurs', icon: '🕷️' },
  { key: 'spider-4', label: 'Spider 4 couleurs', icon: '🕷️' },
  { key: 'freecell', label: 'FreeCell', icon: '♥️' },
  { key: 'yukon', label: 'Yukon', icon: '🏔️' },
  { key: 'golf', label: 'Golf', icon: '⛳' },
  { key: 'pyramid', label: 'Pyramid', icon: '🔺' },
  { key: 'tripeaks', label: 'TriPeaks', icon: '⛰️' },
  { key: 'forty-thieves', label: 'Forty Thieves', icon: '🎭' },
  { key: 'accordion', label: 'Accordion', icon: '🎵' },
];

export default function SolitairePage() {
  const [stats, setStats] = useState<DealSeedStats | null>(null);
  const [seeding, setSeeding] = useState<SeedingStatus | null>(null);
  const [matchCode, setMatchCode] = useState<string | null>(null);
  const [matchData, setMatchData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState('klondike-1');
  const [user, setUser] = useState<{ username?: string; email?: string } | null>(null);
  const [locale, setLocale] = useState<Locale>('fr');

  // Restaure l'utilisateur + locale depuis localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('user');
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch { /* ignore */ }
    }
    const savedLoc = localStorage.getItem('solitaire-locale') as Locale | null;
    if (savedLoc && LOCALES.find((l) => l.code === savedLoc)) {
      setLocale(savedLoc);
    } else {
      // Détection navigator
      const navLoc = (navigator?.language || 'fr').split('-')[0] as Locale;
      if (LOCALES.find((l) => l.code === navLoc)) setLocale(navLoc);
    }
  }, []);

  const changeLocale = (loc: Locale) => {
    setLocale(loc);
    if (typeof window !== 'undefined') localStorage.setItem('solitaire-locale', loc);
  };

  const rtl = isRtl(locale);

  // SSE stream pour les updates de match en temps réel (latence < 100ms)
  useEffect(() => {
    if (!matchCode) return;
    const es = new EventSource(`${API_URL}/solitaire-matches/${matchCode}/stream`);
    es.onmessage = (ev) => {
      try {
        const m = JSON.parse(ev.data);
        setMatchData(m);
      } catch { /* ignore */ }
    };
    es.onerror = () => {
      console.warn('[SSE] connection error');
    };
    return () => es.close();
  }, [matchCode]);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const [s, st] = await Promise.all([
          fetch(`${API_URL}/deal-seeds/stats`).then((r) => r.json()).catch(() => null),
          fetch(`${API_URL}/deal-seeds/seeding-status`).then((r) => r.json()).catch(() => null),
        ]);
        if (cancelled) return;
        if (s?.success) setStats(s.data);
        if (st?.success) setSeeding(st.data);
      } catch { /* network down */ }
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const createQuickMatch = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/solitaire-matches/quick-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variant: selectedVariant,
          userId: 'web-' + Math.random().toString(36).slice(2, 9),
          displayName: 'WebPlayer',
        }),
      });
      const json = await res.json();
      if (json?.success) setMatchCode(json.data.code);
      else alert('Impossible de créer un match — backend offline ?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white"
      dir={rtl ? 'rtl' : 'ltr'}>
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Sélecteur de langue */}
        <div className="flex justify-end gap-1 mb-6">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              onClick={() => changeLocale(l.code)}
              className={`px-2 py-1 rounded text-xs ${
                locale === l.code
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-800/50 hover:bg-slate-700 text-slate-300'
              }`}>
              {l.flag} {l.native}
            </button>
          ))}
        </div>

        <header className="mb-12 text-center">
          <h1 className="text-5xl font-black mb-4">{t(locale, 'hero.title')}</h1>
          <p className="text-lg text-slate-300 mb-6">
            {t(locale, 'hero.subtitle')}
          </p>
          {user ? (
            <div className="inline-flex items-center gap-2 bg-emerald-900/30 border border-emerald-500 px-4 py-2 rounded">
              <span className="text-emerald-400">✓</span>
              <span className="text-sm">{t(locale, 'hero.signedIn')} <b>{user.username ?? user.email}</b></span>
              <button
                onClick={() => {
                  localStorage.removeItem('accessToken');
                  localStorage.removeItem('user');
                  setUser(null);
                }}
                className="ml-2 text-xs text-slate-400 hover:text-white">
                {t(locale, 'hero.logout')}
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <GoogleSignIn onSuccess={(u) => setUser(u)} />
            </div>
          )}
        </header>

        {/* Stats BD live */}
        <section className="mb-12 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="text-3xl font-black text-amber-400">
              {stats?.grandTotal ?? '…'}
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wide">{t(locale, 'stats.seedsInDb')}</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="text-3xl font-black text-emerald-400">
              {stats?.grandWithSolution ?? '…'}
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wide">{t(locale, 'stats.withSolution')}</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="text-3xl font-black text-cyan-400">
              {VARIANTS.length}
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wide">{t(locale, 'stats.variants')}</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className={`text-3xl font-black ${
              seeding?.status === 'running' ? 'text-cyan-400 animate-pulse' :
              seeding?.status === 'done' ? 'text-emerald-400' : 'text-slate-400'
            }`}>
              {seeding?.status === 'running' ? '⟳' :
               seeding?.status === 'done' ? '✓' : '—'}
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wide">
              {seeding?.status ?? t(locale, 'stats.loading')}
            </div>
          </div>
        </section>

        {/* Variantes */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">{t(locale, 'variants.title')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {VARIANTS.map((v) => {
              const total = stats?.total[v.key] ?? 0;
              const cov = stats?.coverage[v.key] ?? 0;
              return (
                <div key={v.key}
                  onClick={() => setSelectedVariant(v.key)}
                  className={`cursor-pointer p-4 rounded-lg border transition-all ${
                    selectedVariant === v.key
                      ? 'bg-cyan-500/20 border-cyan-400 scale-105'
                      : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'
                  }`}>
                  <div className="text-2xl mb-1">{v.icon}</div>
                  <div className="text-sm font-bold">{v.label}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {total} {t(locale, 'variants.deals')} · {cov.toFixed(0)}% {t(locale, 'variants.coverage')}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Quick Match */}
        <section className="mb-12 bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-3">{t(locale, 'quick.title')}</h2>
          <p className="text-slate-300 mb-4 text-sm">
            {t(locale, 'quick.intro', { v: selectedVariant })}
          </p>
          <button
            onClick={createQuickMatch}
            disabled={loading}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 rounded-lg font-bold transition">
            {loading ? t(locale, 'quick.creating') : t(locale, 'quick.create')}
          </button>
          {matchCode ? (
            <div className="mt-4 p-4 bg-emerald-900/30 border border-emerald-500 rounded">
              <div className="text-sm text-slate-300 mb-1">{t(locale, 'quick.code')}</div>
              <div className="text-3xl font-mono font-black text-emerald-400 tracking-wider">{matchCode}</div>
              <div className="text-xs text-slate-400 mt-2">
                {t(locale, 'quick.codeHint')}
              </div>
              {matchData ? (
                <div className="mt-4 pt-4 border-t border-emerald-700">
                  <div className="text-xs text-slate-400 mb-2">{t(locale, 'quick.streamActive')}</div>
                  <div className="text-sm">
                    {t(locale, 'quick.status')} : <span className="font-bold text-emerald-400">{matchData.status}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {matchData.players?.map((p: any) => (
                      <div key={p.userId} className="bg-slate-800/50 p-2 rounded">
                        <div className="text-xs text-slate-300">{p.displayName}</div>
                        <div className="font-mono">
                          {p.score}pts · {p.moves}c {p.finished ? '✓' : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        {/* Download CTA */}
        <section className="text-center">
          <p className="text-slate-400 mb-4">{t(locale, 'cta.download')}</p>
          <div className="flex gap-4 justify-center">
            <a href="/download" className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-bold">
              {t(locale, 'cta.stores')}
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
