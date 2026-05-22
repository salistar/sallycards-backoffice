/**
 * @file apps/web/app/belote/rules/page.tsx
 * @description Règles de la Belote (web, Phase 1).
 */
import Link from 'next/link';

const NAVY = '#0A1535';
const CARD = '#152A47';
const GOLD = '#FCD34D';
const BLUE = '#93C5FD';

const SECTIONS: { title: string; body: string }[] = [
  { title: 'Présentation', body: '4 joueurs en 2 équipes, jeu de 32 cartes. But : atteindre 501 (ou 1000) points en remportant des plis et en réalisant des contrats.' },
  { title: 'Distribution', body: 'Le donneur distribue 3 puis 2 cartes (5 cartes), puis retourne une carte. 1er tour d’enchère : « Prendre » l’atout retourné ou « Passer ». Si tous passent, 2e tour : choix d’une autre couleur d’atout.' },
  { title: 'Cartes à l’ATOUT (force ↓ · points)', body: 'Valet (20) > 9 (14) > As (11) > 10 (10) > Roi (4) > Dame (3) > 8 (0) > 7 (0).' },
  { title: 'Cartes HORS atout (force ↓ · points)', body: 'As (11) > 10 (10) > Roi (4) > Dame (3) > Valet (2) > 9, 8, 7 (0).' },
  { title: 'Obligations', body: 'Fournir la couleur demandée si possible ; sinon couper à l’atout ; sur-couper si un atout est déjà posé. Défausse libre si le partenaire est maître.' },
  { title: 'Belote-Rebelote (+20)', body: 'Roi + Dame d’atout dans la même main : annonce « Belote » puis « Rebelote » en les jouant → +20 points.' },
  { title: 'Annonces', body: 'Tierce (+20), Cinquante (+50), Cent (+100). Carrés : Valets (+200), Neufs (+150), autres (+100). La plus forte annonce d’une équipe annule celles de l’adversaire.' },
  { title: '10 de der · Capot · Scoring', body: 'Dernier pli = +10. Capot (8 plis) = +90 (250 en Coinche). 162 points en jeu. Contrat : le preneur doit faire ≥ 82 points sinon « dedans » (tout à l’adversaire). Litige 81-81 : points au greffe pour la manche suivante.' },
  { title: 'Coinche / Contrée', body: 'Annonce d’un contrat chiffré (80 → Capot). Les adversaires peuvent coincher (x2), le preneur sur-coincher (x4).' },
];

export default function BeloteRulesPage() {
  return (
    <main style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${NAVY}, ${CARD})`, padding: '32px 20px 60px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <Link href="/belote" style={{ color: BLUE, textDecoration: 'none', fontWeight: 700 }}>← Retour</Link>
        <h1 style={{ color: '#fff', fontSize: '2rem', fontWeight: 900, margin: '14px 0 24px' }}>Règles de la Belote</h1>
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
