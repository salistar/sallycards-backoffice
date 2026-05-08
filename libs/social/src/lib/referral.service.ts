// @sally/social - Referral System (Prompt #144)
// Generate referral codes, links, and shareable messages.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReferralInfo {
  code: string;
  userId: string;
  referredUsers: string[];
  totalRewards: number;
}

// ---------------------------------------------------------------------------
// Code generation
// ---------------------------------------------------------------------------

const ALPHANUMERIC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/1/O/0 confusion

/**
 * Generate a 6-character alphanumeric referral code seeded by userId.
 * Deterministic for the same userId so a user always gets the same code.
 */
export function generateReferralCode(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }

  let code = '';
  for (let i = 0; i < 6; i++) {
    code += ALPHANUMERIC[hash % ALPHANUMERIC.length];
    hash = (hash * 7 + 13) >>> 0;
  }
  return code;
}

// ---------------------------------------------------------------------------
// Link helpers
// ---------------------------------------------------------------------------

const BASE_URL = 'https://sallycards.com';

/** Create a referral deep-link. */
export function createReferralLink(code: string): string {
  return `${BASE_URL}/invite?ref=${code}`;
}

// ---------------------------------------------------------------------------
// Share messages
// ---------------------------------------------------------------------------

const MESSAGES: Record<string, (code: string, link: string) => string> = {
  en: (code, link) =>
    `Join me on SallyCards! Use my code ${code} and we both earn rewards. ${link}`,
  fr: (code, link) =>
    `Rejoins-moi sur SallyCards ! Utilise mon code ${code} et on gagne tous les deux des recompenses. ${link}`,
  ar: (code, link) =>
    `انضم إلي على سالي كاردز! استخدم رمزي ${code} وسنربح مكافآت معا. ${link}`,
  darija: (code, link) =>
    `دخل معايا لـ سالي كاردز! استعمل الكود ديالي ${code} ونربحو بجوج. ${link}`,
  es: (code, link) =>
    `Unete a SallyCards! Usa mi codigo ${code} y ambos ganamos recompensas. ${link}`,
};

/**
 * Return a ready-to-share referral message in the given locale.
 * Falls back to English when the locale is not supported.
 */
export function createReferralShareMessage(
  code: string,
  locale: string,
): string {
  const link = createReferralLink(code);
  const lang = locale.split('-')[0].toLowerCase();
  const fn = MESSAGES[lang] ?? MESSAGES['en'];
  return fn(code, link);
}
