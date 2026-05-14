/**
 * @file apps/web/app/page.tsx
 * @description Landing page SallyCards — STRICT compliance avec le brief
 * design premium :
 *   - Header sticky 80px, bg rgba(10,21,53,0.95) + blur 20px
 *   - Section padding-top 160px sur la première section (anti-overlap header)
 *   - Section padding 120px 0 entre toutes les sections (no overlap)
 *   - Badges PLACES AU-DESSUS des boutons (margin-bottom 8px), JAMAIS dessus
 *   - Bouton "Jouer maintenant" : gradient OR (#FCD34D -> #F59E0B), pas bleu
 *   - Sélecteur de langue UNIQUE (LanguageSwitcher déjà fixé)
 *   - Icônes sociales = vraies SVG officielles (Facebook, X, Instagram, YouTube, TikTok)
 *   - Footer z-index 10, CTA z-index 1, 120px d'espace entre les deux
 *   - Aucun overflow:hidden qui couperait
 *   - Card padding 40px+ intérieur
 *   - Mockups smartphones ENTIÈREMENT visibles, padding 40px sur conteneur
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './components/LanguageSwitcher';
import { BrandLogo } from './components/BrandLogo';
import { GAMES } from './lib/games';

// ───────────────────────────────────────────────────────────────────────
// PALETTE (cf. brief)
// ───────────────────────────────────────────────────────────────────────
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

// ───────────────────────────────────────────────────────────────────────
// SVG STORE LOGOS — Google Play officiel + Apple
// ───────────────────────────────────────────────────────────────────────
function GooglePlayLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden="true">
      <path fill="#00D4FF" d="M81 41c-7 4-11 12-11 22v386c0 10 4 18 11 22l213-208v-14L81 41z" />
      <path fill="#FFD400" d="M294 263v-14L373 170l85 47c25 14 25 36 0 50l-85 47-79-51z" />
      <path fill="#FF3C00" d="M81 471c4 5 11 7 19 4l278-156-84-56-213 208z" />
      <path fill="#00C846" d="M81 41l213 208 84-56L100 37c-8-3-15-1-19 4z" />
    </svg>
  );
}

function AppleLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 384 512" fill="currentColor" aria-hidden="true">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

// ───────────────────────────────────────────────────────────────────────
// SVG SOCIAL ICONS (officiels - Facebook, X/Twitter, Instagram, YouTube, TikTok)
// ───────────────────────────────────────────────────────────────────────
const SOCIAL_PATHS: Record<string, { label: string; path: string; viewBox?: string }> = {
  facebook: {
    label: 'Facebook',
    path: 'M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82V14.706h-3.13v-3.622h3.13V8.413c0-3.1 1.894-4.788 4.659-4.788 1.325 0 2.464.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z',
  },
  twitter: {
    label: 'X',
    path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  },
  instagram: {
    label: 'Instagram',
    path: 'M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z',
  },
  youtube: {
    label: 'YouTube',
    path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  },
  tiktok: {
    label: 'TikTok',
    path: 'M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z',
  },
};

function SocialIcon({
  network,
  href,
}: {
  network: keyof typeof SOCIAL_PATHS;
  href: string;
}) {
  const item = SOCIAL_PATHS[network];
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={item.label}
      className="social-icon"
      style={{
        width: '44px',
        height: '44px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '12px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = C.bluePrimary;
        e.currentTarget.style.transform = 'translateY(-3px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <svg width="20" height="20" viewBox={item.viewBox ?? '0 0 24 24'} fill={C.white} aria-hidden="true">
        <path d={item.path} />
      </svg>
    </a>
  );
}

// ───────────────────────────────────────────────────────────────────────
// Store button avec wrapper "BADGE AU-DESSUS + NOTE EN-DESSOUS"
// (correction critique du brief — JAMAIS de badge superposé sur le bouton)
// ───────────────────────────────────────────────────────────────────────
function StoreCTA({
  variant,
  topLine,
  store,
  href,
  badgeText,
  badgeColor,
  note,
  disabled = false,
  onClick,
}: {
  variant: 'google' | 'apple';
  topLine: string;
  store: string;
  href: string;
  badgeText: string;
  badgeColor: string;
  note: string;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <div className="store-button-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
      {/* Badge AU-DESSUS du bouton — margin-bottom 8px */}
      <span
        style={{
          alignSelf: 'flex-start',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '999px',
          fontSize: '10px',
          fontWeight: 800,
          letterSpacing: '0.12em',
          color: C.white,
          background: badgeColor,
          marginBottom: '8px',
          textTransform: 'uppercase',
          boxShadow: `0 4px 12px ${badgeColor}50`,
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: '6px',
            height: '6px',
            borderRadius: '999px',
            background: C.white,
          }}
        />
        {badgeText}
      </span>

      {/* Bouton store — HEIGHT 64px exactement comme le brief */}
      <a
        href={href}
        onClick={onClick}
        aria-disabled={disabled}
        rel="noopener noreferrer"
        className="store-btn"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 24px',
          height: '64px',
          background: '#000',
          color: C.white,
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.15)',
          textDecoration: 'none',
          transition: 'all 0.3s',
          opacity: disabled ? 0.65 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => {
          if (disabled) return;
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 10px 30px rgba(37,99,235,0.4)';
        }}
        onMouseLeave={(e) => {
          if (disabled) return;
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {variant === 'google' ? <GooglePlayLogo size={32} /> : <AppleLogo size={32} />}
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
          <span style={{ fontSize: '11px', fontWeight: 500, opacity: 0.85, letterSpacing: '0.04em' }}>{topLine}</span>
          <strong style={{ fontSize: '18px', fontWeight: 700, marginTop: '2px' }}>{store}</strong>
        </span>
      </a>

      {/* Note SOUS le bouton — margin-top 16px (brief: pas collé) */}
      <p
        style={{
          marginTop: '16px',
          fontSize: '13px',
          color: 'rgba(248,250,252,0.7)',
          fontWeight: 500,
        }}
      >
        {note}
      </p>
    </div>
  );
}

