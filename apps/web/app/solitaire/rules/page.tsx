/** @file Règles du Solitaire (web). */
import Link from 'next/link';
const NAVY = '#0A1535'; const CARD = '#152A47'; const GOLD = '#FCD34D'; const BLUE = '#93C5FD';
const SECTIONS: { title: string; body: string }[] = [
  { title: 'Présentation', body: 'Le Solitaire (patience) se joue seul avec un ou deux jeux de 52 cartes. Plus de 100 variantes sont disponibles : Klondike, FreeCell, Yukon, Forty Thieves, Canfield, Pyramid, Monte Carlo, et bien d\'autres. Le but général : déplacer toutes les cartes vers les fondations (As → Roi) ou vider le tableau.' },
  { title: 'Familles « tableau »', body: 'Klondike, FreeCell, Yukon, Forty Thieves… : on empile les cartes du tableau en séquences décroissantes (couleurs alternées pour Klondike/FreeCell, même couleur pour Forty Thieves) et on monte les fondations par suite ascendante de l\'As au Roi. Pioche/défausse pour Klondike ; cellules libres pour FreeCell.' },
  { title: 'Familles « paires »', body: 'Pyramid, Monte Carlo, Nestor, Decade… : on retire des paires de cartes accessibles selon une règle (somme = 13, même rang, suite ±1…). Les Rois (somme 13) peuvent se retirer seuls dans Pyramid.' },
  { title: 'Commandes', body: 'Clique une carte pour la sélectionner, puis clique sa destination (autre colonne, fondation, cellule). Clique la pioche pour distribuer. Utilise « Auto » pour envoyer automatiquement les cartes jouables aux fondations, et « Annuler » pour revenir en arrière. Chrono et nombre de coups sont suivis.' },
];
export default function SolitaireRulesPage() {
  return (
    <main style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${NAVY}, ${CARD})`, padding: '32px 20px 60px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <Link href="/solitaire" style={{ color: BLUE, textDecoration: 'none', fontWeight: 700 }}>← Retour</Link>
        <h1 style={{ color: '#fff', fontSize: '2rem', fontWeight: 900, margin: '14px 0 24px' }}>Règles du Solitaire</h1>
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
