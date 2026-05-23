/**
 * @file apps/web/app/admin/page.tsx
 * @description Dashboard admin — 100% calculé depuis la BD. KPIs, filtre de
 *   période (7/30/90 j), inscriptions/jour, parties/jour, camembert par jeu,
 *   top 10 ELO, rétention, complétion défis, et métriques réelles serveur + BD.
 */
'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '../lib/api';
import { AdminCard, Kpi, Bars, GOLD } from './_ui';

const numberFmt = new Intl.NumberFormat('fr-FR');
const PIE_COLORS = ['#FCD34D', '#3B82F6', '#22C55E', '#EC4899', '#A855F7', '#06B6D4', '#F97316', '#84CC16', '#EF4444', '#14B8A6', '#6366F1'];

function fmtUptime(sec?: number) {
  if (!sec) return '—';
  const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600);
  return d > 0 ? `${d}j ${h}h` : `${h}h ${Math.floor((sec % 3600) / 60)}m`;
}

function Pie({ data }: { data: { gameType: string; users: number }[] }) {
  const total = data.reduce((s, d) => s + d.users, 0) || 1;
  let acc = 0;
  const stops = data.map((d, i) => { const from = (acc / total) * 360; acc += d.users; const to = (acc / total) * 360; return `${PIE_COLORS[i % PIE_COLORS.length]} ${from}deg ${to}deg`; }).join(', ');
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ width: 130, height: 130, borderRadius: '50%', background: `conic-gradient(${stops})`, flexShrink: 0 }} />
      <div style={{ display: 'grid', gap: 5, flex: 1, minWidth: 130 }}>
        {data.map((d, i) => (
          <div key={d.gameType} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem' }}>
            <span style={{ width: 11, height: 11, borderRadius: 3, background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
            <span style={{ color: '#CBD5E1', textTransform: 'capitalize', flex: 1 }}>{d.gameType}</span>
            <strong style={{ color: '#fff' }}>{d.users}</strong>
            <span style={{ color: '#64748B' }}>{Math.round((d.users / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Bar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#CBD5E1', marginBottom: 4 }}><span>{label}</span><strong style={{ color: '#fff' }}>{pct}%</strong></div>
      <div style={{ height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}><div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: color }} /></div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: any }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{k}</span><strong style={{ color: '#fff' }}>{v ?? '—'}</strong></div>;
}

export default function AdminDashboard() {
  const [days, setDays] = useState(30);
  const [o, setO] = useState<any>(null);
  const [m, setM] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    apiClient.apiGet<any>(`/admin/stats/overview?days=${days}`).then(setO).catch((e: any) => setErr(e?.message || 'Accès admin requis'));
  }, [days]);
  useEffect(() => { apiClient.apiGet<any>('/admin/metrics').then(setM).catch(() => {}); }, []);

  const pg = o?.perGame || [];
  const srv = m?.server; const db = m?.db;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 10, flexWrap: 'wrap' }}>
        <h1 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 900, margin: 0 }}>Dashboard</h1>
        <div style={{ display: 'flex', gap: 6 }}>
          {[7, 30, 90].map((d) => (
            <button key={d} onClick={() => setDays(d)} style={{ background: days === d ? `linear-gradient(90deg, ${GOLD}, #F59E0B)` : 'rgba(255,255,255,0.08)', color: days === d ? '#0A1535' : '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999, padding: '6px 14px', fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem' }}>{d}j</button>
          ))}
        </div>
      </div>
      {err && <div style={{ color: '#FCA5A5', marginBottom: 14 }}>{err}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14, marginBottom: 18 }}>
        <Kpi label="Utilisateurs" value={o ? numberFmt.format(o.totalUsers) : '—'} accent />
        <Kpi label="En ligne" value={o?.onlineUsers ?? '—'} />
        <Kpi label={`Nouveaux (${days}j)`} value={o ? numberFmt.format(o.newThisMonth ?? 0) : '—'} />
        <Kpi label="Parties jouées" value={o ? numberFmt.format(o.totalGamesPlayed) : '—'} accent />
        <Kpi label="Victoires" value={o ? numberFmt.format(o.totalGamesWon) : '—'} />
        <Kpi label="Tournois (ouv.)" value={o ? `${o.tournaments} (${o.openTournaments})` : '—'} />
        <Kpi label="Bons émis" value={o?.vouchers ?? '—'} />
        <Kpi label="Posts du mur" value={o?.posts ?? '—'} />
        <Kpi label="Notifs envoyées" value={o?.notifs ?? '—'} />
        <Kpi label="Rétention J+1" value={o ? `${o.retention?.j1 ?? 0}%` : '—'} />
        <Kpi label="Rétention J+7" value={o ? `${o.retention?.j7 ?? 0}%` : '—'} />
        <Kpi label="Défis complétés" value={o ? `${o.challengeCompletion?.pct ?? 0}%` : '—'} accent />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <AdminCard title={`Inscriptions / jour (${days}j)`}><Bars data={o?.daily || []} /></AdminCard>
        <AdminCard title={`Parties / jour (${days}j)`}><Bars data={o?.dailyGames || []} /></AdminCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <AdminCard title="Répartition des joueurs par jeu"><Pie data={pg} /></AdminCard>
        <AdminCard title="Top 10 joueurs (ELO)">
          <div style={{ display: 'grid', gap: 6 }}>
            {(o?.topPlayers || []).length === 0 && <span style={{ color: '#64748B', fontSize: '0.85rem' }}>—</span>}
            {(o?.topPlayers || []).map((p: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.84rem' }}>
                <span style={{ width: 22, color: i < 3 ? GOLD : '#64748B', fontWeight: 800 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</span>
                <span style={{ flex: 1, color: '#fff', fontWeight: 600 }}>{p.username} <span style={{ color: '#64748B', fontSize: '0.72rem', textTransform: 'capitalize' }}>· {p.gameType}</span></span>
                <strong style={{ color: GOLD }}>{numberFmt.format(p.elo)}</strong>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>

      <AdminCard title="Ressources serveur & base de données (temps réel)">
        {!m && <span style={{ color: '#64748B', fontSize: '0.85rem' }}>Chargement des métriques…</span>}
        {srv && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <div style={{ color: GOLD, fontWeight: 800, fontSize: '0.82rem', marginBottom: 10 }}>Serveur</div>
              <Bar label={`CPU (load ${srv.loadAvg?.[0] ?? 0} / ${srv.cpus} cœurs)`} pct={srv.cpuLoadPct ?? 0} color="linear-gradient(90deg, #F97316, #EF4444)" />
              <Bar label={`RAM (${numberFmt.format(srv.memUsedMB)} / ${numberFmt.format(srv.memTotalMB)} Mo)`} pct={srv.memUsedPct ?? 0} color="linear-gradient(90deg, #3B82F6, #1D4ED8)" />
              {srv.disk && <Bar label={`Disque (${srv.disk.totalGB - srv.disk.freeGB} / ${srv.disk.totalGB} Go)`} pct={srv.disk.usedPct ?? 0} color="linear-gradient(90deg, #A855F7, #7C3AED)" />}
              <div style={{ color: '#94A3B8', fontSize: '0.78rem', marginTop: 8 }}>Uptime serveur : <strong style={{ color: '#fff' }}>{fmtUptime(srv.uptimeSec)}</strong> · process {srv.processRssMB} Mo</div>
            </div>
            <div>
              <div style={{ color: GOLD, fontWeight: 800, fontSize: '0.82rem', marginBottom: 10 }}>Base de données (MongoDB {db?.version || ''})</div>
              <div style={{ display: 'grid', gap: 6, fontSize: '0.82rem', color: '#CBD5E1' }}>
                <Row k="Collections" v={db?.collections} />
                <Row k="Documents" v={db ? numberFmt.format(db.objects) : '—'} />
                <Row k="Données" v={db ? `${numberFmt.format(db.dataSizeMB)} Mo` : '—'} />
                <Row k="Stockage" v={db ? `${numberFmt.format(db.storageSizeMB)} Mo` : '—'} />
                <Row k="Index" v={db ? `${db.indexes} (${numberFmt.format(db.indexSizeMB)} Mo)` : '—'} />
                <Row k="Connexions" v={db?.connections} />
                <Row k="Uptime BD" v={fmtUptime(db?.uptimeSec)} />
              </div>
            </div>
          </div>
        )}
      </AdminCard>
    </div>
  );
}
