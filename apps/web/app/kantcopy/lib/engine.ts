/**
 * @file apps/web/app/kantcopy/lib/engine.ts
 * @description Moteur Kant Copy (كانت كوبي) — 4 joueurs en 2 équipes (2v2),
 *   paquet espagnol 40 cartes, chacun tient 4 cartes. À ton tour : pioche (talon
 *   ou défausse) puis défausse. Objectif : réunir un CARRÉ (4 cartes de même
 *   valeur = « Kant »), faire un signal à ton partenaire qui annonce
 *   « Carte Copie ! » → +1. Un adversaire qui repère le signal peut VOLER → +2.
 *   Annonce ratée → l'autre équipe marque. Première équipe à 7 gagne. Logique
 *   propre (inspirée de l'app mobile).
 */
export type Suit = 'O' | 'C' | 'E' | 'B'; // oros, copas, espadas, bastos (lettres assets spanish40)
export type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 10 | 11 | 12;
export interface Card { id: string; suit: Suit; value: CardValue }
export type Team = 'A' | 'B';
export interface KCPlayer { id: string; name: string; isBot: boolean; team: Team; hand: Card[]; signalSent: boolean; hasKant: boolean; kantValue: CardValue | null }
export type KCPhase = 'playing' | 'revealing' | 'over';
export interface KCRound { type: 'win' | 'steal' | 'wrong' | 'exhausted'; by: Team | null; points: number; kantHolderName: string | null }
export interface KCState {
  players: KCPlayer[]; stock: Card[]; discard: Card[];
  turn: number; step: 'draw' | 'discard'; phase: KCPhase;
  scoreA: number; scoreB: number; target: number;
  lastRound: KCRound | null; lastEvent: string; log: string[];
}

export const SUITS: Suit[] = ['O', 'C', 'E', 'B'];
export const VALUES: CardValue[] = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
export const SUIT_NAME: Record<Suit, string> = { O: 'Deniers', C: 'Coupes', E: 'Épées', B: 'Bâtons' };
export const VALUE_NAME: Record<CardValue, string> = { 1: 'As', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 10: 'Sota', 11: 'Caballo', 12: 'Rey' };
export const TARGET = 7;
export const HUMAN = 2; // Sud
export const NAMES = ['Nord', 'Est', 'Sud', 'Ouest'];

export function cardImage(c: Card): string { return `/cards/spanish40/${c.value}${c.suit}.png`; }
export const CARD_BACK = '/cards/spanish40/back.png';
export function valueName(v: CardValue): string { return VALUE_NAME[v]; }
export function teamOf(i: number): Team { return i % 2 === 0 ? 'A' : 'B'; }
export function partnerOf(i: number): number { return (i + 2) % 4; }

function buildDeck(): Card[] {
  const d: Card[] = [];
  for (const s of SUITS) for (const v of VALUES) d.push({ id: `${v}${s}`, suit: s, value: v });
  for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; }
  return d;
}

export function detectKant(hand: Card[]): { has: boolean; value: CardValue | null } {
  if (hand.length !== 4) return { has: false, value: null };
  const counts: Record<number, number> = {};
  for (const c of hand) counts[c.value] = (counts[c.value] || 0) + 1;
  for (const v of Object.keys(counts)) if (counts[Number(v)] >= 4) return { has: true, value: Number(v) as CardValue };
  return { has: false, value: null };
}

function refreshKants(st: KCState): KCState {
  return { ...st, players: st.players.map((p) => { const k = detectKant(p.hand); return { ...p, hasKant: k.has, kantValue: k.value }; }) };
}
function push(log: string[], line: string): string[] { return [line, ...log].slice(0, 30); }

