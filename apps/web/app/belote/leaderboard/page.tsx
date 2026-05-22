/**
 * @file apps/web/app/belote/leaderboard/page.tsx
 * @description Classement Belote web (Phase 2) — thème bleu nuit cohérent avec
 *   le hub. Données prod réelles via GET /leaderboards/belote (tri par ELO sur
 *   la collection belote_users). La ligne du joueur courant est surlignée.
 */
'use client';

import { useEffect, useState } from 'react';
import { Medal } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { Screen, StateNote, cardBox, GOLD, BLUE } from '../_components/Screen';

interface Entry {
  rank: number;
  userId: string;
  username: string;
  elo: number;
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
}

const numberFmt = new Intl.NumberFormat('fr-FR');

export default function BeloteLeaderboard() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await apiClient.apiGet<{ entries: Entry[] }>('/leaderboards/belote?limit=50');
        if (!alive) return;
        setEntries(Array.isArray(res?.entries) ? res.entries : []);
      } catch (e: any) {
        if (alive) setError(e?.message || 'Erreur de chargement');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const myName = (user as any)?.username;

  return (
    <Screen title="Classement" subtitle="Top joueurs Belote · classés par ELO" icon={<Medal style={{ width: 26, height: 26, color: GOLD }} />}>
      {loading && <StateNote kind="loading" text="Chargement…" />}
      {error && !loading && <StateNote kind="error" text={error} />}
      {!loading && !error && entries && entries.length === 0 && (
        <StateNote kind="empty" text="Aucun joueur classé pour le moment." />
      )}

      {!loading && !error && entries && entries.length > 0 && (
        <div style={{ ...cardBox, padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <Th style={{ width: 56 }}>#</Th>
                <Th>Joueur</Th>
                <Th align="right">ELO</Th>
                <Th align="right">V</Th>
                <Th align="right">Win %</Th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                const medal = e.rank === 1 ? '🥇' : e.rank === 2 ? '🥈' : e.rank === 3 ? '🥉' : null;
                const isMe = myName && e.username === myName;
                return (
                  <tr key={`${e.userId}-${e.rank}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: isMe ? 'rgba(252,211,77,0.12)' : e.rank <= 3 ? 'rgba(252,211,77,0.04)' : 'transparent' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: isMe ? GOLD : '#94A3B8' }}>
                      {medal || e.rank}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(252,211,77,0.15)', color: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.72rem' }}>
                          {(e.username || '?').slice(0, 2).toUpperCase()}
                        </div>
                        <span style={{ color: '#fff', fontWeight: 700 }}>
                          {e.username}{isMe ? ' (vous)' : ''}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 900, color: GOLD }}>{numberFmt.format(e.elo)}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: '#4ADE80', fontWeight: 700 }}>{numberFmt.format(e.gamesWon)}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: BLUE, fontWeight: 700 }}>{e.winRate}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Screen>
  );
}

function Th({ children, align = 'left', style }: { children: React.ReactNode; align?: 'left' | 'right'; style?: React.CSSProperties }) {
  return (
    <th style={{ padding: '12px 14px', textAlign: align, color: '#64748B', fontSize: '0.66rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, ...style }}>
      {children}
    </th>
  );
}
