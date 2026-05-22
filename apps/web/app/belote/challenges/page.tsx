/**
 * @file apps/web/app/belote/challenges/page.tsx
 * @description Défis sport web (Phase 2) — défis actifs (/challenges/sport/active)
 *   + historique (/challenges/sport/history). Lecture seule côté web (le tracking
 *   GPS reste sur mobile).
 */
'use client';

import { useEffect, useState } from 'react';
import { Activity, Footprints, Timer } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { Screen, StateNote, cardBox, GOLD, BLUE } from '../_components/Screen';

interface SportChallenge {
  _id: string;
  type: 'walk' | 'run';
  distanceMeters: number;
  status: 'pending' | 'in-progress' | 'done' | 'failed' | 'expired';
  pointA?: { label: string };
  pointB?: { label: string };
  deadlineAt?: string;
  elapsedTimeMs?: number;
  rewardPoints?: number;
}

const STATUS_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  pending: { bg: 'rgba(234,179,8,0.15)', fg: '#FCD34D', label: 'À faire' },
  'in-progress': { bg: 'rgba(59,130,246,0.15)', fg: '#93C5FD', label: 'En cours' },
  done: { bg: 'rgba(34,197,94,0.15)', fg: '#4ADE80', label: 'Réussi' },
  failed: { bg: 'rgba(239,68,68,0.15)', fg: '#FCA5A5', label: 'Échoué' },
  expired: { bg: 'rgba(255,255,255,0.08)', fg: '#94A3B8', label: 'Expiré' },
};

export default function ChallengesScreen() {
  const [active, setActive] = useState<SportChallenge[]>([]);
  const [history, setHistory] = useState<SportChallenge[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [a, h] = await Promise.all([
          apiClient.apiGet<SportChallenge[]>('/challenges/sport/active').catch(() => []),
          apiClient.apiGet<SportChallenge[]>('/challenges/sport/history').catch(() => []),
        ]);
        if (!alive) return;
        setActive(Array.isArray(a) ? a : []);
        setHistory(Array.isArray(h) ? h : []);
      } catch (e: any) {
        if (alive) setError(e?.message || 'Erreur de chargement');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <Screen title="Défis sport" subtitle="Marche / course A → B · le tracking GPS se fait sur mobile" icon={<Activity style={{ width: 26, height: 26, color: GOLD }} />}>
      {loading && <StateNote kind="loading" text="Chargement…" />}
      {error && !loading && <StateNote kind="error" text={error} />}

      {!loading && !error && (
        <>
          <h2 style={{ color: '#fff', fontSize: '1rem', fontWeight: 800, marginBottom: 10 }}>Défis en cours</h2>
          {active.length === 0
            ? <StateNote kind="empty" text="Aucun défi en cours." />
            : <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>{active.map((c) => <ChallengeCard key={c._id} c={c} />)}</div>}

          <h2 style={{ color: '#fff', fontSize: '1rem', fontWeight: 800, margin: '8px 0 10px' }}>Historique</h2>
          {history.length === 0
            ? <StateNote kind="empty" text="Pas encore de défi terminé." />
            : <div style={{ display: 'grid', gap: 12 }}>{history.map((c) => <ChallengeCard key={c._id} c={c} />)}</div>}
        </>
      )}
    </Screen>
  );
}

function ChallengeCard({ c }: { c: SportChallenge }) {
  const st = STATUS_STYLE[c.status] || STATUS_STYLE.expired;
  const km = (c.distanceMeters / 1000).toFixed(2);
  return (
    <div style={cardBox}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Footprints style={{ width: 22, height: 22, color: GOLD }} />
          <div>
            <div style={{ color: '#fff', fontWeight: 800 }}>{c.type === 'run' ? 'Course' : 'Marche'} · {km} km</div>
            <div style={{ color: BLUE, fontSize: '0.8rem' }}>
              {(c.pointA?.label || 'Point A')} → {(c.pointB?.label || 'Point B')}
            </div>
          </div>
        </div>
        <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '5px 10px', borderRadius: 999, background: st.bg, color: st.fg }}>{st.label}</span>
      </div>
      {(c.elapsedTimeMs || c.rewardPoints) && (
        <div style={{ display: 'flex', gap: 16, marginTop: 10, color: '#94A3B8', fontSize: '0.78rem' }}>
          {c.elapsedTimeMs ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Timer style={{ width: 13, height: 13 }} /> {Math.round(c.elapsedTimeMs / 60000)} min</span> : null}
          {c.rewardPoints ? <span>+{c.rewardPoints} pts</span> : null}
        </div>
      )}
    </div>
  );
}
