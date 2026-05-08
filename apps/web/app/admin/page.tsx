'use client';

import { useEffect, useState } from 'react';
import StatsCard from '../components/StatsCard';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const STATS = [
  { label: 'Joueurs actifs', value: '2 847', trend: 'up' as const, change: '+12.5%', icon: '👥', color: '#10b981' },
  { label: "Parties aujourd'hui", value: '1 203', trend: 'up' as const, change: '+8.2%', icon: '🎮', color: '#3b82f6' },
  { label: 'Revenus (Sally Coins)', value: '45 600', trend: 'down' as const, change: '-3.1%', icon: '💰', color: '#f59e0b' },
  { label: 'Temps moyen session', value: '24 min', trend: 'up' as const, change: '+5.7%', icon: '⏱️', color: '#a855f7' },
];

const PLAYERS_30D = [
  { date: '01 Mar', players: 1800 },
  { date: '03 Mar', players: 2100 },
  { date: '05 Mar', players: 1950 },
  { date: '07 Mar', players: 2300 },
  { date: '09 Mar', players: 2200 },
  { date: '11 Mar', players: 2600 },
  { date: '13 Mar', players: 2400 },
  { date: '15 Mar', players: 2550 },
  { date: '17 Mar', players: 2700 },
  { date: '19 Mar', players: 2900 },
  { date: '21 Mar', players: 2650 },
  { date: '23 Mar', players: 2800 },
  { date: '25 Mar', players: 3100 },
  { date: '27 Mar', players: 3050 },
  { date: '29 Mar', players: 3200 },
  { date: '31 Mar', players: 2847 },
];

const GAMES_BY_TYPE = [
  { name: 'Ronda', parties: 340 },
  { name: 'Kdoub', parties: 280 },
  { name: 'Belote', parties: 220 },
  { name: 'Poker', parties: 190 },
  { name: 'Tarot', parties: 150 },
  { name: 'Scopa', parties: 120 },
  { name: 'Okey', parties: 95 },
  { name: 'Concentration', parties: 80 },
  { name: 'Solitaire', parties: 60 },
  { name: 'Qui Est-Ce', parties: 45 },
];

const ACTIVITY_ICONS: Record<string, string> = {
  user: '👤',
  game: '🎮',
  bot: '🤖',
  report: '🚩',
  tournament: '🏆',
  achievement: '⭐',
  purchase: '💎',
};

const ACTIVITY_COLORS: Record<string, string> = {
  user: '#10b981',
  game: '#3b82f6',
  bot: '#a855f7',
  report: '#ef4444',
  tournament: '#f59e0b',
  achievement: '#10b981',
  purchase: '#f59e0b',
};

const RECENT_ACTIVITY = [
  { time: 'Il y a 2 min', action: 'Nouvel utilisateur inscrit', detail: 'ahmed_ronda92', type: 'user' },
  { time: 'Il y a 5 min', action: 'Partie terminee', detail: 'Ronda - Salle #4521', type: 'game' },
  { time: 'Il y a 8 min', action: 'Config bot modifiee', detail: 'Bot Hamza - difficulte augmentee', type: 'bot' },
  { time: 'Il y a 12 min', action: 'Signalement recu', detail: 'Rapport toxicite #892', type: 'report' },
  { time: 'Il y a 15 min', action: 'Tournoi lance', detail: 'Coupe Hebdo Kdoub', type: 'tournament' },
  { time: 'Il y a 20 min', action: 'Succes debloque', detail: 'sara_cards - Premiere Victoire', type: 'achievement' },
  { time: 'Il y a 25 min', action: 'Partie terminee', detail: 'Belote - Salle #3302', type: 'game' },
  { time: 'Il y a 30 min', action: 'Nouvel utilisateur inscrit', detail: 'karim_poker', type: 'user' },
  { time: 'Il y a 35 min', action: 'Achat Sally Coins', detail: '500 coins - youssef_pro', type: 'purchase' },
  { time: 'Il y a 40 min', action: 'Bot desactive', detail: 'Bot Youssef - maintenance', type: 'bot' },
];

