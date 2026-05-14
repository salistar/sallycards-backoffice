/**
 * @file apps/web/app/download/page.tsx
 * @description Page Download — strict compliance avec le brief :
 *   - padding-top 160px (header sticky 80px + 80px de respiration)
 *   - Badge "DISPONIBLE" AU-DESSUS du titre (margin-bottom 32px),
 *     JAMAIS superposé sur le titre
 *   - Cards Google Play/App Store : padding 40px intérieur,
 *     max-width 600px chacune, gap 32px entre elles
 *   - Bouton "Télécharger l'APK" : gradient DORE (#FCD34D -> #F59E0B)
 *   - Footer z-index 10, espace 120px avant footer
 *   - 4 étapes installation : grid avec connector pointillé doré
 */
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

const C = {
  navyDeep:    '#0A1535',
  navy:        '#0F1E47',
  blueRoyal:   '#1E3A8A',
  bluePrimary: '#2563EB',
  blueLight:   '#60A5FA',
  bluePale:    '#93C5FD',
  whiteSoft:   '#F8FAFC',
  gold:        '#FCD34D',
  goldDark:    '#F59E0B',
  green:       '#10B981',
  orange:      '#F97316',
  white:       '#FFFFFF',
};

const APK_URL          = 'https://github.com/salistar/sally-solitaire/releases/download/latest/app-debug.apk';
const RELEASE_PAGE_URL = 'https://github.com/salistar/sally-solitaire/releases/tag/latest';
const RELEASES_API     = 'https://api.github.com/repos/salistar/sally-solitaire/releases/tags/latest';

function GooglePlayLogo({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden="true">
      <path fill="#00D4FF" d="M81 41c-7 4-11 12-11 22v386c0 10 4 18 11 22l213-208v-14L81 41z" />
      <path fill="#FFD400" d="M294 263v-14L373 170l85 47c25 14 25 36 0 50l-85 47-79-51z" />
      <path fill="#FF3C00" d="M81 471c4 5 11 7 19 4l278-156-84-56-213 208z" />
      <path fill="#00C846" d="M81 41l213 208 84-56L100 37c-8-3-15-1-19 4z" />
    </svg>
  );
}

