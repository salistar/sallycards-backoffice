'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Trophy, TrendingUp } from 'lucide-react';

const GAME_TYPES = ['Ronda', 'Kdoub', 'Belote', 'Poker', 'Tarot', 'Scopa', 'Okey', 'Memory', 'Solitaire', 'Qui Est-Ce?'];

interface LeaderEntry {
  rank: number;
  username: string;
  elo: number;
  wins: number;
  losses: number;
}

const PLAYERS: LeaderEntry[] = [
  { rank: 1, username: 'champion_x', elo: 2195, wins: 285, losses: 45 },
  { rank: 2, username: 'master_cards', elo: 2148, wins: 260, losses: 55 },
  { rank: 3, username: 'ronda_king', elo: 2105, wins: 240, losses: 62 },
  { rank: 4, username: 'pro_player', elo: 2062, wins: 225, losses: 70 },
  { rank: 5, username: 'lucky_hand', elo: 2020, wins: 210, losses: 78 },
  { rank: 6, username: 'card_shark', elo: 1975, wins: 198, losses: 82 },
  { rank: 7, username: 'bluff_boss', elo: 1930, wins: 185, losses: 90 },
  { rank: 8, username: 'ace_hunter', elo: 1888, wins: 172, losses: 95 },
  { rank: 9, username: 'trick_queen', elo: 1845, wins: 165, losses: 100 },
  { rank: 10, username: 'slam_dunk', elo: 1800, wins: 155, losses: 105 },
  { rank: 11, username: 'wild_joker', elo: 1758, wins: 148, losses: 110 },
  { rank: 12, username: 'full_house', elo: 1712, wins: 140, losses: 115 },
  { rank: 13, username: 'big_blind', elo: 1670, wins: 132, losses: 118 },
  { rank: 14, username: 'river_rat', elo: 1625, wins: 125, losses: 122 },
  { rank: 15, username: 'pocket_pair', elo: 1582, wins: 118, losses: 128 },
  { rank: 16, username: 'straight_flush', elo: 1540, wins: 112, losses: 132 },
  { rank: 17, username: 'royal_run', elo: 1495, wins: 105, losses: 138 },
  { rank: 18, username: 'high_roller', elo: 1450, wins: 98, losses: 142 },
  { rank: 19, username: 'ante_up', elo: 1408, wins: 92, losses: 148 },
  { rank: 20, username: 'check_mate', elo: 1365, wins: 85, losses: 152 },
  { rank: 21, username: 'deal_me_in', elo: 1320, wins: 80, losses: 155 },
  { rank: 22, username: 'all_in', elo: 1278, wins: 75, losses: 160 },
  { rank: 23, username: 'fold_king', elo: 1235, wins: 70, losses: 165 },
  { rank: 24, username: 'raise_queen', elo: 1190, wins: 65, losses: 170 },
  { rank: 25, username: 'call_master', elo: 1148, wins: 60, losses: 175 },
];

const numberFmt = new Intl.NumberFormat('fr-FR');

export default function PublicLeaderboard() {
  const [selectedGame, setSelectedGame] = useState(GAME_TYPES[0]);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return PLAYERS;
    return PLAYERS.filter((p) => p.username.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  return (
    <main className="min-h-screen overflow-x-hidden" style={{ backgroundColor: '#0a0d14' }}>
      <nav className="fixed top-0 left-0 right-0 z-[100] backdrop-blur-xl border-b border-white/5" style={{ backgroundColor: 'rgba(10,13,20,0.8)' }}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-emerald-500/10 border border-emerald-500/20 group-hover:rotate-12 transition-transform duration-300 ease-out">
              🃏
            </div>
            <span className="text-xl font-black text-slate-100 tracking-tight">
              Sally<span className="text-emerald-500">Cards</span>
            </span>
          </Link>
          <Link href="/" className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-100 transition-colors duration-300 ease-out">
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 pt-32 pb-20 flex flex-col items-center">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-10 h-10 text-emerald-500" />
            <h1 className="text-5xl sm:text-7xl font-black text-slate-100 tracking-tighter">
              Classement
            </h1>
          </div>
          <div className="h-1.5 w-24 bg-emerald-500 mx-auto rounded-full mt-4 mb-4" />
          <p className="text-lg text-slate-400 font-medium">Top joueurs par jeu.</p>
        </div>

        <nav className="flex flex-wrap justify-center gap-2 mb-12 bg-slate-900/40 backdrop-blur-md p-2 rounded-xl border border-white/5">
          {GAME_TYPES.map((game) => (
            <button
              key={game}
              onClick={() => setSelectedGame(game)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ease-out ${
                selectedGame === game
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
              }`}
            >
              {game}
            </button>
          ))}
        </nav>

        <div className="w-full max-w-lg mb-12 relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors duration-300 ease-out" />
          <input
            type="text"
            placeholder="Rechercher un joueur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-14 pr-6 py-4 rounded-xl text-slate-100 outline-none bg-slate-950/50 border border-white/5 focus:border-emerald-500/30 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300 ease-out font-medium"
          />
        </div>

        <div className="w-full overflow-x-auto rounded-3xl border border-white/5 bg-slate-900/40 backdrop-blur-md shadow-2xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-6 py-5 text-left font-black w-20 text-slate-500 uppercase text-[10px] tracking-widest">#</th>
                <th className="px-6 py-5 text-left font-black text-slate-500 uppercase text-[10px] tracking-widest">Joueur</th>
                <th className="px-6 py-5 text-right font-black text-slate-500 uppercase text-[10px] tracking-widest">ELO</th>
                <th className="px-6 py-5 text-right font-black text-slate-500 uppercase text-[10px] tracking-widest">V</th>
                <th className="px-6 py-5 text-right font-black text-slate-500 uppercase text-[10px] tracking-widest">D</th>
                <th className="px-6 py-5 text-right font-black text-slate-500 uppercase text-[10px] tracking-widest">Win %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {filtered.map((player) => {
                const winRate = ((player.wins / (player.wins + player.losses)) * 100).toFixed(1);
                const medal = player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : null;

                return (
                  <tr
                    key={player.rank}
                    className="group transition-colors duration-300 ease-out hover:bg-white/[0.02]"
                    style={{ backgroundColor: player.rank <= 3 ? 'rgba(16,185,129,0.03)' : 'transparent' }}
                  >
                    <td className="px-6 py-4 font-mono">
                      {medal ? (
                        <span className="text-xl">{medal}</span>
                      ) : (
                        <span className="text-slate-600 font-bold">{player.rank}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs">
                          {player.username[0].toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-100 group-hover:text-emerald-400 transition-colors duration-300 ease-out">
                          {player.username}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-black text-amber-500">{numberFmt.format(player.elo)}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-emerald-500 font-bold">{numberFmt.format(player.wins)}</td>
                    <td className="px-6 py-4 text-right text-red-400/70 font-bold">{numberFmt.format(player.losses)}</td>
                    <td className="px-6 py-4 text-right text-slate-400 font-bold">{winRate}%</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-600 font-bold">
                    Aucun joueur trouve.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
