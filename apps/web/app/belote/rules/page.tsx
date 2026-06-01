/**
 * @file apps/web/app/belote/rules/page.tsx
 * @description Page web "Regles de la Belote" — porte la version mobile
 * (7 variantes, chips horizontaux, sections accordion, 5 langues).
 * Cohabite avec rules.tsx mobile via le SAME data file `../lib/variants`.
 */
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { VARIANTS, type VariantId, type Lang } from '../lib/variants';

const C = {
  navy:    '#0A1535',
  blue:    '#2563EB',
  gold:    '#FCD34D',
  white:   '#F8FAFC',
  card:    '#152A47',
  border:  'rgba(255,255,255,0.08)',
  text2:   '#CBD5E1',
};

const SECTIONS: Array<{
  key: 'overview' | 'bidding' | 'scoring' | 'bonuses' | 'endgame';
  icon: string;
  title: Record<Lang, string>;
}> = [
  { key: 'overview', icon: 'ℹ️', title: { fr: 'Présentation', en: 'Overview', ar: 'مقدمة', es: 'Presentación', darija: 'تقديم' } },
  { key: 'bidding',  icon: '🎯', title: { fr: 'Enchères', en: 'Bidding', ar: 'المزايدات', es: 'Apuestas', darija: 'المزايدات' } },
  { key: 'scoring',  icon: '🧮', title: { fr: 'Valeur des cartes', en: 'Card values', ar: 'قيم الأوراق', es: 'Valor de cartas', darija: 'قيمة الأوراق' } },
  { key: 'bonuses',  icon: '⭐', title: { fr: 'Primes & annonces', en: 'Bonuses & sequences', ar: 'المكافآت', es: 'Primas y secuencias', darija: 'البونوسات' } },
  { key: 'endgame',  icon: '🏆', title: { fr: 'Fin de partie', en: 'End of game', ar: 'نهاية اللعبة', es: 'Fin de partida', darija: 'نهاية اللعبة' } },
];

