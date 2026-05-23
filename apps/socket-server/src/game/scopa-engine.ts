/**
 * @file apps/socket-server/src/game/scopa-engine.ts
 * @description Moteur Scopa autoritatif côté serveur (2 sièges). Capture par
 *   valeur ou par somme, Scopa, scoring cartes/denari/settebello/primiera.
 *   API par siège pour le multijoueur (humain vs humain ou vs bot).
 */
export type SSuit = 'spade' | 'coppe' | 'bastoni' | 'denari';
export interface SCard { suit: SSuit; value: number; id: string }
export interface SPlayer { id: string; name: string; isBot: boolean; hand: SCard[]; captured: SCard[]; scope: number }
export type SPhase = 'playing' | 'round_end' | 'game_over';
export interface ScopaState {
  phase: SPhase; players: [SPlayer, SPlayer]; table: SCard[]; deck: SCard[]; turn: 0 | 1;
  lastCapturer: 0 | 1 | null; roundNumber: number; scores: [number, number]; target: number;
  lastBreakdown: null | { labels: string[]; pts: [number, number] }; winner: 0 | 1 | null;
}
const SUITS: SSuit[] = ['spade', 'coppe', 'bastoni', 'denari'];
const PRIME: Record<number, number> = { 7: 21, 6: 18, 1: 16, 5: 15, 4: 14, 3: 13, 2: 12, 10: 10, 9: 10, 8: 10 };

function deck(): SCard[] {
  const d: SCard[] = [];
  for (const s of SUITS) for (let v = 1; v <= 10; v++) d.push({ suit: s, value: v, id: `${v}-${s}` });
  for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; }
  return d;
}

export function buildScopa(seats: { id: string; name: string; isBot: boolean }[], target = 11): ScopaState {
  const players: [SPlayer, SPlayer] = [
    { ...seats[0], hand: [], captured: [], scope: 0 },
    { ...(seats[1] || { id: 'bot-1', name: 'Bot', isBot: true }), hand: [], captured: [], scope: 0 },
  ];
  const st: ScopaState = { phase: 'playing', players, table: [], deck: [], turn: 0, lastCapturer: null, roundNumber: 0, scores: [0, 0], target, lastBreakdown: null, winner: null };
  return dealRound(st);
}

function dealRound(st: ScopaState): ScopaState {
  const d = deck();
  const p0: SPlayer = { ...st.players[0], hand: d.splice(0, 3), captured: [], scope: 0 };
  const p1: SPlayer = { ...st.players[1], hand: d.splice(0, 3), captured: [], scope: 0 };
  const table = d.splice(0, 4);
  return { ...st, players: [p0, p1], table, deck: d, turn: 0, lastCapturer: null, phase: 'playing', roundNumber: st.roundNumber + 1 };
}

export function findCapture(value: number, table: SCard[]): SCard[] | null {
  const exact = table.filter((c) => c.value === value);
  if (exact.length > 0) return [exact[0]];
  let best: SCard[] | null = null;
  const n = table.length;
  for (let mask = 1; mask < (1 << n); mask++) {
    let sum = 0; const sub: SCard[] = [];
    for (let i = 0; i < n; i++) if (mask & (1 << i)) { sum += table[i].value; sub.push(table[i]); }
    if (sum === value && (!best || sub.length < best.length)) best = sub;
  }
  return best;
}

function applyPlay(st: ScopaState, cardId: string): ScopaState {
  const turn = st.turn;
  const p = st.players[turn];
  const card = p.hand.find((c) => c.id === cardId);
  if (!card) return st;
  const hand = p.hand.filter((c) => c.id !== cardId);
  let table = [...st.table]; let captured = [...p.captured]; let scope = p.scope; let lastCapturer = st.lastCapturer;
  const cap = findCapture(card.value, table);
  if (cap) {
    const ids = new Set(cap.map((c) => c.id));
    table = table.filter((c) => !ids.has(c.id));
    captured = [...captured, card, ...cap];
    lastCapturer = turn;
    const lastPlay = st.deck.length === 0 && st.players[0].hand.length + st.players[1].hand.length - 1 === 0;
    if (table.length === 0 && !lastPlay) scope += 1;
  } else table = [...table, card];
  const players: [SPlayer, SPlayer] = [...st.players] as any;
  players[turn] = { ...p, hand, captured, scope };
  let next: ScopaState = { ...st, players, table, lastCapturer, turn: (1 - turn) as 0 | 1 };
  if (players[0].hand.length === 0 && players[1].hand.length === 0) {
    if (next.deck.length > 0) {
      const d = [...next.deck]; const h0 = d.splice(0, 3); const h1 = d.splice(0, 3);
      next = { ...next, deck: d, players: [{ ...players[0], hand: h0 }, { ...players[1], hand: h1 }], turn: 0 };
    } else next = endRound(next);
  }
  return next;
}

