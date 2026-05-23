/**
 * @file apps/web/app/kdoub/bot/page.tsx
 * @description Kdoub vs Bots — bluff marocain. Déclare une valeur en posant une
 *   carte face cachée (honnête ou bluff), ou crie « Kdoub ! » pour contester.
 */
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw, Megaphone } from 'lucide-react';
import { KState, Card, CardValue, VALUES, VALUE_NAME, cardImage, CARD_BACK, newGame, play, challenge, botStep, deciderIndex } from '../lib/engine';

const NAVY = '#0A1535'; const GOLD = '#FCD34D'; const BLUE = '#93C5FD'; const FELT = '#2a1145'; const PURPLE = '#8B5CF6';

export default function KdoubVsBot() {
  const [st, setSt] = useState<KState>(() => newGame());
  const [sel, setSel] = useState<string | null>(null);

  useEffect(() => {
    if (st.phase === 'over') return;
    const humanPlaying = st.phase === 'playing' && st.currentPlayerIndex === 0;
    const humanDeciding = st.phase === 'challenge' && deciderIndex(st) === 0;
    if (humanPlaying || humanDeciding) return;
    const delay = st.phase === 'reveal' ? 1700 : st.phase === 'round_end' ? 1800 : 950;
    const t = setTimeout(() => { setSel(null); setSt((s) => botStep(s)); }, delay);
    return () => clearTimeout(t);
  }, [st]);

  const me = st.players[0];
  const myTurn = st.phase === 'playing' && st.currentPlayerIndex === 0;
  const iAmDecider = st.phase === 'challenge' && deciderIndex(st) === 0;
  const locked = st.declaredValue;

  const doPlay = (cardId: string, declared: CardValue) => { setSel(null); setSt((s) => play(s, cardId, declared)); };
  const onCardClick = (c: Card) => {
    if (iAmDecider) { doPlay(c.id, locked!); return; }     // pendant Kdoub : enchaîne avec la valeur verrouillée
    if (!myTurn) return;
    if (locked !== null) doPlay(c.id, locked);             // valeur verrouillée → joue direct
    else setSel((cur) => (cur === c.id ? null : c.id));    // nouvelle séquence → choisir la valeur déclarée
  };
  const cryKdoub = () => { setSel(null); setSt((s) => challenge(s, me.id)); };

  return (
    <main style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${NAVY}, #1a0a2e)`, padding: '20px 14px 40px' }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <Link href="/kdoub" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: BLUE, textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}><ArrowLeft style={{ width: 16, height: 16 }} /> Hub</Link>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: '1.1rem' }}>🎭 Kdoub · vs Bots</h1>
          <button onClick={() => { setSel(null); setSt(newGame()); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999, padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}><RefreshCw style={{ width: 14, height: 14 }} /> Nouvelle partie</button>
        </div>

        {/* Opponents */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {st.players.slice(1).map((p, i) => {
            const active = st.currentPlayerIndex === i + 1 && st.phase !== 'over';
            return (
              <div key={p.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: active ? 'rgba(252,211,77,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${active ? GOLD : 'rgba(255,255,255,0.1)'}`, borderRadius: 999, padding: '5px 12px' }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.76rem' }}>🤖 {p.name}</span>
                <span style={{ color: BLUE, fontSize: '0.64rem' }}>· {p.hand.length}🂠 · {p.score}pts</span>
              </div>
            );
          })}
        </div>

        {/* Center : tas + valeur déclarée + pioche */}
        <div style={{ background: `radial-gradient(circle at 50% 40%, ${FELT}, #14071f)`, borderRadius: 24, border: '6px solid #3b1d5e', padding: 18, marginBottom: 12, display: 'flex', gap: 24, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', minHeight: 110 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 60, height: 84 }}>
              {st.pile.length === 0
                ? <div style={{ width: 56, height: 80, borderRadius: 8, border: '2px dashed rgba(255,255,255,0.2)' }} />
                : st.pile.slice(-4).map((_, k) => (
                    <span key={k} style={{ position: 'absolute', left: k * 3, top: k * 2 }}>
                      <Image src={CARD_BACK} alt="" width={56} height={80} style={{ display: 'block', borderRadius: 8, boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }} />
                    </span>
                  ))}
            </div>
            <div style={{ color: BLUE, fontSize: '0.7rem', marginTop: 6 }}>Tas ({st.pile.length})</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-block', background: locked !== null ? `linear-gradient(135deg, ${PURPLE}, ${GOLD})` : 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 18px', minWidth: 90 }}>
              <div style={{ color: locked !== null ? NAVY : '#94A3B8', fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>Valeur déclarée</div>
              <div style={{ color: locked !== null ? NAVY : '#fff', fontWeight: 900, fontSize: '1.3rem' }}>{locked !== null ? VALUE_NAME[locked] : '—'}</div>
            </div>
          </div>
        </div>

        {/* Message d'état */}
        <div style={{ color: st.phase === 'reveal' ? GOLD : BLUE, fontSize: '0.85rem', marginBottom: 8, minHeight: 20, fontWeight: st.phase === 'reveal' ? 800 : 500 }}>
          {st.phase === 'over' ? st.lastEvent
            : iAmDecider ? '🔔 À toi : crie « Kdoub ! » pour contester, ou pose une carte pour enchaîner.'
            : myTurn ? (locked !== null ? `Pose une carte en déclarant « ${VALUE_NAME[locked]} » (honnête ou bluff).` : 'Choisis une carte puis la valeur à déclarer.')
            : st.lastEvent}
        </div>

        {/* Kdoub button */}
        {iAmDecider && (
          <button onClick={cryKdoub} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `linear-gradient(90deg, #EF4444, #B91C1C)`, color: '#fff', border: 'none', borderRadius: 12, padding: '10px 22px', fontWeight: 900, cursor: 'pointer', marginBottom: 12, boxShadow: '0 4px 14px rgba(239,68,68,0.5)' }}>
            <Megaphone style={{ width: 18, height: 18 }} /> KDOUB !
          </button>
        )}

        {/* Sélecteur de valeur (nouvelle séquence) */}
        {myTurn && locked === null && sel && (
          <div style={{ background: 'rgba(139,92,246,0.12)', border: `1px solid ${PURPLE}66`, borderRadius: 12, padding: 12, marginBottom: 12 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.82rem', marginBottom: 8 }}>Déclare une valeur pour cette carte (mens si tu veux) :</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {VALUES.map((v) => (
                <button key={v} onClick={() => doPlay(sel, v)} style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 12px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>{VALUE_NAME[v]}</button>
              ))}
            </div>
          </div>
        )}

        {/* Ma main */}
        <div style={{ color: '#fff', fontWeight: 800, marginBottom: 8 }}>Votre main ({me.hand.length}) · {me.score} pts</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', minHeight: 90 }}>
          {me.hand.map((c) => {
            const playable = myTurn || iAmDecider;
            const chosen = sel === c.id;
            return (
              <button key={c.id} onClick={() => onCardClick(c)} disabled={!playable} style={{ border: chosen ? `2px solid ${GOLD}` : '1px solid #cbd5e1', borderRadius: 8, padding: 0, background: '#fff', cursor: playable ? 'pointer' : 'default', transform: chosen ? 'translateY(-6px)' : 'none', transition: 'transform .12s', boxShadow: '0 3px 8px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
                <Image src={cardImage(c)} alt={`${VALUE_NAME[c.value]}`} width={54} height={80} style={{ display: 'block', width: 54, height: 80, objectFit: 'cover' }} />
              </button>
            );
          })}
        </div>

        {/* Journal */}
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 12, marginTop: 14, maxHeight: 130, overflowY: 'auto' }}>
          {st.log.map((l, i) => <div key={i} style={{ color: i === 0 ? '#fff' : '#94A3B8', fontSize: '0.8rem', padding: '2px 0' }}>{l}</div>)}
        </div>

        {(st.phase === 'over' || st.phase === 'round_end') && (
          <div style={{ marginTop: 18, textAlign: 'center', background: 'rgba(0,0,0,0.45)', borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 44 }}>{st.phase === 'over' ? (st.winner === 0 ? '🏆' : '🤖') : '🎉'}</div>
            <h2 style={{ color: '#fff', fontWeight: 900, fontSize: '1.35rem', margin: '8px 0' }}>
              {st.phase === 'over' ? (st.winner === 0 ? 'Vous gagnez la partie !' : `${st.players[st.winner ?? 0].name} gagne la partie`) : `${st.players[st.winner ?? 0].name} remporte la manche`}
            </h2>
            <div style={{ color: BLUE, marginBottom: 14, fontSize: '0.85rem' }}>{st.players.map((p) => `${p.name}: ${p.score}`).join(' · ')}</div>
            {st.phase === 'over' && <button onClick={() => { setSel(null); setSt(newGame()); }} style={{ background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: NAVY, fontWeight: 900, border: 'none', borderRadius: 12, padding: '12px 28px', cursor: 'pointer' }}>Rejouer</button>}
            {st.phase === 'round_end' && <div style={{ color: '#94A3B8', fontSize: '0.8rem' }}>Nouvelle manche…</div>}
          </div>
        )}
      </div>
    </main>
  );
}
