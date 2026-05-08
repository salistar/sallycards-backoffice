// ─── i18next configuration & core ────────────────────────────────────────────
export { default as i18n, changeLanguage, isRTLLocale, RTL_LANGUAGES, LTR_LANGUAGES, LANGUAGE_META } from './lib/i18n.config';
export type { SupportedLocale } from './lib/i18n.config';

// ─── RTL Provider & hooks ────────────────────────────────────────────────────
export { RTLProvider, useRTL } from './lib/RTLProvider';
export type { RTLContextValue } from './lib/RTLProvider';

export { useDirection } from './lib/useDirection';
export type { DirectionInfo } from './lib/useDirection';

// ─── Arabic utilities ────────────────────────────────────────────────────────
export {
  toArabicNumerals,
  toLatinNumerals,
  formatScore,
  formatDuration,
  cardValueLabel,
  suitLabel,
  CARD_NAMES,
  SUIT_NAMES,
} from './lib/arabicUtils';

// ─── Card localization ───────────────────────────────────────────────────────
export {
  getCardName,
  getCardAccessibilityLabel,
  SPANISH_VALUES,
  SPANISH_SUITS,
  FRENCH_VALUES,
  FRENCH_SUITS,
} from './lib/cardLocalization';
export type { DeckType } from './lib/cardLocalization';

// ─── Language selector component ─────────────────────────────────────────────
export { LanguageSelector } from './lib/LanguageSelector';

// ─── Raw locale JSON (backward compat) ──────────────────────────────────────
import en from './lib/locales/en.json';
import fr from './lib/locales/fr.json';
import es from './lib/locales/es.json';
import ar from './lib/locales/ar.json';
import darija from './lib/locales/darija.json';

export type LocaleKey = keyof typeof en;

export const locales: Record<string, Record<LocaleKey, string>> = {
  en,
  fr,
  es,
  ar,
  darija,
};

export { en, fr, es, ar, darija };
