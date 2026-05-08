/**
 * @file i18n.ts
 * @description Traductions inline pour la page Solitaire (5 langues).
 *
 * Pas de framework lourd : juste un dict + hook `useT(locale)`. Les locales
 * mobiles existent mais on évite de réimporter ces gros JSON dans le bundle
 * web — on duplique seulement les chaînes utilisées sur cette page.
 */

export type Locale = 'en' | 'fr' | 'es' | 'ar' | 'darija';

export const LOCALES: { code: Locale; flag: string; native: string }[] = [
  { code: 'fr', flag: '🇫🇷', native: 'Français' },
  { code: 'en', flag: '🇬🇧', native: 'English' },
  { code: 'es', flag: '🇪🇸', native: 'Español' },
  { code: 'ar', flag: '🇸🇦', native: 'العربية' },
  { code: 'darija', flag: '🇲🇦', native: 'الدارجة' },
];

type Dict = Record<string, string>;

const FR: Dict = {
  'hero.title': 'SallyCards Solitaire',
  'hero.subtitle': '13 variantes, des deals 100% solubles, un solveur AI.',
  'hero.signedIn': 'Connecté en tant que',
  'hero.logout': 'Déconnexion',
  'stats.seedsInDb': 'Seeds en BD',
  'stats.withSolution': 'Avec solution',
  'stats.variants': 'Variantes',
  'stats.loading': 'Loading',
  'variants.title': 'Variantes disponibles',
  'variants.deals': 'deals',
  'variants.coverage': 'sol.',
  'quick.title': 'Quick Match 1v1',
  'quick.intro': 'Crée une partie pour la variante {{v}}. Récupère le code et entre-le dans l\'app mobile pour jouer en duel.',
  'quick.create': 'Créer une partie',
  'quick.creating': 'Création…',
  'quick.code': 'Code de partie :',
  'quick.codeHint': "Ouvre l'app mobile, va dans Settings → Quick Match 1v1, clique \"Rejoindre par code\".",
  'quick.streamActive': '⚡ Stream SSE actif (latence < 100ms)',
  'quick.status': 'Status',
  'cta.download': 'Pour jouer aux 13 variantes en mode solo, télécharge l\'app mobile :',
  'cta.stores': '📱 App Store / Play Store',
};

const EN: Dict = {
  'hero.title': 'SallyCards Solitaire',
  'hero.subtitle': '13 variants, 100% solvable deals, an AI solver.',
  'hero.signedIn': 'Signed in as',
  'hero.logout': 'Sign out',
  'stats.seedsInDb': 'Seeds in DB',
  'stats.withSolution': 'With solution',
  'stats.variants': 'Variants',
  'stats.loading': 'Loading',
  'variants.title': 'Available variants',
  'variants.deals': 'deals',
  'variants.coverage': 'sol.',
  'quick.title': 'Quick Match 1v1',
  'quick.intro': 'Create a match for variant {{v}}. Grab the code and enter it in the mobile app to play.',
  'quick.create': 'Create a match',
  'quick.creating': 'Creating…',
  'quick.code': 'Match code:',
  'quick.codeHint': 'Open the mobile app, go to Settings → Quick Match 1v1, tap "Join by code".',
  'quick.streamActive': '⚡ SSE stream active (latency < 100ms)',
  'quick.status': 'Status',
  'cta.download': 'To play all 13 variants in solo mode, download the mobile app:',
  'cta.stores': '📱 App Store / Play Store',
};

const ES: Dict = {
  'hero.title': 'SallyCards Solitaire',
  'hero.subtitle': '13 variantes, juegos 100% resolubles, un solucionador IA.',
  'hero.signedIn': 'Conectado como',
  'hero.logout': 'Salir',
  'stats.seedsInDb': 'Seeds en BD',
  'stats.withSolution': 'Con solución',
  'stats.variants': 'Variantes',
  'stats.loading': 'Cargando',
  'variants.title': 'Variantes disponibles',
  'variants.deals': 'partidas',
  'variants.coverage': 'sol.',
  'quick.title': 'Partida 1v1',
  'quick.intro': 'Crea una partida para la variante {{v}}. Toma el código y entrarlo en la app móvil para jugar.',
  'quick.create': 'Crear partida',
  'quick.creating': 'Creando…',
  'quick.code': 'Código de partida:',
  'quick.codeHint': 'Abre la app móvil, ve a Ajustes → Quick Match 1v1, toca "Unirse por código".',
  'quick.streamActive': '⚡ Stream SSE activo (latencia < 100ms)',
  'quick.status': 'Estado',
  'cta.download': 'Para jugar las 13 variantes en modo solo, descarga la app móvil:',
  'cta.stores': '📱 App Store / Play Store',
};

