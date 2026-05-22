/**
 * @file apps/web/app/belote/tournaments/page.tsx
 * @description Écran Tournois web (Phase 2) — liste (/tournaments?gameType=belote)
 *   + inscription (POST /tournaments/:code/join). Données prod.
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { Screen, StateNote, cardBox, GOLD, BLUE } from '../_components/Screen';

interface Tournament {
  _id: string;            // = code
  name: string;
  scope: string;          // daily / weekly...
  status: string;         // open / in-progress / finished
  participantsCount: number;
  maxParticipants: number;
  startsAt: string;
  prizes: { rank: number; reward: string }[];
}

const STATUS_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  open: { bg: 'rgba(34,197,94,0.15)', fg: '#4ADE80', label: 'Ouvert' },
  'in-progress': { bg: 'rgba(59,130,246,0.15)', fg: '#93C5FD', label: 'En cours' },
  finished: { bg: 'rgba(255,255,255,0.08)', fg: '#94A3B8', label: 'Terminé' },
};

export default function TournamentsScreen() {
  const [list, setList] = useState<Tournament[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiClient.apiGet<Tournament[]>('/tournaments?gameType=belote');
      setList(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const join = async (code: string) => {
    setJoining(code); setFlash(null);
    try {
      await apiClient.apiPost(`/tournaments/${code}/join`, {});
      setFlash('Inscription confirmée ✓');
      await load();
    } catch (e: any) {
      setFlash(e?.message || 'Échec de l’inscription');
    } finally { setJoining(null); }
  };

  return (
    <Screen title="Tournois" subtitle="Quotidiens & hebdomadaires · Belote" icon={<Trophy style={{ width: 26, height: 26, color: GOLD }} />}>
      {flash && <div style={{ marginBottom: 16, color: GOLD, fontWeight: 600 }}>{flash}</div>}
      {loading && <StateNote kind="loading" text="Chargement…" />}
      {error && !loading && <StateNote kind="error" text={error} />}
      {!loading && !error && list && list.length === 0 && (
        <StateNote kind="empty" text="Aucun tournoi ouvert pour le moment. Reviens bientôt !" />
      )}

      <div style={{ display: 'grid', gap: 14 }}>
        {list?.map((t) => {
          const st = STATUS_STYLE[t.status] || STATUS_STYLE.finished;
          return (
            <div key={t._id} style={cardBox}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div>
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.05rem' }}>{t.name}</div>
                  <div style={{ color: BLUE, fontSize: '0.8rem', marginTop: 2, textTransform: 'capitalize' }}>{t.scope}</div>
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '5px 10px', borderRadius: 999, background: st.bg, color: st.fg }}>{st.label}</span>
              </div>

              <div style={{ display: 'flex', gap: 18, margin: '12px 0', flexWrap: 'wrap' }}>
                <Stat label="Joueurs" value={`${t.participantsCount}/${t.maxParticipants}`} />
                <Stat label="Début" value={new Date(t.startsAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} />
              </div>

              {t.prizes?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {t.prizes.map((p) => (
                    <span key={p.rank} style={{ background: 'rgba(252,211,77,0.12)', color: GOLD, borderRadius: 999, padding: '4px 10px', fontSize: '0.72rem', fontWeight: 700 }}>
                      #{p.rank} · {p.reward}
                    </span>
                  ))}
                </div>
              )}

              <button
                onClick={() => join(t._id)}
                disabled={t.status === 'finished' || joining === t._id}
                style={{
                  width: '100%', border: 'none', borderRadius: 10, padding: '11px 0', fontWeight: 800, cursor: t.status === 'finished' ? 'default' : 'pointer',
                  background: t.status === 'finished' ? 'rgba(255,255,255,0.08)' : `linear-gradient(90deg, ${GOLD}, #F59E0B)`,
                  color: t.status === 'finished' ? '#94A3B8' : '#0A1535',
                  opacity: joining === t._id ? 0.7 : 1,
                }}>
                {joining === t._id ? 'Inscription…' : t.status === 'finished' ? 'Terminé' : 'Rejoindre le tournoi'}
              </button>
            </div>
          );
        })}
      </div>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ color: '#94A3B8', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>{value}</div>
    </div>
  );
}
