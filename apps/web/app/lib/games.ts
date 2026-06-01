/**
 * @file apps/web/app/lib/games.ts
 * @description Catalogue centralisé des 11 jeux SallyCards.
 *
 *   - slug         : identifiant URL ("/download/[slug]")
 *   - name         : nom marketing du jeu (langue native)
 *   - players      : nombre de joueurs ("2-4")
 *   - cardSystem   : 'fr' (52 cartes françaises) ou 'es' (40 cartes espagnoles)
 *   - rules        : règles complètes en FR / EN / AR (~ 3-5 phrases)
 *   - available    : true = APK publié sur GH Releases, false = "Bientôt"
 *   - apkUrl       : URL release "latest" si available
 *   - githubRepo   : repo public (pour lien "voir les sources")
 *   - iconSrc      : chemin de l'icône (PNG copié depuis l'app mobile)
 *   - gradient     : couleur d'accent unique pour la card
 */

export type CardSystem = 'fr' | 'es';

export interface GameRules {
  fr: string;
  en: string;
  ar: string;
}

export interface Game {
  slug: string;
  name: string;
  tagline: { fr: string; en: string; ar: string };
  players: string;
  cardSystem: CardSystem;
  rules: GameRules;
  available: boolean;
  /** Primary download (signed APK for users — what the gold button points to) */
  apkUrl?: string;
  /** CI debug APK, served alongside the signed one */
  apkDebugUrl?: string;
  /** Signed AAB for advanced users / Play Console upload */
  aabUrl?: string;
  releasePage?: string;
  githubRepo?: string;
  iconSrc: string;
  gradient: string;
}

