'use client';

import { useState, useEffect } from 'react';

interface ActiveGame {
  roomCode: string;
  gameType: string;
  icon: string;
  players: { name: string; isBot: boolean }[];
  duration: string;
  status: 'en_cours' | 'en_attente';
}

const MOCK_GAMES: ActiveGame[] = [
  {
    roomCode: 'ABCD',
    gameType: 'Ronda',
    icon: '\u{1F0CF}',
    players: [
      { name: 'ahmed_ronda92', isBot: false },
      { name: 'sara_cards', isBot: false },
      { name: 'Bot Hamza', isBot: true },
    ],
    duration: '12:34',
    status: 'en_cours',
  },
  {
    roomCode: 'EFGH',
    gameType: 'Kdoub',
    icon: '\u{1F925}',
    players: [
      { name: 'youssef_pro', isBot: false },
      { name: 'fatima_z', isBot: false },
      { name: 'karim_id', isBot: false },
    ],
    duration: '08:21',
    status: 'en_cours',
  },
  {
    roomCode: 'IJKL',
    gameType: 'Belote',
    icon: '\u2663\uFE0F',
    players: [
      { name: 'omar_fassi', isBot: false },
      { name: 'nadia_alaoui', isBot: false },
      { name: 'Bot Zineb', isBot: true },
      { name: 'Bot Amina', isBot: true },
    ],
    duration: '24:15',
    status: 'en_cours',
  },
  {
    roomCode: 'MNOP',
    gameType: 'Poker',
    icon: '\u2660\uFE0F',
    players: [
      { name: 'driss_pro', isBot: false },
      { name: 'amine_sef', isBot: false },
    ],
    duration: '00:45',
    status: 'en_attente',
  },
  {
    roomCode: 'QRST',
    gameType: 'Tarot',
    icon: '\u{1F451}',
    players: [
      { name: 'mehdi_b', isBot: false },
      { name: 'leila_ff', isBot: false },
      { name: 'rachid_k', isBot: false },
      { name: 'Bot Driss', isBot: true },
    ],
    duration: '18:02',
    status: 'en_cours',
  },
  {
    roomCode: 'UVWX',
    gameType: 'Scopa',
    icon: '\u{1FA99}',
    players: [
      { name: 'zineb_ouaz', isBot: false },
      { name: 'houda_ben', isBot: false },
    ],
    duration: '05:10',
    status: 'en_cours',
  },
  {
    roomCode: 'YZ12',
    gameType: 'Ronda',
    icon: '\u{1F0CF}',
    players: [
      { name: 'samir_tah', isBot: false },
      { name: 'imane_ch', isBot: false },
      { name: 'Bot Khadija', isBot: true },
    ],
    duration: '03:44',
    status: 'en_attente',
  },
  {
    roomCode: '3456',
    gameType: 'Okey',
    icon: '\u{1F3B4}',
    players: [
      { name: 'hassan_ben', isBot: false },
      { name: 'meryem_lah', isBot: false },
      { name: 'amina_zer', isBot: false },
    ],
    duration: '31:00',
    status: 'en_cours',
  },
];

const GAME_TYPES = ['Tous', 'Ronda', 'Kdoub', 'Belote', 'Poker', 'Tarot', 'Scopa', 'Okey'];

const GAME_BORDER_COLORS: Record<string, string> = {
  Ronda: '#ef4444',
  Kdoub: '#a855f7',
  Belote: '#3b82f6',
  Poker: '#f59e0b',
  Tarot: '#ec4899',
  Scopa: '#10b981',
  Okey: '#06b6d4',
};

