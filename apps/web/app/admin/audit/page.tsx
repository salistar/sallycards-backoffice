/**
 * @file apps/web/app/admin/audit/page.tsx
 * @description Journal d'audit : actions admin (notifications, tournois, cadeaux,
 *   bannissements, suppressions…) avec export CSV.
 */
'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { AdminCard, Btn, Flash, card, GOLD, BLUE, downloadCSV } from '../_ui';

const LABEL: Record<string, string> = {
  'notification.broadcast': '📣 Notification', 'tournament.create': '🏆 Tournoi créé', 'tournament.update': '✏️ Tournoi modifié',
  'tournament.delete': '🗑️ Tournoi supprimé', 'gift.create': '🎁 Cadeau émis', 'wall.delete': '🧹 Post supprimé',
  'user.ban': '⛔ Bannissement', 'user.unban': '✅ Débannissement',
};

export default function AdminAudit() {
  const [rows, setRows] = useState<any[]>([]);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    apiClient.apiGet<any[]>('/admin/audit').then((r) => setRows(Array.isArray(r) ? r : [])).catch((e: any) => setFlash(e?.message || 'Accès admin requis'));
  }, []);

  return (
    <div style={{ maxWidth: 820 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <h1 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 900, margin: 0 }}>Journal d'audit</h1>
        <Btn kind="ghost" onClick={() => downloadCSV('audit.csv', rows.map((r) => ({ at: r.at, action: r.action, by: r.by, details: r.details })))}><Download style={{ width: 14, height: 14, display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />CSV</Btn>
      </div>
      <Flash text={flash} />
      <AdminCard title={`Actions récentes (${rows.length})`}>
        <div style={{ display: 'grid', gap: 8 }}>
          {rows.length === 0 && <span style={{ color: '#64748B', fontSize: '0.85rem' }}>Aucune action enregistrée.</span>}
          {rows.map((r, i) => (
            <div key={i} style={{ ...card, padding: 12, display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.86rem' }}>{LABEL[r.action] || r.action}</div>
                <div style={{ color: BLUE, fontSize: '0.76rem', marginTop: 2 }}>{Object.entries(r.details || {}).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(' · ') || '—'}</div>
              </div>
              <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                {r.at && <div style={{ color: '#94A3B8', fontSize: '0.72rem' }}>{new Date(r.at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>}
                <div style={{ color: GOLD, fontSize: '0.7rem' }}>par {String(r.by || '').slice(-6)}</div>
              </div>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}
