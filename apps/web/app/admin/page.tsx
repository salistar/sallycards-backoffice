/**
 * @file apps/web/app/admin/page.tsx
 * @description Dashboard admin : KPIs enrichis + activité (joueurs/jour) +
 *   joueurs par jeu + parties par jeu + en ligne par jeu.
 */
'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '../lib/api';
import { AdminCard, Kpi, Bars, GOLD } from './_ui';

const numberFmt = new Intl.NumberFormat('fr-FR');

function LabelBars({ data, valueKey, color }: { data: any[]; valueKey: string; color: string }) {
  const max = Math.max(1, ...data.map((d) => d[valueKey] || 0));
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {data.length === 0 && <span style={{ color: '#64748B', fontSize: '0.85rem' }}>—</span>}
      {data.map((d) => (
        <div key={d.gameType} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 92, color: '#CBD5E1', fontSize: '0.78rem', textTransform: 'capitalize', flexShrink: 0 }}>{d.gameType}</span>
          <div style={{ flex: 1, height: 16, background: 'rgba(255,255,255,0.06)', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ width: `${Math.round(((d[valueKey] || 0) / max) * 100)}%`, height: '100%', background: color, borderRadius: 6 }} />
          </div>
          <span style={{ width: 48, textAlign: 'right', color: '#fff', fontWeight: 700, fontSize: '0.8rem' }}>{numberFmt.format(d[valueKey] || 0)}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [o, setO] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    apiClient.apiGet<any>('/admin/stats/overview').then(setO).catch((e: any) => setErr(e?.message || 'Accès admin requis'));
  }, []);

  const pg = o?.perGame || [];

  return (
    <div>
      <h1 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 900, marginBottom: 18 }}>Dashboard</h1>
      {err && <div style={{ color: '#FCA5A5', marginBottom: 14 }}>{err}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 14, marginBottom: 18 }}>
        <Kpi label="Utilisateurs" value={o ? numberFmt.format(o.totalUsers) : '—'} accent />
        <Kpi label="En ligne" value={o?.onlineUsers ?? '—'} />
        <Kpi label="Nouveaux / jour" value={o?.newToday ?? '—'} />
        <Kpi label="Nouveaux / semaine" value={o?.newThisWeek ?? '—'} />
        <Kpi label="Nouveaux / mois" value={o?.newThisMonth ?? '—'} />
        <Kpi label="Parties jouées" value={o ? numberFmt.format(o.totalGamesPlayed) : '—'} accent />
        <Kpi label="Victoires" value={o ? numberFmt.format(o.totalGamesWon) : '—'} />
        <Kpi label="Tournois (ouverts)" value={o ? `${o.tournaments} (${o.openTournaments})` : '—'} />
        <Kpi label="Bons émis" value={o?.vouchers ?? '—'} />
        <Kpi label="Posts du mur" value={o?.posts ?? '—'} />
        <Kpi label="Notifs envoyées" value={o?.notifs ?? '—'} />
        <Kpi label="Uptime infra" value={`${o?.resources?.uptimePct ?? 99.9}%`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <AdminCard title="Nouveaux joueurs / jour (30 j)"><Bars data={o?.daily || []} /></AdminCard>
        <AdminCard title="Joueurs par jeu"><LabelBars data={pg} valueKey="users" color={`linear-gradient(90deg, ${GOLD}, #F59E0B)`} /></AdminCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <AdminCard title="Parties jouées par jeu"><LabelBars data={pg} valueKey="gamesPlayed" color="linear-gradient(90deg, #3B82F6, #1D4ED8)" /></AdminCard>
        <AdminCard title="En ligne par jeu"><LabelBars data={pg} valueKey="online" color="linear-gradient(90deg, #22C55E, #16A34A)" /></AdminCard>
      </div>
      <p style={{ color: '#64748B', fontSize: '0.78rem', marginTop: 14 }}>« Nouveaux joueurs » = inscriptions (proxy téléchargements). Ressources détaillées : module Infra Monitoring.</p>
    </div>
  );
}
