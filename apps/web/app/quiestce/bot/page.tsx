/**
 * @file apps/web/app/quiestce/bot/page.tsx
 * @description Qui-est-ce ? vs Bot — pose des questions oui/non pour éliminer
 *   les suspects, puis devine. Le bot fait pareil sur ton personnage. Plateau
 *   propre : grille de 24 personnages + questions + journal.
 */
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw, HelpCircle } from 'lucide-react';
import { QECState, Perso, PERSOS, QUESTIONS, newGame, ask, guess, botTurn } from '../lib/engine';

const NAVY = '#0A1535'; const GOLD = '#FCD34D'; const BLUE = '#93C5FD';
const HAIR: Record<string, string> = { brun: '#7c4a1e', blond: '#f5d76e', roux: '#d2601a', blanc: '#e5e7eb' };

export default function QuiEstCeVsBot() {
  const [st, setSt] = useState<QECState>(() => newGame());
  const [guessMode, setGuessMode] = useState(false);

  useEffect(() => {
    if (st.phase === 'playing' && st.turn === 'bot') {
      const t = setTimeout(() => setSt((s) => botTurn(s)), 1100);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [st]);

  const myTurn = st.phase === 'playing' && st.turn === 'human';
  const alive = new Set(st.humanCandidates);
  const secret = PERSOS[st.humanSecret];

  return (
    <main style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${NAVY}, #0a0820)`, padding: '20px 14px 40px' }}>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <Link href="/quiestce" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: BLUE, textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}><ArrowLeft style={{ width: 16, height: 16 }} /> Hub</Link>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: '1.1rem' }}>🕵️ Qui-est-ce ? · vs Bot</h1>
          <button onClick={() => { setSt(newGame()); setGuessMode(false); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999, padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}><RefreshCw style={{ width: 14, height: 14 }} /> Rejouer</button>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.5)', borderRadius: 12, padding: '8px 14px' }}>
            <div style={{ color: '#A5B4FC', fontSize: '0.64rem', textTransform: 'uppercase', letterSpacing: 1 }}>Ton personnage secret (le bot doit le deviner)</div>
            <div style={{ color: '#fff', fontWeight: 800 }}>{secret.emoji} {secret.name}</div>
          </div>
          <span style={{ color: BLUE, fontSize: '0.82rem' }}>{st.humanCandidates.length} suspects restants</span>
        </div>

        {/* Grille */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(92px, 1fr))', gap: 8, marginBottom: 14 }}>
          {PERSOS.map((p) => {
            const elim = !alive.has(p.id);
            const clickable = myTurn && guessMode && !elim;
            return (
              <button key={p.id} onClick={() => clickable && setSt(guess(st, p.id))} disabled={!clickable}
                style={{ position: 'relative', background: '#152A47', border: `1px solid ${clickable ? GOLD : 'rgba(255,255,255,0.1)'}`, borderRadius: 12, padding: '8px 4px', opacity: elim ? 0.25 : 1, cursor: clickable ? 'pointer' : 'default', textAlign: 'center' }}>
                <div style={{ fontSize: 26 }}>{p.emoji}</div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.72rem' }}>{p.name}</div>
                <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginTop: 3, alignItems: 'center' }}>
                  <span style={{ width: 9, height: 9, borderRadius: 999, background: HAIR[p.cheveux] }} title={p.cheveux} />
                  {p.lunettes && <span style={{ fontSize: 10 }}>👓</span>}
                  {p.chapeau && <span style={{ fontSize: 10 }}>🎩</span>}
                  {p.barbe && <span style={{ fontSize: 10 }}>🧔</span>}
                </div>
                {elim && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', fontSize: 28, fontWeight: 900 }}>✕</div>}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        {st.phase === 'playing' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={() => setGuessMode((g) => !g)} disabled={!myTurn} style={{ background: guessMode ? `linear-gradient(90deg, ${GOLD}, #F59E0B)` : 'rgba(255,255,255,0.08)', color: guessMode ? NAVY : '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px 16px', fontWeight: 800, cursor: myTurn ? 'pointer' : 'default' }}>
              {guessMode ? '🎯 Clique un suspect pour deviner' : 'Mode deviner'}
            </button>
            {!guessMode && <span style={{ color: BLUE, fontSize: '0.8rem' }}>{myTurn ? 'Pose une question :' : 'Le bot réfléchit…'}</span>}
          </div>
        )}
        {st.phase === 'playing' && !guessMode && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {QUESTIONS.map((q) => (
              <button key={q.key} onClick={() => myTurn && setSt(ask(st, q))} disabled={!myTurn} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(99,102,241,0.15)', color: '#C7D2FE', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 999, padding: '7px 14px', fontWeight: 700, fontSize: '0.82rem', cursor: myTurn ? 'pointer' : 'default' }}>
                <HelpCircle style={{ width: 14, height: 14 }} /> {q.label}
              </button>
            ))}
          </div>
        )}

        {/* Journal */}
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 12, maxHeight: 150, overflowY: 'auto' }}>
          {st.log.map((l, i) => <div key={i} style={{ color: i === 0 ? '#fff' : '#94A3B8', fontSize: '0.82rem', padding: '2px 0' }}>{l}</div>)}
        </div>

        {st.phase === 'over' && (
          <div style={{ marginTop: 16, textAlign: 'center', background: 'rgba(0,0,0,0.45)', borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 44 }}>{st.winner === 'human' ? '🏆' : '🤖'}</div>
            <h2 style={{ color: '#fff', fontWeight: 900, fontSize: '1.4rem', margin: '8px 0' }}>{st.winner === 'human' ? 'Tu as deviné !' : 'Le bot a gagné'}</h2>
            <button onClick={() => { setSt(newGame()); setGuessMode(false); }} style={{ background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: NAVY, fontWeight: 900, border: 'none', borderRadius: 12, padding: '12px 28px', cursor: 'pointer' }}>Rejouer</button>
          </div>
        )}
      </div>
    </main>
  );
}
