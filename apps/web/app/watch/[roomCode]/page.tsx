'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface ChatMessage {
  user: string;
  text: string;
  time: string;
}

const MOCK_PLAYERS = [
  { name: 'ahmed92', elo: 1650, avatar: '🧔', cards: 5, score: 12 },
  { name: 'sara_cards', elo: 1420, avatar: '👩‍🌾', cards: 3, score: 8 },
  { name: 'bot_hamza', elo: 1500, avatar: '🤖', cards: 7, score: 15 },
  { name: 'youssef_pro', elo: 1780, avatar: '🧑‍🚀', cards: 4, score: 10 },
];

const MOCK_CHAT: ChatMessage[] = [
  { user: 'spectator_1', text: 'Nice play!', time: '12:30' },
  { user: 'fan_02', text: 'ahmed92 is on fire', time: '12:31' },
  { user: 'spectator_1', text: 'Hamza bot is so smart', time: '12:32' },
  { user: 'guest_99', text: 'Who is winning?', time: '12:33' },
];

export default function SpectatorPage() {
  const params = useParams();
  const roomCode = params.roomCode as string;
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState(MOCK_CHAT);

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    setMessages((prev) => [
      ...prev,
      { user: 'you', text: chatInput.trim(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ]);
    setChatInput('');
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0a0d14' }}>
      {/* Header */}
      <header className="h-20 flex items-center justify-between px-6 sm:px-10 shrink-0 backdrop-blur-xl border-b border-white/5" style={{ backgroundColor: 'rgba(10,13,20,0.8)' }}>
        <div className="flex items-center gap-6">
          <Link href="/admin/games" className="text-sm font-bold text-slate-500 hover:text-slate-100 transition-colors duration-300 ease-out">
            ← Retour
          </Link>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-black text-slate-100">LIVE</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500 font-bold">Room</span>
          <span className="font-mono text-lg font-black text-emerald-500">{roomCode}</span>
        </div>
        <div className="text-sm text-slate-500 font-bold">
          Ronda — Round 3/7
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Main Game Area */}
        <div className="flex-1 flex flex-col items-center">
          {/* Heading */}
          <div className="w-full text-center py-8">
            <h1 className="text-2xl font-black text-slate-100">
              Spectating <span className="text-emerald-500">{roomCode}</span>
            </h1>
          </div>

          {/* Game State */}
          <div className="flex-1 flex items-center justify-center px-8 pb-4">
            <div className="w-full max-w-2xl aspect-square rounded-3xl flex items-center justify-center relative bg-slate-900/40 backdrop-blur-md border border-white/5">
              {/* Table center */}
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full flex items-center justify-center border-2 border-emerald-500/10" style={{ backgroundColor: 'rgba(16,185,129,0.05)' }}>
                <div className="text-center">
                  <div className="text-4xl mb-2">🃏</div>
                  <div className="text-xs text-slate-600 font-bold">Table</div>
                  <div className="text-sm font-black mt-1 text-emerald-500">4 cartes</div>
                </div>
              </div>

              {/* Player positions */}
              {MOCK_PLAYERS.map((player, i) => {
                const positions = [
                  'top-6 left-1/2 -translate-x-1/2',
                  'right-6 top-1/2 -translate-y-1/2',
                  'bottom-6 left-1/2 -translate-x-1/2',
                  'left-6 top-1/2 -translate-y-1/2',
                ];
                return (
                  <div
                    key={player.name}
                    className={`absolute ${positions[i]} rounded-3xl p-4 text-center min-w-[130px] bg-slate-900/40 backdrop-blur-md border border-white/5 hover:border-white/10 transition-all duration-300 ease-out`}
                  >
                    <span className="text-2xl block">{player.avatar}</span>
                    <span className="text-xs font-black text-slate-100 block mt-2">{player.name}</span>
                    <div className="flex items-center justify-center gap-2 mt-1.5 text-xs">
                      <span className="text-emerald-500 font-bold">{player.cards} cartes</span>
                      <span className="text-slate-700">|</span>
                      <span className="text-slate-500 font-bold">{player.score} pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Player Info Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-6 sm:px-10 pb-8 w-full">
            {MOCK_PLAYERS.map((player) => (
              <div
                key={player.name}
                className="p-4 rounded-3xl flex items-center gap-4 bg-slate-900/40 backdrop-blur-md border border-white/5 hover:border-white/10 transition-all duration-300 ease-out"
              >
                <span className="text-2xl">{player.avatar}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-black text-slate-100 truncate">{player.name}</div>
                  <div className="text-xs text-slate-500 font-bold">ELO {player.elo}</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-emerald-500">{player.score}</div>
                  <div className="text-xs text-slate-600 font-bold">pts</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Panel */}
        <div className="w-80 flex flex-col shrink-0 border-l border-white/5" style={{ backgroundColor: 'rgba(15,18,25,0.6)' }}>
          <div className="px-6 py-5 border-b border-white/5">
            <h3 className="text-sm font-black text-slate-100">Chat</h3>
            <span className="text-xs text-slate-500 font-bold">4 spectateurs</span>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i}>
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className={`text-xs font-black ${msg.user === 'you' ? 'text-emerald-500' : 'text-slate-500'}`}>
                    {msg.user}
                  </span>
                  <span className="text-xs text-slate-700">{msg.time}</span>
                </div>
                <p className="text-sm text-slate-300 font-medium">{msg.text}</p>
              </div>
            ))}
          </div>

          <div className="px-5 py-5 border-t border-white/5">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1 px-4 py-3 rounded-xl text-sm text-slate-100 outline-none bg-slate-950/50 border border-white/5 focus:border-emerald-500/30 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300 ease-out font-medium"
              />
              <button
                onClick={sendMessage}
                className="px-5 py-3 rounded-xl text-sm font-black bg-emerald-500 text-slate-950 hover:bg-emerald-400 hover:scale-105 active:scale-95 transition-all duration-300 ease-out"
              >
                Envoyer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
