// ---------------------------------------------------------------------------
// Achievements System – 50 achievements covering all SallyCards games
// Fully localised in 5 languages: en, fr, ar, darija, es
// ---------------------------------------------------------------------------

export type AchievementCategory =
  | 'general'
  | 'ronda'
  | 'kdoub'
  | 'belote'
  | 'poker'
  | 'social'
  | 'solitaire'
  | 'scopa'
  | 'trix'
  | 'tarneeb'
  | 'hand';

export interface AchievementDef {
  id: string;
  name: Record<string, string>;
  description: Record<string, string>;
  icon: string;
  category: AchievementCategory;
  gameType?: string;
  maxProgress: number;
  rewardCoins: number;
}

// ---- 50 Achievements -------------------------------------------------------

export const ACHIEVEMENTS: AchievementDef[] = [
  // ===================== GENERAL (1-17) =====================
  {
    id: 'first_game',
    name: { en: 'First Steps', fr: 'Premiers Pas', ar: '\u062E\u0637\u0648\u0627\u062A \u0623\u0648\u0644\u0649', darija: '\u0623\u0648\u0644 \u062E\u0637\u0648\u0629', es: 'Primeros Pasos' },
    description: { en: 'Play your first game', fr: 'Joue ta premi\u00E8re partie', ar: '\u0627\u0644\u0639\u0628 \u0623\u0648\u0644 \u0644\u0639\u0628\u0629', darija: '\u0644\u0639\u0628 \u0623\u0648\u0644 \u0644\u0639\u0628\u0629', es: 'Juega tu primera partida' },
    icon: 'trophy',
    category: 'general',
    maxProgress: 1,
    rewardCoins: 50,
  },
  {
    id: 'games_10',
    name: { en: 'Regular Player', fr: 'Joueur R\u00E9gulier', ar: '\u0644\u0627\u0639\u0628 \u0645\u0646\u062A\u0638\u0645', darija: '\u0644\u0627\u0639\u0628 \u062F\u0627\u064A\u0645', es: 'Jugador Habitual' },
    description: { en: 'Play 10 games', fr: 'Joue 10 parties', ar: '\u0627\u0644\u0639\u0628 10 \u0623\u0644\u0639\u0627\u0628', darija: '\u0644\u0639\u0628 10 \u0644\u0639\u0628\u0627\u062A', es: 'Juega 10 partidas' },
    icon: 'star',
    category: 'general',
    maxProgress: 10,
    rewardCoins: 100,
  },
  {
    id: 'games_50',
    name: { en: 'Dedicated', fr: 'D\u00E9vou\u00E9', ar: '\u0645\u062A\u0641\u0627\u0646\u064A', darija: '\u0645\u062A\u0641\u0627\u0646\u064A', es: 'Dedicado' },
    description: { en: 'Play 50 games', fr: 'Joue 50 parties', ar: '\u0627\u0644\u0639\u0628 50 \u0644\u0639\u0628\u0629', darija: '\u0644\u0639\u0628 50 \u0644\u0639\u0628\u0629', es: 'Juega 50 partidas' },
    icon: 'star',
    category: 'general',
    maxProgress: 50,
    rewardCoins: 300,
  },
  {
    id: 'games_100',
    name: { en: 'Veteran', fr: 'V\u00E9t\u00E9ran', ar: '\u0645\u062D\u062A\u0631\u0641', darija: '\u0645\u062D\u062A\u0631\u0641', es: 'Veterano' },
    description: { en: 'Play 100 games', fr: 'Joue 100 parties', ar: '\u0627\u0644\u0639\u0628 100 \u0644\u0639\u0628\u0629', darija: '\u0644\u0639\u0628 100 \u0644\u0639\u0628\u0629', es: 'Juega 100 partidas' },
    icon: 'medal',
    category: 'general',
    maxProgress: 100,
    rewardCoins: 500,
  },
  {
    id: 'games_500',
    name: { en: 'Legend', fr: 'L\u00E9gende', ar: '\u0623\u0633\u0637\u0648\u0631\u0629', darija: '\u0623\u0633\u0637\u0648\u0631\u0629', es: 'Leyenda' },
    description: { en: 'Play 500 games', fr: 'Joue 500 parties', ar: '\u0627\u0644\u0639\u0628 500 \u0644\u0639\u0628\u0629', darija: '\u0644\u0639\u0628 500 \u0644\u0639\u0628\u0629', es: 'Juega 500 partidas' },
    icon: 'crown',
    category: 'general',
    maxProgress: 500,
    rewardCoins: 1000,
  },
  {
    id: 'win_streak_3',
    name: { en: 'On Fire', fr: 'En Feu', ar: '\u0645\u0634\u062A\u0639\u0644', darija: '\u0634\u0627\u0639\u0644', es: 'En Racha' },
    description: { en: 'Win 3 games in a row', fr: 'Gagne 3 parties de suite', ar: '\u0627\u0631\u0628\u062D 3 \u0623\u0644\u0639\u0627\u0628 \u0645\u062A\u062A\u0627\u0644\u064A\u0629', darija: '\u0631\u0628\u062D 3 \u0644\u0639\u0628\u0627\u062A \u0648\u0631\u0627 \u0628\u0639\u0636', es: 'Gana 3 partidas seguidas' },
    icon: 'flame',
    category: 'general',
    maxProgress: 3,
    rewardCoins: 100,
  },
  {
    id: 'win_streak_5',
    name: { en: 'Hot Streak', fr: 'S\u00E9rie Chaude', ar: '\u0633\u0644\u0633\u0644\u0629 \u062D\u0627\u0631\u0629', darija: '\u0633\u0644\u0633\u0644\u0629 \u0633\u062E\u0648\u0646\u0629', es: 'Racha Caliente' },
    description: { en: 'Win 5 games in a row', fr: 'Gagne 5 parties de suite', ar: '\u0627\u0631\u0628\u062D 5 \u0623\u0644\u0639\u0627\u0628 \u0645\u062A\u062A\u0627\u0644\u064A\u0629', darija: '\u0631\u0628\u062D 5 \u0644\u0639\u0628\u0627\u062A \u0648\u0631\u0627 \u0628\u0639\u0636', es: 'Gana 5 partidas seguidas' },
    icon: 'flame',
    category: 'general',
    maxProgress: 5,
    rewardCoins: 200,
  },
  {
    id: 'win_streak_10',
    name: { en: 'Unstoppable', fr: 'Inarr\u00EAtable', ar: '\u0644\u0627 \u064A\u0642\u0647\u0631', darija: '\u0645\u0627 \u0643\u064A\u062A\u0648\u0642\u0641\u0634', es: 'Imparable' },
    description: { en: 'Win 10 games in a row', fr: 'Gagne 10 parties de suite', ar: '\u0627\u0631\u0628\u062D 10 \u0623\u0644\u0639\u0627\u0628 \u0645\u062A\u062A\u0627\u0644\u064A\u0629', darija: '\u0631\u0628\u062D 10 \u0644\u0639\u0628\u0627\u062A \u0648\u0631\u0627 \u0628\u0639\u0636', es: 'Gana 10 partidas seguidas' },
    icon: 'flame',
    category: 'general',
    maxProgress: 10,
    rewardCoins: 500,
  },
  {
    id: 'play_all_games',
    name: { en: 'Explorer', fr: 'Explorateur', ar: '\u0645\u0633\u062A\u0643\u0634\u0641', darija: '\u0645\u0633\u062A\u0643\u0634\u0641', es: 'Explorador' },
    description: { en: 'Play every game type at least once', fr: 'Joue \u00E0 chaque type de jeu au moins une fois', ar: '\u0627\u0644\u0639\u0628 \u0643\u0644 \u0646\u0648\u0639 \u0645\u0646 \u0627\u0644\u0623\u0644\u0639\u0627\u0628 \u0645\u0631\u0629 \u0648\u0627\u062D\u062F\u0629', darija: '\u0644\u0639\u0628 \u0643\u0644 \u0646\u0648\u0639 \u062F\u064A\u0627\u0644 \u0644\u0639\u0628\u0629 \u0645\u0631\u0629', es: 'Juega cada tipo de juego al menos una vez' },
    icon: 'compass',
    category: 'general',
    maxProgress: 10,
    rewardCoins: 300,
  },
  {
    id: 'multilingual',
    name: { en: 'Polyglot', fr: 'Polyglotte', ar: '\u0645\u062A\u0639\u062F\u062F \u0627\u0644\u0644\u063A\u0627\u062A', darija: '\u0643\u064A\u0647\u0636\u0631 \u0628\u0632\u0627\u0641 \u062F \u0644\u063A\u0627\u062A', es: 'Pol\u00EDglota' },
    description: { en: 'Play in 3 different languages', fr: 'Joue dans 3 langues diff\u00E9rentes', ar: '\u0627\u0644\u0639\u0628 \u0628 3 \u0644\u063A\u0627\u062A \u0645\u062E\u062A\u0644\u0641\u0629', darija: '\u0644\u0639\u0628 \u0628 3 \u0644\u063A\u0627\u062A \u0645\u062E\u062A\u0627\u0644\u0641\u064A\u0646', es: 'Juega en 3 idiomas diferentes' },
    icon: 'globe',
    category: 'general',
    maxProgress: 3,
    rewardCoins: 150,
  },
  {
    id: 'first_friend',
    name: { en: 'Social Butterfly', fr: 'Papillon Social', ar: '\u0641\u0631\u0627\u0634\u0629 \u0627\u062C\u062A\u0645\u0627\u0639\u064A\u0629', darija: '\u0645\u0639\u0634\u0631\u064A', es: 'Mariposa Social' },
    description: { en: 'Add your first friend', fr: 'Ajoute ton premier ami', ar: '\u0623\u0636\u0641 \u0623\u0648\u0644 \u0635\u062F\u064A\u0642', darija: '\u0632\u064A\u062F \u0623\u0648\u0644 \u0635\u0627\u062D\u0628', es: 'A\u00F1ade tu primer amigo' },
    icon: 'users',
    category: 'social',
    maxProgress: 1,
    rewardCoins: 50,
  },
  {
    id: 'friends_10',
    name: { en: 'Popular', fr: 'Populaire', ar: '\u0645\u0634\u0647\u0648\u0631', darija: '\u0645\u0639\u0631\u0648\u0641', es: 'Popular' },
    description: { en: 'Have 10 friends', fr: 'Aie 10 amis', ar: '\u0627\u062D\u0635\u0644 \u0639\u0644\u0649 10 \u0623\u0635\u062F\u0642\u0627\u0621', darija: '\u062C\u0645\u0639 10 \u062F \u0644\u0635\u062D\u0627\u0628', es: 'Ten 10 amigos' },
    icon: 'users',
    category: 'social',
    maxProgress: 10,
    rewardCoins: 200,
  },
  {
    id: 'first_tournament',
    name: { en: 'Contender', fr: 'Concurrent', ar: '\u0645\u062A\u0633\u0627\u0628\u0642', darija: '\u0645\u062A\u0633\u0627\u0628\u0642', es: 'Contendiente' },
    description: { en: 'Enter your first tournament', fr: 'Participe \u00E0 ton premier tournoi', ar: '\u0627\u062F\u062E\u0644 \u0623\u0648\u0644 \u0628\u0637\u0648\u0644\u0629', darija: '\u062F\u062E\u0644 \u0623\u0648\u0644 \u062A\u0648\u0631\u0646\u0648\u0627', es: 'Entra en tu primer torneo' },
    icon: 'award',
    category: 'social',
    maxProgress: 1,
    rewardCoins: 100,
  },
  {
    id: 'tournament_winner',
    name: { en: 'Champion', fr: 'Champion', ar: '\u0628\u0637\u0644', darija: '\u0634\u0645\u0628\u064A\u0648\u0646', es: 'Campe\u00F3n' },
    description: { en: 'Win a tournament', fr: 'Gagne un tournoi', ar: '\u0627\u0631\u0628\u062D \u0628\u0637\u0648\u0644\u0629', darija: '\u0631\u0628\u062D \u062A\u0648\u0631\u0646\u0648\u0627', es: 'Gana un torneo' },
    icon: 'crown',
    category: 'social',
    maxProgress: 1,
    rewardCoins: 500,
  },
  {
    id: 'daily_7',
    name: { en: 'Week Warrior', fr: 'Guerrier de la Semaine', ar: '\u0645\u062D\u0627\u0631\u0628 \u0627\u0644\u0623\u0633\u0628\u0648\u0639', darija: '\u0645\u062D\u0627\u0631\u0628 \u0627\u0644\u0633\u064A\u0645\u0627\u0646\u0629', es: 'Guerrero Semanal' },
    description: { en: 'Complete daily challenges 7 days in a row', fr: 'Compl\u00E8te les d\u00E9fis quotidiens 7 jours de suite', ar: '\u0623\u0643\u0645\u0644 \u0627\u0644\u062A\u062D\u062F\u064A\u0627\u062A \u0627\u0644\u064A\u0648\u0645\u064A\u0629 7 \u0623\u064A\u0627\u0645 \u0645\u062A\u062A\u0627\u0644\u064A\u0629', darija: '\u0643\u0645\u0644 \u0627\u0644\u062A\u062D\u062F\u064A\u0627\u062A \u062F\u064A\u0627\u0644 \u0643\u0644 \u064A\u0648\u0645 7 \u064A\u0627\u0645\u0627\u062A', es: 'Completa desaf\u00EDos diarios 7 d\u00EDas seguidos' },
    icon: 'calendar',
    category: 'general',
    maxProgress: 7,
    rewardCoins: 300,
  },
  {
    id: 'coins_hoarder',
    name: { en: 'Coin Hoarder', fr: 'Collectionneur de Pi\u00E8ces', ar: '\u062C\u0627\u0645\u0639 \u0627\u0644\u0639\u0645\u0644\u0627\u062A', darija: '\u062C\u0627\u0645\u0639 \u0644\u0641\u0644\u0648\u0633', es: 'Acumulador de Monedas' },
    description: { en: 'Accumulate 5000 Sally Coins', fr: 'Accumule 5000 Sally Coins', ar: '\u0627\u062C\u0645\u0639 5000 \u0639\u0645\u0644\u0629 Sally', darija: '\u062C\u0645\u0639 5000 Sally Coin', es: 'Acumula 5000 Sally Coins' },
    icon: 'dollar-sign',
    category: 'general',
    maxProgress: 5000,
    rewardCoins: 200,
  },
  {
    id: 'night_owl',
    name: { en: 'Night Owl', fr: 'Oiseau de Nuit', ar: '\u0628\u0648\u0645\u0629 \u0627\u0644\u0644\u064A\u0644', darija: '\u0628\u0648\u0645\u0629 \u062F \u0644\u064A\u0644', es: 'B\u00FAho Nocturno' },
    description: { en: 'Play 10 games between midnight and 5 AM', fr: 'Joue 10 parties entre minuit et 5h du matin', ar: '\u0627\u0644\u0639\u0628 10 \u0623\u0644\u0639\u0627\u0628 \u0628\u064A\u0646 \u0645\u0646\u062A\u0635\u0641 \u0627\u0644\u0644\u064A\u0644 \u0648 5 \u0635\u0628\u0627\u062D\u0627', darija: '\u0644\u0639\u0628 10 \u0644\u0639\u0628\u0627\u062A \u0628\u064A\u0646 \u0646\u0635 \u0627\u0644\u0644\u064A\u0644 \u0648 5 \u062F \u0627\u0644\u0635\u0628\u0627\u062D', es: 'Juega 10 partidas entre medianoche y las 5 AM' },
    icon: 'moon',
    category: 'general',
    maxProgress: 10,
    rewardCoins: 150,
  },

  // ===================== RONDA (18-22) =====================
  {
    id: 'ronda_first_ronda',
    name: { en: 'First Ronda!', fr: 'Premi\u00E8re Ronda!', ar: '!\u0623\u0648\u0644 \u0631\u0646\u062F\u0629', darija: '!\u0623\u0648\u0644 \u0631\u0646\u062F\u0629', es: '\u00A1Primera Ronda!' },
    description: { en: 'Call Ronda for the first time', fr: 'Appelle Ronda pour la premi\u00E8re fois', ar: '\u0627\u0639\u0644\u0646 \u0631\u0646\u062F\u0629 \u0644\u0623\u0648\u0644 \u0645\u0631\u0629', darija: '\u0639\u064A\u0637 \u0631\u0646\u062F\u0629 \u0644\u0623\u0648\u0644 \u0645\u0631\u0629', es: 'Anuncia Ronda por primera vez' },
    icon: 'zap',
    category: 'ronda',
    gameType: 'RONDA',
    maxProgress: 1,
    rewardCoins: 50,
  },
  {
    id: 'ronda_tringa',
    name: { en: 'Tringa Master', fr: 'Ma\u00EEtre Tringa', ar: '\u0645\u0639\u0644\u0645 \u0627\u0644\u062A\u0631\u064A\u0646\u0643\u0627', darija: '\u0645\u0639\u0644\u0645 \u0627\u0644\u062A\u0631\u064A\u0646\u0643\u0627', es: 'Maestro Tringa' },
    description: { en: 'Score a Tringa', fr: 'Marque une Tringa', ar: '\u0633\u062C\u0644 \u062A\u0631\u064A\u0646\u0643\u0627', darija: '\u062F\u064A\u0631 \u062A\u0631\u064A\u0646\u0643\u0627', es: 'Anota una Tringa' },
    icon: 'zap',
    category: 'ronda',
    gameType: 'RONDA',
    maxProgress: 1,
    rewardCoins: 200,
  },
  {
    id: 'ronda_missa_5',
    name: { en: 'Sweep Expert', fr: 'Expert du Balayage', ar: '\u062E\u0628\u064A\u0631 \u0627\u0644\u0645\u0633\u062D', darija: '\u062E\u0628\u064A\u0631 \u0627\u0644\u0645\u064A\u0633\u0627', es: 'Experto en Barrer' },
    description: { en: 'Perform 5 table sweeps (Missa)', fr: 'Effectue 5 balayages de table (Missa)', ar: '\u0627\u0639\u0645\u0644 5 \u0645\u0633\u062D\u0627\u062A \u0637\u0627\u0648\u0644\u0629', darija: '\u062F\u064A\u0631 5 \u0645\u064A\u0633\u0627\u062A', es: 'Realiza 5 barridas de mesa (Missa)' },
    icon: 'wind',
    category: 'ronda',
    gameType: 'RONDA',
    maxProgress: 5,
    rewardCoins: 300,
  },
  {
    id: 'ronda_wins_20',
    name: { en: 'Ronda Regular', fr: 'Habitu\u00E9 de Ronda', ar: '\u0644\u0627\u0639\u0628 \u0631\u0646\u062F\u0629 \u0645\u062D\u062A\u0631\u0641', darija: '\u0644\u0627\u0639\u0628 \u0631\u0646\u062F\u0629 \u062F\u0627\u064A\u0645', es: 'Habitual de Ronda' },
    description: { en: 'Win 20 Ronda games', fr: 'Gagne 20 parties de Ronda', ar: '\u0627\u0631\u0628\u062D 20 \u0644\u0639\u0628\u0629 \u0631\u0646\u062F\u0629', darija: '\u0631\u0628\u062D 20 \u0644\u0639\u0628\u0629 \u062F \u0631\u0646\u062F\u0629', es: 'Gana 20 partidas de Ronda' },
    icon: 'target',
    category: 'ronda',
    gameType: 'RONDA',
    maxProgress: 20,
    rewardCoins: 300,
  },
  {
    id: 'ronda_perfect',
    name: { en: 'Perfect Ronda', fr: 'Ronda Parfaite', ar: '\u0631\u0646\u062F\u0629 \u0645\u062B\u0627\u0644\u064A\u0629', darija: '\u0631\u0646\u062F\u0629 \u0643\u0627\u0645\u0644\u0629', es: 'Ronda Perfecta' },
    description: { en: 'Win a Ronda game without opponent scoring', fr: 'Gagne une partie de Ronda sans que l\'adversaire marque', ar: '\u0627\u0631\u0628\u062D \u0644\u0639\u0628\u0629 \u0631\u0646\u062F\u0629 \u0628\u062F\u0648\u0646 \u0623\u0646 \u064A\u0633\u062C\u0644 \u0627\u0644\u062E\u0635\u0645', darija: '\u0631\u0628\u062D \u0631\u0646\u062F\u0629 \u0628\u0644\u0627 \u0645\u0627 \u064A\u0633\u062C\u0644 \u0627\u0644\u062E\u0635\u0645', es: 'Gana una Ronda sin que el rival puntue' },
    icon: 'shield',
    category: 'ronda',
    gameType: 'RONDA',
    maxProgress: 1,
    rewardCoins: 400,
  },

  // ===================== KDOUB (23-27) =====================
  {
    id: 'kdoub_first_win',
    name: { en: 'Kdoub Beginner', fr: 'D\u00E9butant Kdoub', ar: '\u0645\u0628\u062A\u062F\u0626 \u0643\u062F\u0648\u0628', darija: '\u0645\u0628\u062A\u062F\u0626 \u0643\u062F\u0648\u0628', es: 'Principiante Kdoub' },
    description: { en: 'Win your first Kdoub game', fr: 'Gagne ta premi\u00E8re partie de Kdoub', ar: '\u0627\u0631\u0628\u062D \u0623\u0648\u0644 \u0644\u0639\u0628\u0629 \u0643\u062F\u0648\u0628', darija: '\u0631\u0628\u062D \u0623\u0648\u0644 \u0644\u0639\u0628\u0629 \u062F \u0643\u062F\u0648\u0628', es: 'Gana tu primera partida de Kdoub' },
    icon: 'star',
    category: 'kdoub',
    gameType: 'KDOUB',
    maxProgress: 1,
    rewardCoins: 50,
  },
  {
    id: 'kdoub_slam',
    name: { en: 'Kdoub Slam', fr: 'Slam Kdoub', ar: '\u0633\u0644\u0627\u0645 \u0643\u062F\u0648\u0628', darija: '\u0633\u0644\u0627\u0645 \u0643\u062F\u0648\u0628', es: 'Slam Kdoub' },
    description: { en: 'Win with a slam (all tricks)', fr: 'Gagne avec un slam (tous les plis)', ar: '\u0627\u0631\u0628\u062D \u0628\u0633\u0644\u0627\u0645 (\u0643\u0644 \u0627\u0644\u0623\u062F\u0648\u0627\u0631)', darija: '\u0631\u0628\u062D \u0628\u0633\u0644\u0627\u0645 (\u0643\u0627\u0639 \u0644\u0623\u062F\u0648\u0627\u0631)', es: 'Gana con un slam (todas las bazas)' },
    icon: 'zap',
    category: 'kdoub',
    gameType: 'KDOUB',
    maxProgress: 1,
    rewardCoins: 300,
  },
  {
    id: 'kdoub_wins_20',
    name: { en: 'Kdoub Veteran', fr: 'V\u00E9t\u00E9ran Kdoub', ar: '\u0645\u062D\u062A\u0631\u0641 \u0643\u062F\u0648\u0628', darija: '\u0645\u062D\u062A\u0631\u0641 \u0643\u062F\u0648\u0628', es: 'Veterano Kdoub' },
    description: { en: 'Win 20 Kdoub games', fr: 'Gagne 20 parties de Kdoub', ar: '\u0627\u0631\u0628\u062D 20 \u0644\u0639\u0628\u0629 \u0643\u062F\u0648\u0628', darija: '\u0631\u0628\u062D 20 \u0644\u0639\u0628\u0629 \u062F \u0643\u062F\u0648\u0628', es: 'Gana 20 partidas de Kdoub' },
    icon: 'target',
    category: 'kdoub',
    gameType: 'KDOUB',
    maxProgress: 20,
    rewardCoins: 300,
  },
  {
    id: 'kdoub_trump_master',
    name: { en: 'Trump Master', fr: 'Ma\u00EEtre de l\'Atout', ar: '\u0645\u0639\u0644\u0645 \u0627\u0644\u0623\u062A\u0648', darija: '\u0645\u0639\u0644\u0645 \u0644\u0627\u062A\u0648', es: 'Maestro del Triunfo' },
    description: { en: 'Win 10 tricks using trumps', fr: 'Gagne 10 plis avec des atouts', ar: '\u0627\u0631\u0628\u062D 10 \u0623\u062F\u0648\u0627\u0631 \u0628\u0627\u0644\u0623\u062A\u0648', darija: '\u0631\u0628\u062D 10 \u0623\u062F\u0648\u0627\u0631 \u0628\u0644\u0627\u062A\u0648', es: 'Gana 10 bazas usando triunfos' },
    icon: 'crown',
    category: 'kdoub',
    gameType: 'KDOUB',
    maxProgress: 10,
    rewardCoins: 200,
  },
  {
    id: 'kdoub_comeback',
    name: { en: 'Kdoub Comeback', fr: 'Retour Kdoub', ar: '\u0639\u0648\u062F\u0629 \u0643\u062F\u0648\u0628', darija: '\u0631\u062C\u0639\u0629 \u0643\u062F\u0648\u0628', es: 'Remontada Kdoub' },
    description: { en: 'Win a game after being behind by 50+ points', fr: 'Gagne une partie apr\u00E8s avoir eu 50+ points de retard', ar: '\u0627\u0631\u0628\u062D \u0628\u0639\u062F \u0627\u0644\u062A\u0623\u062E\u0631 \u0628 50 \u0646\u0642\u0637\u0629', darija: '\u0631\u0628\u062D \u0645\u0646 \u0628\u0639\u062F \u0645\u0627 \u0643\u0646\u062A\u064A \u062E\u0627\u0633\u0631 \u0628 50 \u0646\u0642\u0637\u0629', es: 'Gana despu\u00E9s de ir 50+ puntos abajo' },
    icon: 'refresh-cw',
    category: 'kdoub',
    gameType: 'KDOUB',
    maxProgress: 1,
    rewardCoins: 400,
  },

  // ===================== BELOTE (28-32) =====================
  {
    id: 'belote_first_win',
    name: { en: 'Belote Beginner', fr: 'D\u00E9butant Belote', ar: '\u0645\u0628\u062A\u062F\u0626 \u0628\u0644\u0648\u062A', darija: '\u0645\u0628\u062A\u062F\u0626 \u0628\u0644\u0648\u062A', es: 'Principiante Belote' },
    description: { en: 'Win your first Belote game', fr: 'Gagne ta premi\u00E8re partie de Belote', ar: '\u0627\u0631\u0628\u062D \u0623\u0648\u0644 \u0644\u0639\u0628\u0629 \u0628\u0644\u0648\u062A', darija: '\u0631\u0628\u062D \u0623\u0648\u0644 \u0644\u0639\u0628\u0629 \u062F \u0628\u0644\u0648\u062A', es: 'Gana tu primera partida de Belote' },
    icon: 'star',
    category: 'belote',
    gameType: 'BELOTE',
    maxProgress: 1,
    rewardCoins: 50,
  },
  {
    id: 'belote_rebelote',
    name: { en: 'Belote & Rebelote', fr: 'Belote et Rebelote', ar: '\u0628\u0644\u0648\u062A \u0648 \u0631\u064A\u0628\u0644\u0648\u062A', darija: '\u0628\u0644\u0648\u062A \u0648 \u0631\u064A\u0628\u0644\u0648\u062A', es: 'Belote y Rebelote' },
    description: { en: 'Declare Belote-Rebelote', fr: 'D\u00E9clare Belote-Rebelote', ar: '\u0627\u0639\u0644\u0646 \u0628\u0644\u0648\u062A-\u0631\u064A\u0628\u0644\u0648\u062A', darija: '\u0639\u064A\u0637 \u0628\u0644\u0648\u062A-\u0631\u064A\u0628\u0644\u0648\u062A', es: 'Declara Belote-Rebelote' },
    icon: 'zap',
    category: 'belote',
    gameType: 'BELOTE',
    maxProgress: 1,
    rewardCoins: 100,
  },
  {
    id: 'belote_capot',
    name: { en: 'Capot!', fr: 'Capot!', ar: '!\u0643\u0627\u0628\u0648', darija: '!\u0643\u0627\u0628\u0648', es: '\u00A1Capot!' },
    description: { en: 'Win all tricks in a round (Capot)', fr: 'Gagne tous les plis dans un tour (Capot)', ar: '\u0627\u0631\u0628\u062D \u0643\u0644 \u0627\u0644\u0623\u062F\u0648\u0627\u0631 \u0641\u064A \u062C\u0648\u0644\u0629 (\u0643\u0627\u0628\u0648)', darija: '\u0631\u0628\u062D \u0643\u0627\u0639 \u0644\u0623\u062F\u0648\u0627\u0631 \u0641 \u062C\u0648\u0644\u0629 (\u0643\u0627\u0628\u0648)', es: 'Gana todas las bazas en una ronda (Capot)' },
    icon: 'shield',
    category: 'belote',
    gameType: 'BELOTE',
    maxProgress: 1,
    rewardCoins: 400,
  },
  {
    id: 'belote_wins_20',
    name: { en: 'Belote Pro', fr: 'Pro de la Belote', ar: '\u0645\u062D\u062A\u0631\u0641 \u0628\u0644\u0648\u062A', darija: '\u0645\u062D\u062A\u0631\u0641 \u0628\u0644\u0648\u062A', es: 'Pro de Belote' },
    description: { en: 'Win 20 Belote games', fr: 'Gagne 20 parties de Belote', ar: '\u0627\u0631\u0628\u062D 20 \u0644\u0639\u0628\u0629 \u0628\u0644\u0648\u062A', darija: '\u0631\u0628\u062D 20 \u0644\u0639\u0628\u0629 \u062F \u0628\u0644\u0648\u062A', es: 'Gana 20 partidas de Belote' },
    icon: 'target',
    category: 'belote',
    gameType: 'BELOTE',
    maxProgress: 20,
    rewardCoins: 300,
  },
  {
    id: 'belote_tierce',
    name: { en: 'Tierce Collector', fr: 'Collectionneur de Tierce', ar: '\u062C\u0627\u0645\u0639 \u0627\u0644\u062A\u064A\u0631\u0633', darija: '\u062C\u0627\u0645\u0639 \u062A\u064A\u0631\u0633', es: 'Coleccionista de Tierce' },
    description: { en: 'Declare 5 Tierces', fr: 'D\u00E9clare 5 Tierces', ar: '\u0627\u0639\u0644\u0646 5 \u062A\u064A\u0631\u0633', darija: '\u0639\u064A\u0637 5 \u062A\u064A\u0631\u0633', es: 'Declara 5 Tierces' },
    icon: 'layers',
    category: 'belote',
    gameType: 'BELOTE',
    maxProgress: 5,
    rewardCoins: 200,
  },

  // ===================== POKER (33-37) =====================
  {
    id: 'poker_first_win',
    name: { en: 'Poker Debut', fr: 'D\u00E9but au Poker', ar: '\u0628\u062F\u0627\u064A\u0629 \u0628\u0648\u0643\u0631', darija: '\u0628\u062F\u0627\u064A\u0629 \u0628\u0648\u0643\u0631', es: 'Debut en P\u00F3ker' },
    description: { en: 'Win your first Poker hand', fr: 'Gagne ta premi\u00E8re main de Poker', ar: '\u0627\u0631\u0628\u062D \u0623\u0648\u0644 \u064A\u062F \u0628\u0648\u0643\u0631', darija: '\u0631\u0628\u062D \u0623\u0648\u0644 \u064A\u062F \u062F \u0628\u0648\u0643\u0631', es: 'Gana tu primera mano de P\u00F3ker' },
    icon: 'star',
    category: 'poker',
    gameType: 'POKER',
    maxProgress: 1,
    rewardCoins: 50,
  },
  {
    id: 'poker_full_house',
    name: { en: 'Full House', fr: 'Full', ar: '\u0641\u0648\u0644 \u0647\u0627\u0648\u0633', darija: '\u0641\u0648\u0644 \u0647\u0627\u0648\u0633', es: 'Full' },
    description: { en: 'Win with a Full House', fr: 'Gagne avec un Full', ar: '\u0627\u0631\u0628\u062D \u0628\u0641\u0648\u0644 \u0647\u0627\u0648\u0633', darija: '\u0631\u0628\u062D \u0628\u0641\u0648\u0644 \u0647\u0627\u0648\u0633', es: 'Gana con un Full' },
    icon: 'home',
    category: 'poker',
    gameType: 'POKER',
    maxProgress: 1,
    rewardCoins: 200,
  },
  {
    id: 'poker_bluff_win',
    name: { en: 'Master Bluffer', fr: 'Ma\u00EEtre Bluffeur', ar: '\u0645\u0639\u0644\u0645 \u0627\u0644\u0628\u0644\u0641', darija: '\u0645\u0639\u0644\u0645 \u0627\u0644\u0628\u0644\u0641', es: 'Maestro del Farol' },
    description: { en: 'Win 5 hands by bluffing', fr: 'Gagne 5 mains en bluffant', ar: '\u0627\u0631\u0628\u062D 5 \u0623\u064A\u062F\u064A \u0628\u0627\u0644\u0628\u0644\u0641', darija: '\u0631\u0628\u062D 5 \u0623\u064A\u062F\u064A \u0628\u0627\u0644\u0628\u0644\u0641', es: 'Gana 5 manos faroleando' },
    icon: 'eye-off',
    category: 'poker',
    gameType: 'POKER',
    maxProgress: 5,
    rewardCoins: 300,
  },
  {
    id: 'poker_straight_flush',
    name: { en: 'Straight Flush!', fr: 'Quinte Flush!', ar: '!\u0633\u062A\u0631\u064A\u062A \u0641\u0644\u0627\u0634', darija: '!\u0633\u062A\u0631\u064A\u062A \u0641\u0644\u0627\u0634', es: '\u00A1Escalera de Color!' },
    description: { en: 'Get a Straight Flush', fr: 'Obtiens une Quinte Flush', ar: '\u0627\u062D\u0635\u0644 \u0639\u0644\u0649 \u0633\u062A\u0631\u064A\u062A \u0641\u0644\u0627\u0634', darija: '\u062C\u0628\u062F \u0633\u062A\u0631\u064A\u062A \u0641\u0644\u0627\u0634', es: 'Consigue una Escalera de Color' },
    icon: 'zap',
    category: 'poker',
    gameType: 'POKER',
    maxProgress: 1,
    rewardCoins: 500,
  },
  {
    id: 'poker_wins_20',
    name: { en: 'Poker Shark', fr: 'Requin du Poker', ar: '\u0642\u0631\u0634 \u0627\u0644\u0628\u0648\u0643\u0631', darija: '\u0642\u0631\u0634 \u0627\u0644\u0628\u0648\u0643\u0631', es: 'Tibur\u00F3n del P\u00F3ker' },
    description: { en: 'Win 20 Poker sessions', fr: 'Gagne 20 sessions de Poker', ar: '\u0627\u0631\u0628\u062D 20 \u062C\u0644\u0633\u0629 \u0628\u0648\u0643\u0631', darija: '\u0631\u0628\u062D 20 \u062C\u0644\u0633\u0629 \u062F \u0628\u0648\u0643\u0631', es: 'Gana 20 sesiones de P\u00F3ker' },
    icon: 'target',
    category: 'poker',
    gameType: 'POKER',
    maxProgress: 20,
    rewardCoins: 300,
  },

  // ===================== SOLITAIRE (38-40) =====================
  {
    id: 'solitaire_first_win',
    name: { en: 'Solitaire Starter', fr: 'D\u00E9but Solitaire', ar: '\u0628\u062F\u0627\u064A\u0629 \u0633\u0648\u0644\u064A\u062A\u064A\u0631', darija: '\u0628\u062F\u0627\u064A\u0629 \u0633\u0648\u0644\u064A\u062A\u064A\u0631', es: 'Inicio Solitario' },
    description: { en: 'Complete your first Solitaire game', fr: 'Termine ta premi\u00E8re partie de Solitaire', ar: '\u0623\u0643\u0645\u0644 \u0623\u0648\u0644 \u0644\u0639\u0628\u0629 \u0633\u0648\u0644\u064A\u062A\u064A\u0631', darija: '\u0643\u0645\u0644 \u0623\u0648\u0644 \u0644\u0639\u0628\u0629 \u062F \u0633\u0648\u0644\u064A\u062A\u064A\u0631', es: 'Completa tu primera partida de Solitario' },
    icon: 'check-circle',
    category: 'solitaire',
    gameType: 'SOLITAIRE',
    maxProgress: 1,
    rewardCoins: 50,
  },
  {
    id: 'solitaire_speed',
    name: { en: 'Speed Demon', fr: 'D\u00E9mon de Vitesse', ar: '\u0634\u064A\u0637\u0627\u0646 \u0627\u0644\u0633\u0631\u0639\u0629', darija: '\u0633\u0631\u064A\u0639 \u0628\u0632\u0627\u0641', es: 'Demonio de la Velocidad' },
    description: { en: 'Complete Solitaire in under 3 minutes', fr: 'Termine le Solitaire en moins de 3 minutes', ar: '\u0623\u0643\u0645\u0644 \u0633\u0648\u0644\u064A\u062A\u064A\u0631 \u0641\u064A \u0623\u0642\u0644 \u0645\u0646 3 \u062F\u0642\u0627\u0626\u0642', darija: '\u0643\u0645\u0644 \u0633\u0648\u0644\u064A\u062A\u064A\u0631 \u0641 \u0623\u0642\u0644 \u0645\u0646 3 \u062F\u0642\u0627\u064A\u0642', es: 'Completa Solitario en menos de 3 minutos' },
    icon: 'clock',
    category: 'solitaire',
    gameType: 'SOLITAIRE',
    maxProgress: 1,
    rewardCoins: 300,
  },
  {
    id: 'solitaire_wins_20',
    name: { en: 'Patience Master', fr: 'Ma\u00EEtre de la Patience', ar: '\u0645\u0639\u0644\u0645 \u0627\u0644\u0635\u0628\u0631', darija: '\u0645\u0639\u0644\u0645 \u0627\u0644\u0635\u0628\u0631', es: 'Maestro de la Paciencia' },
    description: { en: 'Complete 20 Solitaire games', fr: 'Termine 20 parties de Solitaire', ar: '\u0623\u0643\u0645\u0644 20 \u0644\u0639\u0628\u0629 \u0633\u0648\u0644\u064A\u062A\u064A\u0631', darija: '\u0643\u0645\u0644 20 \u0644\u0639\u0628\u0629 \u062F \u0633\u0648\u0644\u064A\u062A\u064A\u0631', es: 'Completa 20 partidas de Solitario' },
    icon: 'target',
    category: 'solitaire',
    gameType: 'SOLITAIRE',
    maxProgress: 20,
    rewardCoins: 300,
  },

  // ===================== SCOPA (41-43) =====================
  {
    id: 'scopa_first_win',
    name: { en: 'Scopa Starter', fr: 'D\u00E9but Scopa', ar: '\u0628\u062F\u0627\u064A\u0629 \u0633\u0643\u0648\u0628\u0627', darija: '\u0628\u062F\u0627\u064A\u0629 \u0633\u0643\u0648\u0628\u0627', es: 'Inicio Scopa' },
    description: { en: 'Win your first Scopa game', fr: 'Gagne ta premi\u00E8re partie de Scopa', ar: '\u0627\u0631\u0628\u062D \u0623\u0648\u0644 \u0644\u0639\u0628\u0629 \u0633\u0643\u0648\u0628\u0627', darija: '\u0631\u0628\u062D \u0623\u0648\u0644 \u0644\u0639\u0628\u0629 \u062F \u0633\u0643\u0648\u0628\u0627', es: 'Gana tu primera partida de Scopa' },
    icon: 'star',
    category: 'scopa',
    gameType: 'SCOPA',
    maxProgress: 1,
    rewardCoins: 50,
  },
  {
    id: 'scopa_sweep_10',
    name: { en: 'Scopa Sweeper', fr: 'Balayeur Scopa', ar: '\u0643\u0646\u0627\u0633 \u0633\u0643\u0648\u0628\u0627', darija: '\u0643\u0646\u0627\u0633 \u0633\u0643\u0648\u0628\u0627', es: 'Barrendero Scopa' },
    description: { en: 'Perform 10 Scopas (table sweeps)', fr: 'Effectue 10 Scopas (balayages)', ar: '\u0627\u0639\u0645\u0644 10 \u0633\u0643\u0648\u0628\u0627\u062A', darija: '\u062F\u064A\u0631 10 \u0633\u0643\u0648\u0628\u0627\u062A', es: 'Realiza 10 Scopas (barridas)' },
    icon: 'wind',
    category: 'scopa',
    gameType: 'SCOPA',
    maxProgress: 10,
    rewardCoins: 300,
  },
  {
    id: 'scopa_settebello',
    name: { en: 'Settebello Hunter', fr: 'Chasseur de Settebello', ar: '\u0635\u064A\u0627\u062F \u0627\u0644\u0633\u064A\u062A\u064A\u0628\u064A\u0644\u0648', darija: '\u0635\u064A\u0627\u062F \u0627\u0644\u0633\u064A\u062A\u064A\u0628\u064A\u0644\u0648', es: 'Cazador de Settebello' },
    description: { en: 'Capture the Settebello (7 of coins) 10 times', fr: 'Capture le Settebello (7 de deniers) 10 fois', ar: '\u0627\u0644\u062A\u0642\u0637 \u0627\u0644\u0633\u064A\u062A\u064A\u0628\u064A\u0644\u0648 10 \u0645\u0631\u0627\u062A', darija: '\u0642\u0628\u0636 \u0627\u0644\u0633\u064A\u062A\u064A\u0628\u064A\u0644\u0648 10 \u0645\u0631\u0627\u062A', es: 'Captura el Settebello (7 de oros) 10 veces' },
    icon: 'target',
    category: 'scopa',
    gameType: 'SCOPA',
    maxProgress: 10,
    rewardCoins: 200,
  },

  // ===================== TRIX (44-46) =====================
  {
    id: 'trix_first_win',
    name: { en: 'Trix Beginner', fr: 'D\u00E9butant Trix', ar: '\u0645\u0628\u062A\u062F\u0626 \u062A\u0631\u064A\u0643\u0633', darija: '\u0645\u0628\u062A\u062F\u0626 \u062A\u0631\u064A\u0643\u0633', es: 'Principiante Trix' },
    description: { en: 'Win your first Trix game', fr: 'Gagne ta premi\u00E8re partie de Trix', ar: '\u0627\u0631\u0628\u062D \u0623\u0648\u0644 \u0644\u0639\u0628\u0629 \u062A\u0631\u064A\u0643\u0633', darija: '\u0631\u0628\u062D \u0623\u0648\u0644 \u0644\u0639\u0628\u0629 \u062F \u062A\u0631\u064A\u0643\u0633', es: 'Gana tu primera partida de Trix' },
    icon: 'star',
    category: 'trix',
    gameType: 'TRIX',
    maxProgress: 1,
    rewardCoins: 50,
  },
  {
    id: 'trix_no_hearts',
    name: { en: 'Heartless', fr: 'Sans Coeur', ar: '\u0628\u062F\u0648\u0646 \u0642\u0644\u0628', darija: '\u0628\u0644\u0627 \u0642\u0644\u0628', es: 'Sin Coraz\u00F3n' },
    description: { en: 'Finish a round without taking any hearts', fr: 'Termine un tour sans prendre de coeurs', ar: '\u0623\u0643\u0645\u0644 \u062C\u0648\u0644\u0629 \u0628\u062F\u0648\u0646 \u0623\u062E\u0630 \u0642\u0644\u0648\u0628', darija: '\u0643\u0645\u0644 \u062C\u0648\u0644\u0629 \u0628\u0644\u0627 \u0645\u0627 \u062A\u0627\u062E\u062F \u0642\u0644\u0648\u0628', es: 'Termina una ronda sin coger corazones' },
    icon: 'heart',
    category: 'trix',
    gameType: 'TRIX',
    maxProgress: 1,
    rewardCoins: 200,
  },
  {
    id: 'trix_wins_20',
    name: { en: 'Trix Expert', fr: 'Expert Trix', ar: '\u062E\u0628\u064A\u0631 \u062A\u0631\u064A\u0643\u0633', darija: '\u062E\u0628\u064A\u0631 \u062A\u0631\u064A\u0643\u0633', es: 'Experto Trix' },
    description: { en: 'Win 20 Trix games', fr: 'Gagne 20 parties de Trix', ar: '\u0627\u0631\u0628\u062D 20 \u0644\u0639\u0628\u0629 \u062A\u0631\u064A\u0643\u0633', darija: '\u0631\u0628\u062D 20 \u0644\u0639\u0628\u0629 \u062F \u062A\u0631\u064A\u0643\u0633', es: 'Gana 20 partidas de Trix' },
    icon: 'target',
    category: 'trix',
    gameType: 'TRIX',
    maxProgress: 20,
    rewardCoins: 300,
  },

  // ===================== TARNEEB (47-48) =====================
  {
    id: 'tarneeb_first_win',
    name: { en: 'Tarneeb Starter', fr: 'D\u00E9but Tarneeb', ar: '\u0628\u062F\u0627\u064A\u0629 \u0637\u0631\u0646\u064A\u0628', darija: '\u0628\u062F\u0627\u064A\u0629 \u0637\u0631\u0646\u064A\u0628', es: 'Inicio Tarneeb' },
    description: { en: 'Win your first Tarneeb game', fr: 'Gagne ta premi\u00E8re partie de Tarneeb', ar: '\u0627\u0631\u0628\u062D \u0623\u0648\u0644 \u0644\u0639\u0628\u0629 \u0637\u0631\u0646\u064A\u0628', darija: '\u0631\u0628\u062D \u0623\u0648\u0644 \u0644\u0639\u0628\u0629 \u062F \u0637\u0631\u0646\u064A\u0628', es: 'Gana tu primera partida de Tarneeb' },
    icon: 'star',
    category: 'tarneeb',
    gameType: 'TARNEEB',
    maxProgress: 1,
    rewardCoins: 50,
  },
  {
    id: 'tarneeb_bid_win',
    name: { en: 'Bid Winner', fr: 'Gagnant de l\'Ench\u00E8re', ar: '\u0641\u0627\u0626\u0632 \u0627\u0644\u0645\u0632\u0627\u064A\u062F\u0629', darija: '\u0641\u0627\u0626\u0632 \u0627\u0644\u0645\u0632\u0627\u064A\u062F\u0629', es: 'Ganador de Puja' },
    description: { en: 'Win 10 rounds after winning the bid', fr: 'Gagne 10 tours apr\u00E8s avoir remport\u00E9 l\'ench\u00E8re', ar: '\u0627\u0631\u0628\u062D 10 \u062C\u0648\u0644\u0627\u062A \u0628\u0639\u062F \u0627\u0644\u0641\u0648\u0632 \u0628\u0627\u0644\u0645\u0632\u0627\u064A\u062F\u0629', darija: '\u0631\u0628\u062D 10 \u062C\u0648\u0644\u0627\u062A \u0645\u0646 \u0628\u0639\u062F \u0645\u0627 \u0631\u0628\u062D\u062A\u064A \u0627\u0644\u0645\u0632\u0627\u064A\u062F\u0629', es: 'Gana 10 rondas tras ganar la puja' },
    icon: 'award',
    category: 'tarneeb',
    gameType: 'TARNEEB',
    maxProgress: 10,
    rewardCoins: 300,
  },

  // ===================== HAND (49-50) =====================
  {
    id: 'hand_first_win',
    name: { en: 'Hand Beginner', fr: 'D\u00E9butant Hand', ar: '\u0645\u0628\u062A\u062F\u0626 \u0647\u0627\u0646\u062F', darija: '\u0645\u0628\u062A\u062F\u0626 \u0647\u0627\u0646\u062F', es: 'Principiante Hand' },
    description: { en: 'Win your first Hand game', fr: 'Gagne ta premi\u00E8re partie de Hand', ar: '\u0627\u0631\u0628\u062D \u0623\u0648\u0644 \u0644\u0639\u0628\u0629 \u0647\u0627\u0646\u062F', darija: '\u0631\u0628\u062D \u0623\u0648\u0644 \u0644\u0639\u0628\u0629 \u062F \u0647\u0627\u0646\u062F', es: 'Gana tu primera partida de Hand' },
    icon: 'star',
    category: 'hand',
    gameType: 'HAND',
    maxProgress: 1,
    rewardCoins: 50,
  },
  {
    id: 'hand_clean_sweep',
    name: { en: 'Clean Sweep', fr: 'Grand Chelem', ar: '\u0643\u0646\u0633 \u0643\u0627\u0645\u0644', darija: '\u0643\u0646\u0633 \u0643\u0627\u0645\u0644', es: 'Barrida Limpia' },
    description: { en: 'Win all tricks in a Hand game round', fr: 'Gagne tous les plis dans un tour de Hand', ar: '\u0627\u0631\u0628\u062D \u0643\u0644 \u0627\u0644\u0623\u062F\u0648\u0627\u0631 \u0641\u064A \u062C\u0648\u0644\u0629 \u0647\u0627\u0646\u062F', darija: '\u0631\u0628\u062D \u0643\u0627\u0639 \u0644\u0623\u062F\u0648\u0627\u0631 \u0641 \u062C\u0648\u0644\u0629 \u0647\u0627\u0646\u062F', es: 'Gana todas las bazas en una ronda de Hand' },
    icon: 'shield',
    category: 'hand',
    gameType: 'HAND',
    maxProgress: 1,
    rewardCoins: 400,
  },
];

