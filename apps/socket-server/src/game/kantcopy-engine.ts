/**
 * @file apps/socket-server/src/game/kantcopy-engine.ts
 * @description Moteur Kant Copy autoritatif serveur (2v2, 4 sièges, paquet
 *   espagnol 40 cartes, main de 4). Pioche/défausse, réunir un carré (Kant),
 *   signaler son partenaire, annoncer « Carte Copie ! » (+1) ou voler le Kant
 *   adverse (+2). Annonce ratée → l'autre équipe marque. Première équipe à 7.
 */
export type Suit = 'O' | 'C' | 'E' | 'B';
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

const SUITS: Suit[] = ['O', 'C', 'E', 'B'];
const VALUES: CardValue[] = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
export const VALUE_NAME: Record<CardValue, string> = { 1: 'As', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 10: 'Sota', 11: 'Caballo', 12: 'Rey' };
const NAMES = ['Nord', 'Est', 'Sud', 'Ouest'];
const TARGET = 7;

function teamOf(i: number): Team { return i % 2 === 0 ? 'A' : 'B'; }
function partnerOf(i: number): number { return (i + 2) % 4; }
function push(log: string[], line: string): string[] { return [line, ...log].slice(0, 30); }

function buildDeck(): Card[] {
  const d: Card[] = [];
  for (const s of SUITS) for (const v of VALUES) d.push({ id: `${v}${s}`, suit: s, value: v });
  for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; }
  return d;
}
function detectKant(hand: Card[]): { has: boolean; value: CardValue | null } {
  if (hand.length !== 4) return { has: false, value: null };
  const counts: Record<number, number> = {};
  for (const c of hand) counts[c.value] = (counts[c.value] || 0) + 1;
  for (const v of Object.keys(counts)) if (counts[Number(v)] >= 4) return { has: true, value: Number(v) as CardValue };
  return { has: false, value: null };
}
function refreshKants(st: KCState): KCState {
  return { ...st, players: st.players.map((p) => { const k = detectKant(p.hand); return { ...p, hasKant: k.has, kantValue: k.value }; }) };
}

export function buildKantcopy(seats: { id: string; name: string; isBot: boolean }[]): KCState {
  const players: KCPlayer[] = [];
  for (let i = 0; i < 4; i++) {
    const s = seats[i] || { id: `bot-${i}`, name: NAMES[i], isBot: true };
    players.push({ ...s, team: teamOf(i), hand: [], signalSent: false, hasKant: false, kantValue: null });
  }
  const deck = buildDeck();
  const dealt = players.map((p, i) => ({ ...p, hand: deck.slice(i * 4, i * 4 + 4) }));
  const discard = [deck[16]];
  const stock = deck.slice(17);
  return refreshKants({ players: dealt, stock, discard, turn: 1, step: 'draw', phase: 'playing', scoreA: 0, scoreB: 0, target: TARGET, lastRound: null, lastEvent: 'Distribution', log: ['Nouvelle partie.'] });
}