const AR: Dict = {
  'hero.title': 'SallyCards Solitaire',
  'hero.subtitle': '13 إصدارة، توزيعات قابلة للحل بنسبة 100%، حلال ذكاء اصطناعي.',
  'hero.signedIn': 'متصل باسم',
  'hero.logout': 'تسجيل الخروج',
  'stats.seedsInDb': 'البذور في قاعدة البيانات',
  'stats.withSolution': 'مع حل',
  'stats.variants': 'الإصدارات',
  'stats.loading': 'جاري التحميل',
  'variants.title': 'الإصدارات المتاحة',
  'variants.deals': 'توزيعة',
  'variants.coverage': 'حل.',
  'quick.title': 'مباراة سريعة 1ضد1',
  'quick.intro': 'أنشئ مباراة للإصدار {{v}}. خذ الرمز وأدخله في تطبيق الجوال للعب.',
  'quick.create': 'إنشاء مباراة',
  'quick.creating': 'جاري الإنشاء…',
  'quick.code': 'رمز المباراة:',
  'quick.codeHint': 'افتح تطبيق الجوال، اذهب إلى الإعدادات → Quick Match 1v1، انقر "انضم بالرمز".',
  'quick.streamActive': '⚡ بث SSE نشط (زمن استجابة < 100ms)',
  'quick.status': 'الحالة',
  'cta.download': 'للعب جميع الإصدارات الـ 13 في وضع الفردي، نزل تطبيق الجوال:',
  'cta.stores': '📱 App Store / Play Store',
};

const DARIJA: Dict = {
  'hero.title': 'SallyCards Solitaire',
  'hero.subtitle': '13 نسخة ديال السوليتير، التوزيعات كاملة قابلين للحل، AI كيلعب بوحدو.',
  'hero.signedIn': 'مسجل دخول بـ',
  'hero.logout': 'الخروج',
  'stats.seedsInDb': 'التوزيعات فالـDB',
  'stats.withSolution': 'فيها حل',
  'stats.variants': 'النسخ',
  'stats.loading': 'كيتحمل',
  'variants.title': 'النسخ لي كاينين',
  'variants.deals': 'توزيعة',
  'variants.coverage': 'حل.',
  'quick.title': 'لعبة سريعة 1ضد1',
  'quick.intro': 'صاوب لعبة بالنسخة {{v}}. خد الكود ودخلو فالتطبيق ديال الموبايل باش تلعبو.',
  'quick.create': 'صاوب لعبة',
  'quick.creating': 'كيصاوب…',
  'quick.code': 'كود اللعبة:',
  'quick.codeHint': 'حل التطبيق ديال الموبايل، سير لـSettings → Quick Match 1v1، كليكي "Rejoindre par code".',
  'quick.streamActive': '⚡ Stream SSE نشيط (latency < 100ms)',
  'quick.status': 'الحالة',
  'cta.download': 'باش تلعب 13 نسخة فالـsolo، نزل التطبيق ديال الموبايل:',
  'cta.stores': '📱 App Store / Play Store',
};

const DICTS: Record<Locale, Dict> = { fr: FR, en: EN, es: ES, ar: AR, darija: DARIJA };

export function t(locale: Locale, key: string, params?: Record<string, string | number>): string {
  const d = DICTS[locale] ?? FR;
  let s = d[key] ?? FR[key] ?? key;
  if (params) {
    for (const k of Object.keys(params)) {
      s = s.replace(`{{${k}}}`, String(params[k]));
    }
  }
  return s;
}

export function isRtl(locale: Locale): boolean {
  return locale === 'ar' || locale === 'darija';
}
