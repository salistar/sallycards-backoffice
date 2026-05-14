/**
 * @file apps/web/app/download/page.tsx
 * @description Page de téléchargement avec design identique à la home :
 * dégradé bleu nuit → ivoire, Playfair Display, boutons stores officiels.
 * Téléchargement APK direct (programmatic anchor click). Trilingue FR/EN/AR
 * avec RTL automatique pour l'arabe.
 */
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

const PALETTE = {
  navy:     '#0A1F44',
  royal:    '#1E3A8A',
  electric: '#2563EB',
  sky:      '#60A5FA',
  ivory:    '#F8FAFC',
  white:    '#FFFFFF',
  gold:     '#FCD34D',
};

const APK_URL = 'https://github.com/salistar/sally-solitaire/releases/download/latest/app-debug.apk';
const RELEASE_PAGE_URL = 'https://github.com/salistar/sally-solitaire/releases/tag/latest';
const RELEASES_API = 'https://api.github.com/repos/salistar/sally-solitaire/releases/tags/latest';

function GooglePlayLogo({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden="true">
      <path fill="#00D4FF" d="M81 41c-7 4-11 12-11 22v386c0 10 4 18 11 22l213-208v-14L81 41z" />
      <path fill="#FFD400" d="M294 263v-14L373 170l85 47c25 14 25 36 0 50l-85 47-79-51z" />
      <path fill="#FF3C00" d="M81 471c4 5 11 7 19 4l278-156-84-56-213 208z" />
      <path fill="#00C846" d="M81 41l213 208 84-56L100 37c-8-3-15-1-19 4z" />
    </svg>
  );
}

