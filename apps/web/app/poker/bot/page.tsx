/**
 * @file apps/web/app/poker/bot/page.tsx
 * @description Poker Texas Hold'em vs Bots — mise/relance/suivre/coucher, flop
 *   turn river, showdown. Tapis 1000, blinds 10/20, paquet espagnol.
 */
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { GameState, Card, Player, cardImage, CARD_BACK, evaluateHand, HAND_FR, newGame, gameReducer, autoStep, getCurrentPlayer } from '../lib/engine';

const NAVY = '#0A1535'; const GOLD = '#FCD34D'; const BLUE = '#93C5FD'; const FELT = '#7F1D1D';
const BOTS = ['Carlos', 'Maria', 'Pedro'];

export default function PokerVsBot() {
  const [st, setSt] = useState<GameState>(() => newGame(BOTS.slice(0, 2)));

  useEffect(() => {
    const adv = autoStep(st);
    if (!adv) return;
    const t = setTimeout(() => setSt((s) => { const a = autoStep(s); return a ? a.next : s; }), adv.delay);
    return () => clearTimeout(t);
  }, [st]);

  const me = st.players[0];
  const cur = getCurrentPlayer(st);
  const betting = ['preflop', 'flop', 'turn', 'river'].includes(st.phase);
  const myTurn = betting && cur?.id === me?.id && !me?.folded && !me?.isAllIn;
  const toCall = me ? st.currentBet - me.currentBet : 0;
  const show = st.phase === 'showdown' || st.phase === 'game_over';

  const act = (a: any) => setSt((s) => gameReducer(s, a));
  const myEval = me && me.hand.length === 2 ? evaluateHand(me.hand, st.communityCards) : null;

  return (
    <main style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${NAVY}, #2a0a0a)`, padding: '20px 14px 40px' }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Link href="/poker" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: BLUE, textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}><ArrowLeft style={{ width: 16, height: 16 }} /> Hub</Link>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: '1.05rem' }}>🃏 Poker · vs Bots</h1>
          <button onClick={() => setSt(newGame(BOTS.slice(0, 2)))} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999, padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}><RefreshCw style={{ width: 14, height: 14 }} /> Nouvelle partie</button>
        </div>

        {/* Adversaires */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {st.players.slice(1).map((p) => <SeatChip key={p.id} p={p} active={cur?.id === p.id && betting} reveal={show && !p.folded} />)}
        </div>

        {/* Table */}
        <div style={{ background: `radial-gradient(circle at 50% 40%, ${FELT}, #3b0a0a)`, borderRadius: 24, border: '6px solid #5b1a1a', padding: 18, marginBottom: 14, minHeight: 150 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: GOLD, fontWeight: 800, fontSize: '0.8rem', marginBottom: 10 }}>
            <span>Pot : {st.pot}</span><span>Mise : {st.currentBet}</span><span style={{ textTransform: 'capitalize' }}>{st.phase}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', minHeight: 84, alignItems: 'center', flexWrap: 'wrap' }}>
            {st.communityCards.length === 0 && <span style={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>En attente du flop…</span>}
            {st.communityCards.map((c) => <CardImg key={c.id} card={c} size={56} />)}
          </div>
          <div style={{ color: '#FDE68A', fontSize: '0.8rem', textAlign: 'center', marginTop: 10, minHeight: 16 }}>{st.lastAction}</div>
        </div>

        {/* Showdown */}
        {show && (
          <div style={{ background: 'rgba(252,211,77,0.12)', border: `1px solid ${GOLD}66`, borderRadius: 12, padding: 14, marginBottom: 12, textAlign: 'center' }}>
            <div style={{ color: GOLD, fontWeight: 900, fontSize: '1.05rem' }}>
              {st.phase === 'game_over' ? `🏆 Partie terminée — ${st.players.find((p) => p.id === st.winnerId)?.name || '?'} remporte tout !` : `🏆 ${st.players.find((p) => p.id === st.winnerId)?.name || '?'} gagne le pot (${st.pot})`}
            </div>
            {st.winnerHandDescription && st.phase !== 'game_over' && <div style={{ color: '#CBD5E1', fontSize: '0.85rem', marginTop: 4 }}>{st.winnerHandDescription}</div>}
            {st.phase === 'game_over' && <button onClick={() => setSt(newGame(BOTS.slice(0, 2)))} style={{ marginTop: 10, background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: NAVY, fontWeight: 900, border: 'none', borderRadius: 12, padding: '10px 24px', cursor: 'pointer' }}>Rejouer</button>}
            {st.phase === 'showdown' && <div style={{ color: '#94A3B8', fontSize: '0.78rem', marginTop: 6 }}>Nouvelle manche…</div>}
          </div>
        )}

        {/* Ma main */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ color: '#fff', fontWeight: 800 }}>
            Vous · {me?.chips ?? 0} jetons {me?.currentBet ? `· mise ${me.currentBet}` : ''} {me?.folded ? '· couché' : me?.isAllIn ? '· TAPIS' : ''}
            {myEval && !me?.folded && <span style={{ color: GOLD, marginLeft: 8 }}>· {HAND_FR[myEval.rank]}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, minHeight: 78 }}>
          {me?.hand.map((c) => <CardImg key={c.id} card={c} size={54} />)}
          {(!me || me.hand.length === 0) && <span style={{ color: BLUE }}>—</span>}
        </div>

        {/* Actions */}
        {myTurn && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
            <button onClick={() => act({ type: 'FOLD', playerId: me.id })} style={btn('#DC2626')}>Se coucher</button>
            {toCall === 0
              ? <>
                  <button onClick={() => act({ type: 'CHECK', playerId: me.id })} style={btn('#334155')}>Check</button>
                  <button onClick={() => act({ type: 'BET', playerId: me.id, amount: Math.min(st.bigBlind * 2, me.chips) })} style={btn('#16A34A')}>Miser {Math.min(st.bigBlind * 2, me.chips)}</button>
                </>
              : <button onClick={() => act({ type: 'CALL', playerId: me.id })} style={btn('#16A34A')}>Suivre {Math.min(toCall, me.chips)}</button>}
            {toCall < me.chips && st.currentBet > 0 && <button onClick={() => act({ type: 'RAISE', playerId: me.id, amount: Math.min(st.currentBet + st.bigBlind * 2, me.chips + me.currentBet) })} style={btn('#7C3AED')}>Relancer à {Math.min(st.currentBet + st.bigBlind * 2, me.chips + me.currentBet)}</button>}
            <button onClick={() => act(st.currentBet > 0 ? { type: 'RAISE', playerId: me.id, amount: me.chips + me.currentBet } : { type: 'BET', playerId: me.id, amount: me.chips })} style={btn('#B45309')}>Tapis ({me.chips})</button>
          </div>
        )}

        {/* Journal */}
        <div style={{ color: BLUE, fontSize: '0.8rem', marginTop: 14 }}>Manche {st.roundNumber} · blinds {st.smallBlind}/{st.bigBlind}</div>
      </div>
    </main>
  );
}