export function buildKantcopy(seats: { id: string; name: string; isBot: boolean }[]): KCState {
  const players: KCPlayer[] = [];
  for (let i = 0; i < 4; i++) {
    const s = seats[i] || { id: `bot-${i}`, name: NAMES[i], isBot: true };
    players.push({ ...s, team: teamOf(i), hand: [], signalSent: false, hasKant: false, kantValue: null });
  }
  const base: KCState = { players, stock: [], discard: [], turn: 1, step: 'draw', phase: 'playing', scoreA: 0, scoreB: 0, target: TARGET, lastRound: null, lastEvent: 'Distribution', log: ['Nouvelle partie.'] };
  // distribution propre
  const deck = buildDeck();
  const dealt = players.map((p, i) => ({ ...p, hand: deck.slice(i * 4, i * 4 + 4) }));
  const discard = [deck[16]];
  const stock = deck.slice(17);
  return refreshKants({ ...base, players: dealt, stock, discard });
}

export function newGame(): KCState {
  return buildKantcopy([
    { id: 'p0', name: 'Nord', isBot: true },
    { id: 'p1', name: 'Est', isBot: true },
    { id: 'p2', name: 'Vous', isBot: false },
    { id: 'p3', name: 'Ouest', isBot: true },
  ]);
}

export function draw(st: KCState, from: 'stock' | 'discard'): KCState {
  if (st.phase !== 'playing' || st.step !== 'draw') return st;
  let stock = st.stock, discard = st.discard, card: Card | undefined;
  if (from === 'discard') {
    if (discard.length === 0) return st;
    discard = [...discard]; card = discard.pop();
  } else {
    if (stock.length === 0) {
      if (discard.length <= 1) return { ...st, phase: 'revealing', lastRound: { type: 'exhausted', by: null, points: 0, kantHolderName: null }, lastEvent: 'Talon épuisé — manche nulle.' };
      const top = discard[discard.length - 1];
      stock = discard.slice(0, -1); for (let i = stock.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [stock[i], stock[j]] = [stock[j], stock[i]]; }
      discard = [top];
    }
    stock = [...stock]; card = stock.pop();
  }
  if (!card) return st;
  const players = st.players.map((p, i) => (i === st.turn ? { ...p, hand: [...p.hand, card!] } : p));
  return refreshKants({ ...st, stock, discard, players, step: 'discard' });
}

export function discard(st: KCState, cardId: string): KCState {
  if (st.phase !== 'playing' || st.step !== 'discard') return st;
  const p = st.players[st.turn];
  if (!p.hand.find((c) => c.id === cardId)) return st;
  const card = p.hand.find((c) => c.id === cardId)!;
  const players = st.players.map((pp, i) => (i === st.turn ? { ...pp, hand: pp.hand.filter((c) => c.id !== cardId) } : pp));
  const nextTurn = (st.turn + 1) % 4;
  return refreshKants({ ...st, players, discard: [...st.discard, card], turn: nextTurn, step: 'draw', lastEvent: `${p.name} défausse` });
}

/** Le joueur idx envoie un signal discret à son partenaire (s'il a un Kant). */
export function signal(st: KCState, idx: number): KCState {
  if (st.phase !== 'playing' || !st.players[idx].hasKant || st.players[idx].signalSent) return st;
  const players = st.players.map((p, i) => (i === idx ? { ...p, signalSent: true } : p));
  return { ...st, players, lastEvent: `${st.players[idx].name} fait un signe à son partenaire…` };
}

