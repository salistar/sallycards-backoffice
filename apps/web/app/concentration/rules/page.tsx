/** @file Règles de la Concentration (web, version simplifiée jouable). */
import Link from 'next/link';
const NAVY = '#0A1535'; const CARD = '#103a1f'; const GOLD = '#FCD34D'; const BLUE = '#93C5FD';
const SECTIONS: { title: string; body: string }[] = [
  { title: 'Présentation', body: 'La Concentration (jeu de mémoire) se joue à 1-4 joueurs. Des cartes sont posées face cachée sur une grille (16, 24 ou 36 cartes selon la difficulté), par paires de symboles identiques. Le but : mémoriser les emplacements et retrouver le plus de paires.' },
  { title: 'Le tour', body: 'À ton tour, retourne 2 cartes. Si elles forment une PAIRE (même symbole), tu la gardes et tu REJOUES. Sinon, les deux cartes se retournent face cachée et c\'est au joueur suivant.' },
  { title: 'Mémoire', body: 'Toutes les cartes retournées sont visibles de tous pendant un instant : observe et mémorise les emplacements pour réaliser des paires à ton prochain tour. Les bots ont une mémoire plus ou moins fiable selon la difficulté.' },
  { title: 'Gagner', body: 'La partie se termine quand toutes les paires sont trouvées. Le joueur (ou l\'équipe) qui a constitué le plus grand nombre de paires gagne.' },
];
export default function ConcentrationRulesPage() {
  return (
    <main style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${NAVY}, ${CARD})`, padding: '32px 20px 60px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <Link href="/concentration" style={{ color: BLUE, textDecoration: 'none', fontWeight: 700 }}>← Retour</Link>
        <h1 style={{ color: '#fff', fontSize: '2rem', fontWeight: 900, margin: '14px 0 24px' }}>Règles de la Concentration</h1>
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
