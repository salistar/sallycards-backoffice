/**
 * @file apps/web/app/[game]/page.tsx
 * @description Page "Bientôt" générique pour les jeux web pas encore portés.
 *   /belote (hub) et /solitaire (existant) ont leurs routes dédiées qui ont
 *   priorité ; cette route dynamique capture les 9 autres jeux.
 */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getGame, GAMES } from '../lib/games';

const NAVY = '#0A1535';
const GOLD = '#FCD34D';
const BLUE = '#93C5FD';

// Jeux qui ont leur propre route web dédiée (hub + vs-bot + écrans data).
const DEDICATED = ['belote', 'solitaire', 'scopa', 'tarot', 'okey', 'quiestce', 'kdoub', 'kantcopy', 'concentration', 'poker', 'ronda'];

export function generateStaticParams() {
  // Pré-génère les slugs encore "Bientôt" (les jeux dédiés ont leur route).
  return GAMES.filter((g) => !DEDICATED.includes(g.slug)).map((g) => ({ game: g.slug }));
}

export default async function ComingSoonGame({ params }: { params: Promise<{ game: string }> }) {
  const { game: slug } = await params;
  const game = getGame(slug);
  if (!game) notFound();

  return (
    <main style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${NAVY}, #1E293B)`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ display: 'inline-block', background: 'rgba(252,211,77,0.12)', border: `1px solid ${GOLD}55`, color: GOLD, fontWeight: 900, fontSize: 12, letterSpacing: 2, padding: '6px 16px', borderRadius: 999, marginBottom: 18 }}>
          BIENTÔT
        </div>
        <h1 style={{ color: '#fff', fontSize: '2.4rem', fontWeight: 900, marginBottom: 10 }}>{game!.name}</h1>
        <p style={{ color: BLUE, fontSize: '1rem', lineHeight: 1.6, marginBottom: 28 }}>
          La version web de ce jeu arrive prochainement. En attendant, la <strong style={{ color: '#fff' }}>Belote</strong> est jouable en web,
          et l’app mobile est disponible au téléchargement.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/belote" style={{ background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: NAVY, fontWeight: 900, padding: '12px 24px', borderRadius: 12, textDecoration: 'none' }}>
            Jouer à la Belote
          </Link>
          <Link href={`/download/${game!.slug}`} style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', fontWeight: 700, padding: '12px 24px', borderRadius: 12, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.15)' }}>
            Télécharger l’app
          </Link>
        </div>
      </div>
    </main>
  );
}
