import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import fr from './locales/fr.json';
import en from './locales/en.json';
import ar from './locales/ar.json';

export type WebLocale = 'fr' | 'en' | 'ar';

export const LANGUAGES: { code: WebLocale; label: string; flag: string; dir: 'ltr' | 'rtl' }[] = [
  { code: 'fr', label: 'Francais', flag: '🇫🇷', dir: 'ltr' },
  { code: 'en', label: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦', dir: 'rtl' },
];

function getSavedLocale(): WebLocale {
  if (typeof window === 'undefined') return 'fr';
  const saved = localStorage.getItem('lang');
  if (saved && ['fr', 'en', 'ar'].includes(saved)) return saved as WebLocale;
  const browser = navigator.language?.split('-')[0];
  if (browser && ['fr', 'en', 'ar'].includes(browser)) return browser as WebLocale;
  return 'fr';
}

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: typeof window !== 'undefined' ? getSavedLocale() : 'fr',
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export function changeWebLanguage(locale: WebLocale) {
  i18n.changeLanguage(locale);
  if (typeof window !== 'undefined') {
    localStorage.setItem('lang', locale);
    const dir = LANGUAGES.find(l => l.code === locale)?.dir || 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = locale;
  }
}

export default i18n;
