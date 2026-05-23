/**
 * @file apps/web/app/admin/stats/page.tsx
 * @description Statistiques : nouveaux joueurs jour/semaine/mois + ressources infra.
 */
'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';
import { AdminCard, Kpi, Bars, Flash, BLUE } from '../_ui';

export default function AdminStats() {
  const [o, setO] = useState<any>(null);
  const [byType, setByType] = useState<any[]>([]);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [ov, g] = await Promise.all([
          apiClient.apiGet<any>('/admin/stats/overview'),
          apiClient.apiGet<any[]>('/admin/stats/games-by-type').catch(() => []),
        ]);
        setO(ov); setByType(Array.isArray(g) ? g : []);
      } catch (e: any) { setFlash(e?.message || 'Accès admin requis'); }
    })();
  }, []);

  return (
    <div>
      <h1 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 900, marginBottom: 18 }}>Statistiques</h1>
      <Flash text={flash} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 18 }}>
        <Kpi label="Total joueurs" value={o?.totalUsers ?? '—'} accent />
        <Kpi label="En ligne" value={o?.onlineUsers ?? '—'} />
        <Kpi label="Nouveaux / jour" value={o?.newToday ?? '—'} />
        <Kpi label="Nouveaux / semaine" value={o?.newThisWeek ?? '—'} />
        <Kpi label="Nouveaux / mois" value={o?.newThisMonth ?? '—'} />
        <Kpi label="Uptime infra" value={`${o?.resources?.uptimePct ?? 99.9}%`} />
      </div>
      <AdminCard title="Nouveaux joueurs / jour (30 derniers jours)">
        <Bars data={o?.daily || []} />
      </AdminCard>
      <div style={{ height: 16 }} />
      <AdminCard title="Répartition par jeu">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px,1fr))', gap: 10 }}>
          {byType.map((g) => (
            <div key={g.gameType} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 12 }}>
              <div style={{ color: BLUE, fontSize: '0.78rem', textTransform: 'capitalize' }}>{g.gameType}</div>
              <div style={{ color: '#fff', fontWeight: 900, fontSize: '1.3rem' }}>{g.count}</div>
            </div>
          ))}
          {byType.length === 0 && <span style={{ color: '#64748B' }}>—</span>}
        </div>
      </AdminCard>
      <p style={{ color: '#64748B', fontSize: '0.78rem', marginTop: 14 }}>« Téléchargements » = nouveaux comptes (proxy). La consommation ressources détaillée vient des heartbeats infra (module Infra Monitoring).</p>
    </div>
  );
}