function AppleLogo({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 384 512" fill={C.white} aria-hidden="true">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
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

  const titleFont = isRtl ? "'Cairo', 'Playfair Display', serif" : "'Playfair Display', 'Cairo', Georgia, serif";
  const bodyFont  = isRtl ? "'Cairo', 'Inter', sans-serif" : "'Inter', 'Cairo', sans-serif";

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
      style={{
        minHeight: '100vh',
        background: C.navyDeep,
        color: C.white,
        fontFamily: bodyFont,
        overflowX: 'hidden',
      }}
    >
      <style>{`
        @media (max-width: 1024px) {
          .dl-section { padding: 80px 40px !important; }
          .dl-stores-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          .dl-section { padding: 60px 24px !important; }
          .dl-hero { padding-top: 120px !important; }
          .dl-steps-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
          .dl-cta-row { flex-direction: column !important; }
          h1.dl-title { font-size: 40px !important; }
        }
      `}</style>

      {/* ════════════ HEADER 80px ════════════ */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          height: '80px',
          backgroundColor: scrolled ? 'rgba(10, 21, 53, 0.95)' : 'rgba(10, 21, 53, 0.7)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          transition: 'background-color 0.3s',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            height: '100%',
            padding: '0 80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
          }}
        >
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', flexShrink: 0 }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${C.bluePrimary}, ${C.blueLight})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                color: C.white,
                border: `1.5px solid ${C.gold}40`,
              }}
            >
              ♠
            </div>
            <span style={{ fontFamily: titleFont, fontSize: '22px', fontWeight: 900, color: C.white, letterSpacing: '-0.02em' }}>
              Sally<span style={{ color: C.gold }}>Cards</span>
            </span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <LanguageSwitcher variant="light" />
            <Link
              href="/"
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.06)',
                color: C.white,
                fontWeight: 600,
                fontSize: '14px',
                textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.15)',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            >
              ← {t('common.back')}
            </Link>
          </div>
        </div>
      </header>

      {/* ════════════ HERO ════════════ */}
      <section
        className="dl-section dl-hero"
        style={{
          padding: '160px 80px 80px',
          background: `linear-gradient(180deg, ${C.navyDeep} 0%, ${C.navy} 100%)`,
          position: 'relative',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          {/* Badge AU-DESSUS du titre — margin-bottom: 32px (anti-chevauchement) */}
          <div style={{ marginBottom: '32px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 20px',
                borderRadius: '999px',
                background: `${C.green}1a`,
                border: `1px solid ${C.green}66`,
                color: C.green,
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
              }}
            >
              <span style={{ position: 'relative', display: 'inline-flex', width: '8px', height: '8px' }}>
                <span style={{ position: 'absolute', inset: 0, borderRadius: '999px', background: C.green, opacity: 0.7 }} className="animate-ping" />
                <span style={{ position: 'relative', width: '8px', height: '8px', borderRadius: '999px', background: C.green }} />
              </span>
              {t('common.available')}
            </span>
          </div>

          {/* H1 — clean, no badge overlap */}
          <h1
            className="dl-title"
            style={{
              fontFamily: titleFont,
              fontSize: '72px',
              fontWeight: 900,
              color: C.white,
              margin: 0,
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
            }}
          >
            {t('download.title')}
          </h1>

          <p
            style={{
              marginTop: '24px',
              fontSize: '18px',
              lineHeight: 1.7,
              color: 'rgba(248,250,252,0.82)',
              maxWidth: '720px',
              margin: '24px auto 0',
            }}
          >
            {t('download.subtitle')}
          </p>
        </div>
      </section>

      {/* ════════════ APK CARD ════════════ */}
      <section
        className="dl-section"
        style={{
          padding: '80px 80px',
          background: `linear-gradient(180deg, ${C.navy} 0%, ${C.blueRoyal} 100%)`,
          position: 'relative',
        }}
      >
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            padding: '48px',
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: `1px solid ${C.gold}40`,
            borderRadius: '24px',
            boxShadow: '0 30px 80px rgba(10,21,53,0.4)',
          }}
        >
          {/* Card head: icon + meta */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'center', marginBottom: '40px' }}>
            <div
              style={{
                width: '128px',
                height: '128px',
                borderRadius: '28px',
                padding: '6px',
                background: `linear-gradient(135deg, ${C.bluePrimary}, ${C.gold})`,
                boxShadow: '0 16px 48px rgba(37,99,235,0.5)',
                flexShrink: 0,
              }}
            >
              <div style={{ width: '100%', height: '100%', borderRadius: '22px', overflow: 'hidden', background: C.white }}>
                <Image
                  src="/solitaire-icon.png"
                  alt="Sally Solitaire"
                  width={128}
                  height={128}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  unoptimized
                  priority
                />
              </div>
            </div>

            <div style={{ flex: '1 1 320px', minWidth: 0 }}>
              <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.gold, margin: '0 0 8px' }}>
                ♦ {t('download.apkLabel')}
              </p>
              <h2 style={{ fontFamily: titleFont, fontSize: '40px', fontWeight: 900, color: C.white, margin: 0, lineHeight: 1.1 }}>
                Sally Solitaire
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginTop: '16px', fontSize: '14px', color: 'rgba(248,250,252,0.82)' }}>
                <span>
                  <span style={{ opacity: 0.6 }}>{t('download.apkSize')} :</span>{' '}
                  <strong style={{ fontWeight: 700, color: C.white }}>{apkSizeMB} MB</strong>
                </span>
                {release && (
                  <span>
                    <span style={{ opacity: 0.6 }}>{t('download.apkBuilt')} :</span>{' '}
                    <strong style={{ fontFamily: 'monospace', fontWeight: 700, color: C.white }}>
                      {new Date(release.published_at).toLocaleString(
                        lang === 'ar' ? 'ar-MA' : lang === 'fr' ? 'fr-FR' : 'en-GB',
                        { dateStyle: 'medium', timeStyle: 'short' },
                      )}
                    </strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* CTA row */}
          <div className="dl-cta-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            <a
              href={APK_URL}
              download="sally-solitaire-latest.apk"
              onClick={triggerDownload}
              style={{
                flex: '1 1 320px',
                minHeight: '64px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '0 32px',
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`,
                color: C.navyDeep,
                fontSize: '16px',
                fontWeight: 800,
                textDecoration: 'none',
                cursor: downloading ? 'wait' : 'pointer',
                opacity: downloading ? 0.85 : 1,
                transition: 'all 0.3s',
                boxShadow: '0 10px 32px rgba(252,211,77,0.45)',
              }}
              onMouseEnter={(e) => {
                if (downloading) return;
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 16px 40px rgba(252,211,77,0.6)';
              }}
              onMouseLeave={(e) => {
                if (downloading) return;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 32px rgba(252,211,77,0.45)';
              }}
            >
              {downloading ? (
                <>
                  <span
                    style={{
                      display: 'inline-block',
                      width: '20px',
                      height: '20px',
                      border: `2px solid ${C.navyDeep}`,
                      borderTopColor: 'transparent',
                      borderRadius: '999px',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
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
              style={{
                minHeight: '64px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '0 28px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.06)',
                color: C.white,
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.18)',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            >
              {t('download.viewRelease')} →
            </a>
          </div>
        </div>
      </section>

      {/* ════════════ 4 STEPS ════════════ */}
      <section
        className="dl-section"
        style={{
          padding: '120px 80px',
          background: C.blueRoyal,
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <h2
            style={{
              fontFamily: titleFont,
              fontSize: '40px',
              fontWeight: 900,
              color: C.white,
              textAlign: 'center',
              margin: '0 0 64px',
              lineHeight: 1.15,
            }}
          >
            {t('download.installTitle')}
          </h2>

          <div
            className="dl-steps-grid"
            style={{
              position: 'relative',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '24px',
              padding: '20px 0',
              maxWidth: '1100px',
              margin: '0 auto',
            }}
          >
            {/* Dotted gold connector */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: 'calc(20px + 28px)',
                left: '12.5%',
                right: '12.5%',
                height: '2px',
                background: `repeating-linear-gradient(90deg, ${C.gold} 0 8px, transparent 8px 16px)`,
                opacity: 0.5,
                pointerEvents: 'none',
              }}
            />
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                style={{
                  padding: '32px 24px',
                  background: 'rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '20px',
                  textAlign: 'center',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    background: `linear-gradient(135deg, ${C.bluePrimary}, ${C.blueLight})`,
                    color: C.white,
                    fontFamily: titleFont,
                    fontSize: '24px',
                    fontWeight: 900,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    boxShadow: '0 8px 24px rgba(37,99,235,0.4)',
                  }}
                >
                  {n}
                </div>
                <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'rgba(248,250,252,0.88)', margin: 0 }}>
                  {t(`download.install${n}`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ COMING SOON STORES ════════════ */}
      <section
        className="dl-section"
        style={{
          padding: '120px 80px',
          background: `linear-gradient(180deg, ${C.blueRoyal} 0%, ${C.bluePrimary} 100%)`,
        }}
      >
        <div
          className="dl-stores-grid"
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 600px))',
            justifyContent: 'center',
            gap: '32px',
          }}
        >
          {/* Google Play card */}
          <div
            style={{
              padding: '40px',
              background: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px',
              position: 'relative',
              overflow: 'visible',
              wordWrap: 'break-word',
            }}
          >
            {/* Badge AU-DESSUS, no overlap */}
            <span
              style={{
                position: 'absolute',
                top: '-12px',
                insetInlineStart: '32px',
                padding: '6px 14px',
                background: `linear-gradient(135deg, ${C.orange}, ${C.goldDark})`,
                color: C.white,
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                borderRadius: '999px',
                boxShadow: '0 6px 16px rgba(249,115,22,0.4)',
              }}
            >
              {t('download.soonBadge')}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '16px', marginTop: '8px' }}>
              <GooglePlayLogo size={56} />
              <h3 style={{ fontFamily: titleFont, fontSize: '28px', fontWeight: 700, color: C.white, margin: 0 }}>
                Google Play
              </h3>
            </div>
            <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'rgba(248,250,252,0.78)', margin: 0 }}>
              {t('download.googleDesc')}
            </p>
          </div>

          {/* App Store card */}
          <div
            style={{
              padding: '40px',
              background: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px',
              position: 'relative',
              overflow: 'visible',
              wordWrap: 'break-word',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: '-12px',
                insetInlineStart: '32px',
                padding: '6px 14px',
                background: `linear-gradient(135deg, ${C.orange}, ${C.goldDark})`,
                color: C.white,
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                borderRadius: '999px',
                boxShadow: '0 6px 16px rgba(249,115,22,0.4)',
              }}
            >
              {t('download.soonBadge')}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '16px', marginTop: '8px' }}>
              <AppleLogo size={56} />
              <h3 style={{ fontFamily: titleFont, fontSize: '28px', fontWeight: 700, color: C.white, margin: 0 }}>
                App Store
              </h3>
            </div>
            <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'rgba(248,250,252,0.78)', margin: 0 }}>
              {t('download.iosDesc')}
            </p>
          </div>
        </div>
      </section>

      {/* ════════════ FOOTER ════════════ */}
      <footer
        style={{
          background: C.navyDeep,
          padding: '60px 80px 32px',
          position: 'relative',
          zIndex: 10,
          marginTop: 0,
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '24px',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.6)',
            letterSpacing: '0.06em',
          }}
        >
          <span>{t('footer.legal')}</span>
          <div style={{ display: 'flex', gap: '24px' }}>
            <a href="/" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>← {t('common.back')}</a>
            <a href="https://salistar.com/#monitoring" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>
              {t('footer.supportStatus')}
            </a>
          </div>
        </div>
      </footer>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}