// ---- Progress tracking (in-memory placeholder) ----------------------------

const progressStore: Map<string, number> = new Map();

function progressKey(userId: string, achievementId: string): string {
  return `${userId}:${achievementId}`;
}

// ---- Public API ------------------------------------------------------------

/**
 * Check (and optionally advance) a user's progress towards an achievement.
 * Returns whether the achievement was just unlocked and the current progress.
 */
export function checkAchievement(
  userId: string,
  achievementId: string,
  currentProgress: number,
): { unlocked: boolean; progress: number } {
  const def = ACHIEVEMENTS.find((a) => a.id === achievementId);
  if (!def) return { unlocked: false, progress: 0 };

  const key = progressKey(userId, achievementId);
  const prev = progressStore.get(key) ?? 0;

  // Only move forward
  const next = Math.max(prev, currentProgress);
  progressStore.set(key, next);

  const wasUnlocked = prev >= def.maxProgress;
  const isUnlocked = next >= def.maxProgress;

  return {
    unlocked: !wasUnlocked && isUnlocked,
    progress: Math.min(next, def.maxProgress),
  };
}

/**
 * Filter achievements by game type.  Pass `undefined` to get global ones.
 */
export function getAchievementsByGame(
  gameType?: string,
): AchievementDef[] {
  return ACHIEVEMENTS.filter((a) =>
    gameType === undefined ? a.gameType === undefined : a.gameType === gameType,
  );
}

/**
 * Filter achievements by category.
 */
export function getAchievementsByCategory(
  category: AchievementCategory,
): AchievementDef[] {
  return ACHIEVEMENTS.filter((a) => a.category === category);
}

/**
 * Return all achievements regardless of game type.
 */
export function getAllAchievements(): AchievementDef[] {
  return [...ACHIEVEMENTS];
}

/**
 * Get a user's progress for every achievement.
 */
export function getUserProgress(
  userId: string,
): { achievementId: string; progress: number; maxProgress: number; unlocked: boolean }[] {
  return ACHIEVEMENTS.map((def) => {
    const key = progressKey(userId, def.id);
    const progress = progressStore.get(key) ?? 0;
    return {
      achievementId: def.id,
      progress: Math.min(progress, def.maxProgress),
      maxProgress: def.maxProgress,
      unlocked: progress >= def.maxProgress,
    };
  });
}
