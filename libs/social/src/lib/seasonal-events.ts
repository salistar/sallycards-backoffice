// @sally/social - Seasonal Events (Prompt #156)
// Defines recurring cultural and holiday events with themed rewards.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SeasonalEvent {
  id: string;
  name: Record<string, string>;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    icon: string;
  };
  startDate: string; // ISO date (YYYY-MM-DD)
  endDate: string; // ISO date (YYYY-MM-DD)
  bonusMultiplier: number;
  specialChallenges: string[];
}

// ---------------------------------------------------------------------------
// Event catalogue
// ---------------------------------------------------------------------------

export const SEASONAL_EVENTS: SeasonalEvent[] = [
  {
    id: 'ramadan',
    name: {
      en: 'Ramadan Kareem',
      fr: 'Ramadan Kareem',
      ar: 'رمضان كريم',
      darija: 'رمضان مبارك',
      es: 'Ramadan Generoso',
    },
    theme: { primaryColor: '#2E7D32', secondaryColor: '#C9A84C', icon: 'lantern' },
    startDate: '2026-02-18',
    endDate: '2026-03-19',
    bonusMultiplier: 2,
    specialChallenges: ['night_owl', 'suhoor_special'],
  },
  {
    id: 'eid_fitr',
    name: {
      en: 'Eid al-Fitr',
      fr: 'Aid el-Fitr',
      ar: 'عيد الفطر',
      darija: 'العيد الصغير',
      es: 'Eid al-Fitr',
    },
    theme: { primaryColor: '#1B5E20', secondaryColor: '#FFD700', icon: 'crescent' },
    startDate: '2026-03-20',
    endDate: '2026-03-22',
    bonusMultiplier: 3,
    specialChallenges: ['eid_tournament'],
  },
  {
    id: 'throne_day',
    name: {
      en: 'Throne Day',
      fr: 'Fete du Trone',
      ar: 'عيد العرش',
      darija: 'عيد العرش',
      es: 'Dia del Trono',
    },
    theme: { primaryColor: '#C62828', secondaryColor: '#1B5E20', icon: 'crown' },
    startDate: '2026-07-30',
    endDate: '2026-07-31',
    bonusMultiplier: 2,
    specialChallenges: ['patriotic_ronda'],
  },
  {
    id: 'eid_adha',
    name: {
      en: 'Eid al-Adha',
      fr: 'Aid al-Adha',
      ar: 'عيد الأضحى',
      darija: 'العيد الكبير',
      es: 'Eid al-Adha',
    },
    theme: { primaryColor: '#4E342E', secondaryColor: '#FFD700', icon: 'crescent' },
    startDate: '2026-05-27',
    endDate: '2026-05-30',
    bonusMultiplier: 3,
    specialChallenges: ['adha_marathon'],
  },
  {
    id: 'independence_day',
    name: {
      en: 'Independence Day',
      fr: 'Fete de l\'Independance',
      ar: 'عيد الاستقلال',
      darija: 'عيد الاستقلال',
      es: 'Dia de la Independencia',
    },
    theme: { primaryColor: '#C62828', secondaryColor: '#1B5E20', icon: 'flag' },
    startDate: '2026-11-18',
    endDate: '2026-11-18',
    bonusMultiplier: 2,
    specialChallenges: ['national_pride'],
  },
  {
    id: 'new_year',
    name: {
      en: 'New Year',
      fr: 'Nouvel An',
      ar: 'رأس السنة',
      darija: 'راس العام',
      es: 'Ano Nuevo',
    },
    theme: { primaryColor: '#1565C0', secondaryColor: '#FFD700', icon: 'fireworks' },
    startDate: '2026-12-31',
    endDate: '2027-01-02',
    bonusMultiplier: 2,
    specialChallenges: ['year_recap'],
  },
  {
    id: 'amazigh_new_year',
    name: {
      en: 'Amazigh New Year',
      fr: 'Nouvel An Amazigh',
      ar: 'السنة الأمازيغية',
      darija: 'ءيض ن يناير',
      es: 'Ano Nuevo Amazigh',
    },
    theme: { primaryColor: '#1565C0', secondaryColor: '#FF9800', icon: 'sun' },
    startDate: '2027-01-13',
    endDate: '2027-01-14',
    bonusMultiplier: 2,
    specialChallenges: ['amazigh_special'],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Check whether a SeasonalEvent is active on the given date. */
export function isEventActive(event: SeasonalEvent, date: Date): boolean {
  const d = date.toISOString().slice(0, 10); // YYYY-MM-DD
  return d >= event.startDate && d <= event.endDate;
}

/** Return the first active SeasonalEvent for the given date, or null. */
export function getCurrentEvent(date: Date): SeasonalEvent | null {
  return SEASONAL_EVENTS.find((e) => isEventActive(e, date)) ?? null;
}

/** Return all active events for a given date (there could be overlaps). */
export function getActiveEvents(date: Date): SeasonalEvent[] {
  return SEASONAL_EVENTS.filter((e) => isEventActive(e, date));
}

/** Get the next upcoming event from the given date. */
export function getNextEvent(date: Date): SeasonalEvent | null {
  const d = date.toISOString().slice(0, 10);
  const upcoming = SEASONAL_EVENTS
    .filter((e) => e.startDate > d)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  return upcoming[0] ?? null;
}