function endRound(st: ScopaState): ScopaState {
  const players: [SPlayer, SPlayer] = [...st.players] as any;
  if (st.table.length > 0 && st.lastCapturer != null) {
    const lc = st.lastCapturer; players[lc] = { ...players[lc], captured: [...players[lc].captured, ...st.table] };
  }
  const [pts, labels] = scoreRound(players[0], players[1]);
  const scores: [number, number] = [st.scores[0] + pts[0], st.scores[1] + pts[1]];
  let phase: SPhase = 'round_end'; let winner: 0 | 1 | null = null;
  if ((scores[0] >= st.target || scores[1] >= st.target) && scores[0] !== scores[1]) { phase = 'game_over'; winner = scores[0] > scores[1] ? 0 : 1; }
  return { ...st, players, table: [], phase, scores, winner, lastBreakdown: { labels, pts } };
}

function primiera(captured: SCard[]): number {
  const best: Record<SSuit, number> = { spade: 0, coppe: 0, bastoni: 0, denari: 0 };
  for (const c of captured) { const v = PRIME[c.value] || 0; if (v > best[c.suit]) best[c.suit] = v; }
  return best.spade + best.coppe + best.bastoni + best.denari;
}
function scoreRound(p0: SPlayer, p1: SPlayer): [[number, number], string[]] {
  const pts: [number, number] = [p0.scope, p1.scope]; const labels: string[] = [];
  if (p0.scope) labels.push(`Scopa ×${p0.scope} (${p0.name})`);
  if (p1.scope) labels.push(`Scopa ×${p1.scope} (${p1.name})`);
  if (p0.captured.length !== p1.captured.length) { const w = p0.captured.length > p1.captured.length ? 0 : 1; pts[w]++; labels.push('Cartes'); }
  const d0 = p0.captured.filter((c) => c.suit === 'denari').length, d1 = p1.captured.filter((c) => c.suit === 'denari').length;
  if (d0 !== d1) { pts[d0 > d1 ? 0 : 1]++; labels.push('Denari'); }
  const sb0 = p0.captured.some((c) => c.suit === 'denari' && c.value === 7), sb1 = p1.captured.some((c) => c.suit === 'denari' && c.value === 7);
  if (sb0 || sb1) { pts[sb0 ? 0 : 1]++; labels.push('Settebello'); }
  const pr0 = primiera(p0.captured), pr1 = primiera(p1.captured);
  if (pr0 !== pr1) { pts[pr0 > pr1 ? 0 : 1]++; labels.push('Primiera'); }
  return [pts, labels];
}

/** Joue la carte pour le siège `seatId` si c'est son tour. */
export function scopaPlay(st: ScopaState, seatId: string, cardId: string): ScopaState {
  if (st.phase !== 'playing') return st;
  if (st.players[st.turn].id !== seatId) return st;
  return applyPlay(st, cardId);
}

/** Avance auto : bot joue, ou nouvelle manche. Retourne null si tour humain / fini. */
export function scopaAdvance(st: ScopaState): { next: ScopaState; delay: number } | null {
  if (st.phase === 'game_over') return null;
  if (st.phase === 'round_end') return { next: dealRound({ ...st }), delay: 2400 };
  const cur = st.players[st.turn];
  if (!cur.isBot) return null;
  // choix du bot
  let bestCard = cur.hand[0]; let bestScore = -1;
  for (const c of cur.hand) {
    const cap = findCapture(c.value, st.table); let score = -1;
    if (cap) { const all = [c, ...cap]; score = all.length; if (all.some((x) => x.suit === 'denari' && x.value === 7)) score += 20; score += all.filter((x) => x.suit === 'denari').length * 2; if (st.table.length === cap.length) score += 8; }
    else score = -c.value;
    if (score > bestScore) { bestScore = score; bestCard = c; }
  }
  return { next: applyPlay(st, bestCard.id), delay: 850 };
}

export function scopaCurrentId(st: ScopaState): string | null { return st.players[st.turn]?.id ?? null; }
export function scopaIsOver(st: ScopaState): boolean { return st.phase === 'game_over'; }

/** Vue personnalisée : ma main visible, l'adversaire masqué (compte seulement). */
export function scopaView(st: ScopaState, youId: string) {
  const players = st.players.map((p) => ({
    id: p.id, name: p.name, isBot: p.isBot, capturedCount: p.captured.length, scope: p.scope,
    hand: p.id === youId ? p.hand : p.hand.map((_, i) => ({ hidden: true, id: `h-${p.id}-${i}` })),
  }));
  return {
    game: 'scopa', youId, phase: st.phase, players, table: st.table, turn: st.turn,
    currentId: scopaCurrentId(st), scores: st.scores, target: st.target, roundNumber: st.roundNumber,
    lastBreakdown: st.lastBreakdown, winner: st.winner,
  };
}
