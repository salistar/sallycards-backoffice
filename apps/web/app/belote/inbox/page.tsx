/**
 * @file apps/web/app/belote/inbox/page.tsx
 * @description Boîte de réception web (Phase 2) — notifications (/notifications),
 *   marquer lu (PATCH /notifications/:id), tout marquer lu (POST /notifications/read-all).
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Inbox, CheckCheck } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { Screen, StateNote, cardBox, GOLD, BLUE } from '../_components/Screen';

interface Notif {
  _id: string;
  type: string;
  title: string;
  body: string;
  sentAt?: string;
  readAt?: string;
}

export default function InboxScreen() {
  const [list, setList] = useState<Notif[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiClient.apiGet<Notif[]>('/notifications');
      setList(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markRead = async (id: string) => {
    try { await apiClient.apiPatch(`/notifications/${id}`, { read: true }); await load(); } catch { /* noop */ }
  };
  const readAll = async () => {
    setBusy(true);
    try { await apiClient.apiPost('/notifications/read-all', {}); await load(); }
    catch { /* noop */ } finally { setBusy(false); }
  };

  const unread = list?.filter((n) => !n.readAt).length ?? 0;

  return (
    <Screen title="Boîte de réception" subtitle={unread > 0 ? `${unread} non lue(s)` : 'Tout est à jour'} icon={<Inbox style={{ width: 26, height: 26, color: GOLD }} />}>
      {unread > 0 && (
        <button onClick={readAll} disabled={busy} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999, padding: '8px 16px', cursor: 'pointer', fontWeight: 700, marginBottom: 18 }}>
          <CheckCheck style={{ width: 16, height: 16 }} /> Tout marquer comme lu
        </button>
      )}

      {loading && <StateNote kind="loading" text="Chargement…" />}
      {error && !loading && <StateNote kind="error" text={error} />}
      {!loading && !error && list && list.length === 0 && (
        <StateNote kind="empty" text="Aucune notification." />
      )}

      <div style={{ display: 'grid', gap: 10 }}>
        {list?.map((n) => {
          const isRead = !!n.readAt;
          return (
            <button
              key={n._id}
              onClick={() => !isRead && markRead(n._id)}
              style={{
                ...cardBox, textAlign: 'left', cursor: isRead ? 'default' : 'pointer',
                borderLeft: `3px solid ${isRead ? 'transparent' : GOLD}`,
                opacity: isRead ? 0.7 : 1,
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem' }}>{n.title}</span>
                {n.sentAt && <span style={{ color: '#94A3B8', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>{new Date(n.sentAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>}
              </div>
              <div style={{ color: BLUE, fontSize: '0.85rem', marginTop: 4 }}>{n.body}</div>
            </button>
          );
        })}
      </div>
    </Screen>
  );
}
