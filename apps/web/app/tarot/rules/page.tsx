/** @file Règles du Tarot (web, version simplifiée jouable). */
import Link from 'next/link';

const NAVY = '#0A1535'; const CARD = '#152A47'; const GOLD = '#FCD34D'; const BLUE = '#93C5FD';

const SECTIONS: { title: string; body: string }[] = [
  { title: 'Présentation', body: 'Jeu de levées français à 78 cartes. Ici : 4 joueurs, tu es le « preneur » face à 3 défenseurs (bots). Le but du preneur est d’atteindre son contrat de points.' },
  { title: 'Le jeu de 78 cartes', body: '4 couleurs (♠ ♥ ♦ ♣) de l’As au Roi (As, 2…10, Valet, Cavalier, Dame, Roi) + 21 atouts numérotés (1 à 21) + l’Excuse (★).' },
  { title: 'Distribution', body: '18 cartes par joueur + un « chien » de 6 cartes. Le preneur intègre le chien puis écarte 6 cartes (l’écart, qui compte pour lui en fin de donne). Ici l’écart est automatique.' },
  { title: 'Jouer un pli', body: 'On doit fournir la couleur demandée. Sinon on doit couper à l’atout — et monter (jouer un atout plus fort) si un atout est déjà tombé. Sans couleur ni atout, on joue n’importe quoi. L’Excuse est jouable à tout moment et reste dans ton camp.' },
  { title: 'Les bouts', body: 'Le Petit (atout 1), le 21 et l’Excuse sont les 3 « bouts ». Ils valent 4,5 points chacun et déterminent le contrat à réaliser.' },
  { title: 'Points & contrat', body: 'Roi 4,5 · Dame 3,5 · Cavalier 2,5 · Valet 1,5 · bouts 4,5 · autres 0,5. Le preneur gagne s’il atteint : 56 pts (0 bout), 51 (1), 41 (2), 36 (3 bouts).' },
];

export default function TarotRulesPage() {
  return (
    <main style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${NAVY}, ${CARD})`, padding: '32px 20px 60px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <Link href="/tarot" style={{ color: BLUE, textDecoration: 'none', fontWeight: 700 }}>← Retour</Link>
        <h1 style={{ color: '#fff', fontSize: '2rem', fontWeight: 900, margin: '14px 0 24px' }}>Règles du Tarot</h1>
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