function SeatChip({ p, active, reveal }: { p: Player; active: boolean; reveal: boolean }) {
  return (
    <div style={{ background: active ? 'rgba(252,211,77,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${active ? GOLD : 'rgba(255,255,255,0.12)'}`, borderRadius: 12, padding: '6px 10px', opacity: p.folded ? 0.5 : 1 }}>
      <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.74rem' }}>🤖 {p.name} · {p.chips}🪙</div>
      <div style={{ display: 'flex', gap: 3, marginTop: 4, alignItems: 'center' }}>
        {reveal ? p.hand.map((c) => <CardImg key={c.id} card={c} size={30} />) : <><MiniBack /><MiniBack /></>}
        {p.currentBet > 0 && <span style={{ color: GOLD, fontSize: '0.66rem', marginLeft: 4 }}>mise {p.currentBet}</span>}
        {p.folded && <span style={{ color: '#FCA5A5', fontSize: '0.66rem', marginLeft: 4 }}>couché</span>}
        {p.isAllIn && <span style={{ color: '#FDE68A', fontSize: '0.66rem', marginLeft: 4 }}>TAPIS</span>}
      </div>
    </div>
  );
}
function CardImg({ card, size }: { card: Card; size: number }) {
  return <span style={{ display: 'inline-block', borderRadius: 5, overflow: 'hidden', background: '#fff', boxShadow: '0 3px 8px rgba(0,0,0,0.4)' }}><Image src={cardImage(card)} alt="" width={size} height={Math.round(size * 1.45)} style={{ display: 'block', width: size, height: 'auto' }} /></span>;
}
function MiniBack() { return <span style={{ display: 'inline-block', borderRadius: 4, overflow: 'hidden' }}><Image src={CARD_BACK} alt="" width={30} height={43} style={{ display: 'block' }} /></span>; }
function btn(bg: string): React.CSSProperties { return { background: bg, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem' }; }
