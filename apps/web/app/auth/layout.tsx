import Link from 'next/link';
import Image from 'next/image';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">

      {/* LEFT — Full illustration panel */}
      <div className="hidden lg:flex relative overflow-hidden flex-col items-center justify-center p-20 bg-gradient-to-br from-blue-50 to-emerald-50">
        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Card fan — big and centered */}
          <div className="flex justify-center items-end h-72 mb-24 relative">
            {[
              { src: '/cards/spanish40/1E.png', rot: -24, x: -100 },
              { src: '/cards/spanish40/12O.png', rot: -10, x: -40 },
              { src: '/cards/spanish40/12C.png', rot: 0, x: 0 },
              { src: '/cards/spanish40/11B.png', rot: 10, x: 40 },
              { src: '/cards/spanish40/7E.png', rot: 24, x: 100 },
            ].map((card, i) => (
              <div
                key={i}
                className="absolute w-32 h-48 rounded-2xl overflow-hidden bg-white border-2 border-gray-200"
                style={{
                  transform: `rotate(${card.rot}deg) translateY(${Math.abs(card.rot) * 0.6}px)`,
                  left: `calc(50% + ${card.x}px - 64px)`,
                  zIndex: 5 - Math.abs(i - 2),
                  boxShadow: '0 25px 60px rgba(0,0,0,0.1)',
                }}
              >
                <Image
                  src={card.src}
                  alt=""
                  width={128}
                  height={192}
                  className="w-full h-full object-contain bg-white"
                />
              </div>
            ))}
          </div>

          {/* Title — big, clear, well spaced */}
          <h2 className="text-6xl xl:text-7xl font-black text-gray-900 tracking-tighter leading-[1.1] mb-8">
            L&apos;As des jeux<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-emerald-500">
              Marocains.
            </span>
          </h2>

          <p className="text-xl text-gray-600 leading-relaxed max-w-md mb-16">
            Ronda, Kdoub, Belote et 7 autres jeux de cartes traditionnels. Jouez en ligne ou hors-ligne.
          </p>

          {/* Stats */}
          <div className="flex gap-16">
            {[
              { value: '10+', label: 'Jeux' },
              { value: '5', label: 'Langues' },
              { value: '100%', label: 'Gratuit' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-black text-emerald-600 mb-2">{s.value}</div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT — Form panel */}
      <div className="flex flex-col items-center justify-center px-8 sm:px-16 lg:px-20 xl:px-28 py-20 relative bg-white border-l border-gray-200">
        {/* Logo */}
        <div className="text-center mb-16">
          <Link href="/" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textDecoration: 'none' }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #10b981, #059669)',
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <path d="M12 8v8M8 12h8" />
              </svg>
            </div>
            <span style={{ fontSize: 28, fontWeight: 900, color: '#111827', letterSpacing: '-0.03em' }}>
              Sally<span style={{ color: '#10b981' }}>Cards</span>
            </span>
          </Link>
        </div>

        {/* Form content */}
        <div className="w-full max-w-[420px]">
          {children}
        </div>

        {/* Footer */}
        <p className="mt-16 text-xs text-gray-400 text-center">
          &copy; 2026 SallyCards by SallyStar
        </p>
      </div>
    </div>
  );
}
