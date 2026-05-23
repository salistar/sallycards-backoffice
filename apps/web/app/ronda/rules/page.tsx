/** @file Règles de la Ronda (web, version simplifiée jouable). */
import Link from 'next/link';
const NAVY = '#0A1535'; const CARD = '#3a2008'; const GOLD = '#FCD34D'; const BLUE = '#FCD9A5';
const SECTIONS: { title: string; body: string }[] = [
  { title: 'Présentation', body: 'La Ronda marocaine se joue à 2-4 joueurs avec le paquet espagnol de 40 cartes (Bâtons, Coupes, Épées, Deniers × 1-7, 10-12). Chaque joueur reçoit 7 cartes et 4 cartes sont posées au centre. Première personne à 21 points gagne.' },
  { title: 'Le tour', body: 'À ton tour, pose une carte. Si sa valeur correspond à une ou plusieurs cartes du centre, tu les CAPTURES toutes (avec ta carte). Sinon, ta carte reste au centre. Capturer toutes les cartes du centre = « Tringla ».' },
  { title: 'Ronda & Tringa', body: 'Si au début de la donne tu as une PAIRE de même valeur en main, c\'est une « Ronda » (+1 au décompte). Un BRELAN (3 cartes de même valeur) est une « Tringa » (+2). Ces bonus sont détectés automatiquement.' },
  { title: 'Décompte', body: 'Quand le paquet et les mains sont épuisés (le dernier qui a capturé ramasse le centre restant), on compte : +1 pour le plus de cartes, +1 pour le plus de Deniers (oros), +1 pour le 7 de Deniers (settebello), +1 pour le plus de 7, plus les bonus Ronda/Tringa. On rejoue des manches jusqu\'à 21.' },
];
export default function RondaRulesPage() {
  return (
    <main style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${NAVY}, ${CARD})`, padding: '32px 20px 60px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <Link href="/ronda" style={{ color: BLUE, textDecoration: 'none', fontWeight: 700 }}>← Retour</Link>
        <h1 style={{ color: '#fff', fontSize: '2rem', fontWeight: 900, margin: '14px 0 24px' }}>Règles de la Ronda</h1>
        {SECTIONS.map((s, i) => (
          <div key={i} style={{ background: CARD, borderRadius: 14, padding: 18, marginBottom: 12 }}>
            <h2 style={{ color: GOLD, fontSize: '1.05rem', fontWeight: 800, marginBottom: 8 }}>{s.title}</h2>
            <p style={{ color: '#E7D5BC', fontSize: '0.95rem', lineHeight: 1.6 }}>{s.body}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
