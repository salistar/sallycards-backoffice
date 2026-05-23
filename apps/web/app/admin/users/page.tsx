/**
 * @file apps/web/app/admin/users/page.tsx
 * @description Gestion des comptes : lister, ajouter, modifier, supprimer.
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { AdminCard, Btn, Field, inputStyle, Flash, ALL_GAMES, GOLD, BLUE, CARD } from '../_ui';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [gameType, setGameType] = useState('belote');
  const [flash, setFlash] = useState<string | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try { const r = await apiClient.listUsers({ gameType, search, limit: 50 }); setUsers(r.users || []); }
    catch (e: any) { setFlash(e?.message || 'Accès admin requis'); }
  }, [gameType, search]);
  useEffect(() => { load(); }, [load]);

  const del = async (u: any) => {
    if (!confirm(`Supprimer ${u.username} ?`)) return;
    try { await apiClient.deleteUserById(u._id || u.id); setFlash('Compte supprimé'); await load(); } catch (e: any) { setFlash(e?.message || 'Échec'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 10, flexWrap: 'wrap' }}>
        <h1 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 900, margin: 0 }}>Utilisateurs</h1>
        <Btn onClick={() => { setCreating(true); setEditing({ username: '', email: '', password: '', role: 'player', gameType }); }}><Plus style={{ width: 15, height: 15, display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Ajouter</Btn>
      </div>
      <Flash text={flash} />

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <select value={gameType} onChange={(e) => setGameType(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>
          {ALL_GAMES.map((g) => <option key={g} value={g} style={{ color: '#000' }}>{g}</option>)}
        </select>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search style={{ width: 16, height: 16, color: '#64748B', position: 'absolute', left: 10, top: 11 }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher…" style={{ ...inputStyle, paddingLeft: 32 }} />
        </div>
      </div>

      <AdminCard>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead><tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#64748B', textAlign: 'left' }}>
              <th style={th}>Joueur</th><th style={th}>Email</th><th style={th}>Rôle</th><th style={th}>ELO</th><th style={{ ...th, textAlign: 'right' }}>Actions</th>
            </tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id || u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ ...td, color: '#fff', fontWeight: 700 }}>{u.username}</td>
                  <td style={{ ...td, color: BLUE }}>{u.email}</td>
                  <td style={td}><span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: u.role === 'admin' ? 'rgba(252,211,77,0.15)' : 'rgba(255,255,255,0.08)', color: u.role === 'admin' ? GOLD : '#94A3B8' }}>{u.role || 'player'}</span></td>
                  <td style={{ ...td, color: '#E2E8F0' }}>{u.stats?.elo ?? 1000}</td>
                  <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button onClick={() => { setCreating(false); setEditing({ ...u, gameType }); }} style={iconBtn}><Pencil style={{ width: 15, height: 15 }} /></button>
                    <button onClick={() => del(u)} style={{ ...iconBtn, color: '#FCA5A5' }}><Trash2 style={{ width: 15, height: 15 }} /></button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={5} style={{ ...td, color: '#64748B', textAlign: 'center' }}>Aucun utilisateur.</td></tr>}
            </tbody>
          </table>
        </div>
      </AdminCard>

      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }} onClick={() => setEditing(null)}>
          <div style={{ background: CARD, borderRadius: 14, padding: 22, width: 380, maxWidth: '100%' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: '#fff', fontWeight: 800, marginBottom: 14 }}>{creating ? 'Nouveau compte' : `Modifier ${editing.username}`}</h2>
            <Field label="Nom d'utilisateur"><input style={inputStyle} value={editing.username || ''} onChange={(e) => setEditing({ ...editing, username: e.target.value })} /></Field>
            <Field label="Email"><input style={inputStyle} value={editing.email || ''} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></Field>
            {creating && <Field label="Mot de passe"><input style={inputStyle} type="password" value={editing.password || ''} onChange={(e) => setEditing({ ...editing, password: e.target.value })} /></Field>}
            <Field label="Rôle">
              <select style={inputStyle} value={editing.role || 'player'} onChange={(e) => setEditing({ ...editing, role: e.target.value })}>
                <option value="player" style={{ color: '#000' }}>player</option>
                <option value="admin" style={{ color: '#000' }}>admin</option>
              </select>
            </Field>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <Btn kind="ghost" onClick={() => setEditing(null)}>Annuler</Btn>
              <Btn onClick={async () => {
                try {
                  if (creating) await apiClient.createUser({ username: editing.username, email: editing.email, password: editing.password, role: editing.role, gameType });
                  else await apiClient.updateUserById(editing._id || editing.id, { username: editing.username, email: editing.email, role: editing.role });
                  setEditing(null); setFlash(creating ? 'Compte créé' : 'Compte mis à jour'); await load();
                } catch (e: any) { setFlash(e?.message || 'Échec'); }
              }}>Enregistrer</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const th: React.CSSProperties = { padding: '10px 12px', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 800 };
const td: React.CSSProperties = { padding: '10px 12px' };
const iconBtn: React.CSSProperties = { background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, padding: 7, color: '#fff', cursor: 'pointer', marginLeft: 6 };