const AVATAR_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#a855f7', '#ec4899', '#06b6d4', '#ef4444',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function GamesPage() {
  const [filter, setFilter] = useState('Tous');
  const [games, setGames] = useState<ActiveGame[]>(MOCK_GAMES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const { apiClient } = await import('../../lib/api');
        setGames(MOCK_GAMES);
      } catch {
        setGames(MOCK_GAMES);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGames();
  }, []);

  const filtered = filter === 'Tous'
    ? games
    : games.filter((g) => g.gameType === filter);

  const getFilterCount = (type: string) => {
    if (type === 'Tous') return games.length;
    return games.filter((g) => g.gameType === type).length;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48, padding: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#111827', letterSpacing: '-0.04em', margin: 0 }}>Parties en Cours</h1>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              borderRadius: 9999,
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
            }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  boxShadow: '0 0 8px rgba(16,185,129,0.6)',
                  animation: 'pulse 2s infinite',
                }}
              />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>
                LIVE
              </span>
            </div>
          </div>
          <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, margin: 0 }}>
            {filtered.length} partie{filtered.length !== 1 ? 's' : ''} active{filtered.length !== 1 ? 's' : ''} en ce moment
          </p>
        </div>
        <div style={{
          padding: '10px 16px',
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 700,
          background: 'white',
          border: '1px solid #e5e7eb',
          color: '#374151',
        }}>
          {games.filter((g) => g.status === 'en_cours').length} en cours / {games.filter((g) => g.status === 'en_attente').length} en attente
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {GAME_TYPES.map((type) => {
          const count = getFilterCount(type);
          const isActive = filter === type;
          return (
            <button
              key={type}
              onClick={() => setFilter(type)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 700,
                transition: 'all 0.3s ease-out',
                cursor: 'pointer',
                border: isActive ? '1px solid #10b981' : '1px solid #e5e7eb',
                background: isActive ? '#ecfdf5' : 'white',
                color: isActive ? '#059669' : '#6b7280',
              }}
            >
              {type}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 20,
                  height: 20,
                  padding: '0 6px',
                  borderRadius: 9999,
                  fontSize: 12,
                  fontWeight: 700,
                  background: isActive ? '#d1fae5' : '#f3f4f6',
                  color: isActive ? '#059669' : '#9ca3af',
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Games Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360, 1fr))', gap: 24 }}>
        {filtered.map((game) => {
          const borderColor = GAME_BORDER_COLORS[game.gameType] || '#10b981';
          return (
            <div
              key={game.roomCode}
              style={{
                position: 'relative',
                borderRadius: 24,
                overflow: 'hidden',
                transition: 'all 0.3s ease-out',
                background: 'white',
                border: '1px solid #e5e7eb',
                borderLeft: `3px solid ${borderColor}`,
                boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)',
              }}
            >
              {/* Card content */}
              <div style={{ padding: 24 }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                        transition: 'all 0.3s ease-out',
                        background: `${borderColor}15`,
                        border: `1px solid ${borderColor}30`,
                      }}
                    >
                      {game.icon}
                    </div>
                    <div>
                      <h3 style={{ fontWeight: 900, color: '#111827', fontSize: 18, letterSpacing: '-0.04em', margin: 0 }}>{game.gameType}</h3>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 12,
                        fontFamily: 'monospace',
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: '#f9fafb',
                        color: '#6b7280',
                        border: '1px solid #e5e7eb',
                      }}>
                        #{game.roomCode}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 12px',
                      borderRadius: 9999,
                      fontSize: 12,
                      fontWeight: 700,
                      border: game.status === 'en_cours' ? '1px solid #a7f3d0' : '1px solid #fde68a',
                      background: game.status === 'en_cours' ? '#ecfdf5' : '#fffbeb',
                      color: game.status === 'en_cours' ? '#059669' : '#d97706',
                    }}
                  >
                    {game.status === 'en_cours' && (
                      <span
                        style={{
                          display: 'inline-block',
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: '#10b981',
                          boxShadow: '0 0 6px rgba(16,185,129,0.6)',
                          animation: 'pulse 2s infinite',
                        }}
                      />
                    )}
                    {game.status === 'en_cours' ? 'En cours' : 'En attente'}
                  </span>
                </div>

                {/* Players - Stacked Avatars */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 12, color: '#9ca3af' }}>
                    Joueurs ({game.players.length})
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {/* Stacked mini avatars */}
                    <div style={{ display: 'flex', marginRight: 12 }}>
                      {game.players.map((p, idx) => {
                        const color = p.isBot ? '#f59e0b' : getAvatarColor(p.name);
                        return (
                          <div
                            key={p.name}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12,
                              fontWeight: 700,
                              transition: 'all 0.3s ease-out',
                              background: `${color}20`,
                              borderWidth: 2,
                              borderStyle: 'solid',
                              borderColor: 'white',
                              color: color,
                              zIndex: game.players.length - idx,
                              position: 'relative',
                              marginLeft: idx > 0 ? -8 : 0,
                            }}
                            title={p.name}
                          >
                            {p.isBot ? '\u{1F916}' : p.name.charAt(0).toUpperCase()}
                          </div>
                        );
                      })}
                    </div>
                    {/* Player names */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, flex: 1, minWidth: 0 }}>
                      {game.players.map((p, i) => (
                        <span
                          key={p.name}
                          style={{
                            fontSize: 12,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: 100,
                            color: p.isBot ? '#d97706' : '#374151',
                          }}
                          title={p.name}
                        >
                          {p.name}{i < game.players.length - 1 ? ',' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
                  {/* Duration */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14 }}>{'\u23F1\uFE0F'}</span>
                    <span style={{ fontSize: 14, fontFamily: 'monospace', fontWeight: 700, color: '#6b7280' }}>
                      {game.duration}
                    </span>
                  </div>

                  {/* Spectate Button */}
                  <button style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 16px',
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 700,
                    transition: 'all 0.3s ease-out',
                    color: '#059669',
                    border: '1px solid #10b981',
                    background: 'transparent',
                    cursor: 'pointer',
                  }}>
                    {'\u{1F441}\uFE0F'} Spectater
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
