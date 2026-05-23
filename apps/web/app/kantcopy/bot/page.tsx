/**
 * @file apps/web/app/kantcopy/bot/page.tsx
 * @description Kant Copy vs Bots — 2v2. Pioche/défausse pour réunir un carré
 *   (Kant), signale ton partenaire, et annonce « Carte Copie ! » — ou vole le
 *   Kant d'un adversaire qui s'est trahi.
 */
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw, Hand, Megaphone, Eye } from 'lucide-react';
import { KCState, Card, NAMES, cardImage, CARD_BACK, VALUE_NAME, newGame, draw, discard, signal, announce, botStep, nextRound, teamOf } from '../lib/engine';

const NAVY = '#0A1535'; const GOLD = '#FCD34D'; const BLUE = '#93C5FD'; const FELT = '#075056';
const TEAM_COLOR: Record<string, string> = { A: '#0EA5E9', B: '#F97316' };

export default function KantcopyVsBot() {
  const [st, setSt] = useState<KCState>(() => newGame());

  useEffect(() => {
    if (st.phase === 'over') return;
    if (st.phase === 'revealing') { const r = setTimeout(() => setSt((s) => nextRound(s)), 1900); return () => clearTimeout(r); }
    if (st.players[st.turn]?.isBot) { const t = setTimeout(() => setSt((s) => botStep(s)), 950); return () => clearTimeout(t); }
    return undefined;
  }, [st]);

  const me = st.players[2];
  const myTurn = st.turn === 2 && st.phase === 'playing';
  const partner = st.players[0]; // Nord (équipe A)
  const partnerSignaled = partner.signalSent && st.phase === 'playing';
  const oppSignaled = st.phase === 'playing' ? [1, 3].find((i) => st.players[i].signalSent) : undefined;

  const myImg = (c: Card) => cardImage(c);

  return (
    <main style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${NAVY}, #05201f)`, padding: '20px 14px 40px' }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Link href="/kantcopy" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: BLUE, textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}><ArrowLeft style={{ width: 16, height: 16 }} /> Hub</Link>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: '1.05rem' }}>🤝 Kant Copy · 2v2 vs Bots</h1>
          <button onClick={() => setSt(newGame())} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999, padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}><RefreshCw style={{ width: 14, height: 14 }} /> Nouvelle partie</button>
        </div>

        {/* Scores équipes */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <ScorePill team="A" label="Vous + Nord" score={st.scoreA} target={st.target} />
          <ScorePill team="B" label="Est + Ouest" score={st.scoreB} target={st.target} />
        </div>

        {/* Adversaires + partenaire */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {[0, 1, 3].map((i) => <SeatChip key={i} st={st} idx={i} />)}
        </div>

        {/* Centre : talon + défausse */}
        <div style={{ background: `radial-gradient(circle at 50% 40%, ${FELT}, #032b2c)`, borderRadius: 24, border: '6px solid #0c4a4f', padding: 18, marginBottom: 12, display: 'flex', gap: 24, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', minHeight: 110 }}>
          <div style={{ textAlign: 'center' }}>
            <button onClick={() => myTurn && st.step === 'draw' && setSt(draw(st, 'stock'))} disabled={!(myTurn && st.step === 'draw')} style={{ width: 56, height: 80, borderRadius: 8, padding: 0, overflow: 'hidden', background: '#fff', border: `2px solid ${myTurn && st.step === 'draw' ? GOLD : '#0c4a4f'}`, cursor: myTurn && st.step === 'draw' ? 'pointer' : 'default' }}><Image src={CARD_BACK} alt="talon" width={56} height={80} style={{ display: 'block', width: 56, height: 80, objectFit: 'cover' }} /></button>
            <div style={{ color: BLUE, fontSize: '0.7rem', marginTop: 5 }}>Talon ({st.stock.length})</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            {st.discard.length > 0
              ? <button onClick={() => myTurn && st.step === 'draw' && setSt(draw(st, 'discard'))} disabled={!(myTurn && st.step === 'draw')} style={{ width: 56, height: 80, borderRadius: 8, padding: 0, overflow: 'hidden', background: '#fff', border: `2px solid ${myTurn && st.step === 'draw' ? GOLD : '#cbd5e1'}`, cursor: myTurn && st.step === 'draw' ? 'pointer' : 'default' }}><Image src={myImg(st.discard[st.discard.length - 1])} alt="" width={56} height={80} style={{ display: 'block', width: 56, height: 80, objectFit: 'cover' }} /></button>
              : <div style={{ width: 56, height: 80, borderRadius: 8, border: '2px dashed rgba(255,255,255,0.2)' }} />}
            <div style={{ color: BLUE, fontSize: '0.7rem', marginTop: 5 }}>Défausse</div>
          </div>
        </div>

        {/* Message + actions */}
        <div style={{ color: st.phase === 'revealing' ? GOLD : BLUE, fontSize: '0.85rem', marginBottom: 8, minHeight: 20, fontWeight: st.phase === 'revealing' ? 800 : 500 }}>
          {st.phase === 'over' ? st.lastEvent
            : st.phase === 'revealing' ? st.lastEvent
            : myTurn ? (st.step === 'draw' ? 'À toi : pioche au talon ou prends la défausse.' : 'Défausse une carte (garde tes paires pour viser le carré !).')
            : st.lastEvent}
        </div>

        {st.phase === 'playing' && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {me.hasKant && !me.signalSent && (
              <button onClick={() => setSt(signal(st, 2))} style={actBtn('#0EA5E9')}><Hand style={ic} /> 🤫 Signaler mon carré à Nord</button>
            )}
            {partnerSignaled && (
              <button onClick={() => setSt(announce(st, 2, 0))} style={actBtn('#16A34A')}><Megaphone style={ic} /> Carte Copie ! (annoncer Nord)</button>
            )}
            {oppSignaled !== undefined && (
              <button onClick={() => setSt(announce(st, 2, oppSignaled))} style={actBtn('#DC2626')}><Eye style={ic} /> 🦹 Voler le Kant de {NAMES[oppSignaled]} !</button>
            )}
          </div>
        )}

        {/* Ma main */}
        <div style={{ color: '#fff', fontWeight: 800, marginBottom: 8 }}>Votre main {me.hasKant ? <span style={{ color: GOLD }}>· CARRÉ de {VALUE_NAME[me.kantValue!]} !</span> : ''}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', minHeight: 90 }}>
          {me.hand.map((c) => {
            const canDiscard = myTurn && st.step === 'discard';
            return (
              <button key={c.id} onClick={() => canDiscard && setSt(discard(st, c.id))} disabled={!canDiscard} style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: 0, background: '#fff', cursor: canDiscard ? 'pointer' : 'default', transform: canDiscard ? 'translateY(-3px)' : 'none', transition: 'transform .12s', boxShadow: canDiscard ? `0 0 0 2px ${GOLD}` : '0 3px 8px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
                <Image src={myImg(c)} alt={VALUE_NAME[c.value]} width={62} height={92} style={{ display: 'block', width: 62, height: 92, objectFit: 'cover' }} />
              </button>
            );
          })}
        </div>

        {/* Journal */}
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 12, marginTop: 14, maxHeight: 130, overflowY: 'auto' }}>
          {st.log.map((l, i) => <div key={i} style={{ color: i === 0 ? '#fff' : '#94A3B8', fontSize: '0.8rem', padding: '2px 0' }}>{l}</div>)}
        </div>

        {st.phase === 'over' && (
          <div style={{ marginTop: 18, textAlign: 'center', background: 'rgba(0,0,0,0.45)', borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 44 }}>{st.scoreA > st.scoreB ? '🏆' : '🤖'}</div>
            <h2 style={{ color: '#fff', fontWeight: 900, fontSize: '1.35rem', margin: '8px 0' }}>{st.scoreA > st.scoreB ? 'Votre équipe gagne !' : 'L’équipe adverse gagne'}</h2>
            <div style={{ color: BLUE, marginBottom: 14 }}>Équipe A {st.scoreA} – {st.scoreB} Équipe B</div>
            <button onClick={() => setSt(newGame())} style={{ background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: NAVY, fontWeight: 900, border: 'none', borderRadius: 12, padding: '12px 28px', cursor: 'pointer' }}>Rejouer</button>
          </div>
        )}
      </div>
    </main>
  );
}

