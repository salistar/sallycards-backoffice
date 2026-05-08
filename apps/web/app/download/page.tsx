import Link from 'next/link';

const GAMES = [
  { name: 'Ronda', icon: '🃏', desc: 'Capture marocaine classique' },
  { name: 'Kdoub', icon: '🤥', desc: 'Bluff et contestation' },
  { name: 'Belote', icon: '♣️', desc: 'Jeu de levees en equipe' },
  { name: 'Poker', icon: '♠️', desc: "Texas Hold'em" },
  { name: 'Tarot', icon: '👑', desc: '78 cartes, 22 atouts' },
  { name: 'Scopa', icon: '🪙', desc: 'Capture italienne' },
  { name: 'Okey', icon: '🎴', desc: 'Rami turc avec tuiles' },
  { name: 'Memory', icon: '🧠', desc: 'Trouvez les paires' },
  { name: 'Solitaire', icon: '♦️', desc: 'Klondike classique' },
  { name: 'Qui Est-Ce?', icon: '❓', desc: 'Deduction oui/non' },
];

export default function DownloadPage() {
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
            ← Retour
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 flex flex-col items-center">
        <div className="w-full text-center pt-36 pb-20 flex flex-col items-center">
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black text-slate-100 leading-[0.95] tracking-tighter mb-6">
            Telecharger <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-emerald-400">
              SallyCards
            </span>
          </h1>
          <p className="text-lg sm:text-2xl max-w-xl text-slate-400 mb-14 font-medium">
            10 jeux de cartes gratuits. Disponible sur iOS et Android.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-5 mb-20">
            <a
              href="#"
              className="px-10 py-5 rounded-xl font-black text-lg bg-white text-slate-950 shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 ease-out flex items-center gap-3"
            >
              📱 App Store
            </a>
            <a
              href="#"
              className="px-10 py-5 rounded-xl font-black text-lg bg-slate-900/40 backdrop-blur-md border border-white/5 hover:border-white/10 text-slate-100 shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 ease-out flex items-center gap-3"
            >
              📱 Google Play
            </a>
          </div>

          <div className="p-10 rounded-3xl bg-slate-900/40 backdrop-blur-md border border-white/5 text-center">
            <div className="w-48 h-48 bg-white rounded-2xl flex items-center justify-center mb-5 mx-auto">
              <div className="text-center text-slate-900">
                <span className="text-5xl block mb-2">📱</span>
                <div className="text-xs font-black">Scannez pour telecharger</div>
              </div>
            </div>
            <p className="text-sm text-slate-500 font-medium">Scannez avec la camera de votre telephone</p>
          </div>
        </div>

        <div className="w-full pb-32 flex flex-col items-center">
          <h2 className="text-4xl sm:text-6xl font-black text-slate-100 mb-6 text-center tracking-tight">
            10 Jeux Inclus
          </h2>
          <div className="h-1.5 w-24 bg-emerald-500 mx-auto rounded-full mb-16" />
          <div className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 place-items-center">
            {GAMES.map((game) => (
              <div
                key={game.name}
                className="w-full p-6 rounded-3xl text-center flex flex-col items-center transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-xl cursor-default bg-slate-900/40 backdrop-blur-md border border-white/5 hover:border-emerald-500/20"
              >
                <span className="text-4xl block mb-4">{game.icon}</span>
                <h3 className="font-black text-slate-100 mb-2">{game.name}</h3>
                <p className="text-xs leading-relaxed text-slate-500 font-medium">{game.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
