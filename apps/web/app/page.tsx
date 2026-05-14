/**
 * @file apps/web/app/page.tsx
 * @description Landing page premium SallyCards — design haut de gamme
 * inspiré Apple / Supercell / King.com. Dégradé bleu nuit → ivoire,
 * Playfair Display pour les titres, motifs de cartes en filigrane,
 * boutons stores officiels Google Play + App Store.
 *
 * 9 sections : Header sticky / Hero / Features / How to play /
 * Screenshots / Testimonials / Stats / CTA final / Footer.
 *
 * Trilingue FR/EN/AR (i18n existant via react-i18next), RTL auto pour AR.
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './components/LanguageSwitcher';

// Palette officielle du brief (utilisée en inline style pour garantir
// le rendu, car certaines valeurs ne sont pas dans la config Tailwind).
const PALETTE = {
  navy:     '#0A1F44',
  royal:    '#1E3A8A',
  electric: '#2563EB',
  sky:      '#60A5FA',
  ivory:    '#F8FAFC',
  white:    '#FFFFFF',
  gold:     '#FCD34D',
};

// ───────────────────────────────────────────────────────────────────────
// Logos stores officiels (SVG inline pour zéro requête réseau)
// ───────────────────────────────────────────────────────────────────────

function GooglePlayLogo({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden="true">
      <path fill="#00D4FF" d="M81 41c-7 4-11 12-11 22v386c0 10 4 18 11 22l213-208v-14L81 41z" />
      <path fill="#FFD400" d="M294 263v-14L373 170l85 47c25 14 25 36 0 50l-85 47-79-51z" />
      <path fill="#FF3C00" d="M81 471c4 5 11 7 19 4l278-156-84-56-213 208z" />
      <path fill="#00C846" d="M81 41l213 208 84-56L100 37c-8-3-15-1-19 4z" />
    </svg>
  );
}

function AppleLogo({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 384 512" className={className} fill="currentColor" aria-hidden="true">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

// Bouton store — fond noir, logo + double texte (sur-titre + nom store)
function StoreButton({
  variant,
  topLine,
  store,
  href,
  disabled = false,
  badge,
  onClick,
}: {
  variant: 'google' | 'apple';
  topLine: string;
  store: string;
  href: string;
  disabled?: boolean;
  badge?: string;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      aria-disabled={disabled}
      target={variant === 'apple' || disabled ? '_self' : undefined}
      rel="noopener noreferrer"
      className={`relative inline-flex items-center gap-3 px-5 h-[60px] rounded-xl border transition-all duration-300 ${
        disabled
          ? 'opacity-60 cursor-not-allowed'
          : 'hover:scale-[1.04] hover:shadow-[0_8px_32px_rgba(37,99,235,0.45)]'
      }`}
      style={{
        backgroundColor: '#000',
        borderColor: 'rgba(255,255,255,0.15)',
      }}
    >
      {variant === 'google' ? (
        <GooglePlayLogo className="w-8 h-8" />
      ) : (
        <AppleLogo className="w-8 h-8 text-white" />
      )}
      <span className="flex flex-col items-start leading-tight">
        <span className="text-[10px] font-medium text-white/80 tracking-wide">{topLine}</span>
        <span className="text-base font-bold text-white tracking-tight">{store}</span>
      </span>
      {badge && (
        <span
          className="absolute -top-2 -end-2 px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest"
          style={{
            backgroundColor: disabled ? PALETTE.gold : '#10B981',
            color: PALETTE.navy,
          }}
        >
          {badge}
        </span>
      )}
    </a>
  );
}

// ───────────────────────────────────────────────────────────────────────
// Motif de cartes à jouer en filigrane (background décoratif)
// ───────────────────────────────────────────────────────────────────────

function SuitMotif({
  suit,
  className,
  style,
}: {
  suit: '♠' | '♥' | '♦' | '♣';
  className?: string;
  style?: React.CSSProperties;
}) {
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

// Card flottante 3D pour le hero
function FloatingCard({
  suit,
  value,
  className,
  delay = 0,
  rotate = -8,
}: {
  suit: '♠' | '♥' | '♦' | '♣';
  value: string;
  className?: string;
  delay?: number;
  rotate?: number;
}) {
  const isRed = suit === '♥' || suit === '♦';
  return (
    <div
      className={`absolute select-none ${className ?? ''}`}
      style={{
        animation: `floatCard 6s ease-in-out ${delay}s infinite`,
        transform: `rotate(${rotate}deg)`,
        filter: 'drop-shadow(0 12px 32px rgba(10,31,68,0.35))',
      }}
    >
      <div
        className="w-[120px] h-[170px] rounded-2xl flex flex-col items-center justify-between p-3 border"
        style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
          borderColor: 'rgba(10,31,68,0.1)',
        }}
      >
        <div className="self-start flex flex-col items-center leading-none">
          <span className="text-2xl font-black" style={{ color: isRed ? '#EF4444' : PALETTE.navy }}>
            {value}
          </span>
          <span className="text-xl" style={{ color: isRed ? '#EF4444' : PALETTE.navy }}>
            {suit}
          </span>
        </div>
        <span className="text-5xl" style={{ color: isRed ? '#EF4444' : PALETTE.navy }}>
          {suit}
        </span>
        <div className="self-end flex flex-col items-center leading-none rotate-180">
          <span className="text-2xl font-black" style={{ color: isRed ? '#EF4444' : PALETTE.navy }}>
            {value}
          </span>
          <span className="text-xl" style={{ color: isRed ? '#EF4444' : PALETTE.navy }}>
            {suit}
          </span>
        </div>
      </div>
    </div>
  );
}

// Animated counter for stats section
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const duration = 1600;
          const start = performance.now();
          const tick = (t: number) => {
            const p = Math.min(1, (t - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
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
  return (
    <span ref={ref}>
      {val}
      {suffix}
    </span>
  );
}

// Scroll-reveal helper (Intersection Observer + CSS class)
function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
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
      { threshold: 0.15 },
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
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
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

  const titleFont = isRtl
    ? "'Cairo', 'Playfair Display', serif"
    : "'Playfair Display', 'Cairo', serif";
  const bodyFont = isRtl
    ? "'Cairo', 'Inter', sans-serif"
    : "'Inter', 'Cairo', sans-serif";

  return (
    <main
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen w-full overflow-x-hidden"
      style={{
        background: `linear-gradient(180deg, ${PALETTE.navy} 0%, ${PALETTE.royal} 25%, ${PALETTE.electric} 55%, ${PALETTE.sky} 80%, ${PALETTE.ivory} 100%)`,
        color: PALETTE.white,
        fontFamily: bodyFont,
      }}
    >
      {/* Local keyframes for the page (avoid touching globals.css) */}
      <style>{`
        @keyframes floatCard {
          0%, 100% { transform: translateY(0px) rotate(var(--r, -8deg)); }
          50%      { transform: translateY(-22px) rotate(calc(var(--r, -8deg) + 4deg)); }
        }
        @keyframes shineGold {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .gold-shine {
          background: linear-gradient(90deg, ${PALETTE.gold} 0%, #FFFFFF 50%, ${PALETTE.gold} 100%);
          background-size: 200% 100%;
          animation: shineGold 4s linear infinite;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
      `}</style>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  1️⃣ HEADER STICKY                                                */}
      {/* ═══════════════════════════════════════════════════════════════ */}
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
              style={{
                background: `linear-gradient(135deg, ${PALETTE.electric}, ${PALETTE.sky})`,
                boxShadow: '0 4px 16px rgba(96,165,250,0.4)',
              }}
            >
              ♠
            </div>
            <span
              className="text-2xl font-black tracking-tight"
              style={{ color: PALETTE.white, fontFamily: titleFont }}
            >
              Sally<span style={{ color: PALETTE.gold }}>Cards</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold" style={{ color: PALETTE.white }}>
            <a href="#home" className="hover:opacity-70 transition">{t('nav.home')}</a>
            <a href="#features" className="hover:opacity-70 transition">{t('nav.features')}</a>
            <a href="#howto" className="hover:opacity-70 transition">{t('nav.howto')}</a>
            <a href="#testimonials" className="hover:opacity-70 transition">{t('nav.testimonials')}</a>
            <Link href="/download" className="hover:opacity-70 transition">{t('nav.download')}</Link>
          </nav>

          <div className="flex items-center gap-3 flex-shrink-0">
            <LanguageSwitcher variant="light" />
            <Link
              href="/download"
              className="px-5 py-2.5 rounded-xl font-bold text-sm hover:scale-105 transition-all duration-300"
              style={{
                background: `linear-gradient(135deg, ${PALETTE.electric}, ${PALETTE.sky})`,
                color: PALETTE.white,
                boxShadow: '0 4px 16px rgba(37,99,235,0.5)',
              }}
            >
              {t('nav.cta')}
            </Link>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  2️⃣ HERO                                                         */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section
        id="home"
        className="relative min-h-screen flex items-center px-8 lg:px-20 pt-28 pb-24 overflow-hidden"
      >
        {/* Card-suit watermark */}
        <SuitMotif suit="♠" className="text-[24rem] -top-20 -start-10" />
        <SuitMotif suit="♥" className="text-[18rem] top-40 end-1/3" />
        <SuitMotif suit="♦" className="text-[22rem] bottom-10 end-20" />
        <SuitMotif suit="♣" className="text-[20rem] -bottom-20 -start-20" />

        <div className="relative max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: text */}
          <Reveal>
            <div className={isRtl ? 'text-right' : 'text-left'}>
              <div
                className="inline-flex items-center gap-2.5 mb-8 px-5 py-2.5 rounded-full border"
                style={{
                  backgroundColor: 'rgba(252,211,77,0.12)',
                  borderColor: 'rgba(252,211,77,0.4)',
                }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ background: PALETTE.gold }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: PALETTE.gold }} />
                </span>
                <span className="text-xs font-bold tracking-widest uppercase" style={{ color: PALETTE.gold }}>
                  {t('hero.tag')}
                </span>
              </div>

              <h1
                className="font-black tracking-tight mb-6"
                style={{
                  fontFamily: titleFont,
                  fontSize: 'clamp(3rem, 6vw, 5rem)',
                  lineHeight: 1.05,
                  color: PALETTE.white,
                }}
              >
                {t('hero.title')}
                <br />
                <span className="gold-shine">{t('hero.titleAccent')}</span>
              </h1>

              <p
                className="max-w-xl mb-10 leading-relaxed"
                style={{ fontSize: 'clamp(1.05rem, 1.5vw, 1.4rem)', color: 'rgba(248,250,252,0.85)' }}
              >
                {t('hero.subtitle')}
              </p>

              <div className="flex flex-wrap gap-4">
                <StoreButton
                  variant="google"
                  topLine={t('hero.android')}
                  store={t('hero.androidStore')}
                  href="/download"
                  badge={t('common.available')}
                />
                <StoreButton
                  variant="apple"
                  topLine={t('hero.ios')}
                  store={t('hero.iosStore')}
                  href="#"
                  disabled
                  badge={t('common.soon')}
                  onClick={(e) => e.preventDefault()}
                />
              </div>

              <div
                className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-6 text-xs font-medium"
                style={{ color: 'rgba(248,250,252,0.65)' }}
              >
                <span>✓ {t('hero.androidStatus')}</span>
                <span>○ {t('hero.iosStatus')}</span>
              </div>
            </div>
          </Reveal>

          {/* Right: phone mockup + floating cards */}
          <Reveal delay={200}>
            <div className="relative flex justify-center items-center h-[520px]">
              {/* Phone frame */}
              <div
                className="relative w-[280px] h-[560px] rounded-[3rem] p-3 z-10"
                style={{
                  background: 'linear-gradient(135deg, #1A1A1A 0%, #0A0A0A 100%)',
                  boxShadow: '0 30px 80px rgba(10,31,68,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
                }}
              >
                <div
                  className="w-full h-full rounded-[2.5rem] overflow-hidden flex flex-col items-center justify-center"
                  style={{
                    background: `linear-gradient(160deg, ${PALETTE.navy} 0%, ${PALETTE.electric} 100%)`,
                  }}
                >
                  <Image
                    src="/solitaire-icon.png"
                    alt="Sally Solitaire"
                    width={140}
                    height={140}
                    className="rounded-3xl shadow-2xl mb-6"
                    style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }}
                    unoptimized
                    priority
                  />
                  <p className="font-black text-xl text-white" style={{ fontFamily: titleFont }}>
                    Sally Solitaire
                  </p>
                  <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    192 variantes
                  </p>
                  <div className="mt-5 flex gap-1.5">
                    {[0, 1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className="w-2 h-2 rounded-full"
                        style={{
                          background: i === 0 ? PALETTE.gold : 'rgba(255,255,255,0.3)',
                        }}
                      />
                    ))}
                  </div>
                </div>
                {/* Phone notch */}
                <div
                  className="absolute top-1.5 left-1/2 -translate-x-1/2 w-32 h-6 rounded-b-2xl"
                  style={{ background: '#000' }}
                />
              </div>

              {/* Floating decorative cards */}
              <FloatingCard suit="♠" value="A" className="top-0 -start-8" delay={0} rotate={-14} />
              <FloatingCard suit="♥" value="K" className="top-10 -end-4" delay={1.5} rotate={12} />
              <FloatingCard suit="♦" value="Q" className="bottom-8 -start-4" delay={3} rotate={-6} />
              <FloatingCard suit="♣" value="J" className="-bottom-2 -end-10" delay={2} rotate={10} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  3️⃣ FEATURES                                                     */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section id="features" className="relative px-8 lg:px-20 py-32">
        <SuitMotif suit="♣" className="text-[26rem] -top-20 -end-20" />
        <div className="relative max-w-7xl mx-auto">
          <Reveal>
            <div className="text-center mb-20 max-w-3xl mx-auto">
              <h2
                className="font-black mb-6"
                style={{
                  fontFamily: titleFont,
                  fontSize: 'clamp(2.25rem, 4vw, 3.5rem)',
                  lineHeight: 1.15,
                  color: PALETTE.white,
                }}
              >
                {t('feat.title')}
              </h2>
              <p className="text-lg leading-relaxed" style={{ color: 'rgba(248,250,252,0.8)' }}>
                {t('feat.subtitle')}
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { suit: '♠', tKey: 'multiplayer' },
              { suit: '♥', tKey: 'tournaments' },
              { suit: '♦', tKey: 'rewards' },
              { suit: '♣', tKey: 'offline' },
              { suit: '★', tKey: 'graphics' },
              { suit: '◆', tKey: 'ranking' },
            ].map((f, i) => (
              <Reveal key={f.tKey} delay={i * 80}>
                <div
                  className="p-10 rounded-2xl border h-full transition-all duration-300 hover:-translate-y-2"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderColor: 'rgba(255,255,255,0.1)',
                    boxShadow: '0 8px 32px rgba(10,31,68,0.2)',
                  }}
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6"
                    style={{
                      background: `linear-gradient(135deg, ${PALETTE.electric}, ${PALETTE.sky})`,
                      boxShadow: '0 8px 24px rgba(37,99,235,0.4)',
                    }}
                  >
                    {f.suit}
                  </div>
                  <h3
                    className="text-2xl font-bold mb-4"
                    style={{ fontFamily: titleFont, color: PALETTE.white }}
                  >
                    {t(`feat.${f.tKey}.t`)}
                  </h3>
                  <p className="text-base leading-relaxed" style={{ color: 'rgba(248,250,252,0.75)' }}>
                    {t(`feat.${f.tKey}.d`)}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  4️⃣ HOW TO PLAY                                                  */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section id="howto" className="relative px-8 lg:px-20 py-32">
        <SuitMotif suit="♦" className="text-[20rem] top-1/2 start-1/2" />
        <div className="relative max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-20 max-w-3xl mx-auto">
              <h2
                className="font-black mb-6"
                style={{
                  fontFamily: titleFont,
                  fontSize: 'clamp(2.25rem, 4vw, 3.5rem)',
                  lineHeight: 1.15,
                  color: PALETTE.white,
                }}
              >
                {t('how.title')}
              </h2>
              <p className="text-lg" style={{ color: 'rgba(248,250,252,0.8)' }}>{t('how.subtitle')}</p>
            </div>
          </Reveal>

          <div className="relative grid md:grid-cols-3 gap-10">
            {/* Connector line (decorative, hidden on mobile) */}
            <div
              aria-hidden
              className="hidden md:block absolute top-12 start-[16.66%] end-[16.66%] h-px"
              style={{
                background: `repeating-linear-gradient(90deg, ${PALETTE.gold} 0 8px, transparent 8px 16px)`,
                opacity: 0.5,
              }}
            />
            {[1, 2, 3].map((n, i) => (
              <Reveal key={n} delay={i * 150}>
                <div className="relative text-center flex flex-col items-center">
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center font-black text-3xl mb-6 relative z-10 border-4"
                    style={{
                      background: `linear-gradient(135deg, ${PALETTE.electric}, ${PALETTE.sky})`,
                      borderColor: PALETTE.navy,
                      color: PALETTE.white,
                      fontFamily: titleFont,
                      boxShadow: '0 8px 32px rgba(37,99,235,0.5)',
                    }}
                  >
                    {n}
                  </div>
                  <h3
                    className="text-2xl font-bold mb-3"
                    style={{ fontFamily: titleFont, color: PALETTE.white }}
                  >
                    {t(`how.step${n}.t`)}
                  </h3>
                  <p className="text-base leading-relaxed max-w-xs" style={{ color: 'rgba(248,250,252,0.75)' }}>
                    {t(`how.step${n}.d`)}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  5️⃣ SCREENSHOTS                                                  */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section id="screens" className="relative px-8 lg:px-20 py-32">
        <div className="relative max-w-7xl mx-auto">
          <Reveal>
            <div className="text-center mb-20 max-w-3xl mx-auto">
              <h2
                className="font-black mb-6"
                style={{
                  fontFamily: titleFont,
                  fontSize: 'clamp(2.25rem, 4vw, 3.5rem)',
                  lineHeight: 1.15,
                  color: PALETTE.white,
                }}
              >
                {t('screens.title')}
              </h2>
              <p className="text-lg" style={{ color: 'rgba(248,250,252,0.8)' }}>{t('screens.subtitle')}</p>
            </div>
          </Reveal>

          <div className="flex justify-center items-end gap-6 flex-wrap">
            {[
              { tilt: -8, color: `linear-gradient(160deg, ${PALETTE.navy}, ${PALETTE.electric})`, label: 'Solitaire' },
              { tilt: 0, color: `linear-gradient(160deg, ${PALETTE.royal}, ${PALETTE.sky})`, label: 'Daily' },
              { tilt: 6, color: `linear-gradient(160deg, ${PALETTE.electric}, ${PALETTE.gold})`, label: 'Win' },
              { tilt: -4, color: `linear-gradient(160deg, ${PALETTE.sky}, ${PALETTE.ivory})`, label: 'Stats' },
            ].map((s, i) => (
              <Reveal key={i} delay={i * 100}>
                <div
                  className="w-[220px] h-[440px] rounded-[2.5rem] p-2.5 transition-transform duration-300 hover:scale-105"
                  style={{
                    background: '#0A0A0A',
                    transform: `rotate(${s.tilt}deg)`,
                    boxShadow: '0 20px 60px rgba(10,31,68,0.5)',
                  }}
                >
                  <div
                    className="w-full h-full rounded-[2rem] flex flex-col items-center justify-center text-white"
                    style={{ background: s.color }}
                  >
                    <span className="text-6xl mb-4">♠</span>
                    <p className="font-bold text-lg" style={{ fontFamily: titleFont }}>
                      {s.label}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  6️⃣ TESTIMONIALS                                                 */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section
        id="testimonials"
        className="relative px-8 lg:px-20 py-32"
        style={{ background: 'rgba(255,255,255,0.03)' }}
      >
        <div className="relative max-w-7xl mx-auto">
          <Reveal>
            <div className="text-center mb-20 max-w-3xl mx-auto">
              <h2
                className="font-black mb-6"
                style={{
                  fontFamily: titleFont,
                  fontSize: 'clamp(2.25rem, 4vw, 3.5rem)',
                  lineHeight: 1.15,
                  color: PALETTE.white,
                }}
              >
                {t('testi.title')}
              </h2>
              <p className="text-lg" style={{ color: 'rgba(248,250,252,0.8)' }}>{t('testi.subtitle')}</p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((n, i) => (
              <Reveal key={n} delay={i * 100}>
                <div
                  className="p-8 rounded-2xl border h-full flex flex-col"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderColor: 'rgba(255,255,255,0.1)',
                  }}
                >
                  <div className="flex items-center gap-1 mb-5" style={{ color: PALETTE.gold }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} className="text-xl">★</span>
                    ))}
                  </div>
                  <p className="text-base leading-relaxed mb-6 flex-1" style={{ color: 'rgba(248,250,252,0.9)' }}>
                    « {t(`testi.${n}.text`)} »
                  </p>
                  <div className="flex items-center gap-4 pt-5 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center font-black text-lg"
                      style={{
                        background: `linear-gradient(135deg, ${PALETTE.electric}, ${PALETTE.sky})`,
                        color: PALETTE.white,
                      }}
                    >
                      {t(`testi.${n}.name`).charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold" style={{ color: PALETTE.white }}>{t(`testi.${n}.name`)}</p>
                      <p className="text-xs" style={{ color: 'rgba(248,250,252,0.6)' }}>{t(`testi.${n}.role`)}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  7️⃣ STATS                                                        */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="relative px-8 lg:px-20 py-24">
        <div className="relative max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10">
          {[
            { value: <><Counter to={250} suffix="+" /></>, label: t('stats.players') },
            { value: <><Counter to={48} suffix="" />/<span style={{ opacity: 0.5 }}>5</span></>, label: t('stats.rating') },
            { value: <><Counter to={12} suffix="+" /></>, label: t('stats.countries') },
            { value: '100%', label: t('stats.free') },
          ].map((s, i) => (
            <Reveal key={i} delay={i * 80}>
              <div className="text-center">
                <div
                  className="font-black mb-3"
                  style={{
                    fontFamily: titleFont,
                    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                    lineHeight: 1,
                    color: PALETTE.gold,
                  }}
                >
                  {s.value}
                </div>
                <div
                  className="text-sm font-bold tracking-widest uppercase"
                  style={{ color: 'rgba(248,250,252,0.85)' }}
                >
                  {s.label}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  8️⃣ FINAL CTA                                                    */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="relative px-8 lg:px-20 py-32 overflow-hidden">
        <SuitMotif suit="♠" className="text-[28rem] top-0 -start-20" />
        <SuitMotif suit="♥" className="text-[26rem] bottom-0 -end-20" />
        <div className="relative max-w-5xl mx-auto">
          <Reveal>
            <div
              className="rounded-[2.5rem] p-12 lg:p-20 text-center"
              style={{
                background: `linear-gradient(135deg, ${PALETTE.navy} 0%, ${PALETTE.electric} 100%)`,
                boxShadow: '0 30px 80px rgba(10,31,68,0.4), 0 0 0 1px rgba(255,255,255,0.06)',
              }}
            >
              <h2
                className="font-black mb-5"
                style={{
                  fontFamily: titleFont,
                  fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                  lineHeight: 1.1,
                  color: PALETTE.white,
                }}
              >
                {t('cta.title')}
              </h2>
              <p className="text-lg mb-10 max-w-2xl mx-auto" style={{ color: 'rgba(248,250,252,0.85)' }}>
                {t('cta.subtitle')}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <StoreButton
                  variant="google"
                  topLine={t('hero.android')}
                  store={t('hero.androidStore')}
                  href="/download"
                  badge={t('common.available')}
                />
                <StoreButton
                  variant="apple"
                  topLine={t('hero.ios')}
                  store={t('hero.iosStore')}
                  href="#"
                  disabled
                  badge={t('common.soon')}
                  onClick={(e) => e.preventDefault()}
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  9️⃣ FOOTER                                                       */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <footer
        id="contact"
        className="relative px-8 lg:px-20 pt-20 pb-10"
        style={{ background: PALETTE.navy, color: PALETTE.white }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-14">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
                  style={{ background: `linear-gradient(135deg, ${PALETTE.electric}, ${PALETTE.sky})` }}
                >
                  ♠
                </div>
                <span className="text-xl font-black" style={{ color: PALETTE.white, fontFamily: titleFont }}>
                  Sally<span style={{ color: PALETTE.gold }}>Cards</span>
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(248,250,252,0.7)' }}>
                {t('footer.aboutText')}
              </p>
            </div>

            <FooterCol
              title={t('footer.links')}
              items={[
                { label: t('footer.linkHome'), href: '#home' },
                { label: t('footer.linkDownload'), href: '/download' },
                { label: t('footer.linkBlog'), href: '#' },
                { label: t('footer.linkPress'), href: '#' },
              ]}
            />
            <FooterCol
              title={t('footer.support')}
              items={[
                { label: t('footer.supportContact'), href: 'mailto:salistarcompany@gmail.com' },
                { label: t('footer.supportFaq'), href: '#features' },
                { label: t('footer.supportApi'), href: 'https://api.salistar.com/api/docs' },
                { label: t('footer.supportStatus'), href: 'https://salistar.com/#monitoring' },
              ]}
            />
            <div>
              <h4 className="font-black uppercase text-xs tracking-widest mb-5" style={{ color: PALETTE.white }}>
                {t('footer.social')}
              </h4>
              <div className="flex gap-3 flex-wrap">
                {[
                  { name: 'GitHub', href: 'https://github.com/salistar' },
                  { name: 'Twitter', href: '#' },
                  { name: 'Instagram', href: '#' },
                  { name: 'YouTube', href: '#' },
                  { name: 'TikTok', href: '#' },
                ].map((s) => (
                  <a
                    key={s.name}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold border transition hover:scale-110"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      borderColor: 'rgba(255,255,255,0.1)',
                      color: PALETTE.white,
                    }}
                  >
                    {s.name.charAt(0)}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div
            className="pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4 text-xs"
            style={{ borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(248,250,252,0.6)' }}
          >
            <span>{t('footer.legal')}</span>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition">{t('footer.privacy')}</a>
              <a href="#" className="hover:text-white transition">{t('footer.terms')}</a>
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
      <h4 className="font-black uppercase text-xs tracking-widest mb-5" style={{ color: PALETTE.white }}>
        {title}
      </h4>
      <ul className="flex flex-col gap-3">
        {items.map((i) => (
          <li key={i.label}>
            <a
              href={i.href}
              className="text-sm transition"
              style={{ color: 'rgba(248,250,252,0.75)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = PALETTE.gold)}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(248,250,252,0.75)')}
            >
              {i.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
