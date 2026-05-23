/** @file Règles de Qui-est-ce ? (web). */
import Link from 'next/link';
const NAVY = '#0A1535'; const CARD = '#152A47'; const GOLD = '#FCD34D'; const BLUE = '#93C5FD';
const SECTIONS: { title: string; body: string }[] = [
  { title: 'Présentation', body: 'Jeu de déduction à 2 (toi vs le bot). Chacun a un personnage secret parmi 24. Le premier à deviner le personnage de l\'adversaire gagne.' },
  { title: 'Poser une question', body: 'À ton tour, pose une question fermée (oui/non) sur l\'apparence : sexe, couleur de cheveux, lunettes, chapeau, barbe. Selon la réponse, les suspects qui ne correspondent pas sont éliminés (grille barrée).' },
  { title: 'Deviner', body: 'Active « Mode deviner » puis clique un personnage encore en lice pour proposer ta réponse. Si c\'est le bon → tu gagnes ; sinon le bot gagne. Le bot pose aussi des questions sur TON personnage et tente de le deviner.' },
  { title: 'Stratégie', body: 'Pose des questions qui éliminent environ la moitié des suspects à chaque fois pour converger vite. Le bot fait de même.' },
];
export default function QECRulesPage() {
  return (
    <main style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${NAVY}, ${CARD})`, padding: '32px 20px 60px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <Link href="/quiestce" style={{ color: BLUE, textDecoration: 'none', fontWeight: 700 }}>← Retour</Link>
        <h1 style={{ color: '#fff', fontSize: '2rem', fontWeight: 900, margin: '14px 0 24px' }}>Règles de Qui-est-ce ?</h1>
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
