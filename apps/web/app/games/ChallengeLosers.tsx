/**
 * @file apps/web/app/games/ChallengeLosers.tsx
 * @description À la fin d'une partie, le GAGNANT choisit un défi sport
 *   (marche/course, distance, échéance) imposé aux PERDANTS humains. Crée un
 *   challenge via POST /challenges/sport pour chaque perdant. Le défi apparaît
 *   ensuite chez le perdant (écran Défis / HKIM) ; le tracking GPS se lance
 *   depuis le téléphone (carte Départ → Arrivée + temps imparti).
 */
'use client';

import { useState } from 'react';
import { Footprints, Send, MapPin } from 'lucide-react';
import { apiClient } from '../lib/api';
import { MapPicker, Pt } from './GeoMap';

const GOLD = '#FCD34D';
const BLUE = '#93C5FD';
// Coordonnées par défaut (Casablanca) si le gagnant ne pose pas de points.
const A = { lat: 33.5731, lng: -7.5898, label: 'Départ' };
const B = { lat: 33.595, lng: -7.618, label: 'Arrivée' };

export default function ChallengeLosers({ gameType, loserIds }: { gameType: string; loserIds: string[] }) {
  const [type, setType] = useState<'walk' | 'run'>('walk');
  const [km, setKm] = useState(2);
  const [days, setDays] = useState(2);
  const [a, setA] = useState<Pt | null>(null);
  const [b, setB] = useState<Pt | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!loserIds || loserIds.length === 0) {
    return <div style={{ marginTop: 14, color: BLUE, fontSize: '0.84rem' }}>🤖 Pas d'adversaire humain à défier (que des bots).</div>;
  }

  const assign = async () => {
    setBusy(true); setErr(null);
    try {
      const deadlineAt = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString();
      const pointA = a || A; const pointB = b || B;
      await Promise.all(loserIds.map((receiverId) =>
        apiClient.apiPost('/challenges/sport', { receiverId, gameType, type, distanceMeters: Math.round(km * 1000), deadlineAt, pointA, pointB })
          .catch(() => null),
      ));
      setSent(true);
    } catch (e: any) { setErr(e?.message || 'Échec'); } finally { setBusy(false); }
  };

  if (sent) {
    return (
      <div style={{ marginTop: 16, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.4)', borderRadius: 12, padding: 14 }}>
        <div style={{ color: '#4ADE80', fontWeight: 800 }}>Défi envoyé à {loserIds.length} perdant(s) ✓</div>
        <div style={{ color: '#CBD5E1', fontSize: '0.82rem', marginTop: 4 }}>
          {type === 'run' ? 'Course' : 'Marche'} de {km} km, à faire en {days} j. 📱 Ils le lancent depuis leur téléphone (tracking GPS).
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 16, background: 'rgba(252,211,77,0.1)', border: `1px solid ${GOLD}55`, borderRadius: 12, padding: 14, textAlign: 'left' }}>
      <div style={{ color: GOLD, fontWeight: 800, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}><Footprints style={{ width: 18, height: 18 }} /> Défie les perdants (HKIM sport)</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        {(['walk', 'run'] as const).map((t) => (
          <button key={t} onClick={() => setType(t)} style={pill(type === t)}>{t === 'walk' ? '🚶 Marche' : '🏃 Course'}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[1, 2, 3, 5].map((d) => <button key={d} onClick={() => setKm(d)} style={pill(km === d)}>{d} km</button>)}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {[1, 2, 3].map((d) => <button key={d} onClick={() => setDays(d)} style={pill(days === d)}>{d} j</button>)}
      </div>
      <div style={{ color: BLUE, fontSize: '0.78rem', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
        <MapPin style={{ width: 13, height: 13 }} /> Clique sur la carte : 1er point = Départ, 2e = Arrivée {a && b ? '✓' : a ? '(pose l’arrivée)' : ''}
      </div>
      <div style={{ marginBottom: 12 }}>
        <MapPicker onPick={(na, nb) => { setA(na); setB(nb); }} />
      </div>
      <button onClick={assign} disabled={busy} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: '#0A1535', fontWeight: 800, border: 'none', borderRadius: 10, padding: '10px 18px', cursor: 'pointer', opacity: busy ? 0.7 : 1 }}>
        <Send style={{ width: 15, height: 15 }} /> {busy ? 'Envoi…' : `Imposer le défi (${loserIds.length})`}
      </button>
      {err && <div style={{ color: '#FCA5A5', fontSize: '0.8rem', marginTop: 8 }}>{err}</div>}
    </div>
  );
}

const pill = (active: boolean): React.CSSProperties => ({
  background: active ? `linear-gradient(90deg, ${GOLD}, #F59E0B)` : 'rgba(255,255,255,0.08)',
  color: active ? '#0A1535' : '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999,
  padding: '7px 14px', fontWeight: 800, cursor: 'pointer', fontSize: '0.82rem',
});