function ScorePill({ team, label, score, target }: { team: string; label: string; score: number; target: number }) {
  return (
    <div style={{ flex: 1, background: `${TEAM_COLOR[team]}22`, border: `1px solid ${TEAM_COLOR[team]}`, borderRadius: 12, padding: '10px 14px' }}>
      <div style={{ color: TEAM_COLOR[team], fontSize: '0.66rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>Équipe {team} · {label}</div>
      <div style={{ color: '#fff', fontWeight: 900, fontSize: '1.5rem' }}>{score} <span style={{ color: '#64748B', fontSize: '0.8rem', fontWeight: 600 }}>/ {target}</span></div>
    </div>
  );
}

function SeatChip({ st, idx }: { st: KCState; idx: number }) {
  const p = st.players[idx];
  const active = st.turn === idx && st.phase === 'playing';
  const team = teamOf(idx);
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: active ? 'rgba(252,211,77,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${active ? GOLD : TEAM_COLOR[team] + '66'}`, borderRadius: 999, padding: '5px 12px' }}>
      <span style={{ color: TEAM_COLOR[team], fontWeight: 800, fontSize: '0.7rem' }}>{team}</span>
      <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.76rem' }}>{idx === 0 ? '🤝' : '🤖'} {p.name}</span>
      <span style={{ color: BLUE, fontSize: '0.64rem' }}>· {p.hand.length}🂠</span>
      {p.signalSent && <span title="a fait un signe" style={{ fontSize: 14 }}>👋</span>}
    </div>
  );
}

const ic: React.CSSProperties = { width: 16, height: 16 };
function actBtn(bg: string): React.CSSProperties { return { display: 'inline-flex', alignItems: 'center', gap: 6, background: bg, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 16px', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem' }; }
