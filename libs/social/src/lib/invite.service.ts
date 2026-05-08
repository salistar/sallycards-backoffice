// ---------------------------------------------------------------------------
// Game Invite System – direct invites, share links, WhatsApp messages
// ---------------------------------------------------------------------------

export interface GameInvite {
  id: string;
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  gameType: string;
  roomCode: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: number;
  expiresAt: number; // 30 minutes after creation
}

// ---- Constants -------------------------------------------------------------

const INVITE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const DEEP_LINK_BASE = 'sallycards://game';

// ---- Helpers ---------------------------------------------------------------

let _inviteCounter = 0;

function generateInviteId(): string {
  _inviteCounter += 1;
  return `inv_${Date.now()}_${_inviteCounter}`;
}

// ---- In-memory store -------------------------------------------------------

const inviteStore: Map<string, GameInvite> = new Map();

// ---- Localised game names --------------------------------------------------

const GAME_NAMES: Record<string, Record<string, string>> = {
  RONDA: { en: 'Ronda', fr: 'Ronda', ar: 'رندة', es: 'Ronda', darija: 'رندة' },
  KDOUB: { en: 'Kdoub', fr: 'Kdoub', ar: 'كضوب', es: 'Kdoub', darija: 'كضوب' },
  BELOTE: { en: 'Belote', fr: 'Belote', ar: 'بيلوت', es: 'Belote', darija: 'بيلوت' },
  POKER: { en: 'Poker', fr: 'Poker', ar: 'بوكر', es: 'Póker', darija: 'بوكر' },
  SOLITAIRE: { en: 'Solitaire', fr: 'Solitaire', ar: 'سوليتير', es: 'Solitario', darija: 'سوليتير' },
  SCOPA: { en: 'Scopa', fr: 'Scopa', ar: 'سكوبا', es: 'Scopa', darija: 'سكوبا' },
  TRIX: { en: 'Trix', fr: 'Trix', ar: 'تريكس', es: 'Trix', darija: 'تريكس' },
  TARNEEB: { en: 'Tarneeb', fr: 'Tarneeb', ar: 'طرنيب', es: 'Tarneeb', darija: 'طرنيب' },
  HAND: { en: 'Hand', fr: 'Hand', ar: 'هاند', es: 'Hand', darija: 'هاند' },
};

function gameNameForLocale(gameType: string, locale: string): string {
  return GAME_NAMES[gameType]?.[locale] ?? GAME_NAMES[gameType]?.['en'] ?? gameType;
}

// ---- Localised invite messages ---------------------------------------------

const INVITE_MSG_TEMPLATES: Record<string, string> = {
  en: "Come play {game} with me on SallyCards! \uD83C\uDFB4 {link}",
  fr: "Viens jouer à {game} avec moi sur SallyCards! \uD83C\uDFB4 {link}",
  ar: "تعال نلعب {game} معي على SallyCards! \uD83C\uDFB4 {link}",
  es: "\u00A1Ven a jugar {game} conmigo en SallyCards! \uD83C\uDFB4 {link}",
  darija: "Aji n9awmo {game}! \uD83C\uDFB4 {link}",
};

// ---- Public API ------------------------------------------------------------

/**
 * Create a direct game invite between two users.
 */
export function createInvite(
  from: { userId: string; username: string },
  toUserId: string,
  gameType: string,
  roomCode: string,
): GameInvite {
  const now = Date.now();
  const invite: GameInvite = {
    id: generateInviteId(),
    fromUserId: from.userId,
    fromUsername: from.username,
    toUserId,
    gameType,
    roomCode,
    status: 'pending',
    createdAt: now,
    expiresAt: now + INVITE_TTL_MS,
  };
  inviteStore.set(invite.id, invite);
  return invite;
}

/**
 * Accept an invite (if still valid).
 */
export function acceptInvite(inviteId: string): GameInvite | null {
  const invite = inviteStore.get(inviteId);
  if (!invite) return null;
  if (invite.status !== 'pending') return invite;
  if (Date.now() > invite.expiresAt) {
    invite.status = 'expired';
    return invite;
  }
  invite.status = 'accepted';
  return invite;
}

/**
 * Decline an invite.
 */
export function declineInvite(inviteId: string): GameInvite | null {
  const invite = inviteStore.get(inviteId);
  if (!invite) return null;
  invite.status = 'declined';
  return invite;
}

/**
 * Generate a universal deep-link for sharing.
 */
export function createShareLink(
  roomCode: string,
  gameType: string,
  hostName: string,
): string {
  return `${DEEP_LINK_BASE}/${gameType.toLowerCase()}/${roomCode}?host=${encodeURIComponent(hostName)}`;
}

/**
 * Generate a localised WhatsApp-ready invite message with deep link.
 */
export function createWhatsAppMessage(
  roomCode: string,
  gameType: string,
  locale: string,
): string {
  const link = `${DEEP_LINK_BASE}/${gameType.toLowerCase()}/${roomCode}`;
  const gameName = gameNameForLocale(gameType, locale);
  const template = INVITE_MSG_TEMPLATES[locale] ?? INVITE_MSG_TEMPLATES['en'];
  return template.replace('{game}', gameName).replace('{link}', link);
}

/**
 * Get all pending invites for a user.
 */
export function getPendingInvites(userId: string): GameInvite[] {
  const now = Date.now();
  const results: GameInvite[] = [];
  inviteStore.forEach((invite) => {
    if (invite.toUserId === userId && invite.status === 'pending') {
      if (now > invite.expiresAt) {
        invite.status = 'expired';
      } else {
        results.push(invite);
      }
    }
  });
  return results;
}

/**
 * Expire all stale invites. Call periodically.
 */
export function expireStaleInvites(): number {
  const now = Date.now();
  let count = 0;
  inviteStore.forEach((invite) => {
    if (invite.status === 'pending' && now > invite.expiresAt) {
      invite.status = 'expired';
      count += 1;
    }
  });
  return count;
}

// ---- Convenience aliases (spec API) ----------------------------------------

/**
 * Build a localised invite message containing the deep link.
 * Alias matching the Phase 8 spec surface.
 */
export function createInviteMessage(
  roomCode: string,
  gameType: string,
  hostName: string,
  locale: string,
): string {
  const link = createShareLink(roomCode, gameType, hostName);
  const gameName = gameNameForLocale(gameType, locale);
  const template = INVITE_MSG_TEMPLATES[locale] ?? INVITE_MSG_TEMPLATES['en'];
  return template.replace('{game}', gameName).replace('{link}', link);
}

/**
 * Create a WhatsApp share URL with the pre-filled invite text.
 */
export function createWhatsAppUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/**
 * Create a generic SMS share URL.
 */
export function createSmsUrl(message: string): string {
  return `sms:?body=${encodeURIComponent(message)}`;
}

/**
 * Create a Telegram share URL.
 */
export function createTelegramUrl(message: string): string {
  return `https://t.me/share/url?text=${encodeURIComponent(message)}`;
}
