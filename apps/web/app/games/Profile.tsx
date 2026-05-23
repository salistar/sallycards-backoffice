/**
 * @file apps/web/app/games/Profile.tsx
 * @description Profil / compte du joueur pour un jeu : identité, ELO + rang,
 *   niveau/XP, parties & victoires, nombre de défis. Données prod individuelles.
 */
'use client';

import { useEffect, useState } from 'react';
import { User, Trophy, Medal, Gift, Footprints, Coins, Mail } from 'lucide-react';
import { apiClient } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { metaOf } from './meta';
import { Shell, StateNote, cardBox, GOLD, BLUE } from './Shell';

export function ProfileScreen({ gameType }: { gameType: string }) {
  const base = `/${gameType}`;
  const meta = metaOf(gameType);
  const { user } = useAuth();
  const [level, setLevel] = useState<any>(null);
  const [rank, setRank] = useState<any>(null);
  const [defis, setDefis] = useState<number | null>(null);
  const [hk, setHk] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let on = true;
    (async () => {
      const [lvl, rk, active, history, summary] = await Promise.all([
        apiClient.apiGet<any>(`/levels/me?gameType=${gameType}`).catch(() => null),
        apiClient.apiGet<any>(`/leaderboards/${gameType}/me`).catch(() => null),
        apiClient.apiGet<any[]>('/challenges/sport/active').catch(() => []),
        apiClient.apiGet<any[]>('/challenges/sport/history').catch(() => []),
        apiClient.apiGet<any>(`/hkim/${gameType}/summary`).catch(() => null),
      ]);
      if (!on) return;
      setLevel(lvl); setRank(rk); setHk(summary);
      const ids = new Set<string>(); const n = [...(active || []), ...(history || [])].filter((c) => (ids.has(c._id) ? false : (ids.add(c._id), true))).length;
      setDefis(n);
      setLoading(false);
    })();
    return () => { on = false; };
  }, [gameType]);

  const u: any = user || {};
  const pct = level && level.nextLevelXp > 0 ? Math.min(100, Math.round((level.xp / level.nextLevelXp) * 100)) : 0;
  const elo = rank?.elo ?? rank?.score ?? u.elo ?? 1000;
  const gp = rank?.gamesPlayed ?? 0;
  const gw = rank?.gamesWon ?? 0;
  const winRate = rank?.winRate ?? (gp > 0 ? Math.round((gw / gp) * 100) : 0);

  return (
    <Shell base={base} title="Mon profil" subtitle={`${meta.label} · ta progression individuelle`} icon={<User style={{ width: 26, height: 26, color: GOLD }} />}>
      {loading && <StateNote kind="loading" text="Chargement…" />}
      {!loading && (
        <>
          {/* Identité */}
          <div style={{ ...cardBox, display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: `linear-gradient(135deg, ${meta.accent[0]}, ${meta.accent[1]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '1.4rem' }}>{(u.username || '?').slice(0, 2).toUpperCase()}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: '#fff', fontWeight: 900, fontSize: '1.3rem' }}>{u.username || 'Joueur'}</div>
              <div style={{ color: BLUE, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 5 }}><Mail style={{ width: 13, height: 13 }} /> {u.email || '—'}</div>
              <div style={{ color: GOLD, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}><Coins style={{ width: 13, height: 13 }} /> {u.coins ?? 0} pièces</div>
            </div>
          </div>

          {/* Niveau / XP */}
          <div style={{ ...cardBox, marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <span style={{ color: '#fff', fontWeight: 800 }}>Niveau {level?.level ?? 1}</span>
              <span style={{ color: BLUE, fontSize: '0.85rem' }}>{level?.xp ?? 0} / {level?.nextLevelXp ?? 100} XP</span>
            </div>
            <div style={{ height: 12, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${GOLD}, #F59E0B)` }} />
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
            <Stat icon={<Trophy style={ic} />} label="ELO" value={elo} />
            <Stat icon={<Medal style={ic} />} label="Rang" value={rank?.rank ? `#${rank.rank}` : '—'} />
            <Stat icon={<Trophy style={ic} />} label="Parties" value={gp} />
            <Stat icon={<Trophy style={ic} />} label="Victoires" value={gw} />
            <Stat icon={<Trophy style={ic} />} label="Win %" value={`${winRate}%`} />
            <Stat icon={<Footprints style={ic} />} label="Défis sport" value={defis ?? 0} />
            <Stat icon={<Gift style={ic} />} label="HKIM faits" value={hk?.done ?? 0} />
            <Stat icon={<Gift style={ic} />} label="HKIM à faire" value={hk?.pending ?? 0} />
          </div>
        </>
      )}
    </Shell>
  );
}

const ic: React.CSSProperties = { width: 18, height: 18, color: GOLD };
function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: any }) {
  return (
    <div style={{ ...cardBox, textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>{icon}</div>
      <div style={{ color: '#fff', fontWeight: 900, fontSize: '1.3rem' }}>{value}</div>
      <div style={{ color: '#94A3B8', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    </div>
  );
}
