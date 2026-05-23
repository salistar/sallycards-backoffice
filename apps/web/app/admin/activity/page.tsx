/**
 * @file apps/web/app/admin/activity/page.tsx
 * @description Surveiller l'activité des utilisateurs : font-ils leurs défis ?
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';
import { AdminCard, Flash, inputStyle, GAMES3, GOLD, BLUE } from '../_ui';

export default function AdminActivity() {
  const [gameType, setGameType] = useState('belote');
  const [rows, setRows] = useState<any[]>([]);
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { const r = await apiClient.apiGet<any[]>(`/admin/activity?gameType=${gameType}`); setRows(Array.isArray(r) ? r : []); setFlash(null); }
    catch (e: any) { setFlash(e?.message || 'Accès admin requis'); }
  }, [gameType]);
  useEffect(() => { load(); }, [load]);

  const actifs = rows.filter((r) => r.active).length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 10, flexWrap: 'wrap' }}>
        <h1 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 900, margin: 0 }}>Activité des joueurs</h1>
        <select value={gameType} onChange={(e) => setGameType(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>{GAMES3.map((g) => <option key={g} value={g} style={{ color: '#000' }}>{g}</option>)}</select>
      </div>
      <Flash text={flash} />
      <div style={{ color: BLUE, fontSize: '0.85rem', marginBottom: 12 }}>{actifs} / {rows.length} joueurs actifs (au moins une partie ou un défi).</div>
      <AdminCard>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead><tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#64748B', textAlign: 'left' }}>
              <th style={th}>Joueur</th><th style={th}>Statut</th><th style={th}>Parties</th><th style={th}>Victoires</th><th style={th}>Défis faits</th><th style={th}>À faire</th><th style={th}>Actif ?</th>
            </tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.userId} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ ...td, color: '#fff', fontWeight: 700 }}>{r.username}</td>
                  <td style={td}><span style={{ color: r.status === 'online' ? '#4ADE80' : '#94A3B8' }}>● {r.status}</span></td>
                  <td style={{ ...td, color: '#E2E8F0' }}>{r.gamesPlayed}</td>
                  <td style={{ ...td, color: '#E2E8F0' }}>{r.gamesWon}</td>
                  <td style={{ ...td, color: '#4ADE80', fontWeight: 700 }}>{r.hkimDone}</td>
                  <td style={{ ...td, color: GOLD }}>{r.hkimPending}</td>
                  <td style={td}>{r.active ? '✅' : '⛔'}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={7} style={{ ...td, color: '#64748B', textAlign: 'center' }}>Aucun joueur.</td></tr>}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  );
}

const th: React.CSSProperties = { padding: '10px 12px', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 800 };
const td: React.CSSProperties = { padding: '10px 12px' };
