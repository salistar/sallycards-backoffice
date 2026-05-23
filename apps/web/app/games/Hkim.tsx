/**
 * @file apps/web/app/games/Hkim.tsx
 * @description Écran unifié "Défis & Mur" par jeu (HKIM = les défis). Onglets :
 *   - Mes défis : défis sport reçus (/challenges/sport, ex. imposés par un
 *     gagnant) + parcours HKIM (/hkim/:game), avec carte Google du trajet A→B.
 *   - Mur de partage : défis réussis de la communauté + commentaires (poster).
 *   Le tracking GPS se lance depuis le mobile. Indépendant par jeu.
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Footprints, MapPin, Send, CheckCircle2, Clock, Heart, PenLine } from 'lucide-react';
import { apiClient } from '../lib/api';
import { Shell, StateNote, cardBox, GOLD, BLUE } from './Shell';
import { StaticRouteMap } from './GeoMap';

const LAT = 33.5731, LNG = -7.5898;

interface Comment { username: string; text: string }
interface Hk { _id: string; name: string; username: string; distanceMeters: number; status: 'pending' | 'done'; start: { lat: number; lng: number; label: string }; end: { lat: number; lng: number; label: string }; routePolyline?: string; maxDate?: string; completedAt?: string; comments?: Comment[]; }
interface Sport { _id: string; type: 'walk' | 'run'; distanceMeters: number; status: string; pointA?: { lat: number; lng: number; label: string }; pointB?: { lat: number; lng: number; label: string }; deadlineAt?: string; role?: string; rewardPoints?: number; }

const SP_STATUS: Record<string, { bg: string; fg: string; label: string }> = {
  pending: { bg: 'rgba(234,179,8,0.15)', fg: '#FCD34D', label: 'À faire' },
  'in-progress': { bg: 'rgba(59,130,246,0.15)', fg: '#93C5FD', label: 'En cours' },
  done: { bg: 'rgba(34,197,94,0.15)', fg: '#4ADE80', label: 'Réussi' },
  failed: { bg: 'rgba(239,68,68,0.15)', fg: '#FCA5A5', label: 'Échoué' },
  expired: { bg: 'rgba(255,255,255,0.08)', fg: '#94A3B8', label: 'Expiré' },
};

export function HkimWall({ gameType }: { gameType: string }) {
  const base = `/${gameType}`;
  const [tab, setTab] = useState<'mine' | 'wall'>('mine');
  const [sport, setSport] = useState<Sport[] | null>(null);
  const [hk, setHk] = useState<Hk[] | null>(null);
  const [feed, setFeed] = useState<Hk[] | null>(null);
  const [posts, setPosts] = useState<any[] | null>(null);
  const [postText, setPostText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    try { const d = await apiClient.apiGet<any[]>(`/wall/${gameType}?limit=40`); setPosts(Array.isArray(d) ? d : []); } catch { setPosts([]); }
  }, [gameType]);
  const publish = async () => { const t = postText.trim(); if (!t) return; setPostText(''); try { await apiClient.apiPost(`/wall/${gameType}`, { text: t }); await loadPosts(); } catch { /* */ } };
  const likePost = async (id: string) => { try { await apiClient.apiPost(`/wall/${gameType}/${id}/like`, {}); await loadPosts(); } catch { /* */ } };

  const loadMine = useCallback(async () => {
    try {
      const [active, history, parcours] = await Promise.all([
        apiClient.apiGet<Sport[]>('/challenges/sport/active').catch(() => []),
        apiClient.apiGet<Sport[]>('/challenges/sport/history').catch(() => []),
        apiClient.apiGet<Hk[]>(`/hkim/${gameType}?lat=${LAT}&lng=${LNG}`).catch(() => []),
      ]);
      const seen = new Set<string>();
      const merged = [...(active || []), ...(history || [])].filter((s) => (seen.has(s._id) ? false : (seen.add(s._id), true)));
      setSport(merged);
      setHk(Array.isArray(parcours) ? parcours : []);
    } catch (e: any) { setError(e?.message || 'Erreur'); }
  }, [gameType]);

  const loadFeed = useCallback(async () => {
    try {
      let d = await apiClient.apiGet<Hk[]>(`/hkim/${gameType}/feed?limit=30`);
      if (!Array.isArray(d) || d.length === 0) {
        try { await apiClient.apiPost(`/hkim/${gameType}/seed-history`, { lat: LAT, lng: LNG }); d = await apiClient.apiGet<Hk[]>(`/hkim/${gameType}/feed?limit=30`); } catch { /* */ }
      }
      setFeed(Array.isArray(d) ? d : []);
    } catch { /* */ }
  }, [gameType]);

  useEffect(() => { loadMine(); loadFeed(); loadPosts(); }, [loadMine, loadFeed, loadPosts]);

  const completeHk = async (id: string) => { try { await apiClient.apiPost(`/hkim/${gameType}/${id}/complete`, {}); await Promise.all([loadMine(), loadFeed()]); } catch { /* */ } };
  const comment = async (id: string, text: string) => { if (!text.trim()) return; try { await apiClient.apiPost(`/hkim/${gameType}/${id}/comments`, { text: text.trim() }); await loadFeed(); } catch { /* */ } };

  const loading = !sport && !hk;

  return (
    <Shell base={base} title="Défis & Mur (HKIM)" subtitle="Défis sport Départ → Arrivée + mur de partage de la communauté" icon={<Footprints style={{ width: 26, height: 26, color: GOLD }} />}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {(['mine', 'wall'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? `linear-gradient(90deg, ${GOLD}, #F59E0B)` : 'rgba(255,255,255,0.06)', color: tab === t ? '#0A1535' : '#fff', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999, padding: '8px 18px', fontWeight: 800, cursor: 'pointer' }}>
            {t === 'mine' ? 'Mes défis' : 'Mur de partage'}
          </button>
        ))}
      </div>
      {error && <StateNote kind="error" text={error} />}

      {tab === 'mine' && (
        <>
          <div style={{ color: '#94A3B8', fontSize: '0.8rem', marginBottom: 12 }}>🛰️ Le tracking GPS se lance depuis l'app mobile. Carte du parcours ci-dessous.</div>
          {loading && <StateNote kind="loading" text="Chargement…" />}

          {sport && sport.length > 0 && (
            <>
              <h2 style={{ color: '#fff', fontSize: '0.98rem', fontWeight: 800, margin: '4px 0 10px' }}>Défis sport reçus</h2>
              <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
                {sport.map((s) => <SportCard key={s._id} s={s} />)}
              </div>
            </>
          )}

          <h2 style={{ color: '#fff', fontSize: '0.98rem', fontWeight: 800, margin: '4px 0 10px' }}>Parcours HKIM</h2>
          {hk && hk.length === 0 && <StateNote kind="empty" text="Aucun parcours pour le moment." />}
          <div style={{ display: 'grid', gap: 12 }}>
            {hk?.map((h) => <HkCard key={h._id} h={h} onComplete={() => completeHk(h._id)} />)}
          </div>
        </>
      )}

      {tab === 'wall' && (
        <>
          {/* Composer : poster un message libre */}
          <div style={{ ...cardBox, marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <textarea value={postText} onChange={(e) => setPostText(e.target.value)} placeholder="Partage quelque chose avec la communauté…" maxLength={280} rows={2} style={{ flex: 1, background: '#0F2238', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 12px', color: '#fff', outline: 'none', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.88rem' }} />
              <button onClick={publish} disabled={!postText.trim()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-end', background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: '#0A1535', fontWeight: 800, border: 'none', borderRadius: 10, padding: '10px 16px', cursor: 'pointer', opacity: postText.trim() ? 1 : 0.6 }}><PenLine style={{ width: 15, height: 15 }} /> Poster</button>
            </div>
          </div>

          {/* Posts libres */}
          <div style={{ display: 'grid', gap: 10, marginBottom: 22 }}>
            {posts && posts.length === 0 && <StateNote kind="empty" text="Sois le premier à poster sur le mur 👋" />}
            {posts?.map((p) => (
              <div key={p._id} style={cardBox}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(252,211,77,0.15)', color: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.72rem' }}>{(p.username || '?').slice(0, 2).toUpperCase()}</div>
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.86rem' }}>{p.username}</span>
                  {p.createdAt && <span style={{ color: '#64748B', fontSize: '0.72rem' }}>· {new Date(p.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
                </div>
                <div style={{ color: '#E2E8F0', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{p.text}</div>
                <button onClick={() => likePost(p._id)} style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 5, background: 'transparent', border: 'none', color: (p.likes?.length ? '#F87171' : '#94A3B8'), cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}><Heart style={{ width: 15, height: 15 }} /> {p.likes?.length || 0}</button>
              </div>
            ))}
          </div>

          {/* Activité défis (HKIM réussis) */}
          <h2 style={{ color: '#fff', fontSize: '0.98rem', fontWeight: 800, margin: '4px 0 10px' }}>Activité défis</h2>
          {!feed && <StateNote kind="loading" text="Chargement…" />}
          {feed && feed.length === 0 && <StateNote kind="empty" text="Aucun défi réussi pour l'instant." />}
          <div style={{ display: 'grid', gap: 14 }}>
            {feed?.map((h) => <WallCard key={h._id} h={h} onComment={(t) => comment(h._id, t)} />)}
          </div>
        </>
      )}
    </Shell>
  );
}

function SportCard({ s }: { s: Sport }) {
  const st = SP_STATUS[s.status] || SP_STATUS.pending;
  const km = (s.distanceMeters / 1000).toFixed(2);
  return (
    <div style={cardBox}>
      {s.pointA && s.pointB && <div style={{ marginBottom: 10 }}><StaticRouteMap a={s.pointA} b={s.pointB} /></div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 800 }}>{s.type === 'run' ? '🏃 Course' : '🚶 Marche'} · {km} km</div>
          <div style={{ color: BLUE, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin style={{ width: 13, height: 13 }} /> {s.pointA?.label || 'Départ'} → {s.pointB?.label || 'Arrivée'}{s.role === 'received' ? ' · imposé à toi' : ''}</div>
        </div>
        <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '5px 10px', borderRadius: 999, background: st.bg, color: st.fg }}>{st.label}</span>
      </div>
      <div style={{ color: '#94A3B8', fontSize: '0.74rem', marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock style={{ width: 13, height: 13 }} /> {s.deadlineAt ? `Avant le ${new Date(s.deadlineAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}` : '—'} · 📱 lance sur mobile</div>
    </div>
  );
}

function HkCard({ h, onComplete }: { h: Hk; onComplete: () => void }) {
  const km = (h.distanceMeters / 1000).toFixed(2);
  const done = h.status === 'done';
  return (
    <div style={cardBox}>
      <div style={{ marginBottom: 10 }}><StaticRouteMap a={h.start} b={h.end} polyline={h.routePolyline} /></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 800 }}>{h.name} · {km} km</div>
          <div style={{ color: BLUE, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin style={{ width: 13, height: 13 }} /> {h.start?.label} → {h.end?.label}</div>
        </div>
        <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '5px 10px', borderRadius: 999, background: done ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)', color: done ? '#4ADE80' : '#FCD34D' }}>{done ? 'Réussi' : 'À faire'}</span>
      </div>
      {!done && <button onClick={onComplete} style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,0.2)', color: '#4ADE80', border: '1px solid rgba(34,197,94,0.4)', borderRadius: 10, padding: '7px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}><CheckCircle2 style={{ width: 15, height: 15 }} /> Marquer fait</button>}
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
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { onComment(text); setText(''); } }} placeholder="Partager / encourager…" maxLength={200} style={{ flex: 1, background: '#0F2238', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '8px 11px', color: '#fff', outline: 'none', fontSize: '0.82rem' }} />
        <button onClick={() => { onComment(text); setText(''); }} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 38, background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: '#0A1535', border: 'none', borderRadius: 10, cursor: 'pointer' }}><Send style={{ width: 15, height: 15 }} /></button>
      </div>
    </div>
  );
}
