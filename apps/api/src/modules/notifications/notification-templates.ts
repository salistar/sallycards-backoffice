export type NotificationType =
  | 'your_turn'
  | 'game_invite'
  | 'friend_request'
  | 'tournament_start'
  | 'daily_challenge'
  | 'achievement_unlocked'
  | 'game_abandoned';

interface NotificationContent {
  title: string;
  body: string;
}

type TemplateMap = Record<NotificationType, { title: string; body: string }>;

const templates: Record<string, TemplateMap> = {
  en: {
    your_turn: {
      title: "It's your turn!",
      body: '{{opponent}} is waiting for you in {{game}}.',
    },
    game_invite: {
      title: 'Game Invite',
      body: '{{sender}} has invited you to play {{game}}.',
    },
    friend_request: {
      title: 'New Friend Request',
      body: '{{sender}} wants to be your friend.',
    },
    tournament_start: {
      title: 'Tournament Starting',
      body: 'The {{tournament}} tournament begins in {{time}}.',
    },
    daily_challenge: {
      title: 'Daily Challenge Available',
      body: "Today's {{game}} challenge is ready. Can you beat the high score?",
    },
    achievement_unlocked: {
      title: 'Achievement Unlocked!',
      body: 'You earned "{{achievement}}"! Keep playing to unlock more.',
    },
    game_abandoned: {
      title: 'Game Abandoned',
      body: '{{opponent}} has left the game. You win by forfeit!',
    },
  },
  fr: {
    your_turn: {
      title: "C'est votre tour !",
      body: '{{opponent}} vous attend dans {{game}}.',
    },
    game_invite: {
      title: 'Invitation de jeu',
      body: '{{sender}} vous invite a jouer a {{game}}.',
    },
    friend_request: {
      title: "Demande d'ami",
      body: "{{sender}} souhaite devenir votre ami.",
    },
    tournament_start: {
      title: 'Tournoi imminent',
      body: 'Le tournoi {{tournament}} commence dans {{time}}.',
    },
    daily_challenge: {
      title: 'Defi du jour disponible',
      body: 'Le defi {{game}} du jour est pret. Pouvez-vous battre le record ?',
    },
    achievement_unlocked: {
      title: 'Succes debloque !',
      body: 'Vous avez obtenu "{{achievement}}" ! Continuez a jouer.',
    },
    game_abandoned: {
      title: 'Partie abandonnee',
      body: '{{opponent}} a quitte la partie. Vous gagnez par forfait !',
    },
  },
  ar: {
    your_turn: {
      title: 'دورك!',
      body: '{{opponent}} ينتظرك في {{game}}.',
    },
    game_invite: {
      title: 'دعوة للعب',
      body: '{{sender}} دعاك للعب {{game}}.',
    },
    friend_request: {
      title: 'طلب صداقة جديد',
      body: '{{sender}} يريد ان يكون صديقك.',
    },
    tournament_start: {
      title: 'البطولة على وشك البدء',
      body: 'بطولة {{tournament}} تبدا خلال {{time}}.',
    },
    daily_challenge: {
      title: 'تحدي اليوم متاح',
      body: 'تحدي {{game}} اليومي جاهز. هل يمكنك تحقيق افضل نتيجة؟',
    },
    achievement_unlocked: {
      title: 'انجاز جديد!',
      body: 'حصلت على "{{achievement}}"! استمر في اللعب لفتح المزيد.',
    },
    game_abandoned: {
      title: 'تم التخلي عن اللعبة',
      body: '{{opponent}} غادر اللعبة. فزت بالانسحاب!',
    },
  },
  es: {
    your_turn: {
      title: 'Es tu turno!',
      body: '{{opponent}} te espera en {{game}}.',
    },
    game_invite: {
      title: 'Invitacion de juego',
      body: '{{sender}} te ha invitado a jugar {{game}}.',
    },
    friend_request: {
      title: 'Solicitud de amistad',
      body: '{{sender}} quiere ser tu amigo.',
    },
    tournament_start: {
      title: 'Torneo a punto de comenzar',
      body: 'El torneo {{tournament}} empieza en {{time}}.',
    },
    daily_challenge: {
      title: 'Desafio diario disponible',
      body: 'El desafio de {{game}} de hoy esta listo. Puedes superar la puntuacion?',
    },
    achievement_unlocked: {
      title: 'Logro desbloqueado!',
      body: 'Has conseguido "{{achievement}}". Sigue jugando para desbloquear mas.',
    },
    game_abandoned: {
      title: 'Partida abandonada',
      body: '{{opponent}} ha abandonado la partida. Ganas por abandono!',
    },
  },
  tr: {
    your_turn: {
      title: 'Sira sende!',
      body: '{{opponent}} seni {{game}} oyununda bekliyor.',
    },
    game_invite: {
      title: 'Oyun Daveti',
      body: '{{sender}} seni {{game}} oynamaya davet etti.',
    },
    friend_request: {
      title: 'Yeni Arkadaslik Istegi',
      body: '{{sender}} arkadasin olmak istiyor.',
    },
    tournament_start: {
      title: 'Turnuva Basliyor',
      body: '{{tournament}} turnuvasi {{time}} sonra basliyor.',
    },
    daily_challenge: {
      title: 'Gunluk Gorev Hazir',
      body: 'Bugunun {{game}} gorevi hazir. En yuksek skoru gecebilir misin?',
    },
    achievement_unlocked: {
      title: 'Basarim Acildi!',
      body: '"{{achievement}}" basarimini kazandin! Oynamaya devam et.',
    },
    game_abandoned: {
      title: 'Oyun Terk Edildi',
      body: '{{opponent}} oyunu terk etti. Hukmen galip geldin!',
    },
  },
};

/**
 * Interpolate template parameters into a string.
 * Replaces {{key}} with params[key].
 */
function interpolate(
  template: string,
  params: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => params[key] ?? key);
}

/**
 * Get localized notification content for a given type and locale.
 *
 * @param type - The notification type
 * @param locale - The locale code (en, fr, ar, es, tr). Falls back to 'en'.
 * @param params - Key-value pairs to interpolate into the template
 * @returns The title and body of the notification
 */
export function getNotificationContent(
  type: NotificationType,
  locale: string,
  params: Record<string, string> = {},
): NotificationContent {
  const lang = templates[locale] ? locale : 'en';
  const template = templates[lang][type];

  if (!template) {
    return {
      title: 'Notification',
      body: 'You have a new notification.',
    };
  }

  return {
    title: interpolate(template.title, params),
    body: interpolate(template.body, params),
  };
}

/**
 * Get all supported locales.
 */
export function getSupportedLocales(): string[] {
  return Object.keys(templates);
}

/**
 * Check if a locale is supported.
 */
export function isLocaleSupported(locale: string): boolean {
  return locale in templates;
}
