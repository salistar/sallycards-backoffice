/**
 * @file apps/web/app/admin/notifications/page.tsx
 * @description Créer et envoyer une notification + liste des notifications envoyées.
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { AdminCard, Btn, Field, inputStyle, Flash, ALL_GAMES, GOLD, BLUE, card } from '../_ui';

export default function AdminNotifications() {
  const [gameType, setGameType] = useState('all');
  const [type, setType] = useState('system');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [flash, setFlash] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [recent, setRecent] = useState<any[]>([]);

  const loadRecent = useCallback(async () => {
    try { const r = await apiClient.apiGet<any[]>('/admin/notifications/recent'); setRecent(Array.isArray(r) ? r : []); } catch { /* */ }
  }, []);
  useEffect(() => { loadRecent(); }, [loadRecent]);

  const send = async () => {
    if (!title.trim() || !body.trim()) { setFlash('Titre et message requis'); return; }
    setBusy(true); setFlash(null);
    try {
      const r = await apiClient.apiPost<{ sent: number }>('/admin/notifications/broadcast', { gameType, type, title, body });
      setFlash(`Notification envoyée à ${r.sent} utilisateur(s).`); setTitle(''); setBody(''); await loadRecent();
    } catch (e: any) { setFlash(e?.message || 'Échec (accès admin requis)'); } finally { setBusy(false); }
  };

  return (
    <div style={{ maxWidth: 720 }}>
      <h1 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 900, marginBottom: 18 }}>Notifications</h1>
      <Flash text={flash} />
      <AdminCard title="Composer un message">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <Field label="Cible (jeu)">
              <select value={gameType} onChange={(e) => setGameType(e.target.value)} style={inputStyle}>
                <option value="all" style={{ color: '#000' }}>Tous les jeux</option>
                {ALL_GAMES.map((g) => <option key={g} value={g} style={{ color: '#000' }}>{g}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <Field label="Type">
              <select value={type} onChange={(e) => setType(e.target.value)} style={inputStyle}>
                {['system', 'tournament_start', 'reward_issued', 'daily_challenge', 'achievement_unlocked'].map((t) => <option key={t} value={t} style={{ color: '#000' }}>{t}</option>)}
              </select>
            </Field>
          </div>
        </div>
        <Field label="Titre"><input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="Ex. Nouveau tournoi !" /></Field>
        <Field label="Message"><textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 90 }} value={body} onChange={(e) => setBody(e.target.value)} maxLength={300} placeholder="Le message envoyé dans la boîte de réception des joueurs…" /></Field>
        <Btn onClick={send} disabled={busy}><Send style={{ width: 15, height: 15, display: 'inline', verticalAlign: 'middle', marginRight: 5 }} />{busy ? 'Envoi…' : 'Envoyer'}</Btn>
      </AdminCard>

      <div style={{ height: 18 }} />
      <AdminCard title={`Notifications envoyées (${recent.length})`}>
        <div style={{ display: 'grid', gap: 8 }}>
          {recent.length === 0 && <span style={{ color: '#64748B', fontSize: '0.85rem' }}>Aucune notification envoyée.</span>}
          {recent.map((n, i) => (
            <div key={i} style={{ ...card, padding: 12, display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.9rem' }}>{n.title}</div>
                <div style={{ color: BLUE, fontSize: '0.8rem', marginTop: 2 }}>{n.body}</div>
              </div>
              <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                <div style={{ color: GOLD, fontWeight: 800, fontSize: '0.82rem' }}>{n.recipients} dest.</div>
                {n.sentAt && <div style={{ color: '#64748B', fontSize: '0.7rem' }}>{new Date(n.sentAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>}
              </div>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}
