'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import GameCard from './components/GameCard';
import CardFan from './components/CardFan';
import GameDetailModal from './components/GameDetailModal';
import ScrollReveal from './components/ScrollReveal';
import LanguageSwitcher from './components/LanguageSwitcher';
import { GAMES, FEATURES, type GameInfo } from './data/games';

function AnimatedCounter({ target, suffix = '' }: { target: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  const numericTarget = parseInt(target.replace(/[^0-9]/g, ''), 10);
  const isPercent = target.includes('%');
  const hasPlus = target.includes('+');

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const duration = 1500;
    const steps = 40;
    const increment = numericTarget / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= numericTarget) {
        setCount(numericTarget);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [started, numericTarget]);

  return (
    <span ref={ref}>
      {count}{isPercent ? '%' : ''}{hasPlus ? '+' : ''}{suffix}
    </span>
  );
}

export default function HomePage() {
  const { t } = useTranslation();
  const [selectedGame, setSelectedGame] = useState<GameInfo | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    { q: t('faq.q1'), a: t('faq.a1') },
    { q: t('faq.q2'), a: t('faq.a2') },
    { q: t('faq.q3'), a: t('faq.a3') },
    { q: t('faq.q4'), a: t('faq.a4') },
    { q: t('faq.q5'), a: t('faq.a5') },
    { q: t('faq.q6'), a: t('faq.a6') },
  ];

  return (
    <main style={{ minHeight: '100vh', width: '100%', overflowX: 'hidden', backgroundColor: '#ffffff' }}>

      {/* ===== NAVBAR ===== */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        backgroundColor: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid #e5e7eb',
      }}>
        <div style={{
          maxWidth: '1536px',
          margin: '0 auto',
          padding: '0 40px',
          height: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #10b981, #059669)',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <path d="M12 8v8M8 12h8" />
              </svg>
            </div>
            <span style={{ fontSize: '22px', fontWeight: 900, color: '#111827', letterSpacing: '-0.03em' }}>
              Sally<span style={{ color: '#10b981' }}>Cards</span>
            </span>
          </Link>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '40px',
            fontSize: '13px',
            fontWeight: 700,
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
          }}>
            <a href="#games" style={{ color: 'inherit', textDecoration: 'none' }}>{t('nav.games')}</a>
            <a href="#features" style={{ color: 'inherit', textDecoration: 'none' }}>{t('nav.features')}</a>
            <a href="#how" style={{ color: 'inherit', textDecoration: 'none' }}>{t('nav.help')}</a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <LanguageSwitcher variant="light" />
            <Link href="/auth/login" style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 700,
              color: '#6b7280',
              textDecoration: 'none',
            }}>
              {t('nav.login')}
            </Link>
            <Link href="/auth/register" style={{
              padding: '14px 28px',
              fontSize: '14px',
              fontWeight: 900,
              borderRadius: '12px',
              color: '#ffffff',
              backgroundColor: '#10b981',
              textDecoration: 'none',
              boxShadow: '0 8px 32px rgba(16,185,129,0.3)',
            }}>
              {t('nav.join')}
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: '160px',
        paddingBottom: '80px',
        paddingLeft: '24px',
        paddingRight: '24px',
        overflow: 'hidden',
        background: 'linear-gradient(to bottom right, #eff6ff, #ffffff, #ecfdf5)',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '1536px',
          margin: '0 auto',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '0 40px',
        }}>
          {/* Beta badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '32px',
            padding: '8px 20px',
            borderRadius: '9999px',
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
          }}>
            <span style={{ position: 'relative', display: 'flex', height: '8px', width: '8px' }}>
              <span style={{
                position: 'absolute',
                display: 'inline-flex',
                height: '100%',
                width: '100%',
                borderRadius: '9999px',
                backgroundColor: '#34d399',
                opacity: 0.75,
                animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
              }} />
              <span style={{
                position: 'relative',
                display: 'inline-flex',
                borderRadius: '9999px',
                height: '8px',
                width: '8px',
                backgroundColor: '#10b981',
              }} />
            </span>
            <span style={{
              fontSize: '12px',
              fontWeight: 900,
              color: '#059669',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}>
              {t('hero.badge')}
            </span>
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: '64px',
            fontWeight: 900,
            color: '#111827',
            lineHeight: 0.95,
            letterSpacing: '-0.03em',
            marginBottom: '24px',
            marginTop: 0,
          }}>
            {t('hero.title1')} <br />
            <span style={{
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              backgroundImage: 'linear-gradient(to right, #2563eb, #10b981)',
            }}>
              {t('hero.title2')}
            </span>
          </h1>

          {/* Arabic subtitle */}
          <p style={{
            fontSize: '28px',
            marginBottom: '40px',
            fontWeight: 700,
            color: 'rgba(16,185,129,0.5)',
            fontStyle: 'italic',
            fontFamily: "'Cairo', sans-serif",
            marginTop: 0,
          }}>
            🃏 جوي الكارطة فابور
          </p>

          {/* Description */}
          <p style={{
            fontSize: '20px',
            maxWidth: '640px',
            color: '#64748b',
            marginBottom: '56px',
            lineHeight: 1.7,
            fontWeight: 500,
            marginTop: 0,
          }}>
            {t('hero.subtitle')}
          </p>

          {/* CTA buttons */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '20px',
            justifyContent: 'center',
            marginBottom: '64px',
          }}>
            <Link href="/download" style={{
              padding: '20px 40px',
              borderRadius: '12px',
              backgroundColor: '#10b981',
              color: '#ffffff',
              fontWeight: 900,
              fontSize: '18px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              boxShadow: '0 16px 48px rgba(16,185,129,0.3)',
            }}>
              {t('hero.install')}
            </Link>
            <a href="#games" style={{
              padding: '20px 40px',
              borderRadius: '12px',
              backgroundColor: '#ffffff',
              border: '1px solid #d1d5db',
              color: '#374151',
              fontWeight: 700,
              fontSize: '18px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}>
              {t('hero.explore')}
            </a>
          </div>

          {/* Card Fan */}
          <CardFan />
        </div>
      </section>

      {/* ===== STATS SECTION ===== */}
      <ScrollReveal>
        <section style={{
          width: '100%',
          padding: '48px 0',
          background: 'linear-gradient(to right, #2563eb, #10b981)',
        }}>
          <div style={{
            maxWidth: '1536px',
            margin: '0 auto',
            padding: '0 40px',
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
            }}>
              {[{ v: '10+', l: t('stats.games') }, { v: '5', l: t('stats.languages') }, { v: '8', l: t('stats.bots') }, { v: '100%', l: t('stats.free') }].map((s, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                }}>
                  <div style={{
                    fontSize: '48px',
                    fontWeight: 900,
                    color: '#ffffff',
                    marginBottom: '8px',
                    letterSpacing: '-0.03em',
                  }}>
                    <AnimatedCounter target={s.v} />
                  </div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.8)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                  }}>
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ===== GAMES GRID SECTION ===== */}
      <section id="games" style={{
        width: '100%',
        padding: '80px 0',
        backgroundColor: '#ffffff',
      }}>
        <div style={{
          maxWidth: '1536px',
          margin: '0 auto',
          padding: '0 40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <ScrollReveal>
            <div style={{ textAlign: 'center', marginBottom: '80px' }}>
              <h2 style={{
                fontSize: '40px',
                fontWeight: 900,
                color: '#111827',
                marginBottom: '24px',
                letterSpacing: '-0.03em',
                marginTop: 0,
              }}>
                {t('games.title')}
              </h2>
              <p style={{
                fontSize: '18px',
                color: '#6b7280',
                fontWeight: 500,
                maxWidth: '640px',
                margin: '0 auto 24px auto',
                lineHeight: 1.7,
              }}>
                {t('games.subtitle')}
              </p>
              <div style={{
                height: '6px',
                width: '96px',
                backgroundColor: '#10b981',
                margin: '0 auto',
                borderRadius: '9999px',
              }} />
            </div>
          </ScrollReveal>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '24px',
            width: '100%',
          }}>
            {GAMES.map((g, i) => (
              <ScrollReveal key={g.name} delay={i * 60}>
                <GameCard
                  name={g.name}
                  icon={g.icon}
                  players={g.players}
                  description={g.desc}
                  color={g.color}
                  deck={g.deck}
                  sampleCard={g.sampleCards[0]}
                  onClick={() => setSelectedGame(g)}
                />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section id="features" style={{
        width: '100%',
        padding: '80px 0',
        backgroundColor: '#f8fafc',
      }}>
        <div style={{
          maxWidth: '1536px',
          margin: '0 auto',
          padding: '0 40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <ScrollReveal>
            <div style={{ textAlign: 'center', marginBottom: '80px' }}>
              <h2 style={{
                fontSize: '40px',
                fontWeight: 900,
                color: '#111827',
                marginBottom: '24px',
                letterSpacing: '-0.03em',
                marginTop: 0,
              }}>
                {t('features.title')}
              </h2>
              <p style={{
                fontSize: '18px',
                color: '#6b7280',
                fontWeight: 500,
                maxWidth: '640px',
                margin: '0 auto',
                lineHeight: 1.7,
              }}>
                {t('features.subtitle')}
              </p>
            </div>
          </ScrollReveal>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '32px',
            width: '100%',
          }}>
            {FEATURES.map((f, i) => (
              <ScrollReveal key={f.title} delay={i * 80}>
                <div style={{
                  padding: '40px',
                  borderRadius: '24px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  height: '100%',
                }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '24px',
                    backgroundColor: '#ecfdf5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '36px',
                    marginBottom: '32px',
                  }}>
                    {f.icon}
                  </div>
                  <h3 style={{
                    fontSize: '24px',
                    fontWeight: 900,
                    color: '#111827',
                    marginBottom: '16px',
                    marginTop: 0,
                  }}>
                    {f.title}
                  </h3>
                  <p style={{
                    color: '#6b7280',
                    lineHeight: 1.7,
                    fontWeight: 500,
                    margin: 0,
                  }}>
                    {f.desc}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW TO PLAY SECTION ===== */}
      <ScrollReveal>
        <section id="how" style={{
          width: '100%',
          padding: '80px 0',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(to bottom right, #059669, #2563eb)',
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '384px',
            height: '384px',
            backgroundColor: '#ffffff',
            borderRadius: '9999px',
            filter: 'blur(120px)',
            marginRight: '-192px',
            marginTop: '-192px',
            opacity: 0.1,
          }} />

          <div style={{
            maxWidth: '1536px',
            margin: '0 auto',
            padding: '0 40px',
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <h2 style={{
              fontSize: '40px',
              fontWeight: 900,
              color: '#ffffff',
              marginBottom: '80px',
              textAlign: 'center',
              letterSpacing: '-0.03em',
              marginTop: 0,
            }}>
              {t('how.title')}
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '64px',
              width: '100%',
            }}>
              {[
                { s: '01', icon: '📲', t: 'Installer', d: 'Telechargez SallyCards sur votre store prefere.' },
                { s: '02', icon: '👤', t: 'Profil', d: 'Choisissez votre avatar et votre pseudo unique.' },
                { s: '03', icon: '🎲', t: 'Lancer', d: 'Rejoignez une table publique ou privee.' },
              ].map((step) => (
                <div key={step.s} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  color: '#ffffff',
                }}>
                  <div style={{
                    width: '96px',
                    height: '96px',
                    borderRadius: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '36px',
                    marginBottom: '32px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    transform: 'rotate(3deg)',
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
                  }}>
                    {step.icon}
                  </div>
                  <h3 style={{
                    fontSize: '24px',
                    fontWeight: 900,
                    marginBottom: '12px',
                    marginTop: 0,
                  }}>
                    {step.t}
                  </h3>
                  <p style={{
                    color: 'rgba(255,255,255,0.8)',
                    lineHeight: 1.7,
                    fontWeight: 500,
                    margin: 0,
                  }}>
                    {step.d}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ===== TESTIMONIALS SECTION ===== */}
      <ScrollReveal>
        <section style={{
          width: '100%',
          padding: '80px 0',
          backgroundColor: '#f8fafc',
        }}>
          <div style={{
            maxWidth: '1536px',
            margin: '0 auto',
            padding: '0 40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '80px' }}>
              <h2 style={{
                fontSize: '40px',
                fontWeight: 900,
                color: '#111827',
                marginBottom: '24px',
                letterSpacing: '-0.03em',
                marginTop: 0,
              }}>
                {t('testimonials.title')}
              </h2>
              <p style={{
                fontSize: '18px',
                color: '#6b7280',
                fontWeight: 500,
                maxWidth: '640px',
                margin: '0 auto',
                lineHeight: 1.7,
              }}>
                Des joueurs passionnes partagent leur experience.
              </p>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '32px',
              width: '100%',
            }}>
              {[
                { avatar: '👨‍💻', quote: "La meilleure app pour jouer a la Ronda avec mes amis, meme a distance. L'interface est super fluide !", name: 'Youssef M.', game: 'Joueur de Ronda' },
                { avatar: '👩‍🎨', quote: "Enfin une application qui propose la Kdoub et la Belote dans la meme app. Je recommande a 100% !", name: 'Amina K.', game: 'Joueuse de Belote' },
                { avatar: '🧑‍🔬', quote: "Les bots IA sont impressionnants. Je m'entraine chaque jour avant de jouer en ligne. Genial !", name: 'Rachid B.', game: 'Joueur de Poker' },
              ].map((t, i) => (
                <ScrollReveal key={i} delay={i * 100}>
                  <div style={{
                    padding: '32px',
                    borderRadius: '24px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                  }}>
                    <div style={{ fontSize: '36px', marginBottom: '24px' }}>{t.avatar}</div>
                    <p style={{
                      color: '#6b7280',
                      lineHeight: 1.7,
                      fontWeight: 500,
                      flex: 1,
                      marginBottom: '24px',
                      marginTop: 0,
                    }}>
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '16px' }}>
                      <p style={{ fontWeight: 900, color: '#111827', margin: 0 }}>{t.name}</p>
                      <p style={{ fontSize: '14px', color: '#10b981', fontWeight: 600, margin: '4px 0 0 0' }}>{t.game}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ===== FAQ SECTION ===== */}
      <ScrollReveal>
        <section style={{
          width: '100%',
          padding: '80px 0',
          backgroundColor: '#ffffff',
        }}>
          <div style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '0 40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '80px' }}>
              <h2 style={{
                fontSize: '40px',
                fontWeight: 900,
                color: '#111827',
                marginBottom: '24px',
                letterSpacing: '-0.03em',
                marginTop: 0,
              }}>
                {t('faq.title')}
              </h2>
              <p style={{
                fontSize: '18px',
                color: '#6b7280',
                fontWeight: 500,
                maxWidth: '640px',
                margin: '0 auto',
                lineHeight: 1.7,
              }}>
                {t('faq.subtitle')}
              </p>
            </div>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {faqs.map((faq, i) => (
                <div key={i} style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '16px',
                  overflow: 'hidden',
                }}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '24px 32px',
                      textAlign: 'left',
                      backgroundColor: '#ffffff',
                      border: 'none',
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  >
                    <span style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>{faq.q}</span>
                    <span
                      style={{
                        fontSize: '24px',
                        color: '#9ca3af',
                        transition: 'transform 0.3s ease',
                        flexShrink: 0,
                        marginLeft: '16px',
                        transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0deg)',
                      }}
                    >
                      +
                    </span>
                  </button>
                  <div style={{
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease, opacity 0.3s ease',
                    maxHeight: openFaq === i ? '200px' : '0px',
                    opacity: openFaq === i ? 1 : 0,
                  }}>
                    <p style={{
                      padding: '0 32px 24px 32px',
                      color: '#6b7280',
                      lineHeight: 1.7,
                      fontWeight: 500,
                      margin: 0,
                    }}>
                      {faq.a}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ===== CTA FINAL SECTION ===== */}
      <ScrollReveal>
        <section style={{
          width: '100%',
          padding: '80px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
        }}>
          <div style={{
            maxWidth: '1024px',
            width: '100%',
            padding: '80px',
            borderRadius: '24px',
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
          }}>
            <h2 style={{
              fontSize: '48px',
              fontWeight: 900,
              color: '#111827',
              marginBottom: '32px',
              position: 'relative',
              zIndex: 10,
              letterSpacing: '-0.03em',
              marginTop: 0,
            }}>
              {t('cta.title')}
            </h2>
            <p style={{
              color: '#6b7280',
              marginBottom: '48px',
              fontSize: '20px',
              fontWeight: 500,
              position: 'relative',
              zIndex: 10,
              lineHeight: 1.7,
              marginTop: 0,
            }}>
              {t('cta.subtitle')}
            </p>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '24px',
              position: 'relative',
              zIndex: 10,
            }}>
              <a href="#" style={{
                backgroundColor: '#10b981',
                color: '#ffffff',
                padding: '20px 40px',
                borderRadius: '12px',
                fontWeight: 900,
                fontSize: '18px',
                textDecoration: 'none',
                boxShadow: '0 16px 48px rgba(16,185,129,0.3)',
              }}>
                APP STORE
              </a>
              <a href="#" style={{
                background: 'linear-gradient(to right, #2563eb, #3b82f6)',
                color: '#ffffff',
                padding: '20px 40px',
                borderRadius: '12px',
                fontWeight: 900,
                fontSize: '18px',
                textDecoration: 'none',
                boxShadow: '0 16px 48px rgba(37,99,235,0.3)',
              }}>
                GOOGLE PLAY
              </a>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ===== FOOTER SECTION ===== */}
      <footer style={{
        width: '100%',
        padding: '64px 0',
        backgroundColor: '#111827',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <div style={{
          maxWidth: '1536px',
          margin: '0 auto',
          padding: '0 40px',
          width: '100%',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '64px',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '24px',
                fontWeight: 900,
                fontSize: '24px',
                color: '#34d399',
              }}>
                <span style={{ fontSize: '30px' }}>🃏</span> SallyCards
              </div>
              <p style={{
                color: '#9ca3af',
                fontWeight: 500,
                lineHeight: 1.7,
                margin: 0,
              }}>
                {t('footer.desc')}
              </p>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                marginTop: '12px',
                marginBottom: 0,
              }}>
                salistarcompany@gmail.com
              </p>
            </div>
            {[
              { title: 'Jeux', links: ['Ronda', 'Kdoub', 'Belote', 'Poker', 'Tarot'] },
              { title: 'Plateforme', links: ['iOS', 'Android', 'API', 'Admin'] },
              { title: 'Legal', links: ['Confidentialite', 'CGU', 'Contact'] },
            ].map((col) => (
              <div key={col.title} style={{ display: 'flex', flexDirection: 'column' }}>
                <h4 style={{
                  fontWeight: 900,
                  color: '#ffffff',
                  marginBottom: '32px',
                  marginTop: 0,
                  textTransform: 'uppercase',
                  fontSize: '12px',
                  letterSpacing: '0.3em',
                }}>
                  {col.title}
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {col.links.map((l) => (
                    <li key={l}>
                      <a href="#" style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#9ca3af',
                        textDecoration: 'none',
                      }}>
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{
            marginTop: '96px',
            paddingTop: '48px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            textAlign: 'center',
            fontSize: '12px',
            fontWeight: 900,
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
          }}>
            &copy; 2026 SallyCards by SallyStar
          </div>
        </div>
      </footer>

      {/* ===== GAME DETAIL MODAL ===== */}
      <GameDetailModal game={selectedGame} onClose={() => setSelectedGame(null)} />
    </main>
  );
}
