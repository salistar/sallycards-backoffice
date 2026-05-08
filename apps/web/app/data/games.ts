export interface GameInfo {
  name: string;
  icon: string;
  players: string;
  desc: string;
  origin: string;
  difficulty: 'Facile' | 'Moyen' | 'Expert';
  deck: 'spanish40';
  sampleCards: string[];
  rules: string[];
  color: string;
}

export const GAMES: GameInfo[] = [
  {
    name: 'Ronda',
    icon: '🃏',
    players: '2-4',
    desc: 'Capture marocaine avec annonces.',
    origin: 'Maroc',
    difficulty: 'Moyen',
    deck: 'spanish40',
    sampleCards: ['1E.png', '7O.png', '12C.png', '10B.png'],
    rules: [
      'Chaque joueur recoit 7 cartes.',
      'Capturez les cartes de la table en faisant correspondre les valeurs.',
      'Les annonces (Ronda, Tringa) rapportent des points bonus.',
      'Le joueur avec le plus de points gagne.',
    ],
    color: '#DC2626',
  },
  {
    name: 'Kdoub',
    icon: '🤥',
    players: '2-6',
    desc: 'Bluffez ou contestez !',
    origin: 'Maroc',
    difficulty: 'Facile',
    deck: 'spanish40',
    sampleCards: ['1E.png', '12O.png', '11C.png', '7B.png'],
    rules: [
      'Posez des cartes face cachee en annoncant leur valeur.',
      'Les autres joueurs peuvent contester votre annonce.',
      'Si vous bluffez et etes attrape, vous ramassez le tas.',
      'Le premier a se debarrasser de toutes ses cartes gagne.',
    ],
    color: '#7C3AED',
  },
  {
    name: 'Belote',
    icon: '♣️',
    players: '4',
    desc: 'Equipes, atout, encheres.',
    origin: 'France',
    difficulty: 'Expert',
    deck: 'spanish40',
    sampleCards: ['11O.png', '7E.png', '1C.png', '12B.png'],
    rules: [
      'Jouez en equipes de 2 contre 2.',
      'Phase d\'encheres pour determiner l\'atout.',
      'Remportez des plis pour marquer des points.',
      'Annoncez les combinaisons pour des bonus.',
    ],
    color: '#2563EB',
  },
  {
    name: 'Poker',
    icon: '♠️',
    players: '2-9',
    desc: "Texas Hold'em classique.",
    origin: 'International',
    difficulty: 'Expert',
    deck: 'spanish40',
    sampleCards: ['1E.png', '12E.png', '1O.png', '12O.png'],
    rules: [
      'Chaque joueur recoit 2 cartes privees.',
      '5 cartes communes sont revelees progressivement.',
      'Formez la meilleure main de 5 cartes.',
      'Mises, relances et bluffs strategiques.',
    ],
    color: '#059669',
  },
  {
    name: 'Tarot',
    icon: '👑',
    players: '4',
    desc: '78 cartes, 22 atouts.',
    origin: 'France',
    difficulty: 'Expert',
    deck: 'spanish40',
    sampleCards: ['10E.png', '11C.png', '12O.png', '12B.png'],
    rules: [
      '78 cartes incluant 22 atouts speciaux.',
      'Le preneur joue seul contre les 3 defenseurs.',
      'Phase d\'encheres pour determiner le contrat.',
      'Le Petit, le 21 et l\'Excuse sont les cartes cles.',
    ],
    color: '#D97706',
  },
  {
    name: 'Scopa',
    icon: '🪙',
    players: '2-4',
    desc: 'Capture italienne.',
    origin: 'Italie',
    difficulty: 'Moyen',
    deck: 'spanish40',
    sampleCards: ['7O.png', '1C.png', '6E.png', '5B.png'],
    rules: [
      'Capturez les cartes de la table dont la somme egale votre carte.',
      'Vider la table (Scopa) rapporte 1 point bonus.',
      'Le 7 d\'Or (Sette Bello) vaut 1 point.',
      'La Primiera: meilleure combinaison de 4 couleurs.',
    ],
    color: '#EA580C',
  },
  {
    name: 'Okey',
    icon: '🎴',
    players: '2-4',
    desc: 'Rami turc avec tuiles.',
    origin: 'Turquie',
    difficulty: 'Moyen',
    deck: 'spanish40',
    sampleCards: ['5O.png', '6O.png', '7O.png', '10O.png'],
    rules: [
      'Chaque joueur recoit 14 tuiles (ou cartes).',
      'Formez des suites (meme couleur) ou des groupes (meme valeur).',
      'Piochez et defaussez a chaque tour.',
      'Le premier a completer ses combinaisons gagne.',
    ],
    color: '#0891B2',
  },
  {
    name: 'Memory',
    icon: '🧠',
    players: '1-4',
    desc: 'Trouvez les paires.',
    origin: 'International',
    difficulty: 'Facile',
    deck: 'spanish40',
    sampleCards: ['1O.png', '1C.png', '12E.png', '12B.png'],
    rules: [
      'Toutes les cartes sont face cachee sur la table.',
      'Retournez 2 cartes par tour.',
      'Si elles correspondent, gardez la paire.',
      'Le joueur avec le plus de paires gagne.',
    ],
    color: '#DB2777',
  },
  {
    name: 'Solitaire',
    icon: '♦️',
    players: '1',
    desc: 'Klondike classique.',
    origin: 'International',
    difficulty: 'Facile',
    deck: 'spanish40',
    sampleCards: ['1E.png', '2O.png', '3C.png', '4B.png'],
    rules: [
      'Classez les cartes par couleur de l\'As au Roi.',
      'Alternez les couleurs rouge/noir dans les colonnes.',
      'Piochez dans le talon quand bloque.',
      'Gagnez en placant les 52 cartes sur les fondations.',
    ],
    color: '#4F46E5',
  },
  {
    name: 'Qui Est-Ce?',
    icon: '❓',
    players: '2',
    desc: 'Deduction oui/non.',
    origin: 'International',
    difficulty: 'Facile',
    deck: 'spanish40',
    sampleCards: ['11O.png', '12E.png', '12C.png', '1B.png'],
    rules: [
      'Chaque joueur choisit une carte secrete.',
      'Posez des questions oui/non sur la carte adversaire.',
      'Eliminez les cartes qui ne correspondent pas.',
      'Devinez la carte de l\'adversaire pour gagner.',
    ],
    color: '#0D9488',
  },
];

export const FEATURES = [
  { icon: '🌐', title: 'Multijoueur', desc: 'Jouez en temps reel dans le monde entier.' },
  { icon: '🗣️', title: '5 Langues', desc: 'Arabe, Francais, Darija, Anglais, Espagnol.' },
  { icon: '📶', title: 'Bluetooth', desc: 'Jouez hors-ligne avec vos proches.' },
  { icon: '🤖', title: 'Bots IA', desc: '8 bots avec difficulte adaptative.' },
  { icon: '🎮', title: 'Mode Solo', desc: 'Sans connexion, contre des bots.' },
  { icon: '🏆', title: 'Tournois', desc: 'Classement ELO et competitions.' },
];