// Animated counter
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const start = performance.now();
          const tick = (t: number) => {
            const p = Math.min(1, (t - start) / 1600);
            const eased = 1 - Math.pow(1 - p, 3);
            setVal(Math.round(to * eased));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [to]);
  return <span ref={ref}>{val}{suffix}</span>;
}

// Scroll reveal
function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
      }}
    >
      {children}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// HOMEPAGE
// ───────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language?.split('-')[0] ?? 'fr') as 'fr' | 'en' | 'ar';
  const isRtl = lang === 'ar';
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const titleFont = isRtl ? "'Cairo', 'Playfair Display', serif" : "'Playfair Display', 'Cairo', Georgia, serif";
  const bodyFont = isRtl ? "'Cairo', 'Inter', sans-serif" : "'Inter', 'Cairo', sans-serif";

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
      {/* Animations + responsive scoped à la page */}
      <style>{`
        @keyframes floatY {
          0%, 100% { transform: translateY(0) rotate(var(--r, 0deg)); }
          50%      { transform: translateY(-15px) rotate(var(--r, 0deg)); }
        }
        @keyframes goldShine {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .gold-italic {
          font-style: italic;
          background: linear-gradient(90deg, ${C.gold} 0%, ${C.white} 50%, ${C.gold} 100%);
          background-size: 200% 100%;
          animation: goldShine 5s linear infinite;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        /* Tablet */
        @media (max-width: 1024px) {
          .section { padding: 80px 40px !important; }
          .hero-grid { grid-template-columns: 1fr !important; gap: 60px !important; }
          .features-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .phone-mockups { grid-template-columns: repeat(2, 1fr) !important; }
          h1.hero-title { font-size: 56px !important; }
        }
        /* Mobile */
        @media (max-width: 768px) {
          .section { padding: 60px 24px !important; }
          .features-grid { grid-template-columns: 1fr !important; gap: 20px !important; }
          .phone-mockups { grid-template-columns: 1fr !important; }
          .steps-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          h1.hero-title { font-size: 40px !important; }
          h2.section-title { font-size: 32px !important; }
          .store-btn-row { flex-direction: column !important; }
          .nav-menu { display: none !important; }
          .footer-cols { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ════════════════════════ HEADER 80px ════════════════════════ */}
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
          {/* Logo — official BrandLogo (3-card fan with Ace of Spades) from mobile app */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', flexShrink: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '52px',
                height: '52px',
              }}
            >
              <BrandLogo size={24} />
            </div>
            <span style={{ fontSize: '22px', fontWeight: 900, color: C.white, fontFamily: titleFont, letterSpacing: '-0.02em' }}>
              Sally<span style={{ color: C.gold }}>Cards</span>
            </span>
          </Link>

          {/* Nav */}
          <nav className="nav-menu" style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
            {[
              { href: '#home', label: t('nav.home') },
              { href: '#features', label: t('nav.features') },
              { href: '#howto', label: t('nav.howto') },
              { href: '#testimonials', label: t('nav.testimonials') },
              { href: '/download', label: t('nav.download') },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                style={{
                  color: C.whiteSoft,
                  fontSize: '14px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = C.gold)}
                onMouseLeave={(e) => (e.currentTarget.style.color = C.whiteSoft)}
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* Lang + CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <LanguageSwitcher variant="light" />
            <Link
              href="/download"
              style={{
                padding: '12px 28px',
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`,
                color: C.navyDeep,
                fontWeight: 700,
                fontSize: '14px',
                textDecoration: 'none',
                transition: 'all 0.3s',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 16px rgba(252,211,77,0.35)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(252,211,77,0.45)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(252,211,77,0.35)';
              }}
            >
              {t('nav.cta')}
            </Link>
          </div>
        </div>
      </header>

      {/* ════════════════════════ 1. HERO ════════════════════════ */}
      <section
        id="home"
        className="section"
        style={{
          padding: '160px 80px 120px',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          background: `linear-gradient(180deg, ${C.navyDeep} 0%, ${C.navy} 100%)`,
          position: 'relative',
        }}
      >
        {/* Suit watermarks */}
        {[
          { s: '♠', t: '5%', l: '2%', sz: '20rem' },
          { s: '♥', t: '40%', r: '8%', sz: '18rem' },
          { s: '♦', b: '15%', l: '30%', sz: '16rem' },
          { s: '♣', b: '5%', r: '2%', sz: '22rem' },
        ].map((w, i) => (
          <span
            key={i}
            aria-hidden
            style={{
              position: 'absolute',
              top: w.t,
              left: w.l,
              right: w.r,
              bottom: w.b,
              fontSize: w.sz,
              opacity: 0.04,
              color: C.white,
              pointerEvents: 'none',
              userSelect: 'none',
              fontFamily: 'serif',
              fontWeight: 900,
            }}
          >
            {w.s}
          </span>
        ))}

        <div
          className="hero-grid"
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            width: '100%',
            display: 'grid',
            gridTemplateColumns: '6fr 4fr',
            gap: '80px',
            alignItems: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Colonne gauche (60%) */}
          <Reveal>
            <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
              {/* Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 18px',
                  borderRadius: '999px',
                  background: 'rgba(252,211,77,0.12)',
                  border: `1px solid ${C.gold}55`,
                  marginBottom: '32px',
                }}
              >
                <span style={{ position: 'relative', display: 'inline-flex', width: '8px', height: '8px' }}>
                  <span style={{ position: 'absolute', inset: 0, borderRadius: '999px', background: C.gold, opacity: 0.75 }} className="animate-ping" />
                  <span style={{ position: 'relative', width: '8px', height: '8px', borderRadius: '999px', background: C.gold }} />
                </span>
                <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.15em', color: C.gold, textTransform: 'uppercase' }}>
                  {t('hero.tag')}
                </span>
              </div>

              {/* H1 */}
              <h1
                className="hero-title"
                style={{
                  fontFamily: titleFont,
                  fontSize: '72px',
                  lineHeight: 1.05,
                  fontWeight: 900,
                  color: C.white,
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}
              >
                {t('hero.title')}{' '}
                <span className="gold-italic">{t('hero.titleAccent')}</span>
              </h1>

              {/* Subtitle */}
              <p
                style={{
                  marginTop: '32px',
                  fontSize: '18px',
                  lineHeight: 1.7,
                  color: 'rgba(248,250,252,0.82)',
                  maxWidth: '560px',
                }}
              >
                {t('hero.subtitle')}
              </p>

              {/* Stores avec badges AU-DESSUS */}
              <div className="store-btn-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '48px' }}>
                <StoreCTA
                  variant="google"
                  topLine={t('hero.android')}
                  store={t('hero.androidStore')}
                  href="/download"
                  badgeText={t('common.available')}
                  badgeColor={C.green}
                  note={`✓ ${t('hero.androidStatus')}`}
                />
                <StoreCTA
                  variant="apple"
                  topLine={t('hero.ios')}
                  store={t('hero.iosStore')}
                  href="#"
                  disabled
                  badgeText={t('common.soon')}
                  badgeColor={C.orange}
                  note={`○ ${t('hero.iosStatus')}`}
                  onClick={(e) => e.preventDefault()}
                />
              </div>
            </div>
          </Reveal>

          {/* Colonne droite (40%) — phone mockup + cartes flottantes */}
          <Reveal delay={200}>
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '600px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Phone mockup */}
              <div
                style={{
                  width: '300px',
                  height: '600px',
                  borderRadius: '44px',
                  background: '#0A0A0A',
                  padding: '12px',
                  boxShadow: '0 30px 80px rgba(10,21,53,0.7), 0 0 0 1.5px rgba(255,255,255,0.06)',
                  zIndex: 5,
                }}
              >
                {/* Inside the phone screen: REAL language-select screen from the mobile app */}
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '34px',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  {/* Background = the actual splash-cards.jpg used in the app */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage: `url(/hero/splash-cards.jpg)`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                  {/* Overlay gradient identical to mobile (welcome.tsx) */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background:
                        'linear-gradient(180deg, rgba(10,10,26,0.88) 0%, rgba(30,27,75,0.95) 50%, rgba(59,7,100,0.95) 100%)',
                    }}
                  />
                  {/* Content stack — exactly like welcome.tsx language picker */}
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '20px',
                      padding: '24px',
                    }}
                  >
                    {/* OFFICIAL BRAND LOGO — same as the mobile app */}
                    <BrandLogo size={70} />

                    <p
                      style={{
                        fontFamily: titleFont,
                        fontSize: '22px',
                        fontWeight: 800,
                        color: C.white,
                        margin: 0,
                        textAlign: 'center',
                      }}
                    >
                      Sally <span style={{ color: C.gold }}>Solitaire</span>
                    </p>

                    {/* Mock language buttons (FR / EN / AR) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                      {[
                        { code: 'fr', flag: '🇫🇷', label: 'Français' },
                        { code: 'en', flag: '🇬🇧', label: 'English' },
                        { code: 'ar', flag: '🇸🇦', label: 'العربية' },
                      ].map((l, i) => (
                        <div
                          key={l.code}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 14px',
                            borderRadius: '12px',
                            background: i === 0 ? 'rgba(252,211,77,0.18)' : 'rgba(255,255,255,0.08)',
                            border: `1px solid ${i === 0 ? 'rgba(252,211,77,0.5)' : 'rgba(255,255,255,0.12)'}`,
                          }}
                        >
                          <span style={{ fontSize: '16px' }}>{l.flag}</span>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: C.white }}>{l.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Notch */}
                <div
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '120px',
                    height: '26px',
                    borderRadius: '0 0 18px 18px',
                    background: '#000',
                  }}
                />
              </div>

              {/* Floating cards — REAL French-deck PNGs from the mobile app */}
              {[
                { file: 'AS', top: '5%', left: '-8%', r: -14, delay: 0 },
                { file: 'KH', top: '-2%', right: '-6%', r: 16, delay: 1 },
                { file: 'QD', bottom: '8%', left: '-6%', r: -8, delay: 2 },
                { file: 'JC', bottom: '-2%', right: '-8%', r: 12, delay: 3 },
              ].map((c) => (
                <div
                  key={c.file}
                  style={{
                    position: 'absolute',
                    top: c.top,
                    left: c.left,
                    right: c.right,
                    bottom: c.bottom,
                    width: '110px',
                    height: '154px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 16px 40px rgba(10,21,53,0.55)',
                    transform: `rotate(${c.r}deg)`,
                    animation: `floatY 6s ease-in-out ${c.delay}s infinite`,
                    zIndex: 4,
                  }}
                >
                  <Image
                    src={`/cards/fr/${c.file}.png`}
                    alt={c.file}
                    width={120}
                    height={170}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    unoptimized
                  />
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════ 2. FEATURES ════════════════════════ */}
      <section
        id="features"
        className="section"
        style={{
          padding: '120px 80px',
          background: `linear-gradient(180deg, ${C.navy} 0%, ${C.blueRoyal} 100%)`,
          position: 'relative',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 80px' }}>
              <h2
                className="section-title"
                style={{
                  fontFamily: titleFont,
                  fontSize: '56px',
                  fontWeight: 900,
                  color: C.white,
                  margin: 0,
                  lineHeight: 1.15,
                }}
              >
                {t('feat.title')}
              </h2>
              <p style={{ marginTop: '24px', fontSize: '18px', lineHeight: 1.7, color: 'rgba(248,250,252,0.8)' }}>
                {t('feat.subtitle')}
              </p>
            </div>
          </Reveal>

          <div
            className="features-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '32px',
              maxWidth: '1200px',
              margin: '0 auto',
              padding: '0 20px',
            }}
          >
            {[
              { suit: '♠', tKey: 'multiplayer' },
              { suit: '♥', tKey: 'tournaments' },
              { suit: '♦', tKey: 'rewards' },
              { suit: '♣', tKey: 'offline' },
              { suit: '★', tKey: 'graphics' },
              { suit: '🏆', tKey: 'ranking' },
            ].map((f, i) => (
              <Reveal key={f.tKey} delay={i * 80}>
                <div
                  style={{
                    padding: '40px 32px',
                    background: 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '20px',
                    height: '100%',
                    transition: 'transform 0.3s, border-color 0.3s',
                    overflow: 'visible',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = `${C.gold}55`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  }}
                >
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '16px',
                      background: `linear-gradient(135deg, ${C.bluePrimary}, ${C.blueLight})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '28px',
                      color: C.white,
                      marginBottom: '24px',
                      boxShadow: '0 8px 24px rgba(37,99,235,0.4)',
                    }}
                  >
                    {f.suit}
                  </div>
                  <h3
                    style={{
                      fontFamily: titleFont,
                      fontSize: '24px',
                      fontWeight: 700,
                      color: C.white,
                      margin: '0 0 16px',
                      lineHeight: 1.3,
                      wordBreak: 'normal',
                      overflowWrap: 'break-word',
                      hyphens: 'none',
                    }}
                  >
                    {t(`feat.${f.tKey}.t`)}
                  </h3>
                  <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'rgba(248,250,252,0.75)', margin: 0 }}>
                    {t(`feat.${f.tKey}.d`)}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════ 3. HOW TO PLAY ════════════════════════ */}
      <section
        id="howto"
        className="section"
        style={{ padding: '120px 80px', background: C.blueRoyal, position: 'relative' }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 80px' }}>
              <h2 className="section-title" style={{ fontFamily: titleFont, fontSize: '56px', fontWeight: 900, color: C.white, margin: 0, lineHeight: 1.15 }}>
                {t('how.title')}
              </h2>
              <p style={{ marginTop: '24px', fontSize: '18px', lineHeight: 1.7, color: 'rgba(248,250,252,0.8)' }}>
                {t('how.subtitle')}
              </p>
            </div>
          </Reveal>

          <div
            className="steps-grid"
            style={{
              position: 'relative',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '60px',
              maxWidth: '1100px',
              margin: '0 auto',
              padding: '40px 20px',
            }}
          >
            {/* Connector line (between circles, hidden on mobile) */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: 'calc(40px + 50px)',
                left: '20%',
                right: '20%',
                height: '2px',
                background: `repeating-linear-gradient(90deg, ${C.gold} 0 10px, transparent 10px 20px)`,
                opacity: 0.5,
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />

            {[1, 2, 3].map((n, i) => (
              <Reveal key={n} delay={i * 150}>
                <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                  <div
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '999px',
                      background: `linear-gradient(135deg, ${C.bluePrimary}, ${C.blueLight})`,
                      border: `4px solid ${C.blueRoyal}`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: titleFont,
                      fontSize: '40px',
                      fontWeight: 900,
                      color: C.white,
                      boxShadow: '0 10px 40px rgba(37,99,235,0.5)',
                      marginBottom: '32px',
                    }}
                  >
                    {n}
                  </div>
                  <h3 style={{ fontFamily: titleFont, fontSize: '28px', fontWeight: 700, color: C.white, margin: '0 0 16px', lineHeight: 1.3 }}>
                    {t(`how.step${n}.t`)}
                  </h3>
                  <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'rgba(248,250,252,0.78)', margin: 0, maxWidth: '280px', marginInline: 'auto' }}>
                    {t(`how.step${n}.d`)}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 4a. NOS 11 JEUX (vraies icônes mobile) ═══════════════ */}
      <section
        id="games"
        className="section"
        style={{
          padding: '120px 80px',
          background: `linear-gradient(180deg, ${C.blueRoyal} 0%, ${C.bluePrimary} 100%)`,
          position: 'relative',
          overflow: 'visible',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 80px' }}>
              <h2 className="section-title" style={{ fontFamily: titleFont, fontSize: '56px', fontWeight: 900, color: C.white, margin: 0, lineHeight: 1.15 }}>
                {lang === 'fr' ? 'Nos 11 jeux' : lang === 'en' ? 'Our 11 games' : 'ألعابنا الـ 11'}
              </h2>
              <p style={{ marginTop: '24px', fontSize: '18px', lineHeight: 1.7, color: 'rgba(248,250,252,0.85)' }}>
                {lang === 'fr'
                  ? 'Une icône réelle, une page dédiée et un jeu par carte. Cliquez pour voir les règles et l\'état de disponibilité.'
                  : lang === 'en'
                  ? 'One real icon, one dedicated page, one game per card. Click for rules and availability state.'
                  : 'أيقونة حقيقية، صفحة مخصصة، لعبة لكل بطاقة. انقر لرؤية القواعد وحالة التوفر.'}
              </p>
            </div>
          </Reveal>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '24px',
              maxWidth: '1200px',
              margin: '0 auto',
              padding: '20px 0',
            }}
          >
            {GAMES.map((g, i) => (
              <Reveal key={g.slug} delay={i * 60}>
                <Link
                  href={`/download/${g.slug}`}
                  style={{
                    display: 'block',
                    padding: '24px',
                    background: g.available ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.04)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: `1px solid ${g.available ? 'rgba(16,185,129,0.45)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '20px',
                    textDecoration: 'none',
                    transition: 'all 0.3s',
                    position: 'relative',
                    overflow: 'visible',
                    height: '100%',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = g.available
                      ? '0 16px 40px rgba(16,185,129,0.3)'
                      : '0 16px 40px rgba(10,21,53,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      insetInlineEnd: '20px',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      fontSize: '9px',
                      fontWeight: 800,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: C.white,
                      background: g.available
                        ? `linear-gradient(135deg, ${C.green}, #059669)`
                        : `linear-gradient(135deg, ${C.orange}, ${C.goldDark})`,
                      boxShadow: g.available
                        ? '0 4px 12px rgba(16,185,129,0.45)'
                        : '0 4px 12px rgba(249,115,22,0.45)',
                    }}
                  >
                    {g.available ? t('common.available') : t('common.soon')}
                  </span>

                  {g.slug === 'solitaire' ? (
                    <div
                      style={{
                        width: '100%',
                        height: '88px',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <BrandLogo size={48} />
                    </div>
                  ) : (
                    <div
                      style={{
                        width: '88px',
                        height: '88px',
                        borderRadius: '22px',
                        overflow: 'hidden',
                        marginBottom: '20px',
                        boxShadow: '0 12px 28px rgba(10,21,53,0.4)',
                        background: g.gradient,
                        padding: '4px',
                      }}
                    >
                      <Image
                        src={g.iconSrc}
                        alt={g.name}
                        width={88}
                        height={88}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '18px' }}
                        unoptimized
                      />
                    </div>
                  )}

                  <h3
                    style={{
                      fontFamily: titleFont,
                      fontSize: '20px',
                      fontWeight: 700,
                      color: C.white,
                      margin: '0 0 6px',
                      lineHeight: 1.2,
                    }}
                  >
                    {g.name}
                  </h3>
                  <p
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: C.gold,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      margin: '0 0 12px',
                    }}
                  >
                    {g.players} · {g.cardSystem === 'fr' ? '52 FR' : '40 ES'}
                  </p>
                  <p
                    style={{
                      fontSize: '13px',
                      lineHeight: 1.55,
                      color: 'rgba(248,250,252,0.78)',
                      margin: 0,
                    }}
                  >
                    {g.tagline[lang]}
                  </p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 4b. SCREENSHOTS — VRAIES CARTES FR + ES ═══════════════ */}
      <section
        id="screenshots"
        className="section"
        style={{
          padding: '120px 80px 160px',
          background: `linear-gradient(180deg, ${C.bluePrimary} 0%, ${C.blueLight} 100%)`,
          position: 'relative',
          overflow: 'visible',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', maxWidth: '760px', margin: '0 auto 64px' }}>
              <h2 className="section-title" style={{ fontFamily: titleFont, fontSize: '56px', fontWeight: 900, color: C.white, margin: 0, lineHeight: 1.15 }}>
                {t('screens.title')}
              </h2>
              <p style={{ marginTop: '24px', fontSize: '18px', lineHeight: 1.7, color: 'rgba(248,250,252,0.92)' }}>
                {lang === 'fr'
                  ? "Les vraies cartes utilisées dans l'app : françaises 52 cartes (♠♥♦♣) et espagnoles 40 cartes (Bastos, Copas, Espadas, Oros)."
                  : lang === 'en'
                  ? 'The actual cards used in the app: French 52-card deck (♠♥♦♣) and Spanish 40-card deck (Bastos, Copas, Espadas, Oros).'
                  : 'البطاقات الحقيقية المستخدمة في التطبيق: 52 ورقة فرنسية (♠♥♦♣) و 40 ورقة إسبانية (Bastos، Copas، Espadas، Oros).'}
              </p>
            </div>
          </Reveal>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
              gap: '40px',
              maxWidth: '1100px',
              margin: '0 auto',
            }}
          >
            {/* FR deck */}
            <Reveal>
              <div
                style={{
                  padding: '40px 32px',
                  background: 'rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: `1px solid ${C.gold}55`,
                  borderRadius: '24px',
                }}
              >
                <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.gold, margin: '0 0 8px' }}>
                  ♠ {lang === 'fr' ? 'Jeu Français' : lang === 'en' ? 'French deck' : 'مجموعة فرنسية'}
                </p>
                <h3 style={{ fontFamily: titleFont, fontSize: '28px', fontWeight: 700, color: C.white, margin: '0 0 20px' }}>
                  52 cartes · ♠ ♥ ♦ ♣
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px', paddingTop: '8px' }}>
                  {['AS', 'KH', 'QD', 'JC', '0S', '0H'].map((card, i) => (
                    <div
                      key={card}
                      style={{
                        aspectRatio: '63 / 88',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        background: C.white,
                        boxShadow: '0 4px 12px rgba(10,21,53,0.35)',
                        transform: `rotate(${(i - 2.5) * 4}deg)`,
                      }}
                    >
                      <Image
                        src={`/cards/fr/${card}.png`}
                        alt={card}
                        width={120}
                        height={170}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        unoptimized
                      />
                    </div>
                  ))}
                </div>
                <p style={{ marginTop: '20px', fontSize: '13px', color: 'rgba(248,250,252,0.78)', lineHeight: 1.6 }}>
                  {lang === 'fr'
                    ? 'Utilisé pour Solitaire, Belote, Poker, Tarot, Kdoub, Concentration, Qui-est-ce et Kantcopy.'
                    : lang === 'en'
                    ? 'Used for Solitaire, Belote, Poker, Tarot, Kdoub, Concentration, Who-is-it and Kantcopy.'
                    : 'يُستخدم في السوليتير، بلوت، بوكر، تاروت، كدوب، Concentration، Who-is-it و Kantcopy.'}
                </p>
              </div>
            </Reveal>

            {/* ES deck */}
            <Reveal delay={200}>
              <div
                style={{
                  padding: '40px 32px',
                  background: 'rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: `1px solid ${C.gold}55`,
                  borderRadius: '24px',
                }}
              >
                <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.gold, margin: '0 0 8px' }}>
                  🪙 {lang === 'fr' ? 'Jeu Espagnol' : lang === 'en' ? 'Spanish deck' : 'مجموعة إسبانية'}
                </p>
                <h3 style={{ fontFamily: titleFont, fontSize: '28px', fontWeight: 700, color: C.white, margin: '0 0 20px' }}>
                  40 cartes · Bastos / Copas / Espadas / Oros
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px', paddingTop: '8px' }}>
                  {['1O', '12B', '11C', '10E', '7O', '3C'].map((card, i) => (
                    <div
                      key={card}
                      style={{
                        aspectRatio: '63 / 88',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        background: C.white,
                        boxShadow: '0 4px 12px rgba(10,21,53,0.35)',
                        transform: `rotate(${(i - 2.5) * -4}deg)`,
                      }}
                    >
                      <Image
                        src={`/cards/es/${card}.png`}
                        alt={card}
                        width={120}
                        height={170}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        unoptimized
                      />
                    </div>
                  ))}
                </div>
                <p style={{ marginTop: '20px', fontSize: '13px', color: 'rgba(248,250,252,0.78)', lineHeight: 1.6 }}>
                  {lang === 'fr'
                    ? 'Utilisé pour Ronda et Scopa — capture marocaine et italienne.'
                    : lang === 'en'
                    ? 'Used for Ronda and Scopa — Moroccan and Italian capture games.'
                    : 'يُستخدم في الروندا والسكوبا — ألعاب الالتقاط المغربية والإيطالية.'}
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ════════════════════════ 5. TESTIMONIALS ════════════════════════ */}
      <section
        id="testimonials"
        className="section"
        style={{
          padding: '120px 80px',
          background: `linear-gradient(180deg, ${C.blueLight} 0%, ${C.bluePale} 100%)`,
          position: 'relative',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 80px' }}>
              <h2 className="section-title" style={{ fontFamily: titleFont, fontSize: '56px', fontWeight: 900, color: C.navyDeep, margin: 0, lineHeight: 1.15 }}>
                {t('testi.title')}
              </h2>
              <p style={{ marginTop: '24px', fontSize: '18px', lineHeight: 1.7, color: 'rgba(10,21,53,0.75)' }}>
                {t('testi.subtitle')}
              </p>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
            {[1, 2, 3].map((n, i) => (
              <Reveal key={n} delay={i * 120}>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    padding: '32px',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.4)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 12px 40px rgba(10,21,53,0.12)',
                  }}
                >
                  <div style={{ display: 'flex', gap: '4px', color: C.goldDark, marginBottom: '16px' }}>
                    {'★★★★★'.split('').map((_, k) => (<span key={k} style={{ fontSize: '20px' }}>★</span>))}
                  </div>
                  <p style={{ fontSize: '15px', lineHeight: 1.7, color: C.navyDeep, margin: '0 0 24px', flex: 1 }}>
                    « {t(`testi.${n}.text`)} »
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingTop: '20px', borderTop: `1px solid rgba(10,21,53,0.1)` }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '999px',
                        background: `linear-gradient(135deg, ${C.bluePrimary}, ${C.blueLight})`,
                        color: C.white,
                        fontWeight: 900,
                        fontSize: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {t(`testi.${n}.name`).charAt(0)}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, color: C.navyDeep, fontSize: '15px' }}>{t(`testi.${n}.name`)}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: 'rgba(10,21,53,0.6)' }}>{t(`testi.${n}.role`)}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════ 6. STATS ════════════════════════ */}
      <section
        className="section"
        style={{
          padding: '80px 80px',
          background: C.bluePale,
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '40px' }}>
          {[
            { v: <Counter to={250} suffix="+" />, l: t('stats.players') },
            { v: '4.8/5',                          l: t('stats.rating')  },
            { v: <Counter to={12} suffix="+" />,  l: t('stats.countries') },
            { v: '100%',                           l: t('stats.free') },
          ].map((s, i) => (
            <Reveal key={i} delay={i * 80}>
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontFamily: titleFont,
                    fontStyle: 'italic',
                    fontSize: '96px',
                    fontWeight: 900,
                    color: C.goldDark,
                    lineHeight: 1,
                  }}
                >
                  {s.v}
                </div>
                <div
                  style={{
                    marginTop: '12px',
                    fontSize: '13px',
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: C.navyDeep,
                    fontWeight: 700,
                  }}
                >
                  {s.l}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ════════════════════════ 7. CTA FINAL ════════════════════════ */}
      <section
        className="section"
        style={{
          padding: '120px 80px',
          background: C.whiteSoft,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Reveal>
          <div
            style={{
              maxWidth: '1200px',
              margin: '0 auto 120px',  /* ⚠️ CRITIQUE : 120px d'espace AVANT le footer */
              padding: '80px 60px',
              borderRadius: '32px',
              background: `linear-gradient(135deg, ${C.blueRoyal}, ${C.bluePrimary})`,
              boxShadow: '0 30px 80px rgba(10,21,53,0.3)',
              textAlign: 'center',
              position: 'relative',
              overflow: 'visible',
            }}
          >
            <h2
              className="section-title"
              style={{
                fontFamily: titleFont,
                fontSize: '56px',
                fontWeight: 900,
                color: C.white,
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              {t('cta.title')}
            </h2>
            <p style={{ marginTop: '24px', fontSize: '18px', lineHeight: 1.7, color: 'rgba(248,250,252,0.9)', maxWidth: '640px', marginInline: 'auto' }}>
              {t('cta.subtitle')}
            </p>
            <div className="store-btn-row" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '24px', marginTop: '48px' }}>
              <StoreCTA
                variant="google"
                topLine={t('hero.android')}
                store={t('hero.androidStore')}
                href="/download"
                badgeText={t('common.available')}
                badgeColor={C.green}
                note={`✓ ${t('hero.androidStatus')}`}
              />
              <StoreCTA
                variant="apple"
                topLine={t('hero.ios')}
                store={t('hero.iosStore')}
                href="#"
                disabled
                badgeText={t('common.soon')}
                badgeColor={C.orange}
                note={`○ ${t('hero.iosStatus')}`}
                onClick={(e) => e.preventDefault()}
              />
            </div>
          </div>
        </Reveal>
      </section>

      {/* ════════════════════════ 8. FOOTER ════════════════════════ */}
      <footer
        id="contact"
        style={{
          background: C.navyDeep,
          padding: '80px 80px 32px',
          position: 'relative',
          zIndex: 10,                       /* ⚠️ AU-DESSUS de la section CTA */
          marginTop: 0,
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div
            className="footer-cols"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '48px', marginBottom: '60px' }}
          >
            {/* Brand col — uses the official BrandLogo from the mobile app */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '52px', height: '52px' }}>
                  <BrandLogo size={24} />
                </div>
                <span style={{ fontFamily: titleFont, fontSize: '22px', fontWeight: 900, color: C.white }}>
                  Sally<span style={{ color: C.gold }}>Cards</span>
                </span>
              </div>
              <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                {t('footer.aboutText')}
              </p>
            </div>

            {/* Links col */}
            <FooterCol
              title={t('footer.links')}
              items={[
                { label: t('footer.linkHome'), href: '#home' },
                { label: t('footer.linkDownload'), href: '/download' },
                { label: t('footer.linkBlog'), href: '#' },
                { label: t('footer.linkPress'), href: '#' },
              ]}
            />

            {/* Support col */}
            <FooterCol
              title={t('footer.support')}
              items={[
                { label: t('footer.supportContact'), href: 'mailto:salistarcompany@gmail.com' },
                { label: t('footer.supportFaq'), href: '#features' },
                { label: t('footer.supportApi'), href: 'https://api.salistar.com/api/docs' },
                { label: t('footer.supportStatus'), href: 'https://salistar.com/#monitoring' },
              ]}
            />

            {/* Social col */}
            <div>
              <h4
                style={{
                  fontFamily: titleFont,
                  fontSize: '12px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.18em',
                  color: C.white,
                  margin: '0 0 20px',
                }}
              >
                {t('footer.social')}
              </h4>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <SocialIcon network="facebook"  href="#" />
                <SocialIcon network="twitter"   href="#" />
                <SocialIcon network="instagram" href="#" />
                <SocialIcon network="youtube"   href="#" />
                <SocialIcon network="tiktok"    href="#" />
              </div>
            </div>
          </div>

          {/* Bottom strip */}
          <div
            style={{
              paddingTop: '24px',
              borderTop: `1px solid rgba(255,255,255,0.08)`,
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            <span>{t('footer.legal')}</span>
            <div style={{ display: 'flex', gap: '24px' }}>
              <a href="#" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}
                 onMouseEnter={(e) => (e.currentTarget.style.color = C.gold)}
                 onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}>
                {t('footer.privacy')}
              </a>
              <a href="#" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}
                 onMouseEnter={(e) => (e.currentTarget.style.color = C.gold)}
                 onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}>
                {t('footer.terms')}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

function FooterCol({ title, items }: { title: string; items: { label: string; href: string }[] }) {
  return (
    <div>
      <h4
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '12px',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '0.18em',
          color: '#FFFFFF',
          margin: '0 0 20px',
        }}
      >
        {title}
      </h4>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {items.map((i) => (
          <li key={i.label}>
            <a
              href={i.href}
              style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FCD34D')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
            >
              {i.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
