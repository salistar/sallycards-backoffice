/**
 * @file apps/web/app/belote/friends/page.tsx
 * @description Écran Amis web (Phase 2) — liste relations (/friends), envoi de
 *   demande (POST /friends), accepter/refuser une demande reçue (PATCH /friends/:id).
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Users, UserPlus, Check, X, Clock } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { Screen, StateNote, cardBox, GOLD, BLUE } from '../_components/Screen';

interface Friend {
  _id: string;
  otherUserId: string;
  status: 'pending' | 'accepted' | 'blocked';
  direction: 'sent' | 'received';
  requestedAt?: string;
}

export default function FriendsScreen() {
  const [list, setList] = useState<Friend[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [addId, setAddId] = useState('');
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiClient.apiGet<Friend[]>('/friends');
      setList(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const sendRequest = async () => {
    if (!addId.trim()) return;
    setBusy(true); setFlash(null);
    try {
      await apiClient.apiPost('/friends', { receiverId: addId.trim() });
      setAddId('');
      setFlash('Demande envoyée ✓');
      await load();
    } catch (e: any) {
      setFlash(e?.message || 'Échec de l’envoi');
    } finally { setBusy(false); }
  };

  const respond = async (id: string, status: 'accepted' | 'blocked') => {
    setBusy(true);
    try { await apiClient.apiPatch(`/friends/${id}`, { status }); await load(); }
    catch (e: any) { setFlash(e?.message || 'Échec'); }
    finally { setBusy(false); }
  };

  const accepted = list?.filter((f) => f.status === 'accepted') ?? [];
  const incoming = list?.filter((f) => f.status === 'pending' && f.direction === 'received') ?? [];
  const outgoing = list?.filter((f) => f.status === 'pending' && f.direction === 'sent') ?? [];

  return (
    <Screen title="Amis" subtitle="Liste, invitations envoyées et reçues" icon={<Users style={{ width: 26, height: 26, color: GOLD }} />}>
      {/* Ajouter un ami */}
      <div style={{ ...cardBox, display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
        <input
          value={addId}
          onChange={(e) => setAddId(e.target.value)}
          placeholder="ID utilisateur à ajouter"
          style={{ flex: 1, minWidth: 180, background: '#0F2238', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 12px', color: '#fff', outline: 'none' }}
        />
        <button onClick={sendRequest} disabled={busy || !addId.trim()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: '#0A1535', fontWeight: 800, border: 'none', borderRadius: 10, padding: '10px 18px', cursor: busy ? 'default' : 'pointer', opacity: busy || !addId.trim() ? 0.6 : 1 }}>
          <UserPlus style={{ width: 16, height: 16 }} /> Inviter
        </button>
      </div>
      {flash && <div style={{ marginBottom: 16, color: GOLD, fontWeight: 600 }}>{flash}</div>}

      {loading && <StateNote kind="loading" text="Chargement…" />}
      {error && !loading && <StateNote kind="error" text={error} />}

      {!loading && !error && (
        <>
          <Section title={`Amis (${accepted.length})`}>
            {accepted.length === 0
              ? <StateNote kind="empty" text="Pas encore d'amis acceptés." />
              : accepted.map((f) => <Row key={f._id} f={f} />)}
          </Section>

          {incoming.length > 0 && (
            <Section title={`Demandes reçues (${incoming.length})`}>
              {incoming.map((f) => (
                <Row key={f._id} f={f} actions={
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => respond(f._id, 'accepted')} disabled={busy} style={iconBtn('#22C55E')}><Check style={{ width: 16, height: 16 }} /></button>
                    <button onClick={() => respond(f._id, 'blocked')} disabled={busy} style={iconBtn('#EF4444')}><X style={{ width: 16, height: 16 }} /></button>
                  </div>
                } />
              ))}
            </Section>
          )}

          {outgoing.length > 0 && (
            <Section title={`Invitations envoyées (${outgoing.length})`}>
              {outgoing.map((f) => <Row key={f._id} f={f} actions={<Clock style={{ width: 16, height: 16, color: BLUE }} />} />)}
            </Section>
          )}
        </>
      )}
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h2 style={{ color: '#fff', fontSize: '1rem', fontWeight: 800, marginBottom: 10 }}>{title}</h2>
      <div style={{ display: 'grid', gap: 10 }}>{children}</div>
    </div>
  );
}

function Row({ f, actions }: { f: Friend; actions?: React.ReactNode }) {
  const initial = f.otherUserId.slice(-2).toUpperCase();
  return (
    <div style={{ ...cardBox, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(252,211,77,0.15)', color: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>{initial}</div>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.otherUserId}</span>
      </div>
      {actions}
    </div>
  );
}

const iconBtn = (color: string): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 34, height: 34, borderRadius: 10, border: 'none', cursor: 'pointer',
  background: `${color}22`, color,
});
