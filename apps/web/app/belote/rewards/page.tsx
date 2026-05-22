/**
 * @file apps/web/app/belote/rewards/page.tsx
 * @description Écran Récompenses web (Phase 2) — niveau/XP (/levels/me) +
 *   bons d'achat (/rewards/vouchers). Données prod, lecture seule.
 */
'use client';

import { useEffect, useState } from 'react';
import { Gift } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { Screen, StateNote, cardBox, GOLD, BLUE } from '../_components/Screen';

interface Voucher {
  code: string; amount: number; currency: string;
  providerStoreCode: string; reason: string; status: string;
  issuedAt?: string; expiresAt?: string;
}
interface Level {
  level: number; xp: number; nextLevelXp: number; unlockedFeatures: string[];
}

const STORE_LABEL: Record<string, string> = {
  amazon: 'Amazon', fnac: 'Fnac', decathlon: 'Decathlon',
  apple: 'Apple', google_play: 'Google Play', custom: 'Bon cadeau',
};
const STATUS_LABEL: Record<string, string> = {
  issued: 'Disponible', claimed: 'Réclamé', expired: 'Expiré',
};

export default function RewardsScreen() {
  const [level, setLevel] = useState<Level | null>(null);
  const [vouchers, setVouchers] = useState<Voucher[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [lvl, vs] = await Promise.all([
          apiClient.apiGet<Level>('/levels/me?gameType=belote').catch(() => null),
          apiClient.apiGet<Voucher[]>('/rewards/vouchers').catch(() => []),
        ]);
        if (!alive) return;
        setLevel(lvl);
        setVouchers(Array.isArray(vs) ? vs : []);
      } catch (e: any) {
        if (alive) setError(e?.message || 'Erreur de chargement');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const pct = level && level.nextLevelXp > 0
    ? Math.min(100, Math.round((level.xp / level.nextLevelXp) * 100)) : 0;

  return (
    <Screen title="Récompenses" subtitle="Niveau, XP et bons d'achat gagnés" icon={<Gift style={{ width: 26, height: 26, color: GOLD }} />}>
      {loading && <StateNote kind="loading" text="Chargement…" />}
      {error && !loading && <StateNote kind="error" text={error} />}

      {!loading && !error && (
        <>
          {/* Niveau / XP */}
          <div style={{ ...cardBox, marginBottom: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem' }}>
                Niveau {level?.level ?? 1}
              </span>
              <span style={{ color: BLUE, fontSize: '0.85rem' }}>
                {level?.xp ?? 0} / {level?.nextLevelXp ?? 100} XP
              </span>
            </div>
            <div style={{ height: 12, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, transition: 'width .3s' }} />
            </div>
            {level?.unlockedFeatures && level.unlockedFeatures.length > 0 && (
              <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {level.unlockedFeatures.map((f) => (
                  <span key={f} style={{ background: 'rgba(252,211,77,0.12)', color: GOLD, borderRadius: 999, padding: '4px 10px', fontSize: '0.72rem', fontWeight: 700 }}>{f}</span>
                ))}
              </div>
            )}
          </div>

          {/* Vouchers */}
          <h2 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 800, marginBottom: 12 }}>Mes bons d'achat</h2>
          {vouchers && vouchers.length === 0 && (
            <StateNote kind="empty" text="Aucun bon pour le moment. Gagne des tournois pour en débloquer !" />
          )}
          <div style={{ display: 'grid', gap: 12 }}>
            {vouchers?.map((v) => (
              <div key={v.code} style={{ ...cardBox, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div>
                  <div style={{ color: '#fff', fontWeight: 800 }}>
                    {STORE_LABEL[v.providerStoreCode] || v.providerStoreCode} · {v.amount} {v.currency}
                  </div>
                  <div style={{ color: BLUE, fontSize: '0.8rem', marginTop: 2 }}>{v.reason}</div>
                  <code style={{ color: GOLD, fontSize: '0.78rem', letterSpacing: 1 }}>{v.code}</code>
                </div>
                <span style={{
                  fontSize: '0.72rem', fontWeight: 800, padding: '5px 10px', borderRadius: 999,
                  background: v.status === 'issued' ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.08)',
                  color: v.status === 'issued' ? '#4ADE80' : '#94A3B8',
                }}>{STATUS_LABEL[v.status] || v.status}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </Screen>
  );
}
