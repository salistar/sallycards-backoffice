/**
 * @file apps/web/app/admin/moderation/page.tsx
 * @description Modération du Mur de partage : voir, supprimer des posts, bannir
 *   un auteur (ne pourra plus poster).
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Trash2, Ban } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { AdminCard, Flash, inputStyle, card, GOLD, BLUE, ALL_GAMES } from '../_ui';

export default function AdminModeration() {
  const [gameType, setGameType] = useState('all');
  const [posts, setPosts] = useState<any[]>([]);
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { const r = await apiClient.apiGet<any[]>(`/admin/wall?gameType=${gameType}`); setPosts(Array.isArray(r) ? r : []); setFlash(null); }
    catch (e: any) { setFlash(e?.message || 'Accès admin requis'); }
  }, [gameType]);
  useEffect(() => { load(); }, [load]);

  const del = async (id: string) => { if (!confirm('Supprimer ce post ?')) return; try { await apiClient.apiDelete(`/admin/wall/${id}`); setFlash('Post supprimé.'); await load(); } catch (e: any) { setFlash(e?.message || 'Échec'); } };
  const ban = async (p: any) => { if (!confirm(`Bannir ${p.username} du mur ?`)) return; try { const r = await apiClient.apiPost<{ banned: number }>('/admin/ban', { userId: p.userId }); setFlash(`${p.username} banni (ne peut plus poster).`); } catch (e: any) { setFlash(e?.message || 'Échec'); } };

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 10, flexWrap: 'wrap' }}>
        <h1 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 900, margin: 0 }}>Modération du mur</h1>
        <select value={gameType} onChange={(e) => setGameType(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>
          <option value="all" style={{ color: '#000' }}>Tous les jeux</option>
          {ALL_GAMES.map((g) => <option key={g} value={g} style={{ color: '#000' }}>{g}</option>)}
        </select>
      </div>
      <Flash text={flash} />
      <AdminCard title={`Posts (${posts.length})`}>
        <div style={{ display: 'grid', gap: 8 }}>
          {posts.length === 0 && <span style={{ color: '#64748B', fontSize: '0.85rem' }}>Aucun post.</span>}
          {posts.map((p) => (
            <div key={p._id} style={{ ...card, padding: 12, display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.84rem' }}>{p.username} <span style={{ color: '#64748B', fontSize: '0.72rem', textTransform: 'capitalize' }}>· {p.gameType}{p.createdAt ? ` · ${new Date(p.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}` : ''}</span></div>
                <div style={{ color: '#CBD5E1', fontSize: '0.86rem', marginTop: 3, whiteSpace: 'pre-wrap' }}>{p.text}</div>
                {p.likes?.length > 0 && <div style={{ color: '#F87171', fontSize: '0.74rem', marginTop: 3 }}>♥ {p.likes.length}</div>}
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => del(p._id)} title="Supprimer le post" style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, padding: 7, color: '#FCA5A5', cursor: 'pointer' }}><Trash2 style={{ width: 15, height: 15 }} /></button>
                <button onClick={() => ban(p)} title="Bannir l'auteur" style={{ background: 'rgba(239,68,68,0.18)', border: 'none', borderRadius: 8, padding: 7, color: '#EF4444', cursor: 'pointer' }}><Ban style={{ width: 15, height: 15 }} /></button>
              </div>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}