const TOP_PLAYERS = [
  { rank: 1, name: 'champion_x', elo: 2150, games: 342 },
  { rank: 2, name: 'master_cards', elo: 2080, games: 298 },
  { rank: 3, name: 'ronda_king', elo: 2010, games: 276 },
  { rank: 4, name: 'pro_player', elo: 1980, games: 253 },
  { rank: 5, name: 'lucky_hand', elo: 1950, games: 241 },
];

const MAX_ELO = 2200;

const tooltipStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  color: '#374151',
  fontSize: '12px',
  padding: '10px 14px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
};

export default function AdminDashboard() {
  const [stats] = useState(STATS);
  const [topPlayers, setTopPlayers] = useState(TOP_PLAYERS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { apiClient } = await import('../lib/api');
        try {
          const leaderboardData = await apiClient.getLeaderboard(undefined, 5);
          setTopPlayers(leaderboardData.map((entry) => ({
            rank: entry.rank,
            name: entry.username,
            elo: parseInt(entry.score.toString()),
            games: entry.games,
          })));
        } catch {
          // Leaderboard API unavailable, keep mock data
        }
      } catch {
        // API unavailable, using mock data
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 48, width: '100%', padding: 32 }}>
      {/* Welcome Banner */}
      <div
        style={{
          width: '100%',
          padding: 32,
          borderRadius: 24,
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease-out',
          backgroundColor: '#ffffff',
          border: '1px solid #f3f4f6',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        {/* Subtle colored tints */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 256,
            height: 256,
            borderRadius: '50%',
            opacity: 0.3,
            background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)',
            transform: 'translate(30%, -30%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            width: 192,
            height: 192,
            borderRadius: '50%',
            opacity: 0.2,
            background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
            transform: 'translate(-50%, 50%)',
          }}
        />

        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 30 }}>🎴</span>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: '#111827', letterSpacing: '-0.05em' }}>
                Bienvenue, <span style={{ color: '#059669' }}>Admin</span>
              </h1>
              <span style={{ fontSize: 30 }}>🃏</span>
            </div>
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
              Voici un apercu de l&apos;activite de SallyCards. Derniere mise a jour il y a 2 minutes.
            </p>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 12,
              alignSelf: 'flex-start',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 8px rgba(16,185,129,0.6)',
                animation: 'pulse 2s infinite',
              }}
            />
            <span style={{ fontSize: 14, fontWeight: 500, color: '#059669' }}>
              Systeme en ligne
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
        {stats.map((stat) => (
          <StatsCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
        {/* Players Over Time */}
        <div
          style={{
            padding: 24,
            borderRadius: 24,
            transition: 'all 0.3s ease-out',
            backgroundColor: '#ffffff',
            border: '1px solid #f3f4f6',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  backgroundColor: '#ecfdf5',
                }}
              >
                📈
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
                Joueurs actifs (30 jours)
              </h3>
            </div>
            <span
              style={{
                fontSize: 12,
                padding: '4px 12px',
                borderRadius: 999,
                fontWeight: 700,
                backgroundColor: '#ecfdf5',
                color: '#059669',
                border: '1px solid #a7f3d0',
              }}
            >
              +12.5%
            </span>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={PLAYERS_30D}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: 'rgba(16,185,129,0.2)' }} />
              <Line
                type="monotone"
                dataKey="players"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ fill: '#ffffff', stroke: '#10b981', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 6, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Games By Type */}
        <div
          style={{
            padding: 24,
            borderRadius: 24,
            transition: 'all 0.3s ease-out',
            backgroundColor: '#ffffff',
            border: '1px solid #f3f4f6',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  backgroundColor: '#eff6ff',
                }}
              >
                🎮
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
                Parties par jeu
              </h3>
            </div>
            <span
              style={{
                fontSize: 12,
                padding: '4px 12px',
                borderRadius: 999,
                fontWeight: 700,
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                border: '1px solid #bfdbfe',
              }}
            >
              10 jeux
            </span>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={GAMES_BY_TYPE}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} angle={-30} textAnchor="end" height={60} tickLine={false} axisLine={false} />
              <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
              <Bar dataKey="parties" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Recent Activity - Timeline */}
        <div
          style={{
            padding: 24,
            borderRadius: 24,
            transition: 'all 0.3s ease-out',
            backgroundColor: '#ffffff',
            border: '1px solid #f3f4f6',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                backgroundColor: '#fffbeb',
              }}
            >
              🕐
            </div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
              Activite recente
            </h3>
          </div>
          <div style={{ position: 'relative' }}>
            {/* Timeline vertical line */}
            <div style={{ position: 'absolute', left: 18, top: 0, bottom: 0, width: 1, backgroundColor: '#f3f4f6' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {RECENT_ACTIVITY.map((item, i) => (
                <div
                  key={i}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 16,
                    padding: 12,
                    paddingLeft: 4,
                    borderRadius: 12,
                    transition: 'all 0.3s ease-out',
                    cursor: 'default',
                  }}
                >
                  {/* Timeline dot */}
                  <div style={{ position: 'relative', zIndex: 10, flexShrink: 0 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        transition: 'all 0.3s ease-out',
                        background: `${ACTIVITY_COLORS[item.type]}10`,
                        border: `1px solid ${ACTIVITY_COLORS[item.type]}25`,
                      }}
                    >
                      {ACTIVITY_ICONS[item.type]}
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 14, color: '#111827', fontWeight: 500 }}>{item.action}</span>
                      <span style={{ fontSize: 14, fontWeight: 500, color: ACTIVITY_COLORS[item.type] }}>
                        {item.detail}
                      </span>
                    </div>
                  </div>

                  {/* Time */}
                  <span style={{ fontSize: 12, whiteSpace: 'nowrap', paddingTop: 6, flexShrink: 0, color: '#9ca3af' }}>
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Players */}
        <div
          style={{
            padding: 24,
            borderRadius: 24,
            transition: 'all 0.3s ease-out',
            backgroundColor: '#ffffff',
            border: '1px solid #f3f4f6',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                backgroundColor: '#fffbeb',
              }}
            >
              🏆
            </div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
              Top joueurs
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {topPlayers.map((player) => {
              const eloPercent = (player.elo / MAX_ELO) * 100;
              const medal =
                player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : '';
              const rankColors: Record<number, string> = {
                1: '#f59e0b',
                2: '#94a3b8',
                3: '#cd7f32',
              };
              const accentColor = rankColors[player.rank] || '#9ca3af';

              return (
                <div
                  key={player.rank}
                  style={{
                    position: 'relative',
                    padding: 16,
                    borderRadius: 12,
                    transition: 'all 0.3s ease-out',
                    backgroundColor: '#ffffff',
                    border: '1px solid #f3f4f6',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    {/* Rank badge */}
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        fontWeight: 700,
                        flexShrink: 0,
                        background: player.rank <= 3 ? `${accentColor}15` : '#f9fafb',
                        border: `1px solid ${player.rank <= 3 ? `${accentColor}30` : '#e5e7eb'}`,
                        color: player.rank <= 3 ? accentColor : '#9ca3af',
                      }}
                    >
                      {medal || `#${player.rank}`}
                    </div>

                    {/* Avatar */}
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        fontWeight: 700,
                        flexShrink: 0,
                        background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}08)`,
                        border: `1px solid ${accentColor}30`,
                        color: accentColor,
                      }}
                    >
                      {player.name.charAt(0).toUpperCase()}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {player.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>
                        {player.games} parties jouees
                      </div>
                    </div>
                  </div>

                  {/* ELO Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1, height: 8, borderRadius: 999, overflow: 'hidden', backgroundColor: '#f3f4f6' }}>
                      <div
                        style={{
                          height: '100%',
                          borderRadius: 999,
                          transition: 'all 0.3s ease-out',
                          width: `${eloPercent}%`,
                          background: `linear-gradient(90deg, ${accentColor}, ${accentColor}aa)`,
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: accentColor }}>
                      {player.elo}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
