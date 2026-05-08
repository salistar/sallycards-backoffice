'use client';

import { useState, useEffect } from 'react';

interface BotProfile {
  id: string;
  name: string;
  avatar: string;
  personality: string;
  difficulty: 'Facile' | 'Moyen' | 'Difficile' | 'Expert';
  gamesPlayed: number;
  winRate: number;
  active: boolean;
}

const MOCK_BOTS: BotProfile[] = [
  { id: '1', name: 'Hamza', avatar: '\u{1F9D4}', personality: 'Bluffeur agressif', difficulty: 'Difficile', gamesPlayed: 4521, winRate: 68, active: true },
  { id: '2', name: 'Zineb', avatar: '\u{1F469}\u200D\u{1F33E}', personality: 'Stratege patiente', difficulty: 'Moyen', gamesPlayed: 3890, winRate: 55, active: true },
  { id: '3', name: 'Driss', avatar: '\u{1F468}\u200D\u{1F4BB}', personality: 'Calculateur de risques', difficulty: 'Expert', gamesPlayed: 2100, winRate: 78, active: true },
  { id: '4', name: 'Amina', avatar: '\u{1F469}\u200D\u{1F3EB}', personality: 'Enseigne en jouant', difficulty: 'Facile', gamesPlayed: 5200, winRate: 35, active: true },
  { id: '5', name: 'Youssef', avatar: '\u{1F9D1}\u200D\u{1F680}', personality: 'Imprevisible et creatif', difficulty: 'Difficile', gamesPlayed: 1800, winRate: 62, active: false },
  { id: '6', name: 'Khadija', avatar: '\u{1F469}\u200D\u2696\uFE0F', personality: 'Juste et equilibree', difficulty: 'Moyen', gamesPlayed: 3400, winRate: 50, active: true },
  { id: '7', name: 'Rachid', avatar: '\u{1F468}\u200D\u{1F52C}', personality: 'Analytique froid', difficulty: 'Expert', gamesPlayed: 2800, winRate: 73, active: true },
  { id: '8', name: 'Leila', avatar: '\u{1F469}\u200D\u{1F3A8}', personality: 'Joueuse intuitive', difficulty: 'Moyen', gamesPlayed: 3100, winRate: 58, active: false },
];

const DIFF_COLORS: Record<string, { bg: string; color: string; gradient: string }> = {
  Facile: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
  Moyen: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
  Difficile: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444, #f87171)' },
  Expert: { bg: 'rgba(168,85,247,0.1)', color: '#a855f7', gradient: 'linear-gradient(135deg, #a855f7, #c084fc)' },
  easy: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
  medium: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
  hard: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444, #f87171)' },
  expert: { bg: 'rgba(168,85,247,0.1)', color: '#a855f7', gradient: 'linear-gradient(135deg, #a855f7, #c084fc)' },
};

const DEFAULT_DIFF = { bg: 'rgba(0,0,0,0.05)', color: '#888', gradient: 'linear-gradient(135deg, #888, #aaa)' };

