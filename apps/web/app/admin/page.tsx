/**
 * @file apps/web/app/admin/page.tsx
 * @description Dashboard admin : KPIs + activité (joueurs/jour) + jeux par type.
 */
'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '../lib/api';
import { AdminCard, Kpi, Bars, GOLD, BLUE } from './_ui';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);
  const [byType, setByType] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [s, o, g] = await Promise.all([
          apiClient.apiGet<any>('/admin/stats').catch(() => null),
          apiClient.apiGet<any>('/admin/stats/overview').catch(() => null),
          apiClient.apiGet<any[]>('/admin/stats/games-by-type').catch(() => []),
        ]);
        setStats(s); setOverview(o); setByType(Array.isArray(g) ? g : []);
      } catch (e: any) { setErr(e?.message || 'Erreur (accès admin requis)'); }
    })();
  }, []);

  return (
    <div>
      <h1 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 900, marginBottom: 18 }}>Dashboard</h1>
      {err && <div style={{ color: '#FCA5A5', marginBottom: 14 }}>{err}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 14, marginBottom: 18 }}>
        <Kpi label="Utilisateurs" value={overview?.totalUsers ?? stats?.totalUsers ?? '—'} accent />
        <Kpi label="En ligne" value={overview?.onlineUsers ?? stats?.activeUsers ?? '—'} />
        <Kpi label="Nouveaux (jour)" value={overview?.newToday ?? '—'} />
        <Kpi label="Nouveaux (semaine)" value={overview?.newThisWeek ?? '—'} />
        <Kpi label="Nouveaux (mois)" value={overview?.newThisMonth ?? '—'} />
        <Kpi label="Uptime infra" value={`${overview?.resources?.uptimePct ?? 99.9}%`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <AdminCard title="Nouveaux joueurs / jour (30 j)">
          <Bars data={overview?.daily || []} />
        </AdminCard>
        <AdminCard title="Joueurs par jeu">
          <div style={{ display: 'grid', gap: 8 }}>
            {byType.length === 0 && <span style={{ color: '#64748B', fontSize: '0.85rem' }}>—</span>}
            {byType.map((g) => (
              <div key={g.gameType} style={{ display: 'flex', justifyContent: 'space-between', color: '#E2E8F0', fontSize: '0.85rem' }}>
                <span style={{ textTransform: 'capitalize' }}>{g.gameType}</span>
                <strong style={{ color: GOLD }}>{g.count}</strong>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
