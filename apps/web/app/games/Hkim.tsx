/**
 * @file apps/web/app/games/Hkim.tsx
 * @description Mur HKIM générique (challenges + fil d'actualité) par jeu.
 *   - "Mes défis" : cartes Départ → Arrivée, distance, échéance, statut. Le
 *     tracking GPS se lance depuis le mobile ; le web permet de marquer fait.
 *   - "Mur d'actualité" : défis réussis par tous + commentaires (on peut poster).
 *   Branché sur /hkim/:game (REST). Indépendant par jeu (collection hkim_<jeu>).
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Footprints, MapPin, MessageCircle, Send, CheckCircle2, Clock } from 'lucide-react';
import { apiClient } from '../lib/api';
import { Shell, StateNote, cardBox, GOLD, BLUE } from './Shell';

// Coordonnées par défaut (Casablanca) pour l'auto-seed côté serveur.
const LAT = 33.5731, LNG = -7.5898;

interface Comment { username: string; text: string; createdAt?: string }
interface Hk {
  _id: string; name: string; username: string; distanceMeters: number; status: 'pending' | 'done';
  start: { label: string }; end: { label: string }; maxDate?: string; completedAt?: string; comments?: Comment[];
}

export function HkimWall({ gameType }: { gameType: string }) {
  const base = `/${gameType}`;
  const [tab, setTab] = useState<'mine' | 'wall'>('mine');
  const [mine, setMine] = useState<Hk[] | null>(null);
  const [feed, setFeed] = useState<Hk[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const loadMine = useCallback(async () => {
    try { const d = await apiClient.apiGet<Hk[]>(`/hkim/${gameType}?lat=${LAT}&lng=${LNG}`); setMine(Array.isArray(d) ? d : []); }
    catch (e: any) { setError(e?.message || 'Erreur'); }
  }, [gameType]);

  const loadFeed = useCallback(async () => {
    try {
      let d = await apiClient.apiGet<Hk[]>(`/hkim/${gameType}/feed?limit=30`);
      if (!Array.isArray(d) || d.length === 0) {
        try { await apiClient.apiPost(`/hkim/${gameType}/seed-history`, { lat: LAT, lng: LNG }); d = await apiClient.apiGet<Hk[]>(`/hkim/${gameType}/feed?limit=30`); } catch { /* */ }
      }
      setFeed(Array.isArray(d) ? d : []);
    } catch (e: any) { setError(e?.message || 'Erreur'); }
  }, [gameType]);

  useEffect(() => { loadMine(); loadFeed(); }, [loadMine, loadFeed]);

  const complete = async (id: string) => { setBusy(id); try { await apiClient.apiPost(`/hkim/${gameType}/${id}/complete`, {}); await Promise.all([loadMine(), loadFeed()]); } catch { /* */ } finally { setBusy(null); } };
  const comment = async (id: string, text: string) => { if (!text.trim()) return; try { await apiClient.apiPost(`/hkim/${gameType}/${id}/comments`, { text: text.trim() }); await loadFeed(); } catch { /* */ } };

  return (
    <Shell base={base} title="HKIM — Défis & Mur" subtitle="Défis Départ → Arrivée + fil d'actualité de la communauté" icon={<Footprints style={{ width: 26, height: 26, color: GOLD }} />}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {(['mine', 'wall'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? `linear-gradient(90deg, ${GOLD}, #F59E0B)` : 'rgba(255,255,255,0.06)', color: tab === t ? '#0A1535' : '#fff', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999, padding: '8px 18px', fontWeight: 800, cursor: 'pointer' }}>
            {t === 'mine' ? 'Mes défis' : "Mur d'actualité"}
          </button>
        ))}
      </div>

      {error && <StateNote kind="error" text={error} />}

      {tab === 'mine' && (
        <>
          <div style={{ color: '#94A3B8', fontSize: '0.8rem', marginBottom: 12 }}>🛰️ Le tracking GPS se lance depuis l'app mobile. Ici tu vois tes défis et peux les marquer faits.</div>
          {!mine && <StateNote kind="loading" text="Chargement…" />}
          {mine && mine.length === 0 && <StateNote kind="empty" text="Aucun défi pour le moment." />}
          <div style={{ display: 'grid', gap: 12 }}>
            {mine?.map((h) => <HkCard key={h._id} h={h} onComplete={() => complete(h._id)} busy={busy === h._id} />)}
          </div>
        </>
      )}

      {tab === 'wall' && (
        <>
          {!feed && <StateNote kind="loading" text="Chargement…" />}
          {feed && feed.length === 0 && <StateNote kind="empty" text="Le mur est vide pour l'instant." />}
          <div style={{ display: 'grid', gap: 14 }}>
            {feed?.map((h) => <WallCard key={h._id} h={h} onComment={(t) => comment(h._id, t)} />)}
          </div>
        </>
      )}
    </Shell>
  );
}