export default function BotsPage() {
  const [bots, setBots] = useState(MOCK_BOTS);
  const [editingBot, setEditingBot] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBots = async () => {
      try {
        const { apiClient } = await import('../../lib/api');
        const data = await apiClient.listBots();
        setBots(data);
      } catch (error) {
        setBots(MOCK_BOTS);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBots();
  }, []);

  const toggleActive = (id: string) => {
    setBots((prev) =>
      prev.map((b) => (b.id === id ? { ...b, active: !b.active } : b))
    );
  };

  const activeBots = bots.filter((b) => b.active).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48, padding: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#111827', letterSpacing: '-0.04em', margin: 0 }}>Bots IA</h1>
            <p style={{ fontSize: 14, marginTop: 4, color: '#6b7280', lineHeight: 1.6, margin: '4px 0 0 0' }}>
              Configurez les profils et comportements des bots IA.
            </p>
          </div>
          <div style={{
            padding: '4px 12px',
            borderRadius: 9999,
            fontSize: 12,
            fontWeight: 700,
            background: '#ecfdf5',
            color: '#059669',
            border: '1px solid #a7f3d0',
          }}>
            {activeBots} / {bots.length} actifs
          </div>
        </div>
        <button style={{
          padding: '10px 20px',
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 700,
          transition: 'all 0.3s ease-out',
          background: '#10b981',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
        }}>
          + Ajouter un bot
        </button>
      </div>

      {/* Bot Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
        {bots.map((bot) => {
          const diff = DIFF_COLORS[bot.difficulty] || DEFAULT_DIFF;
          return (
            <div
              key={bot.id}
              style={{
                borderRadius: 24,
                overflow: 'hidden',
                transition: 'all 0.3s ease-out',
                background: 'white',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)',
                opacity: bot.active ? 1 : 0.55,
              }}
            >
              {/* Gradient Header Strip */}
              <div
                style={{ height: 8, background: diff.gradient }}
              />

              <div style={{ padding: 24 }}>
                {/* Avatar Centered */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 48,
                      transition: 'all 0.3s ease-out',
                      background: diff.bg,
                    }}
                  >
                    {bot.avatar}
                  </div>
                </div>

                {/* Name + Difficulty Badge */}
                <div style={{ textAlign: 'center', marginBottom: 8 }}>
                  <h3 style={{ fontWeight: 900, fontSize: 18, color: '#111827', marginBottom: 6, letterSpacing: '-0.04em' }}>{bot.name}</h3>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: 9999,
                      fontSize: 12,
                      fontWeight: 700,
                      backgroundColor: diff.bg,
                      color: diff.color,
                    }}
                  >
                    {bot.difficulty}
                  </span>
                </div>

                {/* Personality */}
                <p style={{ fontSize: 14, fontStyle: 'italic', textAlign: 'center', marginBottom: 20, color: '#6b7280', lineHeight: 1.6 }}>
                  {bot.personality}
                </p>

                {/* Stats Section */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                  <div style={{ padding: 12, borderRadius: 12, textAlign: 'center', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: 18, marginBottom: 2 }}>{'\u{1F3AE}'}</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#111827' }}>
                      {new Intl.NumberFormat('fr-FR').format(bot.gamesPlayed)}
                    </div>
                    <div style={{ fontSize: 12, marginTop: 2, color: '#6b7280' }}>
                      Parties
                    </div>
                  </div>
                  <div style={{ padding: 12, borderRadius: 12, textAlign: 'center', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: 18, marginBottom: 2 }}>{'\u{1F3C6}'}</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#d97706' }}>
                      {bot.winRate}%
                    </div>
                    <div style={{ fontSize: 12, marginTop: 2, color: '#6b7280' }}>
                      Winrate
                    </div>
                  </div>
                </div>

                {/* Toggle Active/Inactive */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, padding: '0 4px' }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>
                    {bot.active ? 'Actif' : 'Inactif'}
                  </span>
                  <button
                    onClick={() => toggleActive(bot.id)}
                    style={{
                      position: 'relative',
                      width: 48,
                      height: 28,
                      borderRadius: 9999,
                      transition: 'all 0.3s ease-out',
                      backgroundColor: bot.active ? '#10b981' : '#d1d5db',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: 4,
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        transition: 'all 0.3s ease-out',
                        backgroundColor: 'white',
                        left: bot.active ? 26 : 4,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }}
                    />
                  </button>
                </div>

                {/* Configurer Button */}
                <button
                  onClick={() => setEditingBot(editingBot === bot.id ? null : bot.id)}
                  style={{
                    width: '100%',
                    padding: '10px 0',
                    fontSize: 14,
                    fontWeight: 700,
                    borderRadius: 12,
                    transition: 'all 0.3s ease-out',
                    cursor: 'pointer',
                    border: editingBot === bot.id ? '1px solid #10b981' : '1px solid #10b981',
                    background: editingBot === bot.id ? '#10b981' : 'transparent',
                    color: editingBot === bot.id ? 'white' : '#059669',
                  }}
                >
                  {editingBot === bot.id ? 'Fermer config' : 'Configurer'}
                </button>

                {/* Edit Panel */}
                {editingBot === bot.id && (
                  <div style={{ marginTop: 16, padding: 16, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 12, background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                    <div>
                      <label style={{ fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 500, color: '#6b7280' }}>
                        Nom
                      </label>
                      <input
                        defaultValue={bot.name}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 12,
                          fontSize: 14,
                          color: '#111827',
                          outline: 'none',
                          transition: 'all 0.3s ease-out',
                          background: 'white',
                          border: '1px solid #e5e7eb',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 500, color: '#6b7280' }}>
                        Personnalite
                      </label>
                      <input
                        defaultValue={bot.personality}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 12,
                          fontSize: 14,
                          color: '#111827',
                          outline: 'none',
                          transition: 'all 0.3s ease-out',
                          background: 'white',
                          border: '1px solid #e5e7eb',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 500, color: '#6b7280' }}>
                        Difficulte
                      </label>
                      <select
                        defaultValue={bot.difficulty}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 12,
                          fontSize: 14,
                          color: '#111827',
                          outline: 'none',
                          background: 'white',
                          border: '1px solid #e5e7eb',
                          transition: 'all 0.3s ease-out',
                          boxSizing: 'border-box',
                        }}
                      >
                        <option value="Facile">Facile</option>
                        <option value="Moyen">Moyen</option>
                        <option value="Difficile">Difficile</option>
                        <option value="Expert">Expert</option>
                      </select>
                    </div>
                    <button style={{
                      width: '100%',
                      padding: '10px 0',
                      fontSize: 14,
                      fontWeight: 700,
                      borderRadius: 12,
                      transition: 'all 0.3s ease-out',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                    }}>
                      Sauvegarder
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
