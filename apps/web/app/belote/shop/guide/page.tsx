/**
 * @file apps/web/app/belote/shop/guide/page.tsx
 * @description Web port du guide currencies mobile (apps/mobile/belote/app/shop/guide.tsx).
 * Affiche : 2 hero cards (coins/gems), utilisation de chaque currency,
 * 4 gift tiers. Tri-langue FR/EN/AR.
 */
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

type Lang = 'fr' | 'en' | 'ar';

const C = {
  navy:    '#0A1535',
  card:    '#152A47',
  gold:    '#FCD34D',
  pink:    '#EC4899',
  white:   '#F8FAFC',
  border:  'rgba(255,255,255,0.08)',
  text2:   '#CBD5E1',
};

interface Row { icon: string; label: Record<Lang, string>;
                priceCoins?: number; priceGems?: number; reward?: string }

const COINS: Row[] = [
  { icon: '🃏', label: { fr: 'Skin cartes',       en: 'Card skin',      ar: 'تصميم الأوراق' }, priceCoins: 500 },
  { icon: '🎨', label: { fr: 'Tapis de table',    en: 'Table felt',     ar: 'لون الطاولة' },   priceCoins: 800 },
  { icon: '⭐', label: { fr: 'Avatar premium',    en: 'Premium avatar', ar: 'صورة شخصية مميزة' }, priceCoins: 1000 },
  { icon: '✨', label: { fr: 'Effet de victoire', en: 'Win effect',     ar: 'تأثير الفوز' },   priceCoins: 1500 },
  { icon: '⚡', label: { fr: 'Reprise + indice',  en: 'Hint + undo',    ar: 'إعادة + تلميح' }, priceCoins: 100 },
  { icon: '🎁', label: { fr: 'Offrir à un ami',   en: 'Gift a friend',  ar: 'هدية لصديق' },    priceCoins: 250 },
  { icon: '💬', label: { fr: 'Sticker chat',      en: 'Chat sticker',   ar: 'ملصق للدردشة' },  priceCoins: 200 },
];

const GEMS: Row[] = [
  { icon: '💎', label: { fr: 'Pass VIP 30 jours',     en: 'VIP Pass 30 days',  ar: 'VIP لمدة ٣٠ يوماً' },   priceGems: 250 },
  { icon: '📈', label: { fr: 'Double XP 7 jours',     en: 'Double XP 7 days',  ar: 'XP مضاعف ٧ أيام' },     priceGems: 80 },
  { icon: '🛡️', label: { fr: 'Protection chute',      en: 'Loss shield',       ar: 'حماية من الخسارة' },    priceGems: 50 },
  { icon: '⏱️', label: { fr: 'Reprise de partie',     en: 'Match resume',      ar: 'استئناف اللعبة' },      priceGems: 30 },
  { icon: '🚀', label: { fr: 'Skip défi du jour',     en: 'Skip daily',        ar: 'تخطي تحدي اليوم' },     priceGems: 20 },
  { icon: '🔥', label: { fr: 'Conv. gems→coins (1=100)', en: 'Gems→coins (1=100)', ar: 'تحويل: ١ جوهرة = ١٠٠' }, priceGems: 1, reward: '100 🪙' },
];

const TIERS = [
  { tier: 'BRONZE',  coins:  100, gems:  0, label: { fr: 'Petit pourboire', en: 'Small tip',  ar: 'بقشيش صغير' }, color: '#CD7F32' },
  { tier: 'ARGENT',  coins:  500, gems:  5, label: { fr: 'Bravo !',          en: 'Bravo!',      ar: 'برافو!' },     color: '#C0C0C0' },
  { tier: 'OR',      coins: 1500, gems: 20, label: { fr: 'Champion',         en: 'Champion',    ar: 'بطل' },        color: '#FCD34D' },
  { tier: 'DIAMANT', coins: 5000, gems: 80, label: { fr: 'Légende',          en: 'Legend',      ar: 'أسطورة' },     color: '#B9F2FF' },
];

