/**
 * @file apps/web/app/kdoub/lib/engine.ts
 * @description Moteur Kdoub (bluff marocain) — paquet espagnol de 40 cartes
 *   (4 couleurs × 1-7,10-12). Tour à tour, un joueur DÉCLARE une valeur en
 *   posant une carte FACE CACHÉE (honnête ou bluff). La valeur est verrouillée
 *   pour la séquence : les suivants doivent déclarer la MÊME valeur. N'importe
 *   qui peut crier « Kdoub ! » : si bluff → le menteur ramasse le tas, sinon le
 *   contestataire ramasse. Premier à vider sa main remporte la manche. Logique
 *   propre au jeu (inspirée de l'app mobile).
 */

export type Suit = 'B' | 'C' | 'E' | 'O'; // bastos, copas, espadas, oros (lettres assets spanish40)
export type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 10 | 11 | 12;
export interface Card { id: string; suit: Suit; value: CardValue }
export interface PlayedCard { card: Card; declaredValue: CardValue; playerId: string; isBluff: boolean }
export interface KPlayer { id: string; name: string; isBot: boolean; hand: Card[]; score: number }
export type KPhase = 'playing' | 'challenge' | 'reveal' | 'round_end' | 'over';
export interface KChallenge { challengerId: string; likedPlayerId: string; wasBluff: boolean; loserId: string; declaredValue: CardValue; realValue: CardValue; count: number }
export interface KState {
  players: KPlayer[];
  currentPlayerIndex: number;
  pile: PlayedCard[];
  deck: Card[];
  declaredValue: CardValue | null;
  lastPlay: PlayedCard | null;
  lastChallenge: KChallenge | null;
  phase: KPhase;
  winner: number | null;
  roundNumber: number;
  target: number;
  lastEvent: string;
  log: string[];
}

export const SUITS: Suit[] = ['B', 'C', 'E', 'O'];
export const VALUES: CardValue[] = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
export const SUIT_NAME: Record<Suit, string> = { B: 'Bâtons', C: 'Coupes', E: 'Épées', O: 'Deniers' };
export const VALUE_NAME: Record<CardValue, string> = { 1: 'As', 2: 'Deux', 3: 'Trois', 4: 'Quatre', 5: 'Cinq', 6: 'Six', 7: 'Sept', 10: 'Sota', 11: 'Caballo', 12: 'Rey' };
export const CARD_POINTS: Record<CardValue, number> = { 1: 11, 2: 0, 3: 10, 4: 0, 5: 0, 6: 0, 7: 0, 10: 2, 11: 3, 12: 4 };
export const TARGET = 100;

export function cardImage(c: Card): string { return `/cards/spanish40/${c.value}${c.suit}.png`; }
export const CARD_BACK = '/cards/spanish40/back.png';
export function valueName(v: CardValue): string { return VALUE_NAME[v]; }

function buildDeck(): Card[] {
  const d: Card[] = [];
  for (const s of SUITS) for (const v of VALUES) d.push({ id: `${v}${s}`, suit: s, value: v });
  for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; }
  return d;
}
function cardsPerPlayer(n: number): number { return n <= 3 ? 10 : n === 4 ? 8 : n === 5 ? 7 : 6; }

export function buildKdoub(seats: { id: string; name: string; isBot: boolean }[]): KState {
  const players: KPlayer[] = seats.slice(0, 6).map((s) => ({ ...s, hand: [], score: 0 }));
  return deal({
    players, currentPlayerIndex: 0, pile: [], deck: [], declaredValue: null, lastPlay: null, lastChallenge: null,
    phase: 'playing', winner: null, roundNumber: 0, target: TARGET, lastEvent: 'Distribution', log: ['Nouvelle partie.'],
  });
}

export function newGame(): KState {
  return buildKdoub([
    { id: 'p0', name: 'Vous', isBot: false },
    { id: 'p1', name: 'Hamza', isBot: true },
    { id: 'p2', name: 'Fatima', isBot: true },
    { id: 'p3', name: 'Youssef', isBot: true },
  ]);
}

