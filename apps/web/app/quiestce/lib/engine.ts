/**
 * @file apps/web/app/quiestce/lib/engine.ts
 * @description Moteur Qui-est-ce ? (déduction). 24 personnages à attributs. Le
 *   joueur et le bot ont chacun un personnage secret. À tour de rôle on pose une
 *   question fermée (oui/non) pour éliminer des suspects, puis on devine. Premier
 *   à deviner le personnage de l'adversaire gagne. Logique propre.
 */

export type Sexe = 'H' | 'F';
export type Cheveux = 'brun' | 'blond' | 'roux' | 'blanc';
export interface Perso { id: number; name: string; emoji: string; sexe: Sexe; cheveux: Cheveux; lunettes: boolean; chapeau: boolean; barbe: boolean }

const NAMES = ['Léon', 'Alice', 'Victor', 'Rose', 'Gaspard', 'Jeanne', 'Théo', 'Manon', 'Noé', 'Lina', 'Sacha', 'Zoé', 'Hugo', 'Emma', 'Lucas', 'Léa', 'Adam', 'Inès', 'Paul', 'Jade', 'Marc', 'Sara', 'Karim', 'Nora'];

export const PERSOS: Perso[] = NAMES.map((name, i) => ({
  id: i,
  name,
  sexe: (i % 2 === 0 ? 'H' : 'F') as Sexe,
  cheveux: (['brun', 'blond', 'roux', 'blanc'] as Cheveux[])[i % 4],
  lunettes: i % 3 === 0,
  chapeau: i % 4 === 1,
  barbe: i % 2 === 0 && i % 5 === 0,
  emoji: i % 2 === 0 ? (i % 5 === 0 ? '🧔' : '👨') : '👩',
}));

export interface QECState {
  humanSecret: number; botSecret: number;
  humanCandidates: number[]; botCandidates: number[];
  turn: 'human' | 'bot'; phase: 'playing' | 'over'; winner: 'human' | 'bot' | null;
  log: string[];
}

export interface Question { key: string; label: string; test: (p: Perso) => boolean }
export const QUESTIONS: Question[] = [
  { key: 'h', label: 'Est-ce un homme ?', test: (p) => p.sexe === 'H' },
  { key: 'brun', label: 'Cheveux bruns ?', test: (p) => p.cheveux === 'brun' },
  { key: 'blond', label: 'Cheveux blonds ?', test: (p) => p.cheveux === 'blond' },
  { key: 'roux', label: 'Cheveux roux ?', test: (p) => p.cheveux === 'roux' },
  { key: 'blanc', label: 'Cheveux blancs ?', test: (p) => p.cheveux === 'blanc' },
  { key: 'lun', label: 'Porte des lunettes ?', test: (p) => p.lunettes },
  { key: 'cha', label: 'Porte un chapeau ?', test: (p) => p.chapeau },
  { key: 'bar', label: 'A une barbe ?', test: (p) => p.barbe },
];

export function newGame(): QECState {
  const all = PERSOS.map((p) => p.id);
  return {
    humanSecret: Math.floor(Math.random() * 24),
    botSecret: Math.floor(Math.random() * 24),
    humanCandidates: [...all], botCandidates: [...all],
    turn: 'human', phase: 'playing', winner: null,
    log: ['À toi de poser une question.'],
  };
}

/** Le joueur pose une question → réponse selon le secret du bot, élimination. */
export function ask(st: QECState, q: Question): QECState {
  if (st.phase !== 'playing' || st.turn !== 'human') return st;
  const answer = q.test(PERSOS[st.botSecret]);
  const humanCandidates = st.humanCandidates.filter((id) => q.test(PERSOS[id]) === answer);
  return { ...st, humanCandidates, turn: 'bot', log: [`Toi : « ${q.label} » → ${answer ? 'OUI' : 'NON'} (${humanCandidates.length} suspects)`, ...st.log] };
}

/** Le joueur devine un personnage. */
export function guess(st: QECState, id: number): QECState {
  if (st.phase !== 'playing' || st.turn !== 'human') return st;
  if (id === st.botSecret) return { ...st, phase: 'over', winner: 'human', log: [`🎉 Bravo ! C'était ${PERSOS[id].name}.`, ...st.log] };
  return { ...st, phase: 'over', winner: 'bot', log: [`❌ Raté, ce n'était pas ${PERSOS[id].name}. Le bot gagne.`, ...st.log] };
}

/** Tour du bot : pose une question (meilleure coupe), puis devine si 1 suspect. */
export function botTurn(st: QECState): QECState {
  if (st.phase !== 'playing' || st.turn !== 'bot') return st;
  if (st.botCandidates.length <= 1) {
    const id = st.botCandidates[0];
    return { ...st, phase: 'over', winner: 'bot', log: [`🤖 Le bot devine : ${PERSOS[id].name} — gagné pour lui !`, ...st.log] };
  }
  // meilleure question : celle qui divise le plus équitablement les suspects du bot
  let best = QUESTIONS[0], bestGap = 99;
  for (const q of QUESTIONS) {
    const yes = st.botCandidates.filter((id) => q.test(PERSOS[id])).length;
    const gap = Math.abs(yes - (st.botCandidates.length - yes));
    if (yes > 0 && yes < st.botCandidates.length && gap < bestGap) { bestGap = gap; best = q; }
  }
  const answer = best.test(PERSOS[st.humanSecret]);
  const botCandidates = st.botCandidates.filter((id) => best.test(PERSOS[id]) === answer);
  const next: QECState = { ...st, botCandidates, turn: 'human', log: [`🤖 Bot : « ${best.label} » → ${answer ? 'OUI' : 'NON'} (${botCandidates.length} suspects)`, ...st.log] };
  if (botCandidates.length <= 1) {
    return { ...next, phase: 'over', winner: 'bot', log: [`🤖 Le bot devine : ${PERSOS[botCandidates[0]].name} — gagné pour lui !`, ...next.log] };
  }
  return next;
}