export default function BeloteRulesPage() {
  const { i18n } = useTranslation();
  const lang: Lang = useMemo(() => {
    const raw = (i18n.language || 'fr').toLowerCase();
    if (raw.startsWith('en')) return 'en';
    if (raw.startsWith('ar')) return 'ar';
    if (raw.startsWith('es')) return 'es';
    if (raw === 'ma' || raw === 'darija') return 'darija';
    return 'fr';
  }, [i18n.language]);
  const isRtl = lang === 'ar';

  const [variantId, setVariantId] = useState<VariantId>('classique');
  const [openSec, setOpenSec] = useState<string | null>('overview');
  const variant = VARIANTS.find((v) => v.id === variantId) || VARIANTS[0];

  return (
    <main
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{ minHeight: '100vh', background: C.navy, color: C.white, fontFamily: 'Inter, sans-serif' }}
    >
      <header style={{ padding: '24px 80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}` }}>
        <Link href="/belote" style={{ color: C.white, textDecoration: 'none', fontWeight: 700, fontSize: 16 }}>
          ← Belote
        </Link>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>
          {lang === 'fr' ? 'Règles de la Belote'
           : lang === 'en' ? 'Belote Rules'
           : lang === 'ar' ? 'قواعد البلوت'
           : lang === 'es' ? 'Reglas de la Belote'
           : 'قواعد البلوت'}
        </h1>
        <span />
      </header>

      <div style={{ maxWidth: 980, margin: '0 auto', padding: '24px 24px 80px' }}>
        {/* Variant chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 22 }}>
          {VARIANTS.map((v) => {
            const active = v.id === variantId;
            return (
              <button
                key={v.id}
                onClick={() => setVariantId(v.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 16px', borderRadius: 999,
                  background: active ? C.blue : C.card,
                  color: active ? C.white : C.text2,
                  border: `1px solid ${active ? '#60A5FA' : C.border}`,
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ fontSize: 18 }}>{v.emoji}</span>
                {v.i18n.name[lang]}
              </button>
            );
          })}
        </div>

        {/* Hero card */}
        <div
          style={{
            background: `linear-gradient(135deg, ${C.blue}, #1E3A8A)`,
            borderRadius: 20, padding: 24,
            border: `1px solid ${C.border}`,
            marginBottom: 22,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 900 }}>
            {variant.emoji}&nbsp;&nbsp;{variant.i18n.name[lang]}
          </h2>
          <p style={{ marginTop: 8, marginBottom: 24, color: 'rgba(255,255,255,0.88)', fontSize: 15 }}>
            {variant.i18n.tagline[lang]}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <Meta label={lang === 'fr' ? 'Joueurs' : 'Players'} value={variant.players.join(' / ')} />
            <Meta label={lang === 'fr' ? 'Cartes' : 'Cards'} value={String(variant.deckSize)} />
            <Meta label={lang === 'fr' ? 'But' : 'Target'} value={`${variant.target} pts`} />
          </div>
        </div>

        {/* Accordion sections */}
        {SECTIONS.map((sec) => {
          const open = openSec === sec.key;
          return (
            <div
              key={sec.key}
              style={{ background: C.card, borderRadius: 14, marginBottom: 10, overflow: 'hidden' }}
            >
              <button
                onClick={() => setOpenSec(open ? null : sec.key)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: 18, border: 'none', background: 'transparent',
                  color: C.white, cursor: 'pointer', textAlign: isRtl ? 'right' : 'left',
                }}
              >
                <span style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'rgba(252,211,77,0.15)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                }}>{sec.icon}</span>
                <span style={{ flex: 1, fontWeight: 800, fontSize: 15 }}>{sec.title[lang]}</span>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>{open ? '▲' : '▼'}</span>
              </button>
              {open && (
                <div style={{ padding: '0 18px 18px', color: C.text2, fontSize: 14, lineHeight: 1.65 }}>
                  {variant.i18n[sec.key][lang]}
                </div>
              )}
            </div>
          );
        })}

        {/* Hkim banner (Moroccan only) */}
        {variant.id === 'belote-marocaine' && (
          <div
            style={{
              marginTop: 18, padding: 16, borderRadius: 14,
              background: 'rgba(16,185,129,0.10)',
              border: '1px solid rgba(16,185,129,0.35)',
              display: 'flex', gap: 14, alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 28 }}>⚽</span>
            <div>
              <h3 style={{ margin: 0, color: '#10B981', fontSize: 15, fontWeight: 900 }}>
                {lang === 'fr' ? 'Hkim — challenge sportif'
                 : lang === 'en' ? 'Hkim — sport challenge'
                 : lang === 'ar' ? 'الحكم — تحدي رياضي'
                 : lang === 'es' ? 'Hkim — reto deportivo'
                 : 'الحكم — تحدي رياضي'}
              </h3>
              <p style={{ margin: '6px 0 0', color: C.text2, fontSize: 13, lineHeight: 1.5 }}>
                {lang === 'fr' ? "À la fin de la partie, le gagnant trace un parcours sur la carte. Le perdant doit le faire à pied ou en courant, puis partager sur les réseaux."
                 : lang === 'en' ? 'At the end of the game, the winner draws a route on the map. The loser must walk/run it and share on socials.'
                 : lang === 'ar' ? 'في نهاية اللعبة، الفائز يرسم مساراً على الخريطة. الخاسر يجب أن يمشيه ويشاركه على وسائل التواصل.'
                 : lang === 'es' ? 'Al final de la partida, el ganador dibuja una ruta en el mapa. El perdedor debe recorrerla y compartirla en redes.'
                 : 'فلخر اللعبة، الرابح كيرسم طريق فالخريطة. الخاسر خاصو يمشيها ويشيرها فالشبكات.'}
              </p>
            </div>
          </div>
        )}

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 24 }}>
          {lang === 'fr' ? 'Sources : FFB · Wikipedia · Éditions Pole'
           : lang === 'en' ? 'Sources: FFB · Wikipedia · Pole Editions'
           : 'المصادر: FFB · ويكيبيديا'}
        </p>
      </div>
    </main>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      background: 'rgba(0,0,0,0.25)', borderRadius: 12,
      padding: '12px 14px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)' }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 900, color: '#FCD34D', marginTop: 4 }}>{value}</div>
    </div>
  );
}
