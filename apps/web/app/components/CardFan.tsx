'use client';

import Image from 'next/image';
import { useState } from 'react';

const CARDS = [
  { front: '/cards/spanish40/1E.png', label: "As d'Epees" },
  { front: '/cards/spanish40/12O.png', label: "Roi d'Ors" },
  { front: '/cards/spanish40/12C.png', label: 'Roi de Coupes' },
  { front: '/cards/spanish40/11B.png', label: 'Cavalier de Batons' },
  { front: '/cards/spanish40/7E.png', label: "7 d'Epees" },
];

export default function CardFan() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="flex justify-center items-end h-56 sm:h-72 md:h-80 relative mt-8">
      {CARDS.map((card, i) => {
        const rotation = (i - 2) * 14;
        const isHovered = hoveredIndex === i;
        const translateY = isHovered ? -40 : 0;
        const scale = isHovered ? 1.12 : 1;
        const zIndex = isHovered ? 50 : i + 1;

        return (
          <div
            key={i}
            className="absolute transition-all duration-500 ease-out cursor-pointer"
            style={{
              transform: `rotate(${rotation}deg) translateY(${translateY}px) scale(${scale})`,
              transformOrigin: 'bottom center',
              left: `calc(50% + ${(i - 2) * 52}px - 48px)`,
              zIndex,
              filter: isHovered
                ? 'drop-shadow(0 25px 50px rgba(16,185,129,0.3))'
                : 'drop-shadow(0 10px 30px rgba(0,0,0,0.15))',
            }}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="w-24 h-36 sm:w-32 sm:h-48 md:w-36 md:h-52 rounded-xl overflow-hidden border-2 border-gray-200 bg-white">
              <Image
                src={card.front}
                alt={card.label}
                width={144}
                height={208}
                className="w-full h-full object-contain"
                priority
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
