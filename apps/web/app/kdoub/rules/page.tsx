/** @file Règles du Kdoub (web, version simplifiée jouable). */
import Link from 'next/link';
const NAVY = '#0A1535'; const CARD = '#231541'; const GOLD = '#FCD34D'; const BLUE = '#C4B5FD';
const SECTIONS: { title: string; body: string }[] = [
  { title: 'Présentation', body: 'Kdoub est un jeu de bluff marocain joué à 2-6 joueurs avec le paquet espagnol de 40 cartes : 4 couleurs (Bâtons, Coupes, Épées, Deniers) × valeurs 1-7 et 10-12. Les cartes sont distribuées ; le but est d\'être le premier à vider sa main.' },
  { title: 'Déclarer & poser', body: 'À ton tour, tu poses une carte FACE CACHÉE en annonçant une valeur (ex. « As »). Le premier d\'une séquence choisit librement la valeur : elle est alors VERROUILLÉE. Tous les joueurs suivants doivent annoncer la MÊME valeur — honnêtement ou en bluffant.' },
  { title: 'Crier « Kdoub ! »', body: 'Quand quelqu\'un pose sa carte, le joueur suivant peut crier « Kdoub ! » pour contester. On retourne la carte : si c\'était un bluff, le menteur ramasse tout le tas ; si la carte disait vrai, c\'est le contestataire qui ramasse. S\'il ne conteste pas, il enchaîne en posant sa propre carte.' },
  { title: 'Gagner', body: 'Le premier à se débarrasser de toutes ses cartes remporte la manche. Les cartes restantes en main rapportent des points de pénalité (As = 11, Trois = 10, Roi = 4, Cavalier = 3, Sota = 2). On joue plusieurs manches : le joueur avec le score total le plus bas gagne la partie.' },
];
export default function KdoubRulesPage() {
  return (
    <main style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${NAVY}, ${CARD})`, padding: '32px 20px 60px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <Link href="/kdoub" style={{ color: BLUE, textDecoration: 'none', fontWeight: 700 }}>← Retour</Link>
        <h1 style={{ color: '#fff', fontSize: '2rem', fontWeight: 900, margin: '14px 0 24px' }}>Règles du Kdoub</h1>
        {SECTIONS.map((s, i) => (
          <div key={i} style={{ background: CARD, borderRadius: 14, padding: 18, marginBottom: 12 }}>
            <h2 style={{ color: GOLD, fontSize: '1.05rem', fontWeight: 800, marginBottom: 8 }}>{s.title}</h2>
            <p style={{ color: '#CBD5E1', fontSize: '0.95rem', lineHeight: 1.6 }}>{s.body}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
