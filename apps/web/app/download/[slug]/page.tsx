/**
 * @file apps/web/app/download/[slug]/page.tsx
 * @description Page download dédiée à UN jeu de la catalogue.
 *
 * URL: /download/solitaire, /download/ronda, /download/poker, …
 *
 *   - Hero avec icône réelle du jeu (depuis l'app mobile) + badge
 *     DISPONIBLE/BIENTÔT placé AU-DESSUS du titre (margin-bottom 32px)
 *   - Card APK :
 *       * si disponible : bouton GOLD de téléchargement direct + meta live
 *         (build date, size) depuis l'API GitHub releases
 *       * si bientôt : message + formulaire "me prévenir"
 *   - Section RÈGLES trilingue (toggle FR/EN/AR), texte long ~2 paragraphes
 *   - Lien retour vers /download (liste des 11 jeux)
 */
'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { BrandLogo } from '../../components/BrandLogo';
import { getGame, GAMES } from '../../lib/games';
import { notFound } from 'next/navigation';

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

function GooglePlayLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden="true">
      <path fill="#00D4FF" d="M81 41c-7 4-11 12-11 22v386c0 10 4 18 11 22l213-208v-14L81 41z" />
      <path fill="#FFD400" d="M294 263v-14L373 170l85 47c25 14 25 36 0 50l-85 47-79-51z" />
      <path fill="#FF3C00" d="M81 471c4 5 11 7 19 4l278-156-84-56-213 208z" />
      <path fill="#00C846" d="M81 41l213 208 84-56L100 37c-8-3-15-1-19 4z" />
    </svg>
  );
}

