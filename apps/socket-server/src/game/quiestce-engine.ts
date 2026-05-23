/**
 * @file apps/socket-server/src/game/quiestce-engine.ts
 * @description Moteur Qui-est-ce ? autoritatif serveur (2 sièges). Chaque joueur
 *   a un personnage secret + sa liste de suspects. À tour de rôle : poser une
 *   question fermée (réponse selon le secret de l'adversaire) pour éliminer des
 *   suspects, ou deviner. Premier à deviner le personnage adverse gagne.
 */
export type Sexe = 'H' | 'F';
export type Cheveux = 'brun' | 'blond' | 'roux' | 'blanc';
export interface Perso { id: number; name: string; emoji: string; sexe: Sexe; cheveux: Cheveux; lunettes: boolean; chapeau: boolean; barbe: boolean }
export interface QPlayer { id: string; name: string; isBot: boolean; secret: number; candidates: number[] }
export interface QECState { players: QPlayer[]; turn: number; phase: 'playing' | 'over'; winner: number | null; lastEvent: string; log: string[] }

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

export function buildQuiestce(seats: { id: string; name: string; isBot: boolean }[]): QECState {
  const all = PERSOS.map((p) => p.id);
  const secrets: number[] = [];
  // Deux secrets distincts.
  while (secrets.length < 2) { const s = Math.floor(Math.random() * PERSOS.length); if (!secrets.includes(s)) secrets.push(s); }
  const players: QPlayer[] = [];
  for (let i = 0; i < 2; i++) {
    const s = seats[i] || { id: `bot-${i}`, name: `Bot ${i}`, isBot: true };
    players.push({ ...s, secret: secrets[i], candidates: [...all] });
  }
  return { players, turn: 0, phase: 'playing', winner: null, lastEvent: 'Distribution des personnages', log: [`${players[0].name} commence.`] };
}

function opponentIdx(st: QECState): number { return (st.turn + 1) % 2; }

function askQuestion(st: QECState, q: Question): QECState {
  if (st.phase !== 'playing') return st;
  const opp = st.players[opponentIdx(st)];
  const answer = q.test(PERSOS[opp.secret]);
  const me = st.players[st.turn];
  const candidates = me.candidates.filter((id) => q.test(PERSOS[id]) === answer);
  const players = st.players.map((p, i) => (i === st.turn ? { ...p, candidates } : p));
  const log = [`${me.name} : « ${q.label} » → ${answer ? 'OUI' : 'NON'} (${candidates.length} suspects)`, ...st.log].slice(0, 30);
  return { ...st, players, turn: opponentIdx(st), lastEvent: `${me.name} a posé une question`, log };
}

function makeGuess(st: QECState, persoId: number): QECState {
  if (st.phase !== 'playing') return st;
  const me = st.players[st.turn];
  const opp = st.players[opponentIdx(st)];
  if (persoId === opp.secret) {
    return { ...st, phase: 'over', winner: st.turn, lastEvent: `${me.name} a deviné — gagné !`, log: [`🎉 ${me.name} devine ${PERSOS[persoId].name} — c'était le bon !`, ...st.log].slice(0, 30) };
  }
  return { ...st, phase: 'over', winner: opponentIdx(st), lastEvent: `${me.name} s'est trompé`, log: [`❌ ${me.name} devine ${PERSOS[persoId].name} — raté. ${opp.name} gagne.`, ...st.log].slice(0, 30) };
}

export function quiestceApply(st: QECState, seatId: string, a: any): QECState {
  const pi = st.players.findIndex((p) => p.id === seatId);
  if (pi < 0 || pi !== st.turn || st.phase !== 'playing') return st;
  if (a?.type === 'ASK') { const q = QUESTIONS.find((x) => x.key === a.key); return q ? askQuestion(st, q) : st; }
  if (a?.type === 'GUESS' && typeof a.persoId === 'number') return makeGuess(st, a.persoId);
  return st;
}

export function quiestceAdvance(st: QECState): { next: QECState; delay: number } | null {
  if (st.phase === 'over') return null;
  const me = st.players[st.turn];
  if (!me.isBot) return null;
  // Devine si un seul suspect restant.
  if (me.candidates.length <= 1) return { next: makeGuess(st, me.candidates[0] ?? me.secret), delay: 1100 };
  // Sinon meilleure question (coupe la plus équitable).
  let best = QUESTIONS[0], bestGap = 99;
  for (const q of QUESTIONS) {
    const yes = me.candidates.filter((id) => q.test(PERSOS[id])).length;
    const gap = Math.abs(yes - (me.candidates.length - yes));
    if (yes > 0 && yes < me.candidates.length && gap < bestGap) { bestGap = gap; best = q; }
  }
  return { next: askQuestion(st, best), delay: 1100 };
}

export function quiestceCurrentId(st: QECState): string | null { return st.players[st.turn]?.id ?? null; }
export function quiestceIsOver(st: QECState): boolean { return st.phase === 'over'; }
export function quiestceView(st: QECState, youId: string) {
  return {
    game: 'quiestce', youId, phase: st.phase, turn: st.turn, currentId: quiestceCurrentId(st), winner: st.winner, lastEvent: st.lastEvent, log: st.log,
    personnages: PERSOS,
    questions: QUESTIONS.map((q) => ({ key: q.key, label: q.label })),
    players: st.players.map((p) => ({
      id: p.id, name: p.name, isBot: p.isBot,
      candidates: p.candidates.length,
      // Le joueur ne voit que SON secret et SES suspects.
      secret: p.id === youId ? p.secret : undefined,
      myCandidates: p.id === youId ? p.candidates : undefined,
    })),
  };
}
