'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect } from 'react';
import type { GameInfo } from '../data/games';

interface Props {
  game: GameInfo | null;
  onClose: () => void;
}

export default function GameDetailModal({ game, onClose }: Props) {
  useEffect(() => {
    if (!game) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [game, onClose]);

  if (!game) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg rounded-3xl border border-gray-200 overflow-hidden animate-fade-up bg-white"
        style={{ boxShadow: '0 25px 80px rgba(0,0,0,0.15)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with color band */}
        <div
          className="relative px-8 pt-8 pb-6"
          style={{ background: `linear-gradient(135deg, ${game.color}10, ${game.color}05)` }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-all duration-300"
          >
            ✕
          </button>

          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ backgroundColor: `${game.color}12` }}
            >
              {game.icon}
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900">{game.name}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm font-semibold text-gray-600">{game.origin}</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold text-white bg-emerald-500">
                  {game.difficulty}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-600">
                  {game.players} joueurs
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="px-8 py-5 border-b border-gray-200">
          <p className="text-gray-600 font-medium leading-relaxed">{game.desc}</p>
        </div>

        {/* Card preview */}
        <div className="px-8 py-5 border-b border-gray-200">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Apercu des cartes</h3>
          <div className="flex gap-3 justify-center">
            {game.sampleCards.map((card, i) => (
              <div
                key={i}
                className="w-16 h-24 sm:w-20 sm:h-28 rounded-lg overflow-hidden border border-gray-200 hover:-translate-y-2 transition-all duration-300 bg-gray-100"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
              >
                <Image
                  src={`/cards/${game.deck}/${card}`}
                  alt={`Card ${i + 1}`}
                  width={80}
                  height={112}
                  className="w-full h-full object-contain"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Rules */}
        <div className="px-8 py-5 border-b border-gray-200">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Regles du jeu</h3>
          <ul className="space-y-2">
            {game.rules.map((rule, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-black text-white mt-0.5"
                >
                  {i + 1}
                </span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="px-8 py-6 flex gap-3">
          <Link
            href="/download"
            className="flex-1 py-3 rounded-xl text-center text-white font-black text-sm bg-emerald-500 hover:bg-emerald-400 hover:scale-105 active:scale-95 transition-all duration-300"
            style={{ boxShadow: '0 8px 32px rgba(16,185,129,0.25)' }}
          >
            Telecharger l&apos;app
          </Link>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl text-gray-600 font-bold text-sm border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-300"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
