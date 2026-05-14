/**
 * @file apps/web/app/download/page.tsx
 * @description Index des 11 jeux SallyCards. Affiche une carte par jeu
 * (icône réelle + état + tagline). Chaque carte mène à /download/[slug]
 * qui contient les règles trilingues et l'APK / message "Bientôt".
 */
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { GAMES } from '../lib/games';

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

export default function DownloadIndexPage() {
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

  const availableCount = GAMES.filter((g) => g.available).length;
  const soonCount = GAMES.length - availableCount;

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
          .dlx-section { padding: 80px 40px !important; }
        }
        @media (max-width: 768px) {
          .dlx-section { padding: 60px 24px !important; }
          .dlx-hero { padding-top: 120px !important; }
          h1.dlx-title { font-size: 40px !important; }
        }
      `}</style>

      {/* HEADER */}
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
            >
              ← {t('common.back')}
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section
        className="dlx-section dlx-hero"
        style={{
          padding: '160px 80px 80px',
          background: `linear-gradient(180deg, ${C.navyDeep} 0%, ${C.navy} 100%)`,
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ marginBottom: '32px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 20px',
                borderRadius: '999px',
                background: `${C.gold}1f`,
                border: `1px solid ${C.gold}66`,
                color: C.gold,
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
              }}
            >
              ♠ {lang === 'fr' ? '11 jeux mobiles' : lang === 'en' ? '11 mobile games' : '11 لعبة محمولة'}
            </span>
          </div>

          <h1
            className="dlx-title"
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
            {lang === 'fr' ? 'Choisissez votre jeu' : lang === 'en' ? 'Pick your game' : 'اختر لعبتك'}
          </h1>

          <p
            style={{
              marginTop: '24px',
              fontSize: '20px',
              lineHeight: 1.6,
              color: 'rgba(248,250,252,0.85)',
              maxWidth: '720px',
              margin: '24px auto 0',
            }}
          >
            {lang === 'fr'
              ? `${availableCount} jeu disponible immédiatement (Solitaire APK signée). ${soonCount} jeux arrivent dans les semaines à venir. Cliquez pour voir les règles et télécharger.`
              : lang === 'en'
              ? `${availableCount} game ready now (Solitaire signed APK). ${soonCount} games arriving in the coming weeks. Click for rules and download.`
              : `${availableCount} لعبة جاهزة الآن (Solitaire APK موقّع). ${soonCount} ألعاب قادمة في الأسابيع القادمة. انقر للقواعد والتحميل.`}
          </p>
        </div>
      </section>

      {/* GAMES GRID */}
      <section
        className="dlx-section"
        style={{
          padding: '80px 80px 160px',
          background: `linear-gradient(180deg, ${C.navy} 0%, ${C.blueRoyal} 100%)`,
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '32px',
            padding: '20px 0',
          }}
        >
          {GAMES.map((g) => (
            <Link
              key={g.slug}
              href={`/download/${g.slug}`}
              style={{
                display: 'block',
                padding: '32px 28px',
                background: g.available ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: `1px solid ${g.available ? 'rgba(16,185,129,0.45)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '24px',
                textDecoration: 'none',
                transition: 'all 0.3s',
                position: 'relative',
                overflow: 'visible',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = g.available
                  ? '0 20px 50px rgba(16,185,129,0.3)'
                  : '0 20px 50px rgba(10,21,53,0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: '-12px',
                  insetInlineEnd: '24px',
                  padding: '5px 12px',
                  borderRadius: '999px',
                  fontSize: '10px',
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

              <div
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  marginBottom: '20px',
                  boxShadow: '0 14px 32px rgba(10,21,53,0.4)',
                  background: g.gradient,
                  padding: '4px',
                }}
              >
                <Image
                  src={g.iconSrc}
                  alt={g.name}
                  width={100}
                  height={100}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px' }}
                  unoptimized
                />
              </div>

              <h3 style={{ fontFamily: titleFont, fontSize: '24px', fontWeight: 700, color: C.white, margin: '0 0 6px', lineHeight: 1.2 }}>
                {g.name}
              </h3>
              <p style={{ fontSize: '11px', fontWeight: 700, color: C.gold, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 14px' }}>
                {g.players} · {g.cardSystem === 'fr' ? '52 FR' : '40 ES'}
              </p>
              <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'rgba(248,250,252,0.78)', margin: '0 0 16px' }}>
                {g.tagline[lang]}
              </p>
              <p style={{ fontSize: '12px', fontWeight: 700, color: g.available ? C.green : C.gold, margin: 0 }}>
                {g.available
                  ? `⬇ ${lang === 'fr' ? 'Télécharger maintenant' : lang === 'en' ? 'Download now' : 'حمّل الآن'} →`
                  : `${lang === 'fr' ? 'Voir les règles' : lang === 'en' ? 'View rules' : 'عرض القواعد'} →`}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* FOOTER */}
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
            <Link href="/" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>
              ← {t('common.back')}
            </Link>
            <a href="https://salistar.com/#monitoring" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>
              {t('footer.supportStatus')}
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