/** byIndex annonce « Carte Copie ! » en désignant targetIndex (porteur supposé du Kant). */
export function announce(st: KCState, byIndex: number, targetIndex: number): KCState {
  if (st.phase !== 'playing') return st;
  const target = st.players[targetIndex];
  const k = detectKant(target.hand);
  const annTeam = teamOf(byIndex);
  const tgtTeam = teamOf(targetIndex);
  const byName = st.players[byIndex].name;
  if (k.has) {
    const stolen = annTeam !== tgtTeam;
    const pts = stolen ? 2 : 1;
    const round: KCRound = { type: stolen ? 'steal' : 'win', by: annTeam, points: pts, kantHolderName: target.name };
    const msg = stolen ? `🦹 ${byName} VOLE le Kant de ${target.name} (${VALUE_NAME[k.value!]}) → équipe ${annTeam} +${pts}` : `✅ ${byName} annonce le Kant de ${target.name} (${VALUE_NAME[k.value!]}) → équipe ${annTeam} +${pts}`;
    return { ...st, phase: 'revealing', scoreA: st.scoreA + (annTeam === 'A' ? pts : 0), scoreB: st.scoreB + (annTeam === 'B' ? pts : 0), lastRound: round, lastEvent: msg, log: push(st.log, msg) };
  }
  const winTeam: Team = annTeam === 'A' ? 'B' : 'A';
  const round: KCRound = { type: 'wrong', by: winTeam, points: 1, kantHolderName: null };
  const msg = `❌ ${byName} se trompe (${target.name} n'a pas de Kant) → équipe ${winTeam} +1`;
  return { ...st, phase: 'revealing', scoreA: st.scoreA + (winTeam === 'A' ? 1 : 0), scoreB: st.scoreB + (winTeam === 'B' ? 1 : 0), lastRound: round, lastEvent: msg, log: push(st.log, msg) };
}

export function nextRound(st: KCState): KCState {
  const over = st.scoreA >= st.target || st.scoreB >= st.target;
  if (over) return { ...st, phase: 'over', lastEvent: `Partie terminée — équipe ${st.scoreA > st.scoreB ? 'A' : 'B'} gagne !` };
  const deck = buildDeck();
  const players = st.players.map((p, i) => ({ ...p, hand: deck.slice(i * 4, i * 4 + 4), signalSent: false, hasKant: false, kantValue: null }));
  const discard = [deck[16]];
  const stock = deck.slice(17);
  return refreshKants({ ...st, players, stock, discard, turn: 1, step: 'draw', phase: 'playing', lastRound: null, lastEvent: 'Nouvelle manche' });
}

// ── IA ───────────────────────────────────────────────────────────────────────
function aiDiscardId(hand: Card[]): string {
  // garde les paires/carrés : défausse une carte isolée
  const counts: Record<number, Card[]> = {};
  for (const c of hand) (counts[c.value] ??= []).push(c);
  const groups = Object.values(counts).sort((a, b) => a.length - b.length);
  return groups[0][0].id;
}

/** Avance d'un cran si c'est à un bot d'agir. Renvoie l'état inchangé sinon. */
export function botStep(st: KCState): KCState {
  if (st.phase !== 'playing') return st;
  const me = st.players[st.turn];
  if (!me.isBot) return st;

  // 1) Annonce : mon partenaire m'a fait signe ?
  const partner = st.players[partnerOf(st.turn)];
  if (partner.signalSent && partner.hasKant && Math.random() < 0.7) return announce(st, st.turn, partnerOf(st.turn));
  // 2) Vol : un adversaire a signalé ?
  for (let i = 0; i < 4; i++) {
    if (teamOf(i) === teamOf(st.turn)) continue;
    if (st.players[i].signalSent && st.players[i].hasKant && Math.random() < 0.25) return announce(st, st.turn, i);
  }

  // 3) Tour normal
  if (st.step === 'draw') {
    const top = st.discard[st.discard.length - 1];
    const useful = top && me.hand.filter((c) => c.value === top.value).length >= 2;
    return draw(st, useful ? 'discard' : 'stock');
  }
  // discard : si carré possible, garde-le ; sinon défausse l'isolée
  let chosen = aiDiscardId(me.hand);
  const counts: Record<number, Card[]> = {};
  for (const c of me.hand) (counts[c.value] ??= []).push(c);
  const quad = Object.values(counts).find((g) => g.length >= 4);
  if (quad) { const odd = me.hand.find((c) => c.value !== quad[0].value); if (odd) chosen = odd.id; }
  let ns = discard(st, chosen);
  // après défausse, si le bot vient de former un Kant → il signale
  const prev = ns.players[st.turn];
  if (prev.hasKant && !prev.signalSent) ns = signal(ns, st.turn);
  return ns;
}
