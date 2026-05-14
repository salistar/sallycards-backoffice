/**
 * @file app/download/page.tsx
 * @description Page de téléchargement de l'APK Sally Solitaire avec design
 * dark premium aligné sur la home. Trilingue FR/EN/AR avec support RTL.
 *
 * Le bouton vert déclenche un download IMMÉDIAT du fichier (programmatic
 * anchor click + Content-Disposition: attachment côté GitHub). Les autres
 * stores (Play Store, App Store) sont affichés en état "Coming soon".
 */
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

const APK_URL = 'https://github.com/salistar/sally-solitaire/releases/download/latest/app-debug.apk';
const RELEASE_PAGE_URL = 'https://github.com/salistar/sally-solitaire/releases/tag/latest';
const RELEASES_API = 'https://api.github.com/repos/salistar/sally-solitaire/releases/tags/latest';

export default function DownloadPage() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language?.split('-')[0] ?? 'fr') as 'fr' | 'en' | 'ar';
  const isRtl = lang === 'ar';

  const [release, setRelease] = useState<{
    published_at: string;
    name: string;
    apkSize?: number;
  } | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch(RELEASES_API)
      .then((r) => r.json())
      .then((data) => {
        if (data?.tag_name) {
          const apk = data.assets?.find((a: any) => a.name === 'app-debug.apk');
          setRelease({
            published_at: data.published_at,
            name: data.name ?? data.tag_name,
            apkSize: apk?.size,
          });
        }
      })
      .catch(() => {});
  }, []);

  const apkSizeMB = release?.apkSize ? (release.apkSize / 1024 / 1024).toFixed(1) : '211';

  /**
   * Direct-download via a hidden anchor — most reliable across browsers,
   * including iOS Safari and Edge. Combined with the GitHub release URL's
   * Content-Disposition: attachment header, this triggers an immediate
   * file save with no navigation.
   */
  const triggerDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    setDownloading(true);
    const a = document.createElement('a');
    a.href = APK_URL;
    a.download = 'sally-solitaire-latest.apk';
    a.rel = 'noopener noreferrer';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => setDownloading(false), 2500);
  };

  return (
    <main
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen w-full overflow-x-hidden relative"
      style={{
        backgroundColor: '#0a0e1a',
        color: '#e7e9ee',
        fontFamily: isRtl ? "'Cairo', 'Inter', system-ui, sans-serif" : "'Inter', system-ui, sans-serif",
      }}
    >
      {/* ─── Background ─── */}
      <div
        aria-hidden
        className="fixed inset-0 -z-10 opacity-50"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(16,185,129,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(16,185,129,0.05) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />
      <div
        aria-hidden
        className="fixed -z-10 rounded-full"
        style={{
          top: '-20%',
          right: '-10%',
          width: '600px',
          height: '600px',
          background: '#10b981',
          filter: 'blur(120px)',
          opacity: 0.25,
        }}
      />
      <div
        aria-hidden
        className="fixed -z-10 rounded-full"
        style={{
          bottom: '-20%',
          left: '10%',
          width: '600px',
          height: '600px',
          background: '#06b6d4',
          filter: 'blur(120px)',
          opacity: 0.2,
        }}
      />

      {/* ─── NAVBAR ─── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b"
        style={{
          backgroundColor: 'rgba(10,14,26,0.85)',
          borderColor: 'rgba(255,255,255,0.06)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
              style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <path d="M12 8v8M8 12h8" />
              </svg>
            </div>
            <span className="text-xl font-black tracking-tight" style={{ color: '#f8fafc' }}>
              Sally<span style={{ color: '#10b981' }}>Cards</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="light" />
            <Link
              href="/"
              className="px-4 py-2 rounded-xl text-sm font-bold border transition hover:bg-white/5"
              style={{
                backgroundColor: 'rgba(15,23,42,0.6)',
                borderColor: 'rgba(255,255,255,0.1)',
                color: '#e7e9ee',
              }}
            >
              ← {t('common.back')}
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO + APK CARD ─── */}
      <section className="relative pt-32 pb-16 px-6">
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
          {/* Title */}
          <div
            className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border"
            style={{
              backgroundColor: 'rgba(16,185,129,0.08)',
              borderColor: 'rgba(16,185,129,0.3)',
            }}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
              {t('games.available')}
            </span>
          </div>

          <h1
            className="text-5xl md:text-7xl font-black tracking-tighter mb-4"
            style={{ color: '#f8fafc' }}
          >
            {t('download.title')}{' '}
            <span
              style={{
                backgroundImage: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Solitaire
            </span>
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mb-12" style={{ color: '#94a3b8' }}>
            {t('download.subtitle')}
          </p>

          {/* APK card — main highlight */}
          <div
            className="w-full p-8 md:p-10 rounded-3xl backdrop-blur-md border"
            style={{
              backgroundColor: 'rgba(15,23,42,0.6)',
              borderColor: 'rgba(16,185,129,0.4)',
              boxShadow: '0 8px 48px rgba(16,185,129,0.2)',
            }}
          >
            <div className="flex flex-col md:flex-row items-center gap-6 mb-6 text-center md:text-start">
              {/* Icon from mobile app */}
              <div
                className="w-28 h-28 rounded-3xl overflow-hidden shadow-2xl flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
              >
                <Image
                  src="/solitaire-icon.png"
                  alt="Sally Solitaire"
                  width={112}
                  height={112}
                  className="w-full h-full object-cover"
                  unoptimized
                  priority
                />
              </div>
              <div className="flex-1">
                <p className="text-xs font-black uppercase tracking-widest mb-2 text-emerald-400">
                  ♦ {t('download.apkLabel')}
                </p>
                <h2 className="text-3xl md:text-4xl font-black mb-2" style={{ color: '#f8fafc' }}>
                  {t('download.solitaireTitle')}
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
                  {t('download.solitaireDesc')}
                </p>
              </div>
            </div>

            {/* Download CTA */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch">
              <a
                href={APK_URL}
                download="sally-solitaire-latest.apk"
                onClick={triggerDownload}
                aria-disabled={downloading}
                className={`flex-1 px-6 py-5 rounded-xl font-black text-base text-[#0a0e1a] shadow-2xl shadow-emerald-500/30 transition flex items-center justify-center gap-3 ${
                  downloading ? 'opacity-90 cursor-wait' : 'hover:scale-[1.02] active:scale-95'
                }`}
                style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
              >
                {downloading ? (
                  <>
                    <span className="inline-block w-5 h-5 border-2 border-[#0a0e1a] border-t-transparent rounded-full animate-spin" />
                    {lang === 'fr' ? 'Téléchargement…' : lang === 'en' ? 'Downloading…' : 'جاري التحميل…'}
                  </>
                ) : (
                  <>
                    ⬇ {t('download.apkButton')} <span className="opacity-70">({apkSizeMB} MB)</span>
                  </>
                )}
              </a>
              <a
                href={RELEASE_PAGE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-5 rounded-xl text-sm font-bold border transition hover:bg-white/5 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: 'rgba(15,23,42,0.5)',
                  borderColor: 'rgba(255,255,255,0.1)',
                  color: '#e7e9ee',
                }}
              >
                {t('download.viewRelease')}
              </a>
            </div>

            {/* Release meta */}
            {release && (
              <p className="mt-4 text-xs text-center" style={{ color: '#64748b' }}>
                {t('download.lastBuild')}{' '}
                <span className="font-mono" style={{ color: '#94a3b8' }}>
                  {new Date(release.published_at).toLocaleString(lang === 'ar' ? 'ar-MA' : lang === 'fr' ? 'fr-FR' : 'en-GB', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ─── INSTALLATION STEPS ─── */}
      <section className="relative py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black mb-10 text-center tracking-tight" style={{ color: '#f8fafc' }}>
            {t('download.installSteps')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {['download.step1', 'download.step2', 'download.step3', 'download.step4'].map((stepKey, i) => (
              <div
                key={stepKey}
                className="p-6 rounded-2xl backdrop-blur-md border"
                style={{
                  backgroundColor: 'rgba(15,23,42,0.5)',
                  borderColor: 'rgba(255,255,255,0.08)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-base mb-4 text-[#0a0e1a]"
                  style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
                >
                  {i + 1}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#e7e9ee' }}>
                  {t(stepKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── OTHER STORES (Coming Soon) ─── */}
      <section className="relative py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Google Play */}
            <div
              className="p-7 rounded-2xl backdrop-blur-md border relative overflow-hidden"
              style={{
                backgroundColor: 'rgba(15,23,42,0.4)',
                borderColor: 'rgba(255,255,255,0.06)',
                opacity: 0.75,
              }}
            >
              <span
                className="absolute top-4 end-4 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase"
                style={{
                  backgroundColor: 'rgba(245,158,11,0.15)',
                  color: '#f59e0b',
                  border: '1px solid rgba(245,158,11,0.4)',
                }}
              >
                {t('games.comingSoon')}
              </span>
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl mb-4"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                🤖
              </div>
              <h3 className="text-xl font-black mb-2" style={{ color: '#f8fafc' }}>Google Play</h3>
              <p className="text-sm" style={{ color: '#94a3b8' }}>{t('download.googleSoon')}</p>
            </div>

            {/* App Store */}
            <div
              className="p-7 rounded-2xl backdrop-blur-md border relative overflow-hidden"
              style={{
                backgroundColor: 'rgba(15,23,42,0.4)',
                borderColor: 'rgba(255,255,255,0.06)',
                opacity: 0.75,
              }}
            >
              <span
                className="absolute top-4 end-4 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase"
                style={{
                  backgroundColor: 'rgba(245,158,11,0.15)',
                  color: '#f59e0b',
                  border: '1px solid rgba(245,158,11,0.4)',
                }}
              >
                {t('games.comingSoon')}
              </span>
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl mb-4"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                🍎
              </div>
              <h3 className="text-xl font-black mb-2" style={{ color: '#f8fafc' }}>App Store</h3>
              <p className="text-sm" style={{ color: '#94a3b8' }}>{t('download.iosSoon')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer
        className="relative py-12 px-6 border-t mt-16"
        style={{
          backgroundColor: 'rgba(10,14,26,0.8)',
          borderColor: 'rgba(255,255,255,0.06)',
        }}
      >
        <div className="max-w-7xl mx-auto text-center text-xs font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>
          © 2026 SallyCards · Made by SallyStar in Casablanca
        </div>
      </footer>
    </main>
  );
}