export default function GameDownloadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const game = getGame(slug);
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
    if (!game?.available || !game.githubRepo) return;
    const repo = game.githubRepo.replace('https://github.com/', '');
    fetch(`https://api.github.com/repos/${repo}/releases/tags/latest`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.tag_name) {
          const apk = data.assets?.find((a: any) => a.name === 'app-debug.apk');
          setRelease({ published_at: data.published_at, apkSize: apk?.size });
        }
      })
      .catch(() => {});
  }, [game]);

  if (!game) return notFound();

  const apkSizeMB = release?.apkSize
    ? (release.apkSize / 1024 / 1024).toFixed(1)
    : game.slug === 'solitaire' ? '211' : '~200';

  const titleFont = isRtl ? "'Cairo', 'Playfair Display', serif" : "'Playfair Display', 'Cairo', Georgia, serif";
  const bodyFont = isRtl ? "'Cairo', 'Inter', sans-serif" : "'Inter', 'Cairo', sans-serif";

  const triggerDownload = (e: React.MouseEvent) => {
    if (!game.apkUrl) return;
    e.preventDefault();
    setDownloading(true);
    const a = document.createElement('a');
    a.href = game.apkUrl;
    a.download = `sally-${game.slug}-latest.apk`;
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
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 1024px) {
          .gd-section { padding: 80px 40px !important; }
        }
        @media (max-width: 768px) {
          .gd-section { padding: 60px 24px !important; }
          .gd-hero { padding-top: 120px !important; }
          h1.gd-title { font-size: 40px !important; }
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '52px', height: '52px' }}>
              <BrandLogo size={24} />
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

      {/* HERO */}
      <section
        className="gd-section gd-hero"
        style={{
          padding: '160px 80px 80px',
          background: `linear-gradient(180deg, ${C.navyDeep} 0%, ${C.navy} 100%)`,
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          {/* Badge AU-DESSUS du titre */}
          <div style={{ marginBottom: '32px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 20px',
                borderRadius: '999px',
                background: game.available ? `${C.green}1a` : `${C.orange}1a`,
                border: `1px solid ${game.available ? C.green : C.orange}66`,
                color: game.available ? C.green : C.orange,
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
              }}
            >
              <span style={{ position: 'relative', display: 'inline-flex', width: '8px', height: '8px' }}>
                <span
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '999px',
                    background: game.available ? C.green : C.orange,
                    opacity: 0.7,
                  }}
                  className="animate-ping"
                />
                <span style={{ position: 'relative', width: '8px', height: '8px', borderRadius: '999px', background: game.available ? C.green : C.orange }} />
              </span>
              {game.available ? t('common.available') : t('common.soon')}
            </span>
          </div>

          {/* Hero icon — Solitaire uses the OFFICIAL BrandLogo (3-card fan
              with Ace of Spades — the one shown on the language-select
              screen and the splash screen of the mobile app). Other games
              use their square PNG icon. */}
          {game.slug === 'solitaire' ? (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
              <BrandLogo size={130} />
            </div>
          ) : (
            <div
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '28px',
                margin: '0 auto 24px',
                overflow: 'hidden',
                padding: '4px',
                background: game.gradient,
                boxShadow: '0 20px 60px rgba(10,21,53,0.5)',
              }}
            >
              <Image
                src={game.iconSrc}
                alt={game.name}
                width={120}
                height={120}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '22px' }}
                unoptimized
                priority
              />
            </div>
          )}

          <h1
            className="gd-title"
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
            {game.name}
          </h1>

          <p
            style={{
              marginTop: '24px',
              fontSize: '20px',
              lineHeight: 1.6,
              color: 'rgba(248,250,252,0.85)',
              maxWidth: '700px',
              margin: '24px auto 0',
            }}
          >
            {game.tagline[lang]}
          </p>

          <div
            style={{
              marginTop: '24px',
              display: 'inline-flex',
              flexWrap: 'wrap',
              gap: '16px',
              padding: '12px 24px',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              fontSize: '13px',
              fontWeight: 700,
              color: C.gold,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            <span>♟ {game.players}</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span>
              {game.cardSystem === 'fr'
                ? lang === 'fr' ? '52 cartes FR' : lang === 'en' ? '52-card FR deck' : '52 ورقة فرنسية'
                : lang === 'fr' ? '40 cartes ES' : lang === 'en' ? '40-card ES deck' : '40 ورقة إسبانية'}
            </span>
          </div>
        </div>
      </section>

      {/* APK CARD or COMING SOON */}
      <section
        className="gd-section"
        style={{
          padding: '60px 80px 80px',
          background: `linear-gradient(180deg, ${C.navy} 0%, ${C.blueRoyal} 100%)`,
        }}
      >
        <div
          style={{
            maxWidth: '900px',
            margin: '0 auto',
            padding: '48px',
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: `1px solid ${game.available ? C.green : C.orange}55`,
            borderRadius: '24px',
            boxShadow: '0 30px 80px rgba(10,21,53,0.4)',
          }}
        >
          {game.available ? (
            <>
              <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.gold, margin: '0 0 12px' }}>
                ♦ {t('download.apkLabel')}
              </p>
              <h2 style={{ fontFamily: titleFont, fontSize: '36px', fontWeight: 900, color: C.white, margin: '0 0 16px', lineHeight: 1.1 }}>
                {lang === 'fr' ? 'APK signée — téléchargement direct' : lang === 'en' ? 'Signed APK — direct download' : 'APK موقّع — تحميل مباشر'}
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginBottom: '32px', fontSize: '14px', color: 'rgba(248,250,252,0.82)' }}>
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

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                <a
                  href={game.apkUrl}
                  download={`sally-${game.slug}-latest.apk`}
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
                >
                  {downloading ? (
                    <>
                      <span style={{ display: 'inline-block', width: '20px', height: '20px', border: `2px solid ${C.navyDeep}`, borderTopColor: 'transparent', borderRadius: '999px', animation: 'spin 0.8s linear infinite' }} />
                      {t('download.downloading')}
                    </>
                  ) : (
                    <>⬇ {t('download.apkDownload')}</>
                  )}
                </a>
                {game.releasePage && (
                  <a
                    href={game.releasePage}
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
                  >
                    {t('download.viewRelease')} →
                  </a>
                )}
              </div>

              {/* Secondary download options — AAB for Play Console + nightly debug APK */}
              {(game.aabUrl || game.apkDebugUrl) && (
                <div
                  style={{
                    marginTop: '18px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '12px',
                    alignItems: 'center',
                    color: 'rgba(248,250,252,0.65)',
                    fontSize: '12px',
                  }}
                >
                  {game.aabUrl && (
                    <a
                      href={game.aabUrl}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: '999px',
                        background: 'rgba(252,211,77,0.10)',
                        color: C.gold,
                        textDecoration: 'none',
                        border: `1px solid ${C.gold}66`,
                        fontWeight: 700,
                      }}
                    >
                      📦 Signed AAB (Play Store)
                    </a>
                  )}
                  {game.apkDebugUrl && (
                    <a
                      href={game.apkDebugUrl}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: '999px',
                        background: 'rgba(255,255,255,0.04)',
                        color: 'rgba(248,250,252,0.85)',
                        textDecoration: 'none',
                        border: '1px solid rgba(255,255,255,0.15)',
                        fontWeight: 600,
                      }}
                    >
                      🛠 Nightly debug APK (CI)
                    </a>
                  )}
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div
                style={{
                  display: 'inline-block',
                  fontSize: '64px',
                  marginBottom: '16px',
                }}
              >
                ⏳
              </div>
              <h2 style={{ fontFamily: titleFont, fontSize: '36px', fontWeight: 900, color: C.white, margin: '0 0 16px', lineHeight: 1.1 }}>
                {lang === 'fr'
                  ? 'Bientôt disponible'
                  : lang === 'en'
                  ? 'Coming soon'
                  : 'قريباً'}
              </h2>
              <p style={{ fontSize: '17px', lineHeight: 1.6, color: 'rgba(248,250,252,0.85)', maxWidth: '600px', margin: '0 auto 32px' }}>
                {lang === 'fr'
                  ? `${game.name} est en cours de développement. La sortie est prévue dans les semaines à venir, après Solitaire qui est déjà disponible.`
                  : lang === 'en'
                  ? `${game.name} is under development. Release planned in the coming weeks, after Solitaire which is already live.`
                  : `${game.name} قيد التطوير. الإصدار مخطط له في الأسابيع المقبلة، بعد السوليتير المتوفر بالفعل.`}
              </p>
              <Link
                href="/download/solitaire"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px 28px',
                  borderRadius: '12px',
                  background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`,
                  color: C.navyDeep,
                  fontSize: '14px',
                  fontWeight: 800,
                  textDecoration: 'none',
                  boxShadow: '0 8px 24px rgba(252,211,77,0.4)',
                }}
              >
                ⬇ {lang === 'fr' ? 'Essayer Solitaire en attendant' : lang === 'en' ? 'Try Solitaire while waiting' : 'جرب السوليتير في انتظار'}
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* RULES SECTION (trilingual content rendered in current lang) */}
      <section
        className="gd-section"
        style={{
          padding: '120px 80px',
          background: C.blueRoyal,
        }}
      >
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <p style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.gold, margin: '0 0 12px' }}>
            ♟ {lang === 'fr' ? 'Règles du jeu' : lang === 'en' ? 'Game rules' : 'قواعد اللعبة'}
          </p>
          <h2 style={{ fontFamily: titleFont, fontSize: '48px', fontWeight: 900, color: C.white, margin: '0 0 40px', lineHeight: 1.1 }}>
            {lang === 'fr' ? 'Comment jouer à ' : lang === 'en' ? 'How to play ' : 'كيف تلعب '}
            <span style={{ color: C.gold, fontStyle: 'italic' }}>{game.name}</span>
            {lang === 'fr' ? ' ?' : lang === 'en' ? '' : '؟'}
          </h2>

          <div
            style={{
              padding: '40px',
              background: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px',
            }}
          >
            <p
              style={{
                fontSize: '17px',
                lineHeight: 1.85,
                color: 'rgba(248,250,252,0.92)',
                margin: 0,
                whiteSpace: 'pre-wrap',
              }}
            >
              {game.rules[lang]}
            </p>
          </div>

          <p
            style={{
              marginTop: '32px',
              padding: '16px 20px',
              background: 'rgba(252,211,77,0.1)',
              border: `1px solid ${C.gold}40`,
              borderRadius: '12px',
              fontSize: '13px',
              lineHeight: 1.6,
              color: C.gold,
              fontWeight: 600,
            }}
          >
            🌐 {lang === 'fr'
              ? 'Règles disponibles en français, anglais et arabe — utilisez le sélecteur de langue en haut.'
              : lang === 'en'
              ? 'Rules available in French, English and Arabic — use the language picker at the top.'
              : 'القواعد متاحة بالفرنسية، الإنجليزية والعربية — استخدم محدد اللغة في الأعلى.'}
          </p>
        </div>
      </section>

      {/* OTHER GAMES */}
      <section
        className="gd-section"
        style={{
          padding: '100px 80px 120px',
          background: `linear-gradient(180deg, ${C.blueRoyal} 0%, ${C.bluePrimary} 100%)`,
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: titleFont, fontSize: '40px', fontWeight: 900, color: C.white, margin: '0 0 40px', textAlign: 'center', lineHeight: 1.1 }}>
            {lang === 'fr' ? 'Découvrez les 10 autres jeux' : lang === 'en' ? 'Discover the 10 other games' : 'اكتشف الألعاب الـ 10 الأخرى'}
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
            }}
          >
            {GAMES.filter((g) => g.slug !== game.slug).map((g) => (
              <Link
                key={g.slug}
                href={`/download/${g.slug}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px 18px',
                  background: 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: `1px solid ${g.available ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '14px',
                  textDecoration: 'none',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, background: g.gradient }}>
                  <Image src={g.iconSrc} alt={g.name} width={40} height={40} style={{ width: '100%', height: '100%' }} unoptimized />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: C.white, lineHeight: 1.2 }}>{g.name}</p>
                  <p
                    style={{
                      margin: '4px 0 0',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: g.available ? C.green : C.orange,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {g.available ? t('common.available') : t('common.soon')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
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
            <a
              href="https://salistar.com/#monitoring"
              style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}
            >
              {t('footer.supportStatus')}
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
