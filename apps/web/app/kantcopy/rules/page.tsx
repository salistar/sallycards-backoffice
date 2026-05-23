/** @file Règles du Kant Copy (web, version simplifiée jouable). */
import Link from 'next/link';
const NAVY = '#0A1535'; const CARD = '#0c3540'; const GOLD = '#FCD34D'; const BLUE = '#93C5FD';
const SECTIONS: { title: string; body: string }[] = [
  { title: 'Présentation', body: 'Kant Copy (كانت كوبي) se joue à 4 en 2 équipes de 2 (partenaires face à face), avec le paquet espagnol de 40 cartes. Chaque joueur garde toujours 4 cartes en main. Première équipe à 7 points gagne.' },
  { title: 'Le tour', body: 'À ton tour : pioche une carte (au talon fermé ou sur la défausse), tu as 5 cartes, puis défausse-en une (retour à 4). Garde tes paires et brelans pour viser le carré !' },
  { title: 'Le Kant (carré)', body: 'Réunir 4 cartes de MÊME valeur dans ta main = un « Kant ». Tu fais alors un signal discret à ton partenaire. S\'il le repère, il annonce « Carte Copie ! » et désigne ta main : +1 point pour ton équipe.' },
  { title: 'Voler & se tromper', body: 'Un adversaire qui repère ton signal peut intercepter en annonçant lui-même « Carte Copie ! » sur ta main : il VOLE le Kant → +2 pour son équipe. Mais une annonce ratée (pas de Kant chez la cible) donne +1 à l\'équipe adverse. À toi de bien lire les signaux !' },
];
export default function KantcopyRulesPage() {
  return (
    <main style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${NAVY}, ${CARD})`, padding: '32px 20px 60px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <Link href="/kantcopy" style={{ color: BLUE, textDecoration: 'none', fontWeight: 700 }}>← Retour</Link>
        <h1 style={{ color: '#fff', fontSize: '2rem', fontWeight: 900, margin: '14px 0 24px' }}>Règles du Kant Copy</h1>
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
