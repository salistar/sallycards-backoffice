'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const GAMES = [
  { name: 'Ronda', icon: '🃏', desc: 'Capture marocaine classique' },
  { name: 'Kdoub', icon: '🤥', desc: 'Bluff et contestation' },
  { name: 'Belote', icon: '♣️', desc: 'Jeu de levees en equipe' },
  { name: 'Poker', icon: '♠️', desc: "Texas Hold'em" },
  { name: 'Tarot', icon: '👑', desc: '78 cartes, 22 atouts' },
  { name: 'Scopa', icon: '🪙', desc: 'Capture italienne' },
  { name: 'Okey', icon: '🎴', desc: 'Rami turc avec tuiles' },
  { name: 'Memory', icon: '🧠', desc: 'Trouvez les paires' },
  { name: 'Solitaire', icon: '♦️', desc: 'Klondike + 192 variantes', highlight: true },
  { name: 'Qui Est-Ce?', icon: '❓', desc: 'Deduction oui/non' },
];

// GitHub releases — the sally-solitaire repo publishes a "latest" release
// on every main push (see .github/workflows/android-build.yml). The APK
// URL is stable and public.
const APK_URL = 'https://github.com/salistar/sally-solitaire/releases/download/latest/app-debug.apk';
const RELEASE_PAGE_URL = 'https://github.com/salistar/sally-solitaire/releases/tag/latest';
const RELEASES_API = 'https://api.github.com/repos/salistar/sally-solitaire/releases/tags/latest';

export default function DownloadPage() {
  const [release, setRelease] = useState<{
    published_at: string;
    name: string;
    body: string;
    apkSize?: number;
  } | null>(null);
  const [loadingRelease, setLoadingRelease] = useState(true);

  useEffect(() => {
    fetch(RELEASES_API)
      .then((r) => r.json())
      .then((data) => {
        if (data?.tag_name) {
          const apk = data.assets?.find((a: any) => a.name?.endsWith('.apk'));
          setRelease({
            published_at: data.published_at,
            name: data.name ?? data.tag_name,
            body: data.body ?? '',
            apkSize: apk?.size,
          });
        }
      })
      .catch(() => {
        /* silently ignore — section just stays hidden */
      })
      .finally(() => setLoadingRelease(false));
  }, []);

  const apkSizeMB = release?.apkSize ? (release.apkSize / 1024 / 1024).toFixed(1) : null;

  return (
    <main className="min-h-screen overflow-x-hidden" style={{ backgroundColor: '#0a0d14' }}>
      <nav
        className="fixed top-0 left-0 right-0 z-[100] backdrop-blur-xl border-b border-white/5"
        style={{ backgroundColor: 'rgba(10,13,20,0.8)' }}
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-emerald-500/10 border border-emerald-500/20 group-hover:rotate-12 transition-transform duration-300 ease-out">
              🃏
            </div>
            <span className="text-xl font-black text-slate-100 tracking-tight">
              Sally<span className="text-emerald-500">Cards</span>
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-100 transition-colors duration-300 ease-out"
          >
            ← Retour
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 flex flex-col items-center">
        <div className="w-full text-center pt-36 pb-12 flex flex-col items-center">
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black text-slate-100 leading-[0.95] tracking-tighter mb-6">
            Telecharger <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-emerald-400">
              SallyCards
            </span>
          </h1>
          <p className="text-lg sm:text-2xl max-w-xl text-slate-400 mb-10 font-medium">
            10 jeux de cartes gratuits. Disponible sur iOS et Android.
          </p>

          {/* APK SOLITAIRE BUILD AUTO — bouton de telechargement principal */}
          <div className="w-full max-w-2xl mb-12 p-8 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-slate-900/50 to-cyan-500/10 backdrop-blur-md border border-emerald-500/30 text-left">
            <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
              <div>
                <p className="text-emerald-400 text-xs font-bold tracking-widest mb-1">
                  ♦ SOLITAIRE — BUILD DEBUG AUTO
                </p>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-100">
                  Sally Solitaire <span className="text-emerald-400">.apk</span>
                </h2>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Android · APK direct
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              APK debug compile automatiquement a chaque push sur <code className="text-emerald-400 text-xs">main</code>{' '}
              via GitHub Actions. Telecharge, autorise les "Sources inconnues" dans Android, et installe.
              <br />
              <span className="text-slate-500">
                Inclut les 192 variantes de solitaire, le mode multiplayer P2P (WebRTC + TURN), et l'AI bot.
              </span>
            </p>

            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <a
                href={APK_URL}
                className="flex-1 px-6 py-4 rounded-xl font-black text-base bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-2xl hover:scale-[1.02] active:scale-95 transition-all duration-300 ease-out flex items-center justify-center gap-3"
              >
                ⬇ Telecharger l'APK {apkSizeMB ? `(${apkSizeMB} MB)` : ''}
              </a>
              <a
                href={RELEASE_PAGE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-4 rounded-xl font-bold text-sm bg-slate-900/60 hover:bg-slate-800/60 text-slate-300 border border-white/10 transition-all duration-300 ease-out flex items-center justify-center gap-2"
              >
                Voir la release
              </a>
            </div>

            {loadingRelease ? (
              <p className="mt-4 text-xs text-slate-500">Chargement des infos de release…</p>
            ) : release ? (
              <p className="mt-4 text-xs text-slate-500">
                Derniere release :{' '}
                <span className="text-slate-300 font-mono">{release.name}</span> ·{' '}
                publiee le{' '}
                <span className="text-slate-300 font-mono">
                  {new Date(release.published_at).toLocaleString('fr-FR', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </p>
            ) : (
              <p className="mt-4 text-xs text-slate-500">
                Aucune release publiee encore — declenche un push sur <code>main</code> dans{' '}
                <a
                  className="text-emerald-400 hover:underline"
                  href="https://github.com/salistar/sally-solitaire"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  salistar/sally-solitaire
                </a>
                .
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-5 mb-16">
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
                className={`w-full p-6 rounded-3xl text-center flex flex-col items-center transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-xl cursor-default bg-slate-900/40 backdrop-blur-md border ${
                  game.highlight ? 'border-emerald-500/40 ring-1 ring-emerald-500/20' : 'border-white/5 hover:border-emerald-500/20'
                }`}
              >
                <span className="text-4xl block mb-4">{game.icon}</span>
                <h3 className="font-black text-slate-100 mb-2">{game.name}</h3>
                <p className="text-xs leading-relaxed text-slate-500 font-medium">{game.desc}</p>
                {game.highlight && (
                  <span className="mt-3 text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
                    APK dispo ↑
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
