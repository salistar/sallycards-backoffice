'use client';

import { useState, useEffect } from 'react';
import { Trophy, Medal, Target, TrendingUp, Gamepad2 } from 'lucide-react';

const GAME_TYPES = ['Ronda', 'Kdoub', 'Belote', 'Poker', 'Tarot', 'Scopa', 'Okey'];
const MAX_SCORE = 2000;

interface LeaderEntry {
  rank: number;
  avatar: string;
  username: string;
  score: number;
  games: number;
  winrate: string;
}

const LEADERBOARD_MOCK: LeaderEntry[] = [
  { rank: 1, avatar: 'C', username: 'champion_x', score: 1995, games: 210, winrate: '72.4%' },
  { rank: 2, avatar: 'M', username: 'master_cards', score: 1948, games: 185, winrate: '68.1%' },
  { rank: 3, avatar: 'R', username: 'ronda_king', score: 1905, games: 198, winrate: '65.7%' },
  { rank: 4, avatar: 'P', username: 'pro_player', score: 1862, games: 170, winrate: '63.5%' },
  { rank: 5, avatar: 'L', username: 'lucky_hand', score: 1820, games: 155, winrate: '61.3%' },
  { rank: 6, avatar: 'C', username: 'card_shark', score: 1775, games: 142, winrate: '59.9%' },
  { rank: 7, avatar: 'B', username: 'bluff_boss', score: 1730, games: 190, winrate: '57.4%' },
  { rank: 8, avatar: 'A', username: 'ace_hunter', score: 1688, games: 165, winrate: '55.8%' },
  { rank: 9, avatar: 'T', username: 'trick_queen', score: 1645, games: 178, winrate: '54.2%' },
  { rank: 10, avatar: 'S', username: 'slam_dunk', score: 1600, games: 132, winrate: '52.3%' },
  { rank: 11, avatar: 'W', username: 'wild_joker', score: 1558, games: 148, winrate: '50.7%' },
  { rank: 12, avatar: 'F', username: 'full_house', score: 1512, games: 160, winrate: '49.4%' },
  { rank: 13, avatar: 'B', username: 'big_blind', score: 1470, games: 138, winrate: '47.8%' },
  { rank: 14, avatar: 'R', username: 'river_rat', score: 1425, games: 125, winrate: '46.4%' },
  { rank: 15, avatar: 'P', username: 'pocket_pair', score: 1382, games: 152, winrate: '45.1%' },
  { rank: 16, avatar: 'S', username: 'straight_flush', score: 1340, games: 118, winrate: '43.2%' },
  { rank: 17, avatar: 'R', username: 'royal_run', score: 1295, games: 140, winrate: '41.4%' },
  { rank: 18, avatar: 'H', username: 'high_roller', score: 1250, games: 110, winrate: '40.0%' },
  { rank: 19, avatar: 'A', username: 'ante_up', score: 1208, games: 128, winrate: '38.3%' },
  { rank: 20, avatar: 'C', username: 'check_mate', score: 1165, games: 105, winrate: '36.2%' },
];

const PODIUM_CONFIG: Record<number, { color: string; borderColor: string; icon: string; scale: string }> = {
  1: { color: '#f59e0b', borderColor: '#f59e0b', icon: '\u{1F947}', scale: '1.1' },
  2: { color: '#94a3b8', borderColor: '#94a3b8', icon: '\u{1F948}', scale: '1' },
  3: { color: '#d97706', borderColor: '#d97706', icon: '\u{1F949}', scale: '0.95' },
};

