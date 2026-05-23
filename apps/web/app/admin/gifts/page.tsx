/**
 * @file apps/web/app/admin/gifts/page.tsx
 * @description Créer et envoyer un cadeau (bon d'achat) avec condition (parties min).
 */
'use client';

import { useState } from 'react';
import { Gift } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { AdminCard, Btn, Field, inputStyle, Flash, ALL_GAMES } from '../_ui';

export default function AdminGifts() {
  const [gameType, setGameType] = useState('all');
  const [amount, setAmount] = useState(10);
  const [currency, setCurrency] = useState('EUR');
  const [store, setStore] = useState('amazon');
  const [reason, setReason] = useState('Cadeau de l\'équipe SallyCards');
  const [minGamesPlayed, setMin] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true); setFlash(null);
    try {
      const r = await apiClient.apiPost<{ issued: number; condition: string }>('/admin/gifts', { gameType, amount, currency, providerStoreCode: store, reason, minGamesPlayed });
      setFlash(`Cadeau envoyé : ${r.issued} bon(s) (condition : ${r.condition}).`);
    } catch (e: any) { setFlash(e?.message || 'Échec (accès admin requis)'); } finally { setBusy(false); }
  };

  return (
    <div style={{ maxWidth: 620 }}>
      <h1 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 900, marginBottom: 18 }}>Cadeaux</h1>
      <Flash text={flash} />
      <AdminCard title="Créer un cadeau (bon d'achat)">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 150 }}><Field label="Cible (jeu)"><select value={gameType} onChange={(e) => setGameType(e.target.value)} style={inputStyle}><option value="all" style={{ color: '#000' }}>Tous les jeux</option>{ALL_GAMES.map((g) => <option key={g} value={g} style={{ color: '#000' }}>{g}</option>)}</select></Field></div>
          <div style={{ flex: 1, minWidth: 120 }}><Field label="Montant"><input type="number" style={inputStyle} value={amount} onChange={(e) => setAmount(+e.target.value)} /></Field></div>
          <div style={{ flex: 1, minWidth: 110 }}><Field label="Devise"><select value={currency} onChange={(e) => setCurrency(e.target.value)} style={inputStyle}>{['EUR', 'USD', 'MAD'].map((c) => <option key={c} value={c} style={{ color: '#000' }}>{c}</option>)}</select></Field></div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 150 }}><Field label="Enseigne"><select value={store} onChange={(e) => setStore(e.target.value)} style={inputStyle}>{['amazon', 'fnac', 'decathlon', 'apple', 'google_play', 'custom'].map((s) => <option key={s} value={s} style={{ color: '#000' }}>{s}</option>)}</select></Field></div>
          <div style={{ flex: 1, minWidth: 150 }}><Field label="Condition : parties min. jouées"><input type="number" min={0} style={inputStyle} value={minGamesPlayed} onChange={(e) => setMin(+e.target.value)} /></Field></div>
        </div>
        <Field label="Raison / message"><input style={inputStyle} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={120} /></Field>
        <Btn onClick={create} disabled={busy}><Gift style={{ width: 15, height: 15, display: 'inline', verticalAlign: 'middle', marginRight: 5 }} />{busy ? 'Envoi…' : 'Créer & envoyer'}</Btn>
        <p style={{ color: '#64748B', fontSize: '0.78rem', marginTop: 10 }}>Le bon apparaît dans « Récompenses » des joueurs éligibles. Condition 0 = tous les joueurs.</p>
      </AdminCard>
    </div>
  );
}