export const GAMES: Game[] = [
  // ════════════════════════════════════════════════════════════════════
  // 1. SOLITAIRE — disponible (APK signé via GH Releases)
  // ════════════════════════════════════════════════════════════════════
  {
    slug: 'solitaire',
    name: 'Sally Solitaire',
    tagline: {
      fr: '192 variantes de patience (Klondike, Spider, FreeCell…)',
      en: '192 patience variants (Klondike, Spider, FreeCell…)',
      ar: '192 متغيراً للسوليتير (Klondike، Spider، FreeCell…)',
    },
    players: '1 (solo) / 2-4 (multi)',
    cardSystem: 'fr',
    rules: {
      fr: "Le but est de transférer toutes les cartes du tableau vers les 4 fondations, classées par couleur de l'As au Roi. Le mode Klondike — le plus connu — distribue 28 cartes en 7 piles décroissantes (1 visible, 6 cachées). On déplace des séquences alternées de couleur du plus haut au plus bas. Quand un Roi atteint une colonne vide, on peut la recoloniser. Le jeu propose également les variantes Spider (2 paquets, 10 colonnes), FreeCell (4 cellules libres), TriPeaks, Pyramid, Yukon et Forty Thieves.",
      en: 'The goal is to move all cards from the tableau to the 4 foundations, sorted by suit from Ace to King. The Klondike mode — the most famous — deals 28 cards into 7 descending piles (1 face-up, 6 hidden). You move alternating-color sequences from high to low. When a King reaches an empty column, you can re-seed it. The game also includes Spider (2 decks, 10 columns), FreeCell (4 free cells), TriPeaks, Pyramid, Yukon, and Forty Thieves variants.',
      ar: "الهدف نقل جميع الأوراق من اللوحة إلى الأربع قواعد، مرتبة حسب اللون من الآس إلى الملك. وضع Klondike الأشهر يوزع 28 ورقة في 7 أعمدة متناقصة (واحدة مكشوفة، ست مخفية). تنقل تسلسلات بألوان متناوبة من الأعلى للأدنى. عندما يصل الملك إلى عمود فارغ، يمكنك ملؤه من جديد. تشمل اللعبة أيضاً Spider (مجموعتان، 10 أعمدة)، FreeCell (4 خلايا حرة)، TriPeaks، Pyramid، Yukon و Forty Thieves.",
    },
    available: true,
    apkUrl: 'https://github.com/salistar/sally-solitaire/releases/download/latest/app-debug.apk',
    releasePage: 'https://github.com/salistar/sally-solitaire/releases/tag/latest',
    githubRepo: 'https://github.com/salistar/sally-solitaire',
    iconSrc: '/games/solitaire.png',
    gradient: 'linear-gradient(135deg, #2563EB, #60A5FA)',
  },

  // ════════════════════════════════════════════════════════════════════
  // 2. RONDA (Maroc) — bientôt
  // ════════════════════════════════════════════════════════════════════
  {
    slug: 'ronda',
    name: 'Sally Ronda',
    tagline: {
      fr: 'La ronda marocaine — capture rapide en 40 cartes',
      en: 'Moroccan Ronda — fast capture, 40-card Spanish deck',
      ar: 'الروندا المغربية — التقاط سريع بـ 40 ورقة',
    },
    players: '2-4',
    cardSystem: 'es',
    rules: {
      fr: "La Ronda se joue avec 40 cartes espagnoles (Bastos, Copas, Espadas, Oros). Chaque joueur reçoit 3 cartes et 4 cartes sont posées au centre. À son tour, on pose une carte : si elle a la même valeur qu'une carte du milieu, on la capture (et on capture aussi toute série consécutive ascendante). Capturer toutes les cartes du milieu = « Tringla » (bonus +1). Quand le paquet est épuisé, on compte les captures : 1 point par carte + bonus pour les oros (carreaux).",
      en: 'Ronda is played with 40 Spanish-suited cards (Bastos, Copas, Espadas, Oros). Each player receives 3 cards and 4 cards are placed at the center. On your turn you play one card: if it matches the value of a center card, you capture it (and any ascending consecutive run). Capturing all center cards = "Tringla" (+1 bonus). When the deck is exhausted, captures are counted: 1 point per card + bonus for Oros (gold suit).',
      ar: 'تُلعب الروندا بـ 40 ورقة إسبانية (Bastos، Copas، Espadas، Oros). كل لاعب يأخذ 3 أوراق وتوضع 4 أوراق في الوسط. في دورك تلعب ورقة: إذا تطابقت قيمتها مع ورقة وسط، تلتقطها (ومعها أي تسلسل تصاعدي). التقاط كل أوراق الوسط = « Tringla » (مكافأة +1). عند نفاد المجموعة تُحسب الالتقاطات: نقطة لكل ورقة + مكافأة للـ Oros.',
    },
    available: true,
    apkUrl: 'https://github.com/salistar/sally-ronda/releases/download/latest/app-debug.apk',
    releasePage: 'https://github.com/salistar/sally-ronda/releases/tag/latest',
    githubRepo: 'https://github.com/salistar/sally-ronda',
    iconSrc: '/games/ronda.png',
    gradient: 'linear-gradient(135deg, #F59E0B, #EF4444)',
  },

  // ════════════════════════════════════════════════════════════════════
  // 3. KDOUB (Maroc) — bientôt
  // ════════════════════════════════════════════════════════════════════
  {
    slug: 'kdoub',
    name: 'Sally Kdoub',
    tagline: {
      fr: 'Bluff et défi — le mensonge organisé',
      en: 'Bluff and challenge — organized lying',
      ar: 'خداع وتحدي — الكذب المنظم',
    },
    players: '3-6',
    cardSystem: 'fr',
    rules: {
      fr: "Le Kdoub se joue à 3-6 joueurs avec un paquet de 52 cartes. Toutes les cartes sont distribuées équitablement. Le premier joueur pose une ou plusieurs cartes face cachée en annonçant une valeur (« deux Rois »). Le joueur suivant doit poser au moins une carte de la même valeur — ou bluffer. Un autre joueur peut contester (« Kdoub ! ») : si le bluff est avéré, le menteur récupère le tas ; sinon le contestataire le récupère. Le premier à se débarrasser de toutes ses cartes gagne.",
      en: 'Kdoub is played by 3-6 players with a 52-card deck. All cards are dealt evenly. The first player plays one or more cards face down, announcing a value ("two Kings"). The next player must play at least one card of the same value — or bluff. Any other player may challenge ("Kdoub!"): if the bluff is proven, the liar takes the pile; otherwise the challenger does. First to empty their hand wins.',
      ar: "يلعب الكدوب 3-6 لاعبين بمجموعة 52 ورقة. توزع كل الأوراق بالتساوي. اللاعب الأول يضع ورقة أو أكثر مقلوبة معلناً قيمة (« ملكان »). اللاعب التالي يضع ورقة على الأقل بنفس القيمة — أو يخدع. أي لاعب آخر يستطيع التحدي (« كدوب! »): إذا ثبت الخداع، الكاذب يأخذ الكومة؛ وإلا المتحدي. أول من ينهي أوراقه يربح.",
    },
    available: true,
    apkUrl: 'https://github.com/salistar/sally-kdoub/releases/download/latest/app-debug.apk',
    releasePage: 'https://github.com/salistar/sally-kdoub/releases/tag/latest',
    githubRepo: 'https://github.com/salistar/sally-kdoub',
    iconSrc: '/games/kdoub.png',
    gradient: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
  },

  // ════════════════════════════════════════════════════════════════════
  // 4. BELOTE — bientôt
  // ════════════════════════════════════════════════════════════════════
  {
    slug: 'belote',
    name: 'Sally Belote',
    tagline: {
      fr: 'Le jeu de levées français en équipe',
      en: 'The French trick-taking team game',
      ar: 'لعبة فرنسية بالحيل في فرق',
    },
    players: '4 (2v2)',
    cardSystem: 'fr',
    rules: {
      fr: "La Belote se joue à 4 en équipes de 2 (face à face) avec 32 cartes (du 7 à l'As, ordre Belote : 7-8-9-V-D-R-10-A, mais à l'atout : 7-8-D-R-10-A-9-V). Chaque joueur reçoit 5 cartes ; une carte du paquet est retournée pour proposer l'atout. Les équipes annoncent (« je prends » / « passe »). L'équipe preneur doit réaliser plus de la moitié des points. Belote/Rebelote = +20 si on a Roi+Dame d'atout. Le but : 1 000 points en plusieurs manches.",
      en: 'Belote is played by 4 in 2v2 teams (facing) with 32 cards (7 to Ace, Belote order: 7-8-9-J-Q-K-10-A, but at trump: 7-8-Q-K-10-A-9-J). Each player receives 5 cards; one card is flipped to propose trump. Teams announce ("I take" / "pass"). The taking team must score more than half the points. Belote/Rebelote = +20 if you have K+Q of trump. Goal: 1,000 points across multiple rounds.',
      ar: "تلعب البلوت بأربعة لاعبين في فريقين من اثنين (وجهاً لوجه) بـ 32 ورقة (من 7 إلى الآس، ترتيب البلوت: 7-8-9-V-D-R-10-A، لكن في الأتو: 7-8-D-R-10-A-9-V). كل لاعب يأخذ 5 أوراق؛ تُقلب ورقة لاقتراح الأتو. الفرق تعلن (« آخذ » / « أمرر »). الفريق الآخذ يجب أن يحقق أكثر من نصف النقاط. Belote/Rebelote = +20 إذا كان لديك ملك+ملكة الأتو. الهدف: 1000 نقطة على عدة جولات.",
    },
    available: true,
    apkUrl: 'https://github.com/salistar/sally-belote/releases/download/v1.0.2-signed/sally-belote-v1.0.2-prod.apk',
    apkDebugUrl: 'https://github.com/salistar/sally-belote/releases/download/latest/app-debug.apk',
    aabUrl: 'https://github.com/salistar/sally-belote/releases/download/v1.0.2-signed/sally-belote-v1.0.2-prod.aab',
    releasePage: 'https://github.com/salistar/sally-belote/releases/tag/v1.0.2-signed',
    githubRepo: 'https://github.com/salistar/sally-belote',
    iconSrc: '/games/belote.png',
    gradient: 'linear-gradient(135deg, #3B82F6, #1E40AF)',
  },

  // ════════════════════════════════════════════════════════════════════
  // 5. POKER — bientôt
  // ════════════════════════════════════════════════════════════════════
  {
    slug: 'poker',
    name: 'Sally Poker',
    tagline: {
      fr: "Texas Hold'em No-Limit — cash & tournois",
      en: "Texas Hold'em No-Limit — cash and tournaments",
      ar: 'تكساس هولدم بدون حدود — كاش وبطولات',
    },
    players: '2-9',
    cardSystem: 'fr',
    rules: {
      fr: "Texas Hold'em No-Limit : chaque joueur reçoit 2 cartes privées (« hole cards »). 5 cartes communes sont dévoilées en 3 étapes (flop=3, turn=1, river=1). 4 tours d'enchères (pré-flop, flop, turn, river). Le but est de constituer la meilleure main de 5 cartes (combinaison des 7 disponibles). Hiérarchie : carte haute < paire < double paire < brelan < quinte < couleur < full < carré < quinte flush < quinte flush royale. Mise « no-limit » : on peut aller all-in à n'importe quel moment.",
      en: "Texas Hold'em No-Limit: each player receives 2 private cards (\"hole cards\"). 5 community cards are revealed in 3 stages (flop=3, turn=1, river=1). 4 betting rounds (pre-flop, flop, turn, river). The goal is to make the best 5-card hand (any 5 of the 7 available). Hierarchy: high card < pair < two pair < three of a kind < straight < flush < full house < four of a kind < straight flush < royal flush. \"No-limit\" betting: you can go all-in at any time.",
      ar: "تكساس هولدم بدون حدود: كل لاعب يأخذ ورقتين خاصتين. تكشف 5 أوراق مشتركة على 3 مراحل (flop=3، turn=1، river=1). 4 جولات رهان. الهدف: أفضل يد من 5 أوراق (أي 5 من السبع المتاحة). الترتيب: ورقة عالية < زوج < زوجان < ثلاثية < تتابع < لون < فول < رباعية < تتابع لون < تتابع ملكي. الرهان بدون حدود: يمكن all-in في أي لحظة.",
    },
    available: true,
    apkUrl: 'https://github.com/salistar/sally-poker/releases/download/latest/app-debug.apk',
    releasePage: 'https://github.com/salistar/sally-poker/releases/tag/latest',
    githubRepo: 'https://github.com/salistar/sally-poker',
    iconSrc: '/games/poker.png',
    gradient: 'linear-gradient(135deg, #DC2626, #7F1D1D)',
  },

  // ════════════════════════════════════════════════════════════════════
  // 6. TAROT — bientôt
  // ════════════════════════════════════════════════════════════════════
  {
    slug: 'tarot',
    name: 'Sally Tarot',
    tagline: {
      fr: 'Le Tarot français à 5 joueurs — 78 cartes',
      en: 'French Tarot — 78-card 5-player trick-taking',
      ar: 'تاروت فرنسي بـ 5 لاعبين — 78 ورقة',
    },
    players: '3-5',
    cardSystem: 'fr',
    rules: {
      fr: "Le Tarot se joue à 3, 4 ou 5 avec 78 cartes : 4 couleurs (♠♥♦♣) de l'As au Roi + 21 atouts numérotés + l'Excuse (★). Distribution de 15 à 24 cartes selon le nombre. Le preneur annonce un contrat (Petite, Garde, Garde Sans, Garde Contre). 6 cartes au chien sont vues seulement à Garde Contre. Les bouts (1, 21, Excuse) valent 4.5 pts chacun ; pour gagner il faut atteindre 56 pts (3 bouts) à 81 pts (0 bout). Le Petit (atout 1) doit être joué au dernier pli pour le « Petit au bout » (+10).",
      en: 'Tarot is played by 3, 4 or 5 with 78 cards: 4 suits (♠♥♦♣) from Ace to King + 21 numbered trumps + the Excuse (★). 15 to 24 cards dealt depending on player count. The taker announces a contract (Petite, Garde, Garde Sans, Garde Contre). 6 dog cards are seen only on Garde Contre. The "bouts" (1, 21, Excuse) are worth 4.5 pts each; to win you need 56 pts (3 bouts) to 81 pts (0 bouts). The Petit (trump 1) must be played on the last trick for "Petit au bout" (+10).',
      ar: "يلعب التاروت 3 أو 4 أو 5 لاعبين بـ 78 ورقة: 4 ألوان (♠♥♦♣) من الآس إلى الملك + 21 أتو + Excuse (★). توزيع من 15 إلى 24 ورقة حسب العدد. الآخذ يعلن عقداً (Petite، Garde، Garde Sans، Garde Contre). 6 أوراق في الكلب تُرى فقط في Garde Contre. الـ bouts (1، 21، Excuse) كل واحد بـ 4.5 نقطة؛ للفوز تحتاج 56 نقطة (3 bouts) إلى 81 نقطة (0 bouts).",
    },
    available: true,
    apkUrl: 'https://github.com/salistar/sally-tarot/releases/download/latest/app-debug.apk',
    releasePage: 'https://github.com/salistar/sally-tarot/releases/tag/latest',
    githubRepo: 'https://github.com/salistar/sally-tarot',
    iconSrc: '/games/tarot.png',
    gradient: 'linear-gradient(135deg, #EC4899, #831843)',
  },

  // ════════════════════════════════════════════════════════════════════
  // 7. SCOPA (Italie) — bientôt
  // ════════════════════════════════════════════════════════════════════
  {
    slug: 'scopa',
    name: 'Sally Scopa',
    tagline: {
      fr: 'Capture italienne — 40 cartes, balayage parfait',
      en: 'Italian capture game — 40 cards, perfect sweep',
      ar: 'لعبة التقاط إيطالية — 40 ورقة، كنس مثالي',
    },
    players: '2-4',
    cardSystem: 'es',
    rules: {
      fr: "La Scopa se joue à 2 ou 4 avec 40 cartes italiennes (Spade, Coppe, Bastoni, Denari). 3 cartes en main + 4 au centre. À son tour : (1) si une carte du centre a la même valeur que la nôtre → on les capture, (2) sinon si des cartes du centre additionnent la valeur de la nôtre → on capture l'ensemble, (3) sinon on défausse au centre. Capturer toutes les cartes du centre d'un coup = « Scopa » (+1). Fin de partie : 1 pt pour le plus grand nombre de cartes, 1 pt pour le plus de Denari, 1 pt pour le Sept de Denari (« Settebello »), 1 pt pour la « Primiera » (meilleure combinaison de 4 sevens).",
      en: 'Scopa is played by 2 or 4 with 40 Italian-suited cards (Spade, Coppe, Bastoni, Denari). 3 cards in hand + 4 in the middle. On your turn: (1) if a middle card matches your card → capture both, (2) else if middle cards sum to your value → capture them all, (3) else discard your card. Capturing all middle cards at once = "Scopa" (+1). End of game: 1 pt for most cards captured, 1 pt for most Denari, 1 pt for the Seven of Denari ("Settebello"), 1 pt for the "Primiera" (best 4-seven combination).',
      ar: "تلعب السكوبا بـ 2 أو 4 لاعبين بـ 40 ورقة إيطالية (Spade، Coppe، Bastoni، Denari). 3 أوراق في اليد + 4 في الوسط. في دورك: (1) إذا تطابقت ورقة وسط مع ورقتك → التقطهما، (2) أو إذا جمعت أوراق الوسط قيمة ورقتك → التقطها كلها، (3) وإلا ارمِ ورقتك. التقاط كل أوراق الوسط دفعة واحدة = « سكوبا » (+1). نهاية اللعبة: نقطة لأكثر التقاط، نقطة لأكثر Denari، نقطة لـ « Settebello »، نقطة لـ « Primiera ».",
    },
    available: true,
    apkUrl: 'https://github.com/salistar/sally-scopa/releases/download/latest/app-debug.apk',
    releasePage: 'https://github.com/salistar/sally-scopa/releases/tag/latest',
    githubRepo: 'https://github.com/salistar/sally-scopa',
    iconSrc: '/games/scopa.png',
    gradient: 'linear-gradient(135deg, #F59E0B, #B45309)',
  },

  // ════════════════════════════════════════════════════════════════════
  // 8. OKEY (Turquie) — bientôt
  // ════════════════════════════════════════════════════════════════════
  {
    slug: 'okey',
    name: 'Sally Okey',
    tagline: {
      fr: 'Rami turc avec 106 tuiles colorées',
      en: 'Turkish rummy with 106 colored tiles',
      ar: 'رامي تركي بـ 106 قطعة ملونة',
    },
    players: '4',
    cardSystem: 'fr',
    rules: {
      fr: "L'Okey se joue à 4 joueurs avec 106 tuiles : 4 couleurs (rouge, jaune, noir, bleu) × 13 valeurs × 2 exemplaires + 2 « OKEY » (jokers). Chaque joueur reçoit 14 tuiles, le donneur en a 15. La tuile « indicator » détermine la tuile « gösterge » (joker). On pioche puis on défausse jusqu'à pouvoir aligner ses tuiles en groupes valides : suites (3 tuiles+ même couleur valeurs consécutives) ou brelans (3 tuiles+ même valeur couleurs différentes). Le premier à finir crie « Okey ! » et gagne. Bonus +2 si l'on finit avec un Okey caché.",
      en: 'Okey is played by 4 with 106 tiles: 4 colors (red, yellow, black, blue) × 13 values × 2 copies + 2 "OKEY" (jokers). Each player gets 14 tiles, dealer 15. The "indicator" tile determines the "gösterge" (joker). Draw-discard until you can arrange all your tiles in valid groups: runs (3+ same-color consecutive values) or sets (3+ same-value different-color). First to empty their rack shouts "Okey!" and wins. +2 bonus if you finish with a hidden Okey.',
      ar: "تلعب الأوكي بأربعة لاعبين بـ 106 قطعة: 4 ألوان (أحمر، أصفر، أسود، أزرق) × 13 قيمة × نسختان + 2 « OKEY » (جوكر). كل لاعب يأخذ 14 قطعة، الموزع 15. القطعة « indicator » تحدد القطعة « gösterge » (الجوكر). تسحب وترمي حتى تستطيع تنظيم قطعك في مجموعات صحيحة: تتابعات (3+ نفس اللون قيم متتالية) أو مجموعات (3+ نفس القيمة ألوان مختلفة). أول من ينهي يصرخ « Okey! » ويفوز. مكافأة +2 إذا انتهيت بـ Okey مخفي.",
    },
    available: true,
    apkUrl: 'https://github.com/salistar/sally-okey/releases/download/latest/app-debug.apk',
    releasePage: 'https://github.com/salistar/sally-okey/releases/tag/latest',
    githubRepo: 'https://github.com/salistar/sally-okey',
    iconSrc: '/games/okey.png',
    gradient: 'linear-gradient(135deg, #06B6D4, #0E7490)',
  },

  // ════════════════════════════════════════════════════════════════════
  // 9. CONCENTRATION (Memory) — bientôt
  // ════════════════════════════════════════════════════════════════════
  {
    slug: 'concentration',
    name: 'Sally Concentration',
    tagline: {
      fr: 'Jeu de mémoire — trouvez les paires',
      en: 'Memory game — find the pairs',
      ar: 'لعبة الذاكرة — اعثر على الأزواج',
    },
    players: '1-4',
    cardSystem: 'fr',
    rules: {
      fr: "Toutes les cartes sont retournées face cachée sur une grille (24, 36 ou 52 cartes selon la difficulté). À son tour, chaque joueur retourne deux cartes : si elles forment une paire (même valeur), il les garde et rejoue ; sinon il les remet face cachée à leur emplacement initial. Le but est de mémoriser les emplacements visités. Gagne celui qui a la plus grande pile de paires à la fin. Mode chronométré disponible (solo).",
      en: 'All cards are placed face down on a grid (24, 36 or 52 cards depending on difficulty). On each turn, a player flips two cards: if they match (same value), the player keeps them and plays again; otherwise they are returned face-down to their original positions. The goal is to memorize visited locations. The player with the most pairs at the end wins. Timed mode available (solo).',
      ar: "توضع كل الأوراق مقلوبة في شبكة (24، 36 أو 52 ورقة حسب الصعوبة). في دوره، كل لاعب يقلب ورقتين: إذا شكلتا زوجاً (نفس القيمة) يحتفظ بهما ويلعب مرة أخرى؛ وإلا يعيدهما مقلوبتين في مكانهما الأصلي. الهدف حفظ الأماكن. يفوز من جمع أكبر عدد من الأزواج في النهاية. الوضع المؤقت متاح (فردي).",
    },
    available: true,
    apkUrl: 'https://github.com/salistar/sally-concentration/releases/download/latest/app-debug.apk',
    releasePage: 'https://github.com/salistar/sally-concentration/releases/tag/latest',
    githubRepo: 'https://github.com/salistar/sally-concentration',
    iconSrc: '/games/concentration.png',
    gradient: 'linear-gradient(135deg, #84CC16, #15803D)',
  },

  // ════════════════════════════════════════════════════════════════════
  // 10. QUI-EST-CE? — bientôt
  // ════════════════════════════════════════════════════════════════════
  {
    slug: 'quiestce',
    name: 'Sally Qui-est-ce?',
    tagline: {
      fr: 'Déduction par oui/non — devinez le personnage',
      en: 'Yes/no deduction — guess the character',
      ar: 'استنتاج بنعم/لا — احزر الشخصية',
    },
    players: '2',
    cardSystem: 'fr',
    rules: {
      fr: "Chaque joueur reçoit une grille de 24 personnages identiques et choisit secrètement un personnage cible parmi eux. À tour de rôle, on pose une question fermée (oui/non) sur l'apparence (« A-t-il une barbe ? », « Porte-t-il des lunettes ? »). En fonction de la réponse, on élimine les personnages qui ne correspondent pas. Le premier à deviner le personnage de l'adversaire gagne. Mode duel ou tournoi.",
      en: "Each player gets a grid of 24 identical characters and secretly picks one target. In turn, you ask a closed (yes/no) question about appearance (\"Does he have a beard?\", \"Does he wear glasses?\"). Based on the answer, you eliminate non-matching characters. First to guess the opponent's character wins. Duel or tournament mode.",
      ar: "كل لاعب يأخذ شبكة من 24 شخصية متطابقة ويختار سراً واحدة منها. بالدور، تطرح سؤالاً مغلقاً (نعم/لا) عن المظهر (« هل لديه لحية؟ »، « هل يرتدي نظارات؟ »). بناء على الإجابة، تستبعد الشخصيات التي لا تتطابق. أول من يحزر شخصية الخصم يفوز. وضع المبارزة أو البطولة.",
    },
    available: true,
    apkUrl: 'https://github.com/salistar/sally-quiestce/releases/download/latest/app-debug.apk',
    releasePage: 'https://github.com/salistar/sally-quiestce/releases/tag/latest',
    githubRepo: 'https://github.com/salistar/sally-quiestce',
    iconSrc: '/games/quiestce.png',
    gradient: 'linear-gradient(135deg, #6366F1, #312E81)',
  },

  // ════════════════════════════════════════════════════════════════════
  // 11. KANTCOPY — bientôt (jeu original SallyStar)
  // ════════════════════════════════════════════════════════════════════
  {
    slug: 'kantcopy',
    name: 'Sally Kantcopy',
    tagline: {
      fr: "Jeu de stratégie original — composer & contrer",
      en: 'Original strategy game — compose & counter',
      ar: 'لعبة استراتيجية أصلية — تكوين ومضاد',
    },
    players: '2-4',
    cardSystem: 'fr',
    rules: {
      fr: "Le Kantcopy est un jeu de stratégie original créé par SallyStar. Chaque joueur reçoit 7 cartes et doit construire des combinaisons (suites, paires, brelans) tout en bloquant l'adversaire. Une carte « Kant » spéciale permet de copier la combinaison d'un adversaire. Les actions sont publiques (chaque coup est annoncé) mais les mains sont cachées. Le premier à poser toutes ses cartes en combinaisons valides gagne. Le mode tournoi offre des récompenses cosmétiques.",
      en: 'Kantcopy is an original strategy game created by SallyStar. Each player gets 7 cards and must build combinations (runs, pairs, three-of-a-kind) while blocking opponents. A special "Kant" card lets you copy an opponent\'s combination. Actions are public (each move is announced) but hands stay hidden. First to lay all cards in valid combinations wins. Tournament mode offers cosmetic rewards.',
      ar: "Kantcopy لعبة استراتيجية أصلية من إنتاج SallyStar. كل لاعب يأخذ 7 أوراق ويبني تركيبات (تتابعات، أزواج، ثلاثيات) مع عرقلة الخصم. ورقة « Kant » خاصة تسمح بنسخ تركيبة الخصم. الأفعال علنية (كل حركة تُعلن) لكن الأيادي مخفية. أول من يضع كل أوراقه في تركيبات صحيحة يفوز. وضع البطولة يقدم مكافآت تجميلية.",
    },
    available: true,
    apkUrl: 'https://github.com/salistar/sally-kantcopy/releases/download/latest/app-debug.apk',
    releasePage: 'https://github.com/salistar/sally-kantcopy/releases/tag/latest',
    githubRepo: 'https://github.com/salistar/sally-kantcopy',
    iconSrc: '/games/kantcopy.png',
    gradient: 'linear-gradient(135deg, #FCD34D, #F59E0B)',
  },
];

export function getGame(slug: string): Game | undefined {
  return GAMES.find((g) => g.slug === slug);
}
