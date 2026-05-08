// ---------------------------------------------------------------------------
// Chat Service – in-game and lobby chat with quick replies & profanity filter
// ---------------------------------------------------------------------------

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'emoji' | 'quick_reply' | 'system';
  timestamp: number;
}

// Twenty quick-reply phrases, each localised in five languages / dialects.
export const QUICK_REPLIES: Record<string, Record<string, string>> = {
  good_game: {
    en: 'Good game!',
    fr: 'Bien joué!',
    ar: '!لعب جيد',
    es: '¡Buen juego!',
    darija: '!لعبتي مزيان',
  },
  thanks: {
    en: 'Thanks!',
    fr: 'Merci!',
    ar: '!شكرا',
    es: '¡Gracias!',
    darija: '!شكرا',
  },
  ronda: {
    en: 'Ronda!',
    fr: 'Ronda!',
    ar: '!رندة',
    es: '¡Ronda!',
    darija: '!رندة',
  },
  bluff: {
    en: 'Bluff!',
    fr: 'Menteur!',
    ar: '!كذاب',
    es: '¡Mentiroso!',
    darija: '!كذوب',
  },
  hurry_up: {
    en: 'Hurry up!',
    fr: 'Dépêche-toi!',
    ar: '!أسرع',
    es: '¡Date prisa!',
    darija: '!سير بالزربة',
  },
  wow: {
    en: 'Wow!',
    fr: 'Waouh!',
    ar: '!واو',
    es: '¡Guau!',
    darija: '!واو',
  },
  oops: {
    en: 'Oops!',
    fr: 'Oups!',
    ar: '!أوه',
    es: '¡Ups!',
    darija: '!أوبس',
  },
  luck: {
    en: 'Lucky!',
    fr: 'Chance!',
    ar: '!محظوظ',
    es: '¡Suerte!',
    darija: '!مزيان ليك',
  },
  no_way: {
    en: 'No way!',
    fr: 'Impossible!',
    ar: '!مستحيل',
    es: '¡Imposible!',
    darija: '!واخا',
  },
  rematch: {
    en: 'Rematch?',
    fr: 'Revanche?',
    ar: '؟ريفانش',
    es: '¿Revancha?',
    darija: '؟نعاودو',
  },
  well_played: {
    en: 'Well played!',
    fr: 'Bien joué!',
    ar: '!أحسنت',
    es: '¡Bien jugado!',
    darija: '!لعبتي مزيان',
  },
  my_turn: {
    en: 'My turn!',
    fr: 'Mon tour!',
    ar: '!دوري',
    es: '¡Mi turno!',
    darija: '!دوري',
  },
  nice_move: {
    en: 'Nice move!',
    fr: 'Joli coup!',
    ar: '!حركة جيدة',
    es: '¡Buena jugada!',
    darija: '!ضربة زوينة',
  },
  sorry: {
    en: 'Sorry!',
    fr: 'Désolé!',
    ar: '!آسف',
    es: '¡Lo siento!',
    darija: '!سمح لي',
  },
  lets_go: {
    en: "Let's go!",
    fr: 'Allons-y!',
    ar: '!هيا بنا',
    es: '¡Vamos!',
    darija: '!يلاه',
  },
  close_game: {
    en: 'Close game!',
    fr: 'Partie serrée!',
    ar: '!لعبة متقاربة',
    es: '¡Partido reñido!',
    darija: '!كانت قريبة',
  },
  wait: {
    en: 'Wait!',
    fr: 'Attends!',
    ar: '!انتظر',
    es: '¡Espera!',
    darija: '!تسنا',
  },
  bye: {
    en: 'Bye!',
    fr: 'Salut!',
    ar: '!مع السلامة',
    es: '¡Adiós!',
    darija: '!بسلامة',
  },
  hello: {
    en: 'Hello!',
    fr: 'Salut!',
    ar: '!مرحبا',
    es: '¡Hola!',
    darija: '!سلام',
  },
  haha: {
    en: 'Haha!',
    fr: 'Haha!',
    ar: '!هاها',
    es: '¡Jaja!',
    darija: '!هاها',
  },
};

// ---- Profanity word list (basic / placeholder – extend as needed) ----------

const PROFANITY_LIST: string[] = [
  'damn',
  'hell',
  'crap',
  'shit',
  'fuck',
  'ass',
  'bastard',
  'bitch',
  'dick',
  'piss',
  'merde',
  'putain',
  'connard',
  'mierda',
  'joder',
  'coño',
];

function buildProfanityRegex(): RegExp {
  const escaped = PROFANITY_LIST.map((w) =>
    w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
  );
  return new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
}

const PROFANITY_RE = buildProfanityRegex();

// ---- Helpers ---------------------------------------------------------------

let _msgCounter = 0;

function generateId(): string {
  _msgCounter += 1;
  return `msg_${Date.now()}_${_msgCounter}`;
}

// ---- ChatService -----------------------------------------------------------

export class ChatService {
  /**
   * Build a complete ChatMessage from partial input.
   */
  sendMessage(
    roomId: string,
    message: Omit<ChatMessage, 'id' | 'timestamp'>,
  ): ChatMessage {
    const content =
      message.type === 'text'
        ? this.filterProfanity(message.content)
        : message.content;

    return {
      ...message,
      id: generateId(),
      roomId,
      content,
      timestamp: Date.now(),
    };
  }

  /**
   * Return the localised quick-reply string.  Falls back to `en` if the
   * requested locale is unavailable, then to the key itself.
   */
  getQuickReply(key: string, locale: string): string {
    const entry = QUICK_REPLIES[key];
    if (!entry) return key;
    return entry[locale] ?? entry['en'] ?? key;
  }

  /**
   * Replace profanity with asterisks of the same length.
   */
  filterProfanity(text: string): string {
    return text.replace(PROFANITY_RE, (match) => '*'.repeat(match.length));
  }
}