function deal(st: KState): KState {
  const deck = buildDeck();
  const per = cardsPerPlayer(st.players.length);
  const players = st.players.map((p, i) => ({ ...p, hand: deck.slice(i * per, (i + 1) * per) }));
  const rest = deck.slice(st.players.length * per);
  return { ...st, players, deck: rest, currentPlayerIndex: 0, pile: [], declaredValue: null, lastPlay: null, lastChallenge: null, phase: 'playing', roundNumber: st.roundNumber + 1, lastEvent: `Manche ${st.roundNumber + 1}` };
}

function nextIdx(cur: number, players: KPlayer[]): number {
  let n = (cur + 1) % players.length, tries = 0;
  while (players[n].hand.length === 0 && tries < players.length) { n = (n + 1) % players.length; tries++; }
  return n;
}
function handPoints(hand: Card[]): number { return hand.reduce((t, c) => t + CARD_POINTS[c.value], 0); }
function push(log: string[], line: string): string[] { return [line, ...log].slice(0, 30); }

/** Jouer une carte. Pendant 'challenge', seul le décideur (joueur suivant) peut
 *  jouer (= renoncer à crier Kdoub et enchaîner). En 'playing', le joueur courant. */
export function play(st: KState, cardId: string, declared: CardValue): KState {
  let s = st;
  if (s.phase === 'challenge') {
    // Le décideur (joueur suivant) renonce à Kdoub et enchaîne en posant sa carte.
    s = { ...s, phase: 'playing', currentPlayerIndex: nextIdx(s.currentPlayerIndex, s.players) };
  } else if (s.phase !== 'playing') return st;

  const pi = s.currentPlayerIndex;
  const player = s.players[pi];
  const idx = player.hand.findIndex((c) => c.id === cardId);
  if (idx < 0) return st;

  // Valeur verrouillée si une séquence est en cours.
  const forced: CardValue = s.declaredValue !== null ? s.declaredValue : declared;
  const card = player.hand[idx];
  const isBluff = card.value !== forced;
  const hand = player.hand.filter((c) => c.id !== cardId);
  const players = s.players.map((p, i) => (i === pi ? { ...p, hand } : p));
  const played: PlayedCard = { card, declaredValue: forced, playerId: player.id, isBluff };
  const log = push(s.log, `${player.name} pose « ${VALUE_NAME[forced]} »`);

  if (hand.length === 0) {
    // Manche terminée — calcul des scores.
    const scored = players.map((p) => ({ ...p, score: p.score + handPoints(p.hand) }));
    const over = scored.some((p) => p.score >= s.target) || s.roundNumber >= 10;
    const winnerIdx = pi;
    if (over) {
      const lowest = scored.reduce((b, p, i) => (p.score < scored[b].score ? i : b), 0);
      return { ...s, players: scored, pile: [...s.pile, played], phase: 'over', winner: lowest, declaredValue: forced, lastPlay: played, lastEvent: `${player.name} se débarrasse de tout !`, log: push(log, `🏆 Partie finie — ${scored[lowest].name} gagne (score le plus bas).`) };
    }
    return { ...s, players: scored, pile: [...s.pile, played], phase: 'round_end', winner: winnerIdx, declaredValue: forced, lastPlay: played, lastEvent: `${player.name} remporte la manche !`, log: push(log, `${player.name} vide sa main — fin de manche.`) };
  }

  return { ...s, players, pile: [...s.pile, played], lastPlay: played, declaredValue: forced, phase: 'challenge', lastEvent: `${player.name} déclare ${VALUE_NAME[forced]}`, log };
}

/** Crier « Kdoub ! » : conteste la dernière carte posée. */
export function challenge(st: KState, challengerId: string): KState {
  if (st.phase !== 'challenge' || !st.lastPlay) return st;
  if (challengerId === st.lastPlay.playerId) return st;
  const wasBluff = st.lastPlay.isBluff;
  const loserId = wasBluff ? st.lastPlay.playerId : challengerId;
  const collected = st.pile.map((p) => p.card);
  const loserIdx = st.players.findIndex((p) => p.id === loserId);
  if (loserIdx < 0) return st;
  const players = st.players.map((p, i) => (i === loserIdx ? { ...p, hand: [...p.hand, ...collected] } : p));
  const chName = st.players.find((p) => p.id === challengerId)?.name || '?';
  const liarName = st.players.find((p) => p.id === st.lastPlay!.playerId)?.name || '?';
  const verdict = wasBluff
    ? `Kdoub ! ${liarName} bluffait (${VALUE_NAME[st.lastPlay.card.value]}) → ramasse ${collected.length} cartes.`
    : `Kdoub raté ! ${liarName} disait vrai → ${chName} ramasse ${collected.length} cartes.`;
  const lastChallenge: KChallenge = { challengerId, likedPlayerId: st.lastPlay.playerId, wasBluff, loserId, declaredValue: st.lastPlay.declaredValue, realValue: st.lastPlay.card.value, count: collected.length };
  return { ...st, players, pile: [], phase: 'reveal', lastChallenge, lastEvent: verdict, log: push(st.log, verdict) };
}

