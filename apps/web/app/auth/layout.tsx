import Link from 'next/link';
import Image from 'next/image';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2" style={{ background: '#0A1535' }}>

      {/* LEFT — Full illustration panel (bleu nuit) */}
      <div
        className="hidden lg:flex relative overflow-hidden flex-col items-center justify-center p-20"
        style={{ background: 'linear-gradient(135deg, #0A1535 0%, #1E3A8A 60%, #0A1535 100%)' }}
      >
        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Card fan */}
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
                className="absolute w-32 h-48 rounded-2xl overflow-hidden bg-white"
                style={{
                  transform: `rotate(${card.rot}deg) translateY(${Math.abs(card.rot) * 0.6}px)`,
                  left: `calc(50% + ${card.x}px - 64px)`,
                  zIndex: 5 - Math.abs(i - 2),
                  border: '2px solid rgba(252,211,77,0.4)',
                  boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
                }}
              >
                <Image src={card.src} alt="" width={128} height={192} className="w-full h-full object-contain bg-white" />
              </div>
            ))}
          </div>

          {/* Title */}
          <h2 className="text-6xl xl:text-7xl font-black tracking-tighter leading-[1.1] mb-8" style={{ color: '#ffffff' }}>
            L&apos;As des jeux<br />
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #FCD34D, #F59E0B)' }}>
              Marocains.
            </span>
          </h2>

          <p className="text-xl leading-relaxed max-w-md mb-16" style={{ color: '#93C5FD' }}>
            Ronda, Kdoub, Belote et 8 autres jeux de cartes traditionnels. Jouez en ligne ou hors-ligne.
          </p>

          {/* Stats */}
          <div className="flex gap-16">
            {[
              { value: '10+', label: 'Jeux' },
              { value: '5', label: 'Langues' },
              { value: '100%', label: 'Gratuit' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-black mb-2" style={{ color: '#FCD34D' }}>{s.value}</div>
                <div className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: '#93C5FD' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT — Form panel (bleu nuit) */}
      <div
        className="flex flex-col items-center justify-center px-8 sm:px-16 lg:px-20 xl:px-28 py-20 relative"
        style={{ background: '#0A1429', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Logo */}
        <div className="text-center mb-16">
          <Link href="/" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textDecoration: 'none' }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, #FCD34D, #F59E0B)',
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0A1535" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <path d="M12 8v8M8 12h8" />
              </svg>
            </div>
            <span style={{ fontSize: 28, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.03em' }}>
              Sally<span style={{ color: '#FCD34D' }}>Cards</span>
            </span>
          </Link>
        </div>

        {/* Form content */}
        <div className="w-full max-w-[420px]">
          {children}
        </div>

        {/* Footer */}
        <p className="mt-16 text-xs text-center" style={{ color: '#64748B' }}>
          &copy; 2026 SallyCards by SallyStar
        </p>
      </div>
    </div>
  );
}
