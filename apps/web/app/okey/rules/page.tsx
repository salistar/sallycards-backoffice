/** @file Règles de l'Okey (web, version simplifiée jouable). */
import Link from 'next/link';
const NAVY = '#0A1535'; const CARD = '#152A47'; const GOLD = '#FCD34D'; const BLUE = '#93C5FD';
const SECTIONS: { title: string; body: string }[] = [
  { title: 'Présentation', body: 'Rami turc à 4 joueurs avec 106 tuiles : 4 couleurs (rouge, jaune, bleu, noir) × valeurs 1-13 en double + 2 jokers. Chaque joueur a 14 tuiles. But : être le premier à organiser ses 14 tuiles en groupes valides.' },
  { title: 'Le tour', body: 'À ton tour : pioche une tuile (depuis la pioche fermée ou la défausse), tu as alors 15 tuiles, puis défausse-en une (retour à 14).' },
  { title: 'Groupes valides', body: 'Suite : 3 tuiles ou + de la MÊME couleur, valeurs consécutives (ex. 4-5-6 rouge). Brelan : 3 ou 4 tuiles de la MÊME valeur, couleurs différentes (ex. 7 rouge, 7 bleu, 7 noir). Les jokers (★) remplacent n\'importe quelle tuile.' },
  { title: 'Terminer (Okey)', body: 'Quand tes 14 tuiles forment entièrement des groupes valides (après avoir pioché et en défaussant la 15e), clique « Terminer » : tu remportes la manche.' },
];
export default function OkeyRulesPage() {
  return (
    <main style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${NAVY}, ${CARD})`, padding: '32px 20px 60px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <Link href="/okey" style={{ color: BLUE, textDecoration: 'none', fontWeight: 700 }}>← Retour</Link>
        <h1 style={{ color: '#fff', fontSize: '2rem', fontWeight: 900, margin: '14px 0 24px' }}>Règles de l'Okey</h1>
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
