/**
 * @file apps/web/app/admin/tournaments/page.tsx
 * @description Créer un tournoi (jeu, type, durée, dotations) et le publier.
 */
'use client';

import { useState } from 'react';
import { Trophy } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { AdminCard, Btn, Field, inputStyle, Flash, ALL_GAMES } from '../_ui';

export default function AdminTournaments() {
  const [gameType, setGameType] = useState('belote');
  const [type, setType] = useState('daily');
  const [days, setDays] = useState(7);
  const [g1, setG1] = useState(500);
  const [g2, setG2] = useState(250);
  const [g3, setG3] = useState(100);
  const [flash, setFlash] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true); setFlash(null);
    try {
      const now = Date.now();
      await apiClient.apiPost('/admin/tournaments', {
        gameType, type, startsAt: now, endsAt: now + days * 24 * 3600 * 1000,
        prizes: [{ rank: 1, gold: g1 }, { rank: 2, gold: g2 }, { rank: 3, gold: g3 }],
      });
      setFlash(`Tournoi ${type} ${gameType} créé et ouvert.`);
    } catch (e: any) { setFlash(e?.message || 'Échec (accès admin requis)'); } finally { setBusy(false); }
  };

  return (
    <div style={{ maxWidth: 620 }}>
      <h1 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 900, marginBottom: 18 }}>Tournois</h1>
      <Flash text={flash} />
      <AdminCard title="Créer un tournoi">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 150 }}><Field label="Jeu"><select value={gameType} onChange={(e) => setGameType(e.target.value)} style={inputStyle}>{ALL_GAMES.map((g) => <option key={g} value={g} style={{ color: '#000' }}>{g}</option>)}</select></Field></div>
          <div style={{ flex: 1, minWidth: 150 }}><Field label="Type"><select value={type} onChange={(e) => setType(e.target.value)} style={inputStyle}>{['daily', 'weekly', 'special'].map((t) => <option key={t} value={t} style={{ color: '#000' }}>{t}</option>)}</select></Field></div>
          <div style={{ flex: 1, minWidth: 120 }}><Field label="Durée (jours)"><input type="number" min={1} max={60} style={inputStyle} value={days} onChange={(e) => setDays(+e.target.value)} /></Field></div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}><Field label="🥇 Gold"><input type="number" style={inputStyle} value={g1} onChange={(e) => setG1(+e.target.value)} /></Field></div>
          <div style={{ flex: 1 }}><Field label="🥈 Gold"><input type="number" style={inputStyle} value={g2} onChange={(e) => setG2(+e.target.value)} /></Field></div>
          <div style={{ flex: 1 }}><Field label="🥉 Gold"><input type="number" style={inputStyle} value={g3} onChange={(e) => setG3(+e.target.value)} /></Field></div>
        </div>
        <Btn onClick={create} disabled={busy}><Trophy style={{ width: 15, height: 15, display: 'inline', verticalAlign: 'middle', marginRight: 5 }} />{busy ? 'Création…' : 'Créer & publier'}</Btn>
      </AdminCard>
    </div>
  );
}
