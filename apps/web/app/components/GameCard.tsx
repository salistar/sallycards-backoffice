'use client';

import Image from 'next/image';
import { useState } from 'react';

interface GameCardProps {
  name: string;
  icon: string;
  players: string;
  description: string;
  color?: string;
  deck?: string;
  sampleCard?: string;
  onClick?: () => void;
}

export default function GameCard({ name, icon, players, description, color = '#10b981', deck, sampleCard, onClick }: GameCardProps) {
  const [h, setH] = useState(false);

  return (
    <div
      className="p-6 sm:p-7 rounded-3xl cursor-pointer transition-all duration-300 ease-out flex flex-col items-center text-center relative overflow-hidden group"
      style={{
        backgroundColor: '#ffffff',
        border: h ? `1px solid ${color}60` : '1px solid #e5e7eb',
        boxShadow: h ? `0 20px 50px ${color}15, 0 8px 24px rgba(0,0,0,0.08)` : '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        transform: h ? 'translateY(-8px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      onClick={onClick}
    >
      {/* Card image peek in top-right corner */}
      {deck && sampleCard && (
        <div
          className="absolute -top-1 -right-1 w-14 h-20 rounded-md overflow-hidden transition-all duration-500 rotate-12 group-hover:rotate-6"
          style={{ opacity: h ? 0.6 : 0.25 }}
        >
          <Image
            src={`/cards/${deck}/${sampleCard}`}
            alt=""
            width={56}
            height={80}
            className="w-full h-full object-contain"
          />
        </div>
      )}

      {/* Icon */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl mb-5 transition-all duration-300"
        style={{
          backgroundColor: `${color}15`,
          transform: h ? 'scale(1.15) rotate(-5deg)' : 'scale(1) rotate(0)',
        }}
      >
        {icon}
      </div>

      {/* Name */}
      <h3 className="text-base sm:text-lg font-black mb-3 transition-colors duration-300" style={{ color: h ? '#10b981' : '#1f2937' }}>
        {name}
      </h3>

      {/* Player count badge */}
      <span
        className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 transition-all duration-300"
        style={{ backgroundColor: `${color}12`, color }}
      >
        {players} joueurs
      </span>

      {/* Description */}
      <p className="text-sm leading-relaxed text-gray-600">{description}</p>

      {/* Hover overlay: "Voir les regles" */}
      <div
        className="mt-4 text-xs font-black uppercase tracking-wider transition-all duration-300 text-emerald-500"
        style={{ opacity: h ? 1 : 0, transform: h ? 'translateY(0)' : 'translateY(8px)' }}
      >
        Voir les regles →
      </div>
    </div>
  );
}
