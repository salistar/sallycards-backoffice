/** @file Règles du Poker Texas Hold'em (web, version simplifiée jouable). */
import Link from 'next/link';
const NAVY = '#0A1535'; const CARD = '#3b0a0a'; const GOLD = '#FCD34D'; const BLUE = '#FCA5A5';
const SECTIONS: { title: string; body: string }[] = [
  { title: 'Présentation', body: "Texas Hold'em No-Limit à 2-4 joueurs, paquet espagnol de 40 cartes. Chaque joueur démarre avec 1000 jetons. Blinds 10/20. Le but : remporter les jetons des adversaires en formant la meilleure main de 5 cartes." },
  { title: 'Déroulement', body: 'Chaque joueur reçoit 2 cartes privées. 5 cartes communes sont dévoilées en 3 étapes : flop (3), turn (1), river (1). Entre chaque étape, un tour d\'enchères : check, miser, suivre, relancer ou se coucher. « No-limit » : tu peux faire tapis (all-in) à tout moment.' },
  { title: 'Hiérarchie des mains', body: 'Du plus faible au plus fort : carte haute < paire < double paire < brelan < quinte < couleur < full < carré < quinte flush. On combine ses 2 cartes privées et les 5 communes pour faire la meilleure main de 5 cartes.' },
  { title: 'Gagner', body: 'À l\'abattage (river jouée) ou quand tous les autres se sont couchés, le meilleur jeu remporte le pot. La partie se termine quand un joueur a récupéré tous les jetons.' },
];
export default function PokerRulesPage() {
  return (
    <main style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${NAVY}, ${CARD})`, padding: '32px 20px 60px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <Link href="/poker" style={{ color: BLUE, textDecoration: 'none', fontWeight: 700 }}>← Retour</Link>
        <h1 style={{ color: '#fff', fontSize: '2rem', fontWeight: 900, margin: '14px 0 24px' }}>Règles du Poker</h1>
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
