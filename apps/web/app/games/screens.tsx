/**
 * @file apps/web/app/games/screens.tsx
 * @description Écrans data génériques (rewards/friends/tournaments/inbox/
 *   challenges/leaderboard) paramétrés par gameType — réutilisés par scopa,
 *   tarot, etc. Mêmes endpoints prod que la Belote (levels/tournaments/
 *   leaderboards filtrés par gameType ; friends/notifications/challenges
 *   sont globaux par utilisateur).
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Gift, Users, UserPlus, Check, X, Clock, Trophy, Inbox, CheckCheck, Activity, Footprints, Timer, Medal } from 'lucide-react';
import { apiClient } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { Shell, StateNote, cardBox, GOLD, BLUE } from './Shell';

const numberFmt = new Intl.NumberFormat('fr-FR');

// ─────────────────────────── REWARDS ───────────────────────────
const STORE_LABEL: Record<string, string> = { amazon: 'Amazon', fnac: 'Fnac', decathlon: 'Decathlon', apple: 'Apple', google_play: 'Google Play', custom: 'Bon cadeau' };
const VSTATUS: Record<string, string> = { issued: 'Disponible', claimed: 'Réclamé', expired: 'Expiré' };

export function RewardsScreen({ gameType }: { gameType: string }) {
  const base = `/${gameType}`;
  const [level, setLevel] = useState<any>(null);
  const [vouchers, setVouchers] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const [lvl, vs] = await Promise.all([
          apiClient.apiGet<any>(`/levels/me?gameType=${gameType}`).catch(() => null),
          apiClient.apiGet<any[]>('/rewards/vouchers').catch(() => []),
        ]);
        if (!on) return; setLevel(lvl); setVouchers(Array.isArray(vs) ? vs : []);
      } catch (e: any) { if (on) setError(e?.message || 'Erreur'); } finally { if (on) setLoading(false); }
    })();
    return () => { on = false; };
  }, [gameType]);

  const pct = level && level.nextLevelXp > 0 ? Math.min(100, Math.round((level.xp / level.nextLevelXp) * 100)) : 0;
  return (
    <Shell base={base} title="Récompenses" subtitle="Niveau, XP et bons d'achat gagnés" icon={<Gift style={{ width: 26, height: 26, color: GOLD }} />}>
      {loading && <StateNote kind="loading" text="Chargement…" />}
      {error && !loading && <StateNote kind="error" text={error} />}
      {!loading && !error && (
        <>
          <div style={{ ...cardBox, marginBottom: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem' }}>Niveau {level?.level ?? 1}</span>
              <span style={{ color: BLUE, fontSize: '0.85rem' }}>{level?.xp ?? 0} / {level?.nextLevelXp ?? 100} XP</span>
            </div>
            <div style={{ height: 12, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${GOLD}, #F59E0B)` }} />
            </div>
            {level?.unlockedFeatures?.length > 0 && (
              <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {level.unlockedFeatures.map((f: string) => <span key={f} style={{ background: 'rgba(252,211,77,0.12)', color: GOLD, borderRadius: 999, padding: '4px 10px', fontSize: '0.72rem', fontWeight: 700 }}>{f}</span>)}
              </div>
            )}
          </div>
          <h2 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 800, marginBottom: 12 }}>Mes bons d'achat</h2>
          {vouchers && vouchers.length === 0 && <StateNote kind="empty" text="Aucun bon pour le moment. Gagne des tournois pour en débloquer !" />}
          <div style={{ display: 'grid', gap: 12 }}>
            {vouchers?.map((v) => (
              <div key={v.code} style={{ ...cardBox, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div>
                  <div style={{ color: '#fff', fontWeight: 800 }}>{STORE_LABEL[v.providerStoreCode] || v.providerStoreCode} · {v.amount} {v.currency}</div>
                  <div style={{ color: BLUE, fontSize: '0.8rem', marginTop: 2 }}>{v.reason}</div>
                  <code style={{ color: GOLD, fontSize: '0.78rem', letterSpacing: 1 }}>{v.code}</code>
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '5px 10px', borderRadius: 999, background: v.status === 'issued' ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.08)', color: v.status === 'issued' ? '#4ADE80' : '#94A3B8' }}>{VSTATUS[v.status] || v.status}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </Shell>
  );
}

// ─────────────────────────── FRIENDS ───────────────────────────
export function FriendsScreen({ gameType }: { gameType: string }) {
  const base = `/${gameType}`;
  const [list, setList] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [addId, setAddId] = useState('');
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { const d = await apiClient.apiGet<any[]>('/friends'); setList(Array.isArray(d) ? d : []); setError(null); }
    catch (e: any) { setError(e?.message || 'Erreur'); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const send = async () => {
    if (!addId.trim()) return; setBusy(true); setFlash(null);
    try { await apiClient.apiPost('/friends', { receiverId: addId.trim() }); setAddId(''); setFlash('Demande envoyée ✓'); await load(); }
    catch (e: any) { setFlash(e?.message || 'Échec'); } finally { setBusy(false); }
  };
  const respond = async (id: string, status: 'accepted' | 'blocked') => {
    setBusy(true); try { await apiClient.apiPatch(`/friends/${id}`, { status }); await load(); } catch (e: any) { setFlash(e?.message || 'Échec'); } finally { setBusy(false); }
  };

  const accepted = list?.filter((f) => f.status === 'accepted') ?? [];
  const incoming = list?.filter((f) => f.status === 'pending' && f.direction === 'received') ?? [];
  const outgoing = list?.filter((f) => f.status === 'pending' && f.direction === 'sent') ?? [];

  return (
    <Shell base={base} title="Amis" subtitle="Liste, invitations envoyées et reçues" icon={<Users style={{ width: 26, height: 26, color: GOLD }} />}>
      <div style={{ ...cardBox, display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
        <input value={addId} onChange={(e) => setAddId(e.target.value)} placeholder="ID utilisateur à ajouter" style={{ flex: 1, minWidth: 180, background: '#0F2238', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 12px', color: '#fff', outline: 'none' }} />
        <button onClick={send} disabled={busy || !addId.trim()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: '#0A1535', fontWeight: 800, border: 'none', borderRadius: 10, padding: '10px 18px', cursor: 'pointer', opacity: busy || !addId.trim() ? 0.6 : 1 }}><UserPlus style={{ width: 16, height: 16 }} /> Inviter</button>
      </div>
      {flash && <div style={{ marginBottom: 16, color: GOLD, fontWeight: 600 }}>{flash}</div>}
      {loading && <StateNote kind="loading" text="Chargement…" />}
      {error && !loading && <StateNote kind="error" text={error} />}
      {!loading && !error && (
        <>
          <FSection title={`Amis (${accepted.length})`}>{accepted.length === 0 ? <StateNote kind="empty" text="Pas encore d'amis acceptés." /> : accepted.map((f) => <FRow key={f._id} f={f} />)}</FSection>
          {incoming.length > 0 && <FSection title={`Demandes reçues (${incoming.length})`}>{incoming.map((f) => <FRow key={f._id} f={f} actions={<div style={{ display: 'flex', gap: 6 }}><button onClick={() => respond(f._id, 'accepted')} disabled={busy} style={fIcon('#22C55E')}><Check style={{ width: 16, height: 16 }} /></button><button onClick={() => respond(f._id, 'blocked')} disabled={busy} style={fIcon('#EF4444')}><X style={{ width: 16, height: 16 }} /></button></div>} />)}</FSection>}
          {outgoing.length > 0 && <FSection title={`Invitations envoyées (${outgoing.length})`}>{outgoing.map((f) => <FRow key={f._id} f={f} actions={<Clock style={{ width: 16, height: 16, color: BLUE }} />} />)}</FSection>}
        </>
      )}
    </Shell>
  );
}
function FSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 22 }}><h2 style={{ color: '#fff', fontSize: '1rem', fontWeight: 800, marginBottom: 10 }}>{title}</h2><div style={{ display: 'grid', gap: 10 }}>{children}</div></div>;
}
function FRow({ f, actions }: { f: any; actions?: React.ReactNode }) {
  return (
    <div style={{ ...cardBox, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(252,211,77,0.15)', color: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>{f.otherUserId.slice(0, 2).toUpperCase()}</div>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.otherUserId}</span>
      </div>
      {actions}
    </div>
  );
}
const fIcon = (c: string): React.CSSProperties => ({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 10, border: 'none', cursor: 'pointer', background: `${c}22`, color: c });

// ─────────────────────────── TOURNAMENTS ───────────────────────────
const TSTATUS: Record<string, { bg: string; fg: string; label: string }> = {
  open: { bg: 'rgba(34,197,94,0.15)', fg: '#4ADE80', label: 'Ouvert' },
  'in-progress': { bg: 'rgba(59,130,246,0.15)', fg: '#93C5FD', label: 'En cours' },
  finished: { bg: 'rgba(255,255,255,0.08)', fg: '#94A3B8', label: 'Terminé' },
};
export function TournamentsScreen({ gameType }: { gameType: string }) {
  const base = `/${gameType}`;
  const [list, setList] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { const d = await apiClient.apiGet<any[]>(`/tournaments?gameType=${gameType}`); setList(Array.isArray(d) ? d : []); setError(null); }
    catch (e: any) { setError(e?.message || 'Erreur'); } finally { setLoading(false); }
  }, [gameType]);
  useEffect(() => { load(); }, [load]);

  const join = async (code: string) => {
    setJoining(code); setFlash(null);
    try { await apiClient.apiPost(`/tournaments/${code}/join`, {}); setFlash('Inscription confirmée ✓'); await load(); }
    catch (e: any) { setFlash(e?.message || 'Échec'); } finally { setJoining(null); }
  };

  return (
    <Shell base={base} title="Tournois" subtitle="Quotidiens & hebdomadaires" icon={<Trophy style={{ width: 26, height: 26, color: GOLD }} />}>
      {flash && <div style={{ marginBottom: 16, color: GOLD, fontWeight: 600 }}>{flash}</div>}
      {loading && <StateNote kind="loading" text="Chargement…" />}
      {error && !loading && <StateNote kind="error" text={error} />}
      {!loading && !error && list && list.length === 0 && <StateNote kind="empty" text="Aucun tournoi ouvert pour le moment." />}
      <div style={{ display: 'grid', gap: 14 }}>
        {list?.map((t) => {
          const st = TSTATUS[t.status] || TSTATUS.finished;
          return (
            <div key={t._id} style={cardBox}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div><div style={{ color: '#fff', fontWeight: 800, fontSize: '1.05rem' }}>{t.name}</div><div style={{ color: BLUE, fontSize: '0.8rem', marginTop: 2, textTransform: 'capitalize' }}>{t.scope}</div></div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '5px 10px', borderRadius: 999, background: st.bg, color: st.fg }}>{st.label}</span>
              </div>
              <div style={{ display: 'flex', gap: 18, margin: '12px 0', flexWrap: 'wrap' }}>
                <TStat label="Joueurs" value={`${t.participantsCount}/${t.maxParticipants}`} />
                <TStat label="Début" value={new Date(t.startsAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} />
              </div>
              {t.prizes?.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>{t.prizes.map((p: any) => <span key={p.rank} style={{ background: 'rgba(252,211,77,0.12)', color: GOLD, borderRadius: 999, padding: '4px 10px', fontSize: '0.72rem', fontWeight: 700 }}>#{p.rank} · {p.reward}</span>)}</div>}
              <button onClick={() => join(t._id)} disabled={t.status === 'finished' || joining === t._id} style={{ width: '100%', border: 'none', borderRadius: 10, padding: '11px 0', fontWeight: 800, cursor: t.status === 'finished' ? 'default' : 'pointer', background: t.status === 'finished' ? 'rgba(255,255,255,0.08)' : `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: t.status === 'finished' ? '#94A3B8' : '#0A1535', opacity: joining === t._id ? 0.7 : 1 }}>
                {joining === t._id ? 'Inscription…' : t.status === 'finished' ? 'Terminé' : 'Rejoindre le tournoi'}
              </button>
            </div>
          );
        })}
      </div>
    </Shell>
  );
}
function TStat({ label, value }: { label: string; value: string }) {
  return <div><div style={{ color: '#94A3B8', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div><div style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>{value}</div></div>;
}

// ─────────────────────────── INBOX ───────────────────────────
export function InboxScreen({ gameType }: { gameType: string }) {
  const base = `/${gameType}`;
  const [list, setList] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { const d = await apiClient.apiGet<any[]>('/notifications'); setList(Array.isArray(d) ? d : []); setError(null); }
    catch (e: any) { setError(e?.message || 'Erreur'); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const markRead = async (id: string) => { try { await apiClient.apiPatch(`/notifications/${id}`, { read: true }); await load(); } catch { /* */ } };
  const readAll = async () => { setBusy(true); try { await apiClient.apiPost('/notifications/read-all', {}); await load(); } catch { /* */ } finally { setBusy(false); } };
  const unread = list?.filter((n) => !n.readAt).length ?? 0;

  return (
    <Shell base={base} title="Boîte de réception" subtitle={unread > 0 ? `${unread} non lue(s)` : 'Tout est à jour'} icon={<Inbox style={{ width: 26, height: 26, color: GOLD }} />}>
      {unread > 0 && <button onClick={readAll} disabled={busy} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999, padding: '8px 16px', cursor: 'pointer', fontWeight: 700, marginBottom: 18 }}><CheckCheck style={{ width: 16, height: 16 }} /> Tout marquer comme lu</button>}
      {loading && <StateNote kind="loading" text="Chargement…" />}
      {error && !loading && <StateNote kind="error" text={error} />}
      {!loading && !error && list && list.length === 0 && <StateNote kind="empty" text="Aucune notification." />}
      <div style={{ display: 'grid', gap: 10 }}>
        {list?.map((n) => {
          const isRead = !!n.readAt;
          return (
            <button key={n._id} onClick={() => !isRead && markRead(n._id)} style={{ ...cardBox, textAlign: 'left', cursor: isRead ? 'default' : 'pointer', borderLeft: `3px solid ${isRead ? 'transparent' : GOLD}`, opacity: isRead ? 0.7 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem' }}>{n.title}</span>
                {n.sentAt && <span style={{ color: '#94A3B8', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>{new Date(n.sentAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>}
              </div>
              <div style={{ color: BLUE, fontSize: '0.85rem', marginTop: 4 }}>{n.body}</div>
            </button>
          );
        })}
      </div>
    </Shell>
  );
}

// ─────────────────────────── CHALLENGES ───────────────────────────
const CSTATUS: Record<string, { bg: string; fg: string; label: string }> = {
  pending: { bg: 'rgba(234,179,8,0.15)', fg: '#FCD34D', label: 'À faire' },
  'in-progress': { bg: 'rgba(59,130,246,0.15)', fg: '#93C5FD', label: 'En cours' },
  done: { bg: 'rgba(34,197,94,0.15)', fg: '#4ADE80', label: 'Réussi' },
  failed: { bg: 'rgba(239,68,68,0.15)', fg: '#FCA5A5', label: 'Échoué' },
  expired: { bg: 'rgba(255,255,255,0.08)', fg: '#94A3B8', label: 'Expiré' },
};
export function ChallengesScreen({ gameType }: { gameType: string }) {
  const base = `/${gameType}`;
  const [active, setActive] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const [a, h] = await Promise.all([
          apiClient.apiGet<any[]>('/challenges/sport/active').catch(() => []),
          apiClient.apiGet<any[]>('/challenges/sport/history').catch(() => []),
        ]);
        if (!on) return; setActive(Array.isArray(a) ? a : []); setHistory(Array.isArray(h) ? h : []);
      } catch (e: any) { if (on) setError(e?.message || 'Erreur'); } finally { if (on) setLoading(false); }
    })();
    return () => { on = false; };
  }, []);
  return (
    <Shell base={base} title="Défis sport" subtitle="Marche / course A → B · tracking GPS sur mobile" icon={<Activity style={{ width: 26, height: 26, color: GOLD }} />}>
      {loading && <StateNote kind="loading" text="Chargement…" />}
      {error && !loading && <StateNote kind="error" text={error} />}
      {!loading && !error && (
        <>
          <h2 style={{ color: '#fff', fontSize: '1rem', fontWeight: 800, marginBottom: 10 }}>Défis en cours</h2>
          {active.length === 0 ? <StateNote kind="empty" text="Aucun défi en cours." /> : <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>{active.map((c) => <CCard key={c._id} c={c} />)}</div>}
          <h2 style={{ color: '#fff', fontSize: '1rem', fontWeight: 800, margin: '8px 0 10px' }}>Historique</h2>
          {history.length === 0 ? <StateNote kind="empty" text="Pas encore de défi terminé." /> : <div style={{ display: 'grid', gap: 12 }}>{history.map((c) => <CCard key={c._id} c={c} />)}</div>}
        </>
      )}
    </Shell>
  );
}
function CCard({ c }: { c: any }) {
  const st = CSTATUS[c.status] || CSTATUS.expired;
  const km = (c.distanceMeters / 1000).toFixed(2);
  return (
    <div style={cardBox}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Footprints style={{ width: 22, height: 22, color: GOLD }} />
          <div><div style={{ color: '#fff', fontWeight: 800 }}>{c.type === 'run' ? 'Course' : 'Marche'} · {km} km</div><div style={{ color: BLUE, fontSize: '0.8rem' }}>{(c.pointA?.label || 'Point A')} → {(c.pointB?.label || 'Point B')}</div></div>
        </div>
        <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '5px 10px', borderRadius: 999, background: st.bg, color: st.fg }}>{st.label}</span>
      </div>
      {(c.elapsedTimeMs || c.rewardPoints) ? (
        <div style={{ display: 'flex', gap: 16, marginTop: 10, color: '#94A3B8', fontSize: '0.78rem' }}>
          {c.elapsedTimeMs ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Timer style={{ width: 13, height: 13 }} /> {Math.round(c.elapsedTimeMs / 60000)} min</span> : null}
          {c.rewardPoints ? <span>+{c.rewardPoints} pts</span> : null}
        </div>
      ) : null}
    </div>
  );
}

