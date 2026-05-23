/**
 * @file apps/web/app/admin/gifts/page.tsx
 * @description Créer et envoyer un cadeau (bon d'achat) avec condition (parties min).
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Gift, Download, XCircle } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { AdminCard, Btn, Field, inputStyle, Flash, ALL_GAMES, GOLD, BLUE, card, downloadCSV } from '../_ui';

const VSTATUS: Record<string, { fg: string; label: string }> = { issued: { fg: '#4ADE80', label: 'Disponible' }, claimed: { fg: '#93C5FD', label: 'Réclamé' }, expired: { fg: '#94A3B8', label: 'Révoqué/Expiré' } };

export default function AdminGifts() {
  const [gameType, setGameType] = useState('all');
  const [amount, setAmount] = useState(10);
  const [currency, setCurrency] = useState('EUR');
  const [store, setStore] = useState('amazon');
  const [reason, setReason] = useState('Cadeau de l\'équipe SallyCards');
  const [minGamesPlayed, setMin] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [list, setList] = useState<any[]>([]);

  const load = useCallback(async () => {
    try { const r = await apiClient.apiGet<any[]>('/admin/gifts'); setList(Array.isArray(r) ? r : []); } catch { /* */ }
  }, []);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    setBusy(true); setFlash(null);
    try {
      const r = await apiClient.apiPost<{ issued: number; condition: string }>('/admin/gifts', { gameType, amount, currency, providerStoreCode: store, reason, minGamesPlayed });
      setFlash(`Cadeau envoyé : ${r.issued} bon(s) (condition : ${r.condition}).`); await load();
    } catch (e: any) { setFlash(e?.message || 'Échec (accès admin requis)'); } finally { setBusy(false); }
  };

  const revoke = async (code: string) => { if (!confirm(`Révoquer le bon ${code} ?`)) return; try { await apiClient.apiPost(`/admin/gifts/${code}/revoke`, {}); setFlash(`Bon ${code} révoqué.`); await load(); } catch (e: any) { setFlash(e?.message || 'Échec'); } };

  return (
    <div style={{ maxWidth: 760 }}>
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

      <div style={{ height: 18 }} />
      <AdminCard title={`Bons émis (${list.length})`} right={<Btn kind="ghost" onClick={() => downloadCSV('bons.csv', list)}><Download style={{ width: 14, height: 14, display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />CSV</Btn>}>
        <div style={{ display: 'grid', gap: 8 }}>
          {list.length === 0 && <span style={{ color: '#64748B', fontSize: '0.85rem' }}>Aucun bon émis.</span>}
          {list.map((v) => {
            const st = VSTATUS[v.status] || VSTATUS.expired;
            return (
              <div key={v.code} style={{ ...card, padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.86rem' }}>{v.providerStoreCode} · {v.amount} {v.currency} <code style={{ color: '#64748B', fontSize: '0.72rem' }}>{v.code}</code></div>
                  <div style={{ color: BLUE, fontSize: '0.76rem' }}>{v.reason}{v.issuedAt ? ` · ${new Date(v.issuedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}` : ''}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: st.fg }}>{st.label}</span>
                  {v.status === 'issued' && <button onClick={() => revoke(v.code)} title="Révoquer" style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, padding: 7, color: '#FCA5A5', cursor: 'pointer' }}><XCircle style={{ width: 15, height: 15 }} /></button>}
                </div>
              </div>
            );
          })}
        </div>
      </AdminCard>
    </div>
  );
}
