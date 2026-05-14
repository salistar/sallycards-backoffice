/**
 * @file apps/web/app/page.tsx
 * @description Homepage SallyCards (sallycards.salistar.com) — design dark
 * premium, trilingue FR/EN/AR avec support RTL, 10 jeux affichés avec deux
 * états clairs : "DISPONIBLE" (Solitaire avec icône mobile réelle + bouton
 * download) ou "BIENTÔT" (badge orange, dimmed card, bouton "Notify me").
 *
 * Design system :
 *   - bg #0a0e1a + grid-pattern + glow orbs animés (emerald, cyan, pink)
 *   - Glassmorphism: rgba(15,23,42,0.6) + backdrop-blur(24px)
 *   - Gradients : emerald → cyan, gold → pink (états)
 *   - Typo : Inter, font-black, 7xl-8xl titles
 *   - Animations : float, glow, scroll-reveal, hover lift
 *
 * Pas de modification du package.json (react-i18next déjà installé).
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './components/LanguageSwitcher';
import ScrollReveal from './components/ScrollReveal';

// ─── Game catalogue ─────────────────────────────────────────────────────
// `available: true` → carte mise en avant avec bouton "Download" actif.
// `available: false` → carte dimmed avec badge "Coming soon" + bouton désactivé.

interface GameInfo {
  slug: string;
  name: string;
  glyph: string;     // emoji ou caractère iconique pour la card (fallback si pas d'icône image)
  iconSrc?: string;  // chemin d'icône (e.g. solitaire-icon.png), prend le pas sur glyph
  desc: { fr: string; en: string; ar: string };
  players: string;
  gradient: string;
  available: boolean;
}

const GAMES: GameInfo[] = [
  {
    slug: 'solitaire',
    name: 'Solitaire',
    glyph: '♦',
    iconSrc: '/solitaire-icon.png',
    desc: {
      fr: '192 variantes (Klondike, Spider, FreeCell, TriPeaks…) + mode multijoueur P2P',
      en: '192 variants (Klondike, Spider, FreeCell, TriPeaks…) + P2P multiplayer mode',
      ar: '192 متغيراً (Klondike، Spider، FreeCell، TriPeaks…) + لعب جماعي P2P',
    },
    players: '1-4',
    gradient: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
    available: true,
  },
  {
    slug: 'ronda',
    name: 'Ronda',
    glyph: '🃏',
    desc: { fr: 'Capture marocaine classique', en: 'Classic Moroccan capture', ar: 'لعبة التقاط مغربية كلاسيكية' },
    players: '2-4',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    available: false,
  },
  {
    slug: 'kdoub',
    name: 'Kdoub',
    glyph: '🤥',
    desc: { fr: 'Bluff et contestation', en: 'Bluff and challenge', ar: 'خداع وتحدي' },
    players: '3-6',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
    available: false,
  },
  {
    slug: 'belote',
    name: 'Belote',
    glyph: '♣',
    desc: { fr: 'Jeu de levées en équipe', en: 'Tricks-and-tactics team game', ar: 'لعبة جماعية بالحيل' },
    players: '4',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
    available: false,
  },
  {
    slug: 'poker',
    name: 'Poker',
    glyph: '♠',
    desc: { fr: "Texas Hold'em No-Limit", en: "Texas Hold'em No-Limit", ar: 'تكساس هولدم بدون حدود' },
    players: '2-9',
    gradient: 'linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)',
    available: false,
  },
  {
    slug: 'tarot',
    name: 'Tarot',
    glyph: '👑',
    desc: { fr: '78 cartes, 22 atouts', en: '78 cards, 22 trumps', ar: '78 ورقة، 22 أتو' },
    players: '3-5',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #831843 100%)',
    available: false,
  },
  {
    slug: 'scopa',
    name: 'Scopa',
    glyph: '🪙',
    desc: { fr: 'Capture italienne', en: 'Italian capture game', ar: 'لعبة التقاط إيطالية' },
    players: '2-4',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
    available: false,
  },
  {
    slug: 'okey',
    name: 'Okey',
    glyph: '🎴',
    desc: { fr: 'Rami turc avec tuiles', en: 'Turkish rummy with tiles', ar: 'رامي تركي بالقطع' },
    players: '4',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)',
    available: false,
  },
  {
    slug: 'memory',
    name: 'Memory',
    glyph: '🧠',
    desc: { fr: 'Trouvez les paires', en: 'Find the pairs', ar: 'اعثر على الأزواج' },
    players: '1-4',
    gradient: 'linear-gradient(135deg, #84cc16 0%, #15803d 100%)',
    available: false,
  },
  {
    slug: 'qui-est-ce',
    name: 'Qui-est-ce?',
    glyph: '❓',
    desc: { fr: 'Déduction oui/non', en: 'Yes/no deduction', ar: 'استنتاج بنعم/لا' },
    players: '2',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #312e81 100%)',
    available: false,
  },
];

const FEATURES_KEYS: Array<{ glyph: string; titleKey: string; descKey: string }> = [
  { glyph: '🌐', titleKey: 'feature.multiplayer.title', descKey: 'feature.multiplayer.desc' },
  { glyph: '📴', titleKey: 'feature.offline.title', descKey: 'feature.offline.desc' },
  { glyph: '🔒', titleKey: 'feature.privacy.title', descKey: 'feature.privacy.desc' },
  { glyph: '🗣️', titleKey: 'feature.languages.title', descKey: 'feature.languages.desc' },
  { glyph: '🛡️', titleKey: 'feature.fair.title', descKey: 'feature.fair.desc' },
  { glyph: '📱', titleKey: 'feature.crossplatform.title', descKey: 'feature.crossplatform.desc' },
];

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const lang = (i18n.language?.split('-')[0] ?? 'fr') as 'fr' | 'en' | 'ar';
  const isRtl = lang === 'ar';

  const faqs = [
    { q: t('faq.q1'), a: t('faq.a1') },
    { q: t('faq.q2'), a: t('faq.a2') },
    { q: t('faq.q3'), a: t('faq.a3') },
    { q: t('faq.q4'), a: t('faq.a4') },
    { q: t('faq.q5'), a: t('faq.a5') },
    { q: t('faq.q6'), a: t('faq.a6') },
  ];

  return (
    <main
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen w-full overflow-x-hidden relative"
      style={{
        backgroundColor: '#0a0e1a',
        color: '#e7e9ee',
        fontFamily: isRtl
          ? "'Cairo', 'Inter', system-ui, sans-serif"
          : "'Inter', system-ui, sans-serif",
      }}
    >
      {/* ─── Grid pattern + glow orbs in fixed background ─── */}
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
          left: '-10%',
          width: '600px',
          height: '600px',
          background: '#10b981',
          filter: 'blur(120px)',
          opacity: 0.25,
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden
        className="fixed -z-10 rounded-full"
        style={{
          top: '40%',
          right: '-10%',
          width: '700px',
          height: '700px',
          background: '#06b6d4',
          filter: 'blur(140px)',
          opacity: 0.2,
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden
        className="fixed -z-10 rounded-full"
        style={{
          bottom: '-20%',
          left: '30%',
          width: '600px',
          height: '600px',
          background: '#ec4899',
          filter: 'blur(130px)',
          opacity: 0.15,
          pointerEvents: 'none',
        }}
      />

      {/* ═════════ NAVBAR ═════════ */}
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

          <div
            className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest"
            style={{ color: '#94a3b8' }}
          >
            <a href="#games" className="hover:text-white transition-colors">{t('nav.games')}</a>
            <a href="#features" className="hover:text-white transition-colors">{t('nav.features')}</a>
            <a href="#how" className="hover:text-white transition-colors">{t('nav.help')}</a>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="light" />
            <Link
              href="/download"
              className="px-5 py-2.5 rounded-xl font-black text-sm text-[#0a0e1a] shadow-lg shadow-emerald-500/30 hover:scale-105 transition"
              style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
            >
              {t('nav.download')}
            </Link>
          </div>
        </div>
      </nav>

      {/* ═════════ HERO ═════════ */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-40 pb-24 px-6 text-center">
        <div className="max-w-5xl mx-auto flex flex-col items-center">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full border"
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
              {t('hero.badge')}
            </span>
          </div>

          {/* Title */}
          <h1
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tighter mb-6"
            style={{ color: '#f8fafc' }}
          >
            {t('hero.title1')} <br />
            <span
              style={{
                backgroundImage: 'linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #ec4899 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
              }}
            >
              {t('hero.title2')}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl md:text-2xl max-w-3xl mb-12 leading-relaxed font-medium" style={{ color: '#94a3b8' }}>
            {t('hero.subtitle')}
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Link
              href="/download"
              className="px-8 py-4 rounded-xl font-black text-base text-[#0a0e1a] shadow-2xl shadow-emerald-500/30 hover:scale-[1.03] active:scale-95 transition flex items-center gap-3"
              style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
            >
              ⬇ {t('hero.install')}
            </Link>
            <a
              href="#games"
              className="px-8 py-4 rounded-xl font-bold text-base border backdrop-blur transition flex items-center gap-3"
              style={{
                backgroundColor: 'rgba(15,23,42,0.6)',
                borderColor: 'rgba(255,255,255,0.1)',
                color: '#e7e9ee',
              }}
            >
              {t('hero.explore')} →
            </a>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl">
            {[
              { v: '10', l: t('stats.games') },
              { v: '3', l: t('stats.languages') },
              { v: '8', l: t('stats.bots') },
              { v: '0€', l: t('stats.free') },
            ].map((s) => (
              <div
                key={s.l}
                className="p-5 rounded-2xl backdrop-blur-md border"
                style={{
                  backgroundColor: 'rgba(15,23,42,0.5)',
                  borderColor: 'rgba(255,255,255,0.08)',
                }}
              >
                <div
                  className="text-3xl md:text-4xl font-black mb-1"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, #10b981, #06b6d4)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                  }}
                >
                  {s.v}
                </div>
                <div className="text-xs font-bold uppercase tracking-widest" style={{ color: '#94a3b8' }}>
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════ GAMES GRID ═════════ */}
      <section id="games" className="relative py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight" style={{ color: '#f8fafc' }}>
                {t('games.title')}
              </h2>
              <p className="text-base md:text-lg max-w-2xl mx-auto" style={{ color: '#94a3b8' }}>
                {t('games.subtitle')}
              </p>
              <div
                className="h-1.5 w-24 mx-auto mt-6 rounded-full"
                style={{ background: 'linear-gradient(90deg, #10b981, #06b6d4)' }}
              />
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            {GAMES.map((g, i) => (
              <ScrollReveal key={g.slug} delay={i * 50}>
                <GameCardPremium game={g} lang={lang} t={t} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════ FEATURES ═════════ */}
      <section id="features" className="relative py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight" style={{ color: '#f8fafc' }}>
                {t('features.title')}
              </h2>
              <p className="text-base md:text-lg max-w-2xl mx-auto" style={{ color: '#94a3b8' }}>
                {t('features.subtitle')}
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES_KEYS.map((f, i) => (
              <ScrollReveal key={f.titleKey} delay={i * 60}>
                <div
                  className="p-7 rounded-2xl backdrop-blur-md border h-full transition hover:-translate-y-1"
                  style={{
                    backgroundColor: 'rgba(15,23,42,0.5)',
                    borderColor: 'rgba(255,255,255,0.08)',
                  }}
                >
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-5"
                    style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.15))', border: '1px solid rgba(16,185,129,0.3)' }}
                  >
                    {f.glyph}
                  </div>
                  <h3 className="text-xl font-black mb-2" style={{ color: '#f8fafc' }}>{t(f.titleKey)}</h3>
                  <p className="leading-relaxed" style={{ color: '#94a3b8' }}>{t(f.descKey)}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════ HOW IT WORKS ═════════ */}
      <section id="how" className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <h2 className="text-4xl md:text-5xl font-black mb-16 text-center tracking-tight" style={{ color: '#f8fafc' }}>
              {t('how.title')}
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { n: '01', tKey: 'how.step1', glyph: '⬇' },
              { n: '02', tKey: 'how.step2', glyph: '⚙️' },
              { n: '03', tKey: 'how.step3', glyph: '🎮' },
            ].map((step, i) => (
              <ScrollReveal key={step.n} delay={i * 100}>
                <div
                  className="p-7 rounded-2xl backdrop-blur-md border text-center h-full"
                  style={{
                    backgroundColor: 'rgba(15,23,42,0.5)',
                    borderColor: 'rgba(255,255,255,0.08)',
                  }}
                >
                  <div
                    className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-3xl mb-6"
                    style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
                  >
                    {step.glyph}
                  </div>
                  <div className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#10b981' }}>
                    {step.n}
                  </div>
                  <h3 className="text-xl font-black mb-3" style={{ color: '#f8fafc' }}>{t(`${step.tKey}.title`)}</h3>
                  <p className="leading-relaxed" style={{ color: '#94a3b8' }}>{t(`${step.tKey}.desc`)}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════ FAQ ═════════ */}
      <section className="relative py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight" style={{ color: '#f8fafc' }}>
                {t('faq.title')}
              </h2>
              <p className="text-base md:text-lg" style={{ color: '#94a3b8' }}>{t('faq.subtitle')}</p>
            </div>
          </ScrollReveal>

          <div className="flex flex-col gap-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-2xl border overflow-hidden backdrop-blur-md"
                style={{
                  backgroundColor: 'rgba(15,23,42,0.5)',
                  borderColor: 'rgba(255,255,255,0.08)',
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-6 flex items-center justify-between text-start hover:bg-white/5 transition"
                >
                  <span className="text-base md:text-lg font-bold pe-4" style={{ color: '#f8fafc' }}>
                    {faq.q}
                  </span>
                  <span
                    className="text-2xl flex-shrink-0 transition-transform duration-300"
                    style={{
                      color: '#10b981',
                      transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0deg)',
                    }}
                  >
                    +
                  </span>
                </button>
                <div
                  className="overflow-hidden transition-all duration-300"
                  style={{
                    maxHeight: openFaq === i ? '500px' : '0px',
                    opacity: openFaq === i ? 1 : 0,
                  }}
                >
                  <p className="px-6 pb-6 leading-relaxed" style={{ color: '#94a3b8' }}>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════ CTA FINAL ═════════ */}
      <section className="relative py-24 px-6">
        <div
          className="max-w-4xl mx-auto p-10 md:p-16 rounded-3xl text-center backdrop-blur-md border"
          style={{
            backgroundColor: 'rgba(15,23,42,0.5)',
            borderColor: 'rgba(16,185,129,0.3)',
            background:
              'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(6,182,212,0.1) 50%, rgba(236,72,153,0.05) 100%)',
          }}
        >
          <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight" style={{ color: '#f8fafc' }}>
            {t('cta.title')}
          </h2>
          <p className="text-lg mb-8" style={{ color: '#94a3b8' }}>{t('cta.subtitle')}</p>
          <Link
            href="/download"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl font-black text-base text-[#0a0e1a] shadow-2xl shadow-emerald-500/30 hover:scale-[1.03] transition"
            style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
          >
            ⬇ {t('nav.download')}
          </Link>
        </div>
      </section>

      {/* ═════════ FOOTER ═════════ */}
      <footer
        className="relative py-16 px-6 border-t"
        style={{
          backgroundColor: 'rgba(10,14,26,0.8)',
          borderColor: 'rgba(255,255,255,0.06)',
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <path d="M12 8v8M8 12h8" />
                  </svg>
                </div>
                <span className="text-xl font-black" style={{ color: '#f8fafc' }}>
                  Sally<span style={{ color: '#10b981' }}>Cards</span>
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
                {t('footer.desc')}
              </p>
            </div>

            <FooterColumn title={t('footer.games')} items={GAMES.slice(0, 5).map((g) => g.name)} />
            <FooterColumn title={t('footer.platform')} items={['Android', 'iOS', t('footer.api'), t('footer.status')]} />
            <FooterColumn title={t('footer.legal')} items={[t('footer.privacy'), t('footer.terms'), t('footer.contact')]} />
          </div>
          <div
            className="pt-8 border-t text-center text-xs font-bold uppercase tracking-widest"
            style={{
              borderColor: 'rgba(255,255,255,0.06)',
              color: '#64748b',
            }}
          >
            © 2026 SallyCards · Made by SallyStar in Casablanca
          </div>
        </div>
      </footer>
    </main>
  );
}

// ─── Game card component (premium dark, two states) ───────────────────────
function GameCardPremium({
  game,
  lang,
  t,
}: {
  game: GameInfo;
  lang: 'fr' | 'en' | 'ar';
  t: (k: string) => string;
}) {
  const isAvailable = game.available;
  return (
    <div
      className={`relative p-5 rounded-2xl backdrop-blur-md border transition-all duration-300 ${
        isAvailable
          ? 'hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-500/20'
          : 'opacity-75 hover:opacity-90'
      } group`}
      style={{
        backgroundColor: isAvailable ? 'rgba(15,23,42,0.7)' : 'rgba(15,23,42,0.4)',
        borderColor: isAvailable ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.06)',
        boxShadow: isAvailable ? '0 4px 32px rgba(16,185,129,0.15)' : undefined,
      }}
    >
      {/* State badge */}
      <div
        className="absolute top-3 end-3 px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase"
        style={{
          backgroundColor: isAvailable ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
          color: isAvailable ? '#10b981' : '#f59e0b',
          border: `1px solid ${isAvailable ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.4)'}`,
        }}
      >
        {isAvailable ? (
          <>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 me-1.5 animate-pulse" />
            {t('games.available')}
          </>
        ) : (
          t('games.comingSoon')
        )}
      </div>

      {/* Icon */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 mt-3 overflow-hidden"
        style={{ background: game.gradient }}
      >
        {game.iconSrc ? (
          <Image
            src={game.iconSrc}
            alt={game.name}
            width={56}
            height={56}
            className="rounded-xl"
            unoptimized
          />
        ) : (
          <span className="text-3xl">{game.glyph}</span>
        )}
      </div>

      <h3 className="text-lg font-black mb-1" style={{ color: '#f8fafc' }}>
        {game.name}
      </h3>
      <p className="text-xs mb-3 font-mono" style={{ color: '#10b981' }}>
        {game.players} {t('games.players')}
      </p>
      <p className="text-sm leading-relaxed mb-4 min-h-[3.5rem]" style={{ color: '#94a3b8' }}>
        {game.desc[lang]}
      </p>

      {/* Button */}
      {isAvailable ? (
        <Link
          href="/download"
          className="block w-full text-center py-2.5 rounded-xl text-sm font-black text-[#0a0e1a] transition hover:scale-[1.02]"
          style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
        >
          ⬇ {t('games.downloadNow')}
        </Link>
      ) : (
        <button
          disabled
          className="block w-full text-center py-2.5 rounded-xl text-sm font-bold border cursor-not-allowed"
          style={{
            backgroundColor: 'rgba(255,255,255,0.03)',
            borderColor: 'rgba(255,255,255,0.08)',
            color: '#64748b',
          }}
        >
          🔔 {t('games.notify')}
        </button>
      )}
    </div>
  );
}

function FooterColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="font-black uppercase text-xs tracking-widest mb-4" style={{ color: '#f8fafc' }}>
        {title}
      </h4>
      <ul className="flex flex-col gap-2">
        {items.map((i) => (
          <li key={i}>
            <a href="#" className="text-sm hover:text-white transition" style={{ color: '#94a3b8' }}>
              {i}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