export default function LeaderboardAdminPage() {
  const [selectedGame, setSelectedGame] = useState(GAME_TYPES[0]);
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        const { apiClient } = await import('../../lib/api');
        const data = await apiClient.getLeaderboard(selectedGame);
        setLeaderboard(data.map((d: any) => ({ ...d, avatar: d.avatar || d.username?.[0]?.toUpperCase() || '?' })));
      } catch {
        setLeaderboard(LEADERBOARD_MOCK);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaderboard();
  }, [selectedGame]);

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  const podiumDisplay = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: 32, display: 'flex', flexDirection: 'column', gap: 48 }}>
      {/* Header section */}
      <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#111827', letterSpacing: '-0.04em', textTransform: 'uppercase', fontStyle: 'italic', margin: 0 }}>Leaderboard</h1>
            <span style={{
              background: '#ecfdf5',
              color: '#059669',
              padding: '4px 12px',
              borderRadius: 9999,
              fontSize: 10,
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              border: '1px solid #a7f3d0',
            }}>
              Saison 3 - 2026
            </span>
          </div>
          <p style={{ color: '#6b7280', fontSize: 14, fontWeight: 500, lineHeight: 1.6, margin: 0 }}>Affrontez les meilleurs joueurs et dominez le classement.</p>
        </div>

        {/* Game Selector */}
        <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 8, background: 'white', padding: 6, borderRadius: 12, border: '1px solid #e5e7eb' }}>
          {GAME_TYPES.map((game) => (
            <button
              key={game}
              onClick={() => setSelectedGame(game)}
              style={{
                padding: '8px 16px',
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease-out',
                background: selectedGame === game ? '#10b981' : 'transparent',
                color: selectedGame === game ? 'white' : '#6b7280',
              }}
            >
              {game}
            </button>
          ))}
        </nav>
      </header>

      {/* Podium Section */}
      {isLoading ? (
        <div style={{ height: 256, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontStyle: 'italic' }}>Chargement du podium...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, alignItems: 'flex-end', paddingTop: 40 }}>
          {podiumDisplay.map((player) => {
            const config = PODIUM_CONFIG[player.rank];
            return (
              <div
                key={player.username}
                style={{
                  position: 'relative',
                  background: 'white',
                  borderRadius: 24,
                  padding: 32,
                  textAlign: 'center',
                  transition: 'all 0.3s ease-out',
                  border: `1px solid #e5e7eb`,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)',
                  transform: `scale(${config.scale})`,
                  zIndex: player.rank === 1 ? 10 : 1,
                }}
              >
                <div style={{ position: 'absolute', top: -48, left: '50%', transform: 'translateX(-50%)', fontSize: 56 }}>
                  {config.icon}
                </div>

                <div style={{
                  margin: '0 auto',
                  width: 96,
                  height: 96,
                  borderRadius: '50%',
                  border: `4px solid ${config.borderColor}60`,
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f3f4f6',
                  fontSize: 28,
                  fontWeight: 900,
                  color: '#374151',
                }}>
                  {player.avatar}
                </div>

                <h3 style={{ fontSize: 20, fontWeight: 900, color: '#111827', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.04em' }}>{player.username}</h3>
                <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 24, color: config.color }}>
                  {new Intl.NumberFormat('fr-FR').format(player.score)}
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  fontSize: 10,
                  textTransform: 'uppercase',
                  fontWeight: 900,
                  color: '#6b7280',
                  letterSpacing: '0.2em',
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ color: '#111827', display: 'flex', alignItems: 'center', gap: 4 }}><Gamepad2 size={12}/> {player.games}</span>
                    <span>Parties</span>
                  </div>
                  <div style={{ width: 1, height: 24, background: '#e5e7eb' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ color: '#111827', display: 'flex', alignItems: 'center', gap: 4 }}><TrendingUp size={12}/> {player.winrate}</span>
                    <span>Winrate</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table Section */}
      <div style={{ background: 'white', borderRadius: 24, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '20px 24px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#6b7280', fontWeight: 900, background: '#f9fafb' }}>Rang</th>
                <th style={{ padding: '20px 24px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#6b7280', fontWeight: 900, background: '#f9fafb' }}>Joueur</th>
                <th style={{ padding: '20px 24px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#6b7280', fontWeight: 900, background: '#f9fafb', textAlign: 'center' }}>Score ELO</th>
                <th style={{ padding: '20px 24px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#6b7280', fontWeight: 900, background: '#f9fafb', minWidth: 200 }}>Progression</th>
                <th style={{ padding: '20px 24px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#6b7280', fontWeight: 900, background: '#f9fafb', textAlign: 'center' }}>Stats</th>
              </tr>
            </thead>
            <tbody>
              {rest.map((player, idx) => {
                const wr = parseFloat(player.winrate);
                const progressWidth = (player.score / MAX_SCORE) * 100;

                const wrStyle = wr >= 60
                  ? { color: '#059669', background: '#ecfdf5' }
                  : wr >= 45
                  ? { color: '#6b7280', background: '#f3f4f6' }
                  : { color: '#dc2626', background: '#fef2f2' };

                return (
                  <tr
                    key={player.rank}
                    style={{
                      borderBottom: '1px solid #f3f4f6',
                      transition: 'all 0.3s ease-out',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f9fafb'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '20px 24px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 900, color: '#9ca3af' }}>
                        #{player.rank.toString().padStart(2, '0')}
                      </span>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          background: '#f3f4f6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          color: '#374151',
                          border: '1px solid #e5e7eb',
                        }}>
                          {player.avatar}
                        </div>
                        <span style={{ fontWeight: 700, color: '#111827' }}>{player.username}</span>
                      </div>
                    </td>
                    <td style={{ padding: '20px 24px', textAlign: 'center', fontWeight: 900, color: '#d97706' }}>
                      {new Intl.NumberFormat('fr-FR').format(player.score)}
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{ width: '100%', background: '#e5e7eb', height: 6, borderRadius: 9999, overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            background: 'linear-gradient(to right, #10b981, #f59e0b)',
                            borderRadius: 9999,
                            transition: 'all 0.3s ease-out',
                            width: `${progressWidth}%`,
                          }}
                        />
                      </div>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 24, fontSize: 12 }}>
                        <span style={{ color: '#6b7280', fontWeight: 500 }}>
                          <b style={{ color: '#111827' }}>{player.games}</b> gms
                        </span>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: 12,
                          fontWeight: 700,
                          ...wrStyle,
                        }}>
                          {player.winrate}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