// ─────────────────────────── LEADERBOARD ───────────────────────────
export function LeaderboardScreen({ gameType }: { gameType: string }) {
  const base = `/${gameType}`;
  const { user } = useAuth();
  const [entries, setEntries] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let on = true;
    (async () => {
      try { const r = await apiClient.apiGet<{ entries: any[] }>(`/leaderboards/${gameType}?limit=50`); if (on) setEntries(Array.isArray(r?.entries) ? r.entries : []); }
      catch (e: any) { if (on) setError(e?.message || 'Erreur'); } finally { if (on) setLoading(false); }
    })();
    return () => { on = false; };
  }, [gameType]);
  const myName = (user as any)?.username;
  return (
    <Shell base={base} title="Classement" subtitle="Top joueurs · classés par ELO" icon={<Medal style={{ width: 26, height: 26, color: GOLD }} />}>
      {loading && <StateNote kind="loading" text="Chargement…" />}
      {error && !loading && <StateNote kind="error" text={error} />}
      {!loading && !error && entries && entries.length === 0 && <StateNote kind="empty" text="Aucun joueur classé pour le moment." />}
      {!loading && !error && entries && entries.length > 0 && (
        <div style={{ ...cardBox, padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead><tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}><LbTh style={{ width: 56 }}>#</LbTh><LbTh>Joueur</LbTh><LbTh align="right">ELO</LbTh><LbTh align="right">V</LbTh><LbTh align="right">Win %</LbTh></tr></thead>
            <tbody>
              {entries.map((e) => {
                const medal = e.rank === 1 ? '🥇' : e.rank === 2 ? '🥈' : e.rank === 3 ? '🥉' : null;
                const isMe = myName && e.username === myName;
                return (
                  <tr key={`${e.userId}-${e.rank}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: isMe ? 'rgba(252,211,77,0.12)' : e.rank <= 3 ? 'rgba(252,211,77,0.04)' : 'transparent' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: isMe ? GOLD : '#94A3B8' }}>{medal || e.rank}</td>
                    <td style={{ padding: '12px 14px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(252,211,77,0.15)', color: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.72rem' }}>{(e.username || '?').slice(0, 2).toUpperCase()}</div><span style={{ color: '#fff', fontWeight: 700 }}>{e.username}{isMe ? ' (vous)' : ''}</span></div></td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 900, color: GOLD }}>{numberFmt.format(e.elo)}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: '#4ADE80', fontWeight: 700 }}>{numberFmt.format(e.gamesWon)}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: BLUE, fontWeight: 700 }}>{e.winRate}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Shell>
  );
}
function LbTh({ children, align = 'left', style }: { children: React.ReactNode; align?: 'left' | 'right'; style?: React.CSSProperties }) {
  return <th style={{ padding: '12px 14px', textAlign: align, color: '#64748B', fontSize: '0.66rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, ...style }}>{children}</th>;
}
