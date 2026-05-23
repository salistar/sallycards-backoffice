/**
 * @file apps/web/app/games/Hub.tsx
 * @description Hub générique d'un jeu web (scopa/tarot/…), sur le modèle Belote.
 *   Login-gated + grille de menu. Le multijoueur temps réel reste à venir pour
 *   ces jeux (le serveur /game gère la Belote) → cartes Créer/Rejoindre = bientôt.
 */
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { metaOf } from './meta';
import {
  LogIn, Bot, BookOpen, Gift, Users, Trophy, Medal, Inbox, Activity, LogOut, Plus, LogIn as Enter, Footprints,
} from 'lucide-react';

const NAVY = '#0A1535';
const CARD = '#152A47';
const GOLD = '#FCD34D';
const BLUE = '#93C5FD';

interface Item { key: string; label: string; sub: string; icon: any; grad: [string, string]; href?: string; soon?: boolean }

export function GameHub({ gameType }: { gameType: string }) {
  const meta = metaOf(gameType);
  const base = `/${gameType}`;
  const { user, logout } = useAuth();
  const router = useRouter();
  const [note, setNote] = useState<string | null>(null);

  const MENU: Item[] = [
    { key: 'bot', label: 'vs Bot', sub: 'Partie complète contre l’IA', icon: Bot, grad: ['#10B981', '#059669'], href: `${base}/bot` },
    { key: 'create', label: 'Créer une room', sub: 'Multijoueur temps réel web ↔ mobile', icon: Plus, grad: ['#7C3AED', '#EC4899'], href: `${base}/room` },
    { key: 'join', label: 'Rejoindre', sub: 'Avec un code', icon: Enter, grad: ['#2563EB', '#06B6D4'], href: `${base}/room` },
    { key: 'rules', label: 'Règles', sub: 'Distribution & scoring', icon: BookOpen, grad: ['#0EA5E9', '#2563EB'], href: `${base}/rules` },
    { key: 'leaderboards', label: 'Classements', sub: 'Top joueurs par ELO', icon: Medal, grad: ['#F59E0B', '#D97706'], href: `${base}/leaderboard` },
    { key: 'rewards', label: 'Récompenses', sub: 'Vouchers & niveaux', icon: Gift, grad: ['#EAB308', '#CA8A04'], href: `${base}/rewards` },
    { key: 'friends', label: 'Amis', sub: 'Liste & invitations', icon: Users, grad: ['#3B82F6', '#1D4ED8'], href: `${base}/friends` },
    { key: 'tournaments', label: 'Tournois', sub: 'Daily / weekly', icon: Trophy, grad: ['#EAB308', '#B45309'], href: `${base}/tournaments` },
    { key: 'inbox', label: 'Boîte', sub: 'Notifications', icon: Inbox, grad: ['#A855F7', '#7C3AED'], href: `${base}/inbox` },
    { key: 'hkim', label: 'Défis & Mur', sub: 'Défis sport A→B + mur de partage', icon: Footprints, grad: ['#14B8A6', '#0F766E'], href: `${base}/hkim` },
  ];

  if (!user) {
    return (
      <main style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${NAVY}, #1E3A8A 60%, ${NAVY})`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 460 }}>
          <div style={{ fontSize: 64 }}>{meta.emoji}</div>
          <h1 style={{ color: '#fff', fontSize: '2.2rem', fontWeight: 900, margin: '12px 0' }}>{meta.label} — SallyCards</h1>
          <p style={{ color: BLUE, fontSize: '1rem', lineHeight: 1.6, marginBottom: 28 }}>{meta.tagline}. Connecte-toi pour jouer.</p>
          <Link href={`/auth/login?game=${gameType}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: NAVY, fontWeight: 900, fontSize: '1.05rem', padding: '14px 32px', borderRadius: 14, textDecoration: 'none' }}>
            <LogIn style={{ width: 20, height: 20 }} /> Se connecter / S’inscrire
          </Link>
        </div>
      </main>
    );
  }

  const onMenu = (m: Item) => {
    if (m.href) { router.push(m.href); return; }
    setNote(`« ${m.label} » : le multijoueur temps réel arrive bientôt pour le ${meta.label}. En attendant, joue en vs Bot !`);
  };

  return (
    <main style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${NAVY}, #152A47)`, padding: '32px 20px 60px' }}>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 900 }}>{meta.emoji} {meta.label}</h1>
            <p style={{ color: BLUE, fontSize: '0.9rem' }}>Bonjour {(user as any).username || 'joueur'} · {(user as any).coins ?? 0} pièces</p>
          </div>
          <button onClick={() => logout()} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999, padding: '8px 16px', cursor: 'pointer', fontWeight: 700 }}>
            <LogOut style={{ width: 16, height: 16 }} /> Déconnexion
          </button>
        </div>

        {note && (
          <div style={{ background: 'rgba(252,211,77,0.12)', border: `1px solid ${GOLD}55`, borderRadius: 12, padding: 14, marginBottom: 20, color: GOLD, fontWeight: 600 }}>{note}</div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {MENU.map((m) => {
            const Icon = m.icon;
            return (
              <button key={m.key} onClick={() => onMenu(m)} style={{ textAlign: 'left', border: 'none', cursor: 'pointer', borderRadius: 16, overflow: 'hidden', padding: 0, background: CARD }}>
                <div style={{ background: `linear-gradient(135deg, ${m.grad[0]}, ${m.grad[1]})`, padding: 18, position: 'relative' }}>
                  <Icon style={{ width: 28, height: 28, color: '#fff' }} />
                  {m.soon && <span style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.35)', color: '#fff', fontSize: 10, fontWeight: 900, padding: '3px 8px', borderRadius: 999 }}>BIENTÔT</span>}
                </div>
                <div style={{ padding: 14 }}>
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: '1rem' }}>{m.label}</div>
                  <div style={{ color: BLUE, fontSize: '0.8rem', marginTop: 3 }}>{m.sub}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}
