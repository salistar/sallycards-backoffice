/** @file Règles de la Scopa (web). */
import Link from 'next/link';

const NAVY = '#0A1535'; const CARD = '#152A47'; const GOLD = '#FCD34D'; const BLUE = '#93C5FD';

const SECTIONS: { title: string; body: string }[] = [
  { title: 'Présentation', body: 'Jeu de capture italien à 2 joueurs, 40 cartes (Spade, Coppe, Bastoni, Denari ; valeurs 1 à 10). But : marquer le plus de points sur plusieurs manches (objectif 11).' },
  { title: 'Distribution', body: '3 cartes en main par joueur + 4 cartes face visible au centre. Quand les deux mains sont vides, on redistribue 3 cartes chacun (sans recharger le centre) jusqu’à épuisement du paquet.' },
  { title: 'Capturer', body: 'À ton tour tu poses une carte : (1) si une carte du centre a la MÊME valeur → tu la captures (priorité au match exact) ; (2) sinon, si des cartes du centre font la SOMME de ta valeur → tu les captures toutes ; (3) sinon tu défausses ta carte au centre.' },
  { title: 'Scopa (+1)', body: 'Si ta capture vide entièrement le centre (balayage), tu marques une « Scopa » = +1 point — sauf au tout dernier coup de la manche.' },
  { title: 'Fin de manche', body: 'Les cartes restantes au centre vont au dernier joueur ayant capturé. On compte alors les points.' },
  { title: 'Scoring de manche', body: '1 pt pour le plus de cartes capturées · 1 pt pour le plus de Denari · 1 pt pour le 7 de Denari (« Settebello ») · 1 pt pour la meilleure « Primiera » (meilleure carte par couleur, le 7 vaut 21, le 6 vaut 18, l’As 16…). + chaque Scopa.' },
];

export default function ScopaRulesPage() {
  return (
    <main style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${NAVY}, ${CARD})`, padding: '32px 20px 60px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <Link href="/scopa" style={{ color: BLUE, textDecoration: 'none', fontWeight: 700 }}>← Retour</Link>
        <h1 style={{ color: '#fff', fontSize: '2rem', fontWeight: 900, margin: '14px 0 24px' }}>Règles de la Scopa</h1>
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
