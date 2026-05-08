import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden bg-white">
      {/* Soft gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-emerald-50/50" />

      <div className="text-center max-w-lg mx-auto relative z-10 flex flex-col items-center">
        <div className="text-8xl sm:text-9xl mb-10">🃏</div>
        <h1
          className="text-8xl sm:text-9xl md:text-[10rem] font-black mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-emerald-500 tracking-tighter"
          style={{ lineHeight: 1 }}
        >
          404
        </h1>
        <p className="text-2xl sm:text-3xl text-gray-900 font-black mb-4">Page introuvable</p>
        <p className="text-base sm:text-lg mb-14 leading-relaxed text-gray-500 font-medium">
          On dirait que cette carte manque dans le paquet.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-10 py-5 text-lg font-black rounded-xl bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 hover:scale-105 active:scale-95 transition-all duration-300 ease-out"
        >
          ← Retour a l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
