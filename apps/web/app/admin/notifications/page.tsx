/**
 * @file apps/web/app/admin/notifications/page.tsx
 * @description Créer et envoyer une notification aux utilisateurs (par jeu/tous).
 */
'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { AdminCard, Btn, Field, inputStyle, Flash, ALL_GAMES } from '../_ui';

export default function AdminNotifications() {
  const [gameType, setGameType] = useState('all');
  const [type, setType] = useState('system');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [flash, setFlash] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!title.trim() || !body.trim()) { setFlash('Titre et message requis'); return; }
    setBusy(true); setFlash(null);
    try {
      const r = await apiClient.apiPost<{ sent: number }>('/admin/notifications/broadcast', { gameType, type, title, body });
      setFlash(`Notification envoyée à ${r.sent} utilisateur(s).`); setTitle(''); setBody('');
    } catch (e: any) { setFlash(e?.message || 'Échec (accès admin requis)'); } finally { setBusy(false); }
  };

  return (
    <div style={{ maxWidth: 620 }}>
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
    </div>
  );
}