function HkCard({ h, onComplete, busy }: { h: Hk; onComplete: () => void; busy: boolean }) {
  const km = (h.distanceMeters / 1000).toFixed(2);
  const done = h.status === 'done';
  return (
    <div style={cardBox}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Footprints style={{ width: 22, height: 22, color: GOLD }} />
          <div>
            <div style={{ color: '#fff', fontWeight: 800 }}>{h.name} · {km} km</div>
            <div style={{ color: BLUE, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin style={{ width: 13, height: 13 }} /> {h.start?.label} → {h.end?.label}</div>
          </div>
        </div>
        <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '5px 10px', borderRadius: 999, background: done ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)', color: done ? '#4ADE80' : '#FCD34D' }}>{done ? 'Réussi' : 'À faire'}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <span style={{ color: '#94A3B8', fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock style={{ width: 13, height: 13 }} /> {h.maxDate ? `Avant le ${new Date(h.maxDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}` : '—'}</span>
        {!done && <button onClick={onComplete} disabled={busy} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,0.2)', color: '#4ADE80', border: '1px solid rgba(34,197,94,0.4)', borderRadius: 10, padding: '7px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}><CheckCircle2 style={{ width: 15, height: 15 }} /> {busy ? '…' : 'Marquer fait'}</button>}
      </div>
    </div>
  );
}

function WallCard({ h, onComment }: { h: Hk; onComment: (t: string) => void }) {
  const [text, setText] = useState('');
  const km = (h.distanceMeters / 1000).toFixed(2);
  return (
    <div style={cardBox}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(252,211,77,0.15)', color: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>{(h.username || '?').slice(0, 2).toUpperCase()}</div>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}><strong style={{ color: GOLD }}>{h.username}</strong> a réussi {h.name}</div>
          <div style={{ color: BLUE, fontSize: '0.76rem' }}>{km} km · {h.start?.label} → {h.end?.label}{h.completedAt ? ` · ${new Date(h.completedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}` : ''}</div>
        </div>
      </div>
      {h.comments && h.comments.length > 0 && (
        <div style={{ marginTop: 10, display: 'grid', gap: 6, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8 }}>
          {h.comments.slice(-4).map((c, i) => <div key={i} style={{ fontSize: '0.8rem' }}><span style={{ color: GOLD, fontWeight: 700 }}>{c.username}</span> <span style={{ color: '#CBD5E1' }}>{c.text}</span></div>)}
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { onComment(text); setText(''); } }} placeholder="Encourager / commenter…" maxLength={200} style={{ flex: 1, background: '#0F2238', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '8px 11px', color: '#fff', outline: 'none', fontSize: '0.82rem' }} />
        <button onClick={() => { onComment(text); setText(''); }} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 38, background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: '#0A1535', border: 'none', borderRadius: 10, cursor: 'pointer' }}><Send style={{ width: 15, height: 15 }} /></button>
      </div>
    </div>
  );
}