export default function BeloteShopGuide() {
  const { i18n } = useTranslation();
  const lang: Lang = useMemo(() => {
    const raw = (i18n.language || 'fr').toLowerCase();
    if (raw.startsWith('en')) return 'en';
    if (raw.startsWith('ar')) return 'ar';
    return 'fr';
  }, [i18n.language]);
  const isRtl = lang === 'ar';

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
          {lang === 'fr' ? 'Guide des récompenses' : lang === 'en' ? 'Rewards guide' : 'دليل المكافآت'}
        </h1>
        <span />
      </header>

      <div style={{ maxWidth: 880, margin: '0 auto', padding: '24px 24px 80px' }}>
        {/* COINS hero */}
        <HeroCard
          gradient="linear-gradient(135deg, #F59E0B, #D97706)"
          icon="🪙"
          title={lang === 'fr' ? 'Sally Coins' : 'Sally Coins'}
          sub={lang === 'fr' ? 'Gagnés en jouant. Servent à débloquer les cosmétiques.'
            : lang === 'en' ? 'Earned by playing. Spend on cosmetics.'
            : 'تكسبها باللعب. تستخدمها للتجميل.'}
        />
        <SectionLabel text={lang === 'fr' ? 'À quoi servent les Coins ?' : lang === 'en' ? 'What can Coins buy?' : 'ماذا تشتري بالعملات؟'} />
        {COINS.map((r, i) => <RowRender key={i} row={r} lang={lang} accent={C.gold} />)}

        {/* GEMS hero */}
        <div style={{ height: 24 }} />
        <HeroCard
          gradient={`linear-gradient(135deg, ${C.pink}, #BE185D)`}
          icon="💎"
          title={lang === 'fr' ? 'Sally Gemmes' : 'Sally Gems'}
          sub={lang === 'fr' ? 'Monnaie premium. Acheter ou gagner via le défi du jour 7/7.'
            : lang === 'en' ? 'Premium currency. Buy in shop or earn on the 7/7 daily streak.'
            : 'عملة مميزة. تشتريها أو تكسبها بـ ٧/٧ يومياً.'}
        />
        <SectionLabel text={lang === 'fr' ? 'À quoi servent les Gemmes ?' : lang === 'en' ? 'What can Gems do?' : 'ماذا تفعل الجواهر؟'} />
        {GEMS.map((r, i) => <RowRender key={i} row={r} lang={lang} accent={C.pink} />)}

        {/* GIFT TIERS */}
        <SectionLabel text={lang === 'fr' ? 'Cadeaux à offrir' : lang === 'en' ? 'Gifts you can send' : 'هدايا للإرسال'} />
        {TIERS.map((g, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: 14,
            background: C.card, borderRadius: 12, marginBottom: 8,
          }}>
            <span style={{
              padding: '4px 12px', borderRadius: 999,
              background: g.color, color: '#0A1535',
              fontSize: 10, fontWeight: 900, letterSpacing: 1,
            }}>{g.tier}</span>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 700 }}>{g.label[lang]}</span>
            <span style={{ color: C.gold, fontSize: 14, fontWeight: 900 }}>
              {g.coins > 0 ? `${g.coins} 🪙` : ''}{g.coins > 0 && g.gems > 0 ? '  +  ' : ''}{g.gems > 0 ? `${g.gems} 💎` : ''}
            </span>
          </div>
        ))}

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 24, lineHeight: 1.6 }}>
          {lang === 'fr' ? 'Les achats sont confirmés côté serveur. Ton solde se met à jour automatiquement après chaque partie.'
           : lang === 'en' ? 'Purchases are confirmed server-side. Your balance updates automatically after every game.'
           : 'تتم تأكيد المشتريات من جانب الخادم. يتم تحديث رصيدك بعد كل لعبة.'}
        </p>
      </div>
    </main>
  );
}

function HeroCard({ gradient, icon, title, sub }:
  { gradient: string; icon: string; title: string; sub: string }) {
  return (
    <div style={{ background: gradient, borderRadius: 18, padding: 22, display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{
        width: 64, height: 64, borderRadius: 32, background: 'rgba(255,255,255,0.22)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 30,
      }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#fff' }}>{title}</h2>
        <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.92)', fontSize: 13 }}>{sub}</p>
      </div>
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div style={{
      color: '#94A3B8', fontSize: 11, fontWeight: 800, letterSpacing: 1.2,
      textTransform: 'uppercase', marginTop: 18, marginBottom: 10,
    }}>{text}</div>
  );
}

function RowRender({ row, lang, accent }:
  { row: Row; lang: Lang; accent: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: 12,
      background: '#152A47', borderRadius: 12, marginBottom: 6,
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: accent + '22', color: accent,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18,
      }}>{row.icon}</div>
      <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: '#fff' }}>{row.label[lang]}</span>
      <span style={{ color: accent, fontSize: 13, fontWeight: 900 }}>
        {row.priceCoins ? `${row.priceCoins} 🪙` : `${row.priceGems} 💎`}
        {row.reward ? `  →  ${row.reward}` : ''}
      </span>
    </div>
  );
}
