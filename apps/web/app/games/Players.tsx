/**
 * @file apps/web/app/games/Players.tsx
 * @description "Trouver des joueurs" : liste des joueurs du jeu (par ELO),
 *   statut en ligne (présence socket), et invitations :
 *   - Inviter à jouer → génère un code de room et copie le lien (fiable).
 *   - Ajouter en ami → envoie une demande d'amitié.
 */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Users, UserPlus, Gamepad2, Check } from 'lucide-react';
import { apiClient } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { Shell, StateNote, cardBox, GOLD, BLUE } from './Shell';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
function genCode() { const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; return Array.from({ length: 6 }, () => c[Math.floor(Math.random() * c.length)]).join(''); }

export function PlayersScreen({ gameType }: { gameType: string }) {
  const base = `/${gameType}`;
  const { user } = useAuth();
  const [players, setPlayers] = useState<any[] | null>(null);
  const [online, setOnline] = useState<Set<string>>(new Set());
  const [flash, setFlash] = useState<string | null>(null);
  const [invited, setInvited] = useState<Set<string>>(new Set());
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let on = true;
    apiClient.apiGet<any[]>(`/users/by-game/${gameType}`).then((d) => { if (on) setPlayers(Array.isArray(d) ? d : []); }).catch(() => { if (on) setPlayers([]); });
    return () => { on = false; };
  }, [gameType]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) return;
    const s = io(`${SOCKET_URL}/presence`, { transports: ['websocket'], auth: { token } });
    socketRef.current = s;
    s.on('connect', () => s.emit('presence:list'));
    s.on('presence:list', (p: { users: any[] }) => setOnline(new Set((p.users || []).map((u) => u.userId))));
    s.on('presence:update', (u: any) => setOnline((prev) => { const n = new Set(prev); if (u.status === 'online') n.add(u.userId); else n.delete(u.userId); return n; }));
    return () => { s.disconnect(); socketRef.current = null; };
  }, []);

  const inviteToPlay = useCallback((p: any) => {
    const code = genCode();
    const link = `${window.location.origin}${base}/room/${code}`;
    navigator.clipboard?.writeText(link).catch(() => {});
    setFlash(`Lien d'invitation copié pour ${p.username} : ${base}/room/${code} — partage-le et rejoins la room.`);
  }, [base]);

  const addFriend = useCallback(async (p: any) => {
    const id = p._id || p.id;
    try { await apiClient.apiPost('/friends', { receiverId: String(id) }); setInvited((s) => new Set(s).add(String(id))); setFlash(`Demande d'ami envoyée à ${p.username}.`); }
    catch (e: any) { setFlash(e?.message || 'Demande déjà existante.'); }
  }, []);

  const myName = (user as any)?.username;
  const list = (players || []).filter((p) => p.username !== myName);

  return (
    <Shell base={base} title="Trouver des joueurs" subtitle="Joueurs du jeu · invite-les à jouer ou en ami" icon={<Users style={{ width: 26, height: 26, color: GOLD }} />}>
      {flash && <div style={{ background: 'rgba(252,211,77,0.12)', border: `1px solid ${GOLD}55`, borderRadius: 10, padding: 12, marginBottom: 16, color: GOLD, fontWeight: 600, fontSize: '0.85rem' }}>{flash}</div>}
      {!players && <StateNote kind="loading" text="Chargement…" />}
      {players && list.length === 0 && <StateNote kind="empty" text="Aucun autre joueur pour le moment." />}
      <div style={{ display: 'grid', gap: 10 }}>
        {list.map((p) => {
          const id = String(p._id || p.id);
          const isOnline = online.has(id);
          return (
            <div key={id} style={{ ...cardBox, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(252,211,77,0.15)', color: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>{(p.username || '?').slice(0, 2).toUpperCase()}</div>
                  <span style={{ position: 'absolute', bottom: -1, right: -1, width: 11, height: 11, borderRadius: 999, background: isOnline ? '#4ADE80' : '#475569', border: '2px solid #152A47' }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>{p.username}</div>
                  <div style={{ color: BLUE, fontSize: '0.74rem' }}>ELO {p.stats?.elo ?? 1000} · {isOnline ? 'en ligne' : 'hors ligne'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => inviteToPlay(p)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: '#0A1535', fontWeight: 800, border: 'none', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', fontSize: '0.78rem' }}><Gamepad2 style={{ width: 14, height: 14 }} /> Jouer</button>
                <button onClick={() => addFriend(p)} disabled={invited.has(id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', fontSize: '0.78rem' }}>{invited.has(id) ? <Check style={{ width: 14, height: 14, color: '#4ADE80' }} /> : <UserPlus style={{ width: 14, height: 14 }} />} Ami</button>
              </div>
            </div>
          );
        })}
      </div>
    </Shell>
  );
}