function draw(st: KCState, from: 'stock' | 'discard'): KCState {
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
function discardCard(st: KCState, cardId: string): KCState {
  if (st.phase !== 'playing' || st.step !== 'discard') return st;
  const p = st.players[st.turn];
  const card = p.hand.find((c) => c.id === cardId);
  if (!card) return st;
  const players = st.players.map((pp, i) => (i === st.turn ? { ...pp, hand: pp.hand.filter((c) => c.id !== cardId) } : pp));
  return refreshKants({ ...st, players, discard: [...st.discard, card], turn: (st.turn + 1) % 4, step: 'draw', lastEvent: `${p.name} défausse` });
}
function signal(st: KCState, idx: number): KCState {
  if (st.phase !== 'playing' || !st.players[idx].hasKant || st.players[idx].signalSent) return st;
  return { ...st, players: st.players.map((p, i) => (i === idx ? { ...p, signalSent: true } : p)), lastEvent: `${st.players[idx].name} fait un signe…` };
}
function announce(st: KCState, byIndex: number, targetIndex: number): KCState {
  if (st.phase !== 'playing') return st;
  const target = st.players[targetIndex];
  const k = detectKant(target.hand);
  const annTeam = teamOf(byIndex), tgtTeam = teamOf(targetIndex), byName = st.players[byIndex].name;
  if (k.has) {
    const stolen = annTeam !== tgtTeam;
    const pts = stolen ? 2 : 1;
    const round: KCRound = { type: stolen ? 'steal' : 'win', by: annTeam, points: pts, kantHolderName: target.name };
    const msg = stolen ? `🦹 ${byName} VOLE le Kant de ${target.name} (${VALUE_NAME[k.value!]}) → équipe ${annTeam} +${pts}` : `✅ ${byName} annonce le Kant de ${target.name} (${VALUE_NAME[k.value!]}) → équipe ${annTeam} +${pts}`;
    return { ...st, phase: 'revealing', scoreA: st.scoreA + (annTeam === 'A' ? pts : 0), scoreB: st.scoreB + (annTeam === 'B' ? pts : 0), lastRound: round, lastEvent: msg, log: push(st.log, msg) };
  }
  const winTeam: Team = annTeam === 'A' ? 'B' : 'A';
  const msg = `❌ ${byName} se trompe → équipe ${winTeam} +1`;
  return { ...st, phase: 'revealing', scoreA: st.scoreA + (winTeam === 'A' ? 1 : 0), scoreB: st.scoreB + (winTeam === 'B' ? 1 : 0), lastRound: { type: 'wrong', by: winTeam, points: 1, kantHolderName: null }, lastEvent: msg, log: push(st.log, msg) };
}
function nextRound(st: KCState): KCState {
  if (st.scoreA >= st.target || st.scoreB >= st.target) return { ...st, phase: 'over', lastEvent: `Partie terminée — équipe ${st.scoreA > st.scoreB ? 'A' : 'B'} gagne !` };
  const deck = buildDeck();
  const players = st.players.map((p, i) => ({ ...p, hand: deck.slice(i * 4, i * 4 + 4), signalSent: false, hasKant: false, kantValue: null }));
  return refreshKants({ ...st, players, stock: deck.slice(17), discard: [deck[16]], turn: 1, step: 'draw', phase: 'playing', lastRound: null, lastEvent: 'Nouvelle manche' });
}
function aiDiscardId(hand: Card[]): string {
  const counts: Record<number, Card[]> = {};
  for (const c of hand) (counts[c.value] ??= []).push(c);
  return Object.values(counts).sort((a, b) => a.length - b.length)[0][0].id;
}

// ── Interface adaptateur ──────────────────────────────────────────────────
export function kantcopyApply(st: KCState, seatId: string, a: any): KCState {
  if (st.phase !== 'playing') return st;
  const seat = st.players.findIndex((p) => p.id === seatId);
  if (seat < 0) return st;
  if (a?.type === 'DRAW') { if (seat !== st.turn) return st; return draw(st, a.from === 'discard' ? 'discard' : 'stock'); }
  if (a?.type === 'DISCARD') { if (seat !== st.turn) return st; return discardCard(st, a.cardId); }
  if (a?.type === 'SIGNAL') return signal(st, seat);
  if (a?.type === 'ANNOUNCE' && typeof a.targetId === 'string') {
    const tgt = st.players.findIndex((p) => p.id === a.targetId);
    if (tgt < 0) return st;
    return announce(st, seat, tgt);
  }
  return st;
}

export function kantcopyAdvance(st: KCState): { next: KCState; delay: number } | null {
  if (st.phase === 'over') return null;
  if (st.phase === 'revealing') return { next: nextRound(st), delay: 1900 };
  const me = st.players[st.turn];
  if (!me.isBot) return null;
  // annonce / vol par le bot courant
  const partner = st.players[partnerOf(st.turn)];
  if (partner.signalSent && partner.hasKant && Math.random() < 0.7) return { next: announce(st, st.turn, partnerOf(st.turn)), delay: 1000 };
  for (let i = 0; i < 4; i++) {
    if (teamOf(i) === teamOf(st.turn)) continue;
    if (st.players[i].signalSent && st.players[i].hasKant && Math.random() < 0.25) return { next: announce(st, st.turn, i), delay: 1000 };
  }
  // tour normal
  if (st.step === 'draw') {
    const top = st.discard[st.discard.length - 1];
    const useful = top && me.hand.filter((c) => c.value === top.value).length >= 2;
    return { next: draw(st, useful ? 'discard' : 'stock'), delay: 950 };
  }
  let chosen = aiDiscardId(me.hand);
  const counts: Record<number, Card[]> = {};
  for (const c of me.hand) (counts[c.value] ??= []).push(c);
  const quad = Object.values(counts).find((g) => g.length >= 4);
  if (quad) { const odd = me.hand.find((c) => c.value !== quad[0].value); if (odd) chosen = odd.id; }
  let ns = discardCard(st, chosen);
  const prev = ns.players[st.turn];
  if (prev.hasKant && !prev.signalSent) ns = signal(ns, st.turn);
  return { next: ns, delay: 950 };
}

export function kantcopyCurrentId(st: KCState): string | null { return st.players[st.turn]?.id ?? null; }
export function kantcopyIsOver(st: KCState): boolean { return st.phase === 'over'; }

export function kantcopyView(st: KCState, youId: string) {
  return {
    game: 'kantcopy', youId, phase: st.phase, step: st.step, turn: st.turn, currentId: kantcopyCurrentId(st),
    scoreA: st.scoreA, scoreB: st.scoreB, target: st.target, lastRound: st.lastRound, lastEvent: st.lastEvent, log: st.log,
    stockCount: st.stock.length, discardTop: st.discard[st.discard.length - 1] || null,
    valueNames: VALUE_NAME,
    players: st.players.map((p, i) => ({
      id: p.id, name: p.name, isBot: p.isBot, team: p.team, index: i, count: p.hand.length,
      signalSent: p.signalSent,
      // on ne révèle que SA propre main + l'info "j'ai un Kant" pour soi
      hand: p.id === youId ? p.hand : undefined,
      hasKant: p.id === youId ? p.hasKant : undefined,
      kantValue: p.id === youId ? p.kantValue : undefined,
    })),
  };
}