function AppleLogo({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 384 512" className={className} fill="currentColor" aria-hidden="true">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

function SuitMotif({ suit, className, style }: { suit: '♠' | '♥' | '♦' | '♣'; className?: string; style?: React.CSSProperties }) {
  const color = suit === '♥' || suit === '♦' ? '#EF4444' : '#0A1F44';
  return (
    <span
      aria-hidden="true"
      className={`absolute select-none font-serif ${className ?? ''}`}
      style={{ color, opacity: 0.06, ...style }}
    >
      {suit}
    </span>
  );
}

export default function DownloadPage() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language?.split('-')[0] ?? 'fr') as 'fr' | 'en' | 'ar';
  const isRtl = lang === 'ar';

  const [release, setRelease] = useState<{ published_at: string; apkSize?: number } | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    fetch(RELEASES_API)
      .then((r) => r.json())
      .then((data) => {
        if (data?.tag_name) {
          const apk = data.assets?.find((a: any) => a.name === 'app-debug.apk');
          setRelease({ published_at: data.published_at, apkSize: apk?.size });
        }
      })
      .catch(() => {});
  }, []);

  const apkSizeMB = release?.apkSize ? (release.apkSize / 1024 / 1024).toFixed(1) : '211';

  const titleFont = isRtl
    ? "'Cairo', 'Playfair Display', serif"
    : "'Playfair Display', 'Cairo', serif";
  const bodyFont = isRtl ? "'Cairo', 'Inter', sans-serif" : "'Inter', 'Cairo', sans-serif";

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
      className="min-h-screen w-full overflow-x-hidden"
      style={{
        background: `linear-gradient(180deg, ${PALETTE.navy} 0%, ${PALETTE.royal} 30%, ${PALETTE.electric} 65%, ${PALETTE.sky} 90%, ${PALETTE.ivory} 100%)`,
        color: PALETTE.white,
        fontFamily: bodyFont,
      }}
    >
      {/* HEADER */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          height: '80px',
          backgroundColor: scrolled ? 'rgba(10, 31, 68, 0.95)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
        }}
      >
        <div className="max-w-7xl mx-auto h-full px-8 flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform"
              style={{ background: `linear-gradient(135deg, ${PALETTE.electric}, ${PALETTE.sky})`, boxShadow: '0 4px 16px rgba(96,165,250,0.4)' }}
            >
              ♠
            </div>
            <span className="text-2xl font-black tracking-tight" style={{ color: PALETTE.white, fontFamily: titleFont }}>
              Sally<span style={{ color: PALETTE.gold }}>Cards</span>
            </span>
          </Link>

          <div className="flex items-center gap-3 flex-shrink-0">
            <LanguageSwitcher variant="light" />
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl font-bold text-sm transition border hover:bg-white/10"
              style={{
                background: 'rgba(255,255,255,0.05)',
                borderColor: 'rgba(255,255,255,0.15)',
                color: PALETTE.white,
              }}
            >
              ← {t('common.back')}
            </Link>
          </div>
        </div>
      </header>

      {/* HERO + APK CARD */}
      <section className="relative px-8 lg:px-20 pt-32 pb-20 overflow-hidden">
        <SuitMotif suit="♠" className="text-[22rem] -top-10 -start-10" />
        <SuitMotif suit="♦" className="text-[20rem] top-40 -end-20" />

        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2.5 mb-8 px-5 py-2.5 rounded-full border"
              style={{ background: 'rgba(252,211,77,0.12)', borderColor: 'rgba(252,211,77,0.4)' }}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ background: PALETTE.gold }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: PALETTE.gold }} />
              </span>
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: PALETTE.gold }}>
                {t('common.available')}
              </span>
            </div>

            <h1
              className="font-black mb-6"
              style={{
                fontFamily: titleFont,
                fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
                lineHeight: 1.05,
                color: PALETTE.white,
              }}
            >
              {t('download.title')}
            </h1>
            <p className="text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed" style={{ color: 'rgba(248,250,252,0.85)' }}>
              {t('download.subtitle')}
            </p>
          </div>

          {/* APK card */}
          <div
            className="rounded-3xl p-8 lg:p-12 border"
            style={{
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderColor: 'rgba(252,211,77,0.4)',
              boxShadow: '0 20px 60px rgba(10,31,68,0.4), 0 0 0 1px rgba(252,211,77,0.15)',
            }}
          >
            <div className="flex flex-col md:flex-row items-center gap-8 mb-8 text-center md:text-start">
              <div
                className="w-32 h-32 rounded-[2rem] overflow-hidden flex-shrink-0 p-1.5"
                style={{
                  background: `linear-gradient(135deg, ${PALETTE.electric}, ${PALETTE.gold})`,
                  boxShadow: '0 16px 48px rgba(37,99,235,0.5)',
                }}
              >
                <div className="w-full h-full rounded-3xl overflow-hidden bg-white">
                  <Image
                    src="/solitaire-icon.png"
                    alt="Sally Solitaire"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                    unoptimized
                    priority
                  />
                </div>
              </div>

              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: PALETTE.gold }}>
                  ♦ {t('download.apkLabel')}
                </p>
                <h2
                  className="font-black mb-3"
                  style={{ fontFamily: titleFont, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', color: PALETTE.white }}
                >
                  Sally Solitaire
                </h2>
                <div className="flex flex-wrap gap-4 text-sm" style={{ color: 'rgba(248,250,252,0.85)' }}>
                  <span>
                    <span className="opacity-60">{t('download.apkSize')} :</span>{' '}
                    <span className="font-bold">{apkSizeMB} MB</span>
                  </span>
                  {release && (
                    <span>
                      <span className="opacity-60">{t('download.apkBuilt')} :</span>{' '}
                      <span className="font-mono font-bold">
                        {new Date(release.published_at).toLocaleString(
                          lang === 'ar' ? 'ar-MA' : lang === 'fr' ? 'fr-FR' : 'en-GB',
                          { dateStyle: 'medium', timeStyle: 'short' },
                        )}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Download CTA */}
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={APK_URL}
                download="sally-solitaire-latest.apk"
                onClick={triggerDownload}
                className={`flex-1 inline-flex items-center justify-center gap-3 h-[60px] rounded-xl font-black text-base transition-all ${
                  downloading ? 'opacity-90 cursor-wait' : 'hover:scale-[1.02] active:scale-95'
                }`}
                style={{
                  background: `linear-gradient(135deg, ${PALETTE.gold}, #F59E0B)`,
                  color: PALETTE.navy,
                  boxShadow: '0 8px 32px rgba(252,211,77,0.45)',
                }}
              >
                {downloading ? (
                  <>
                    <span className="inline-block w-5 h-5 border-2 border-[#0A1F44] border-t-transparent rounded-full animate-spin" />
                    {t('download.downloading')}
                  </>
                ) : (
                  <>⬇ {t('download.apkDownload')}</>
                )}
              </a>
              <a
                href={RELEASE_PAGE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 h-[60px] px-7 rounded-xl text-sm font-bold border transition hover:bg-white/10"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  borderColor: 'rgba(255,255,255,0.15)',
                  color: PALETTE.white,
                }}
              >
                {t('download.viewRelease')} →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* INSTALL STEPS */}
      <section className="relative px-8 lg:px-20 py-24">
        <div className="relative max-w-6xl mx-auto">
          <h2
            className="font-black mb-12 text-center"
            style={{
              fontFamily: titleFont,
              fontSize: 'clamp(2rem, 3.5vw, 3rem)',
              lineHeight: 1.15,
              color: PALETTE.white,
            }}
          >
            {t('download.installTitle')}
          </h2>

          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div
              aria-hidden
              className="hidden lg:block absolute top-7 start-[12.5%] end-[12.5%] h-px"
              style={{
                background: `repeating-linear-gradient(90deg, ${PALETTE.gold} 0 8px, transparent 8px 16px)`,
                opacity: 0.5,
              }}
            />
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="relative p-7 rounded-2xl border text-center"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  borderColor: 'rgba(255,255,255,0.1)',
                }}
              >
                <div
                  className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center font-black text-xl mb-5 relative z-10"
                  style={{
                    background: `linear-gradient(135deg, ${PALETTE.electric}, ${PALETTE.sky})`,
                    color: PALETTE.white,
                    fontFamily: titleFont,
                    boxShadow: '0 8px 24px rgba(37,99,235,0.4)',
                  }}
                >
                  {n}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(248,250,252,0.85)' }}>
                  {t(`download.install${n}`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMING SOON STORES */}
      <section className="relative px-8 lg:px-20 py-20">
        <div className="relative max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
          {/* Google Play (coming soon) */}
          <div
            className="p-8 rounded-3xl border relative overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderColor: 'rgba(255,255,255,0.1)',
              opacity: 0.85,
            }}
          >
            <span
              className="absolute top-5 end-5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase"
              style={{
                background: 'rgba(252,211,77,0.18)',
                color: PALETTE.gold,
                border: '1px solid rgba(252,211,77,0.4)',
              }}
            >
              {t('download.soonBadge')}
            </span>
            <div className="flex items-center gap-4 mb-4">
              <GooglePlayLogo className="w-12 h-12" />
              <h3 className="text-xl font-bold" style={{ fontFamily: titleFont, color: PALETTE.white }}>
                Google Play
              </h3>
            </div>
            <p className="text-sm" style={{ color: 'rgba(248,250,252,0.75)' }}>
              {t('download.googleDesc')}
            </p>
          </div>

          {/* App Store (coming soon) */}
          <div
            className="p-8 rounded-3xl border relative overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderColor: 'rgba(255,255,255,0.1)',
              opacity: 0.85,
            }}
          >
            <span
              className="absolute top-5 end-5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase"
              style={{
                background: 'rgba(252,211,77,0.18)',
                color: PALETTE.gold,
                border: '1px solid rgba(252,211,77,0.4)',
              }}
            >
              {t('download.soonBadge')}
            </span>
            <div className="flex items-center gap-4 mb-4">
              <AppleLogo className="w-12 h-12 text-white" />
              <h3 className="text-xl font-bold" style={{ fontFamily: titleFont, color: PALETTE.white }}>
                App Store
              </h3>
            </div>
            <p className="text-sm" style={{ color: 'rgba(248,250,252,0.75)' }}>
              {t('download.iosDesc')}
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER (minimal) */}
      <footer
        className="relative px-8 lg:px-20 py-12 mt-12"
        style={{ background: PALETTE.navy, color: 'rgba(248,250,252,0.6)' }}
      >
        <div className="max-w-7xl mx-auto text-center text-xs font-bold uppercase tracking-widest">
          © 2026 SallyCards · SallyStar · Casablanca
        </div>
      </footer>
    </main>
  );
}