/** Le décideur laisse passer (pas de contestation) : à son tour de jouer. */
export function pass(st: KState): KState {
  if (st.phase !== 'challenge') return st;
  return { ...st, phase: 'playing', currentPlayerIndex: nextIdx(st.currentPlayerIndex, st.players), lastEvent: 'Personne ne conteste.' };
}

/** Après une révélation : séquence rompue, nouvelle déclaration libre. */
export function nextTurn(st: KState): KState {
  if (st.phase !== 'reveal') return st;
  const start = st.lastChallenge ? st.players.findIndex((p) => p.id === st.lastChallenge!.loserId) : st.currentPlayerIndex;
  const cur = st.players[start]?.hand.length ? start : nextIdx(start, st.players);
  return { ...st, phase: 'playing', currentPlayerIndex: cur, declaredValue: null, lastPlay: null, lastEvent: 'Nouvelle séquence.' };
}

export function newRound(st: KState): KState {
  if (st.phase !== 'round_end') return st;
  return deal({ ...st, players: st.players.map((p) => ({ ...p, hand: [] })) });
}

// ── Bots ────────────────────────────────────────────────────────────────────
function botPick(bot: KPlayer, locked: CardValue | null): { cardId: string; declared: CardValue } {
  if (locked === null) {
    const c = bot.hand[Math.floor(Math.random() * bot.hand.length)];
    return { cardId: c.id, declared: c.value };
  }
  const honest = bot.hand.find((c) => c.value === locked);
  if (honest) return { cardId: honest.id, declared: locked };
  // bluff : jette la carte la moins coûteuse
  const cheap = [...bot.hand].sort((a, b) => CARD_POINTS[a.value] - CARD_POINTS[b.value])[0];
  return { cardId: cheap.id, declared: locked };
}
function botChallenges(bot: KPlayer, last: PlayedCard, pileSize: number): boolean {
  const hesitation = Math.min(pileSize * 0.08, 0.45);
  const have = bot.hand.filter((c) => c.value === last.declaredValue).length;
  if (have >= 3) return Math.random() > hesitation;          // 4 max dans le paquet → quasi-sûr du bluff
  if (have >= 2) return Math.random() > 0.55 + hesitation;
  return Math.random() > 0.85 + hesitation;                   // contestation aléatoire rare
}

/** Avance l'état si c'est à un bot de décider/jouer. Renvoie l'état inchangé sinon. */
export function botStep(st: KState): KState {
  if (st.phase === 'reveal') return nextTurn(st);
  if (st.phase === 'round_end') return newRound(st);
  if (st.phase === 'challenge') {
    const decIdx = nextIdx(st.currentPlayerIndex, st.players);
    const decider = st.players[decIdx];
    if (!decider.isBot) return st;
    if (st.lastPlay && botChallenges(decider, st.lastPlay, st.pile.length)) return challenge(st, decider.id);
    // laisse passer puis joue
    const passed = pass(st);
    const cur = passed.players[passed.currentPlayerIndex];
    if (!cur.isBot || cur.hand.length === 0) return passed;
    const { cardId, declared } = botPick(cur, passed.declaredValue);
    return play(passed, cardId, declared);
  }
  if (st.phase === 'playing') {
    const cur = st.players[st.currentPlayerIndex];
    if (!cur.isBot || cur.hand.length === 0) return st;
    const { cardId, declared } = botPick(cur, st.declaredValue);
    return play(st, cardId, declared);
  }
  return st;
}

/** Le joueur humain (index 0) est-il le décideur de la fenêtre Kdoub ? */
export function deciderIndex(st: KState): number { return nextIdx(st.currentPlayerIndex, st.players); }
