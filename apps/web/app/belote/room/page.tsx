/**
 * @file apps/web/app/belote/room/page.tsx
 * @description Lobby multijoueur Belote (Phase 3) — créer une room (code généré)
 *   ou rejoindre avec un code. Le code est partagé : un joueur web et un joueur
 *   mobile qui saisissent le même code se retrouvent dans la même partie
 *   (serveur autoritatif /game) + appel vocal TURN/STUN.
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, LogIn as Enter } from 'lucide-react';
import { Screen, cardBox, GOLD, BLUE } from '../_components/Screen';

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function RoomLobby() {
  const router = useRouter();
  const [code, setCode] = useState('');

  const create = () => router.push(`/belote/room/${genCode()}`);
  const join = () => {
    const c = code.trim().toUpperCase();
    if (c.length >= 4) router.push(`/belote/room/${c}`);
  };

  return (
    <Screen title="Multijoueur" subtitle="Crée une room et partage le code, ou rejoins une room existante" icon={<Plus style={{ width: 26, height: 26, color: GOLD }} />}>
      <div style={{ display: 'grid', gap: 16 }}>
        <button onClick={create} style={{ ...cardBox, textAlign: 'left', cursor: 'pointer', border: `1px solid ${GOLD}55`, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: `linear-gradient(135deg, ${GOLD}, #F59E0B)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plus style={{ width: 24, height: 24, color: '#0A1535' }} />
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.05rem' }}>Créer une room</div>
            <div style={{ color: BLUE, fontSize: '0.82rem' }}>Un code à 6 caractères est généré. Tu joues contre l’adversaire qui le saisit (sinon des bots).</div>
          </div>
        </button>

        <div style={{ ...cardBox }}>
          <div style={{ color: '#fff', fontWeight: 800, marginBottom: 10 }}>Rejoindre avec un code</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && join()}
              placeholder="EX. K7P2QM"
              maxLength={6}
              style={{ flex: 1, minWidth: 160, background: '#0F2238', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '12px 14px', color: '#fff', outline: 'none', fontSize: '1.1rem', letterSpacing: 3, fontWeight: 800, textTransform: 'uppercase' }}
            />
            <button onClick={join} disabled={code.trim().length < 4} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: '#0A1535', fontWeight: 800, border: 'none', borderRadius: 10, padding: '12px 22px', cursor: 'pointer', opacity: code.trim().length < 4 ? 0.6 : 1 }}>
              <Enter style={{ width: 16, height: 16 }} /> Rejoindre
            </button>
          </div>
        </div>

        <div style={{ color: '#94A3B8', fontSize: '0.8rem', lineHeight: 1.6 }}>
          Astuce : pour une partie <strong style={{ color: BLUE }}>web ↔ mobile</strong>, crée la room ici, puis saisis le même code dans l’app mobile (Rejoindre). Un appel vocal (TURN/STUN SALISTAR) est disponible dans la partie.
        </div>
      </div>
    </Screen>
  );
}
