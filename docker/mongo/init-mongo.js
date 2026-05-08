// MongoDB initialization script
// Unified `users` collection with stats segmented per game,
// plus per-game user collections kept for non-merged games.

db = db.getSiblingDB('sallycards');

// ─── Unified users collection (6 jeux fusionnés) ───────────────────────
// Single source of truth. Stats are namespaced per-game under stats.<game>.
db.createCollection('users');
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 });
db.users.createIndex({ gameType: 1 });
db.users.createIndex({ 'stats.elo': -1 });
db.users.createIndex({ 'stats.solitaire.elo': -1 });
db.users.createIndex({ 'stats.quiestce.elo': -1 });
db.users.createIndex({ 'stats.concentration.elo': -1 });
db.users.createIndex({ 'stats.scopa.elo': -1 });
db.users.createIndex({ 'stats.tarot.elo': -1 });
db.users.createIndex({ 'stats.poker.elo': -1 });
db.users.createIndex({ status: 1 });
db.users.createIndex({ lastSeenAt: -1 });
db.users.createIndex({ createdAt: -1 });
print('Created unified users collection with per-game stat indexes');

// ─── Migration: fold legacy per-game user collections into `users` ─────
// If a previous deployment created <game>_users collections, copy each user
// into the unified collection with stats nested under stats.<game>.
['solitaire', 'quiestce', 'concentration', 'scopa', 'tarot', 'poker'].forEach(function (game) {
  var legacyCol = game + '_users';
  if (!db.getCollectionNames().includes(legacyCol)) return;
  var legacy = db[legacyCol];
  var migrated = 0;
  legacy.find({}).forEach(function (u) {
    var existing = db.users.findOne({ email: u.email });
    var perGameStats = {
      gamesPlayed: (u.stats && u.stats.gamesPlayed) || 0,
      gamesWon: (u.stats && u.stats.gamesWon) || 0,
      elo: (u.stats && u.stats.elo) || 1000,
      winStreak: (u.stats && u.stats.winStreak) || 0,
      bestWinStreak: (u.stats && u.stats.bestWinStreak) || 0,
      totalPlayTimeMs: (u.stats && u.stats.totalPlayTimeMs) || 0,
    };
    if (existing) {
      var setOp = {};
      setOp['stats.' + game] = perGameStats;
      db.users.updateOne({ _id: existing._id }, { $set: setOp });
    } else {
      var statsRoot = u.stats || {
        gamesPlayed: 0, gamesWon: 0, elo: 1000,
        winStreak: 0, bestWinStreak: 0, totalPlayTimeMs: 0,
      };
      statsRoot[game] = perGameStats;
      var doc = Object.assign({}, u, { gameType: game, stats: statsRoot });
      delete doc._id;
      try { db.users.insertOne(doc); } catch (e) { /* duplicate username collision — skip */ }
    }
    migrated++;
  });
  print('Migrated ' + migrated + ' users from ' + legacyCol + ' into users.stats.' + game);
});

// ─── Per-game user collections (jeux non-fusionnés, gardés pour compat) ─
var gameTypes = ['ronda', 'kdoub', 'belote', 'okey'];

gameTypes.forEach(function (game) {
  var col = game + '_users';
  db.createCollection(col);
  db[col].createIndex({ email: 1 }, { unique: true });
  db[col].createIndex({ username: 1 }, { unique: true });
  db[col].createIndex({ 'stats.elo': -1 });
  db[col].createIndex({ createdAt: -1 });
  print('Created collection and indexes for: ' + col);
});

// ─── Per-game match/score collections (6 jeux fusionnés) ───────────────
['solitaire', 'quiestce', 'concentration', 'scopa', 'tarot', 'poker'].forEach(function (game) {
  var matches = game + '_matches';
  var scores = game + '_scores';
  db.createCollection(matches);
  db[matches].createIndex({ code: 1 }, { unique: true });
  db[matches].createIndex({ status: 1, variant: 1, createdAt: -1 });
  db.createCollection(scores);
  db[scores].createIndex({ variant: 1, score: -1 });
  db[scores].createIndex({ userId: 1, variant: 1 });
  print('Created match/score collections for: ' + game);
});

// ─── Game rooms collection indexes ──────────────────
db.createCollection('gamerooms');
db.gamerooms.createIndex({ code: 1 }, { unique: true });
db.gamerooms.createIndex({ status: 1, gameType: 1 });
db.gamerooms.createIndex({ 'players.userId': 1 });
db.gamerooms.createIndex({ createdAt: -1 }, { expireAfterSeconds: 86400 }); // TTL 24h

// Game history collection indexes
db.createCollection('gamehistories');
db.gamehistories.createIndex({ gameId: 1 });
db.gamehistories.createIndex({
  'players.userId': 1,
  gameType: 1,
  endedAt: -1,
});
db.gamehistories.createIndex({ gameType: 1, endedAt: -1 });

// Leaderboard collection indexes
db.createCollection('leaderboards');
db.leaderboards.createIndex({ gameType: 1, season: 1, score: -1 });
db.leaderboards.createIndex(
  { userId: 1, gameType: 1, season: 1 },
  { unique: true },
);

// Achievements collection indexes
db.createCollection('achievements');
db.achievements.createIndex({ userId: 1 });
db.achievements.createIndex({ userId: 1, type: 1 }, { unique: true });

// Messages collection indexes
db.createCollection('messages');
db.messages.createIndex({ roomId: 1, timestamp: -1 });
db.messages.createIndex({ timestamp: 1 }, { expireAfterSeconds: 604800 }); // TTL 7 days

// Tournaments collection indexes
db.createCollection('tournaments');
db.tournaments.createIndex({ status: 1, gameType: 1, startsAt: 1 });
db.tournaments.createIndex({ 'participants.userId': 1 });

// ─── Seed demo admin in ALL 10 collections ──────────
// Password: Demo123456 (bcrypt 12 rounds)
var demoHash =
  '$2b$12$n7R/Rtlx7dLUr1.3q4s.leUhmn5eVkvLqx.9qPEQ24IrPeIziOkTC';

gameTypes.forEach(function (game) {
  var col = game + '_users';
  var exists = db[col].findOne({ email: 'demo@sallycards.com' });
  if (!exists) {
    // Rich seed data so the profile / leaderboard / shop all look alive
    // when the tester logs in with demo@sallycards.com.
    var eloByGame = { ronda: 1420, kdoub: 1380, belote: 1550, poker: 1610,
      tarot: 1290, scopa: 1345, okey: 1205, concentration: 1150,
      solitaire: 1100, quiestce: 1080 };
    var gpByGame = { ronda: 148, kdoub: 132, belote: 210, poker: 186,
      tarot: 98, scopa: 124, okey: 76, concentration: 58, solitaire: 41, quiestce: 32 };
    var elo = eloByGame[game] || 1200;
    var gp = gpByGame[game] || 80;
    var gw = Math.round(gp * 0.58);

    db[col].insertOne({
      email: 'demo@sallycards.com',
      username: 'DemoPlayer',
      passwordHash: demoHash,
      avatar: '',
      role: 'admin',
      status: 'offline',
      isGuest: false,
      isVerified: true,
      locale: 'fr',
      friends: [],
      friendRequests: [],
      blockedUsers: [],
      deviceTokens: [],
      lastSeenAt: new Date(Date.now() - 3600000),

      // Geo (for world/country/city leaderboards)
      location: {
        country: 'MA',
        countryName: 'Morocco',
        city: 'Casablanca',
        region: 'Casablanca-Settat',
        lat: 33.5731,
        lon: -7.5898,
      },

      // Virtual currency wallet (for Shop)
      coins: 2500,
      diamonds: 12,

      stats: {
        gamesPlayed: gp,
        gamesWon: gw,
        gamesLost: gp - gw,
        elo: elo,
        winStreak: 3,
        bestWinStreak: 9,
        totalPlayTimeMs: gp * 420000,
        avgGameDurationMs: 420000,
        bluffsSuccessful: Math.round(gp * 0.22),
        bluffsAttempted: Math.round(gp * 0.35),
        cardsCaptured: gp * 12,
        lastGameAt: new Date(Date.now() - 86400000),
      },

      // Per-game achievements
      achievements: [
        { id: 'first_win',      name: 'Première victoire',    unlockedAt: new Date(Date.now() - 30*86400000) },
        { id: 'streak_5',       name: 'Série de 5',            unlockedAt: new Date(Date.now() - 20*86400000) },
        { id: 'play_50',        name: '50 parties jouées',     unlockedAt: new Date(Date.now() - 10*86400000) },
        { id: 'elo_1200',       name: 'ELO 1200',              unlockedAt: new Date(Date.now() - 5*86400000) },
        { id: 'bluff_master',   name: 'Maître du bluff',       unlockedAt: new Date(Date.now() - 2*86400000) },
      ],

      // Recent games history preview (last 5)
      recentGames: [0, 1, 2, 3, 4].map(function (i) {
        return {
          gameId: 'seed-game-' + game + '-' + i,
          opponent: game === 'ronda' ? 'RondaPlayer' + (i + 1)
                  : game === 'kdoub' ? 'KdoubPlayer' + (i + 1)
                  : 'Opponent' + (i + 1),
          result: i % 3 === 0 ? 'loss' : 'win',
          eloChange: i % 3 === 0 ? -8 : +12,
          playedAt: new Date(Date.now() - (i + 1) * 86400000),
          durationMs: 300000 + i * 60000,
        };
      }),

      settings: {
        theme: 'dark',
        soundEnabled: true,
        hapticEnabled: true,
        language: 'fr',
        notificationsEnabled: true,
        autoMatchmaking: false,
        cardBackStyle: 'classic',
      },

      // Purchase history (for Shop transparency)
      purchases: [],

      createdAt: new Date(Date.now() - 90*86400000),
      updatedAt: new Date(),
    });
    print('Demo admin seeded in: ' + col);
  }
});

// ─── Seed 2 players per game collection ─────────────
// Password: Player123456 (bcrypt 12 rounds)
var playerHash =
  '$2b$12$WGdv7lF9FRFIHAMSt3VI3.iF0Q/nhMGo7I7nIvDc1GTYtb1a8B..W';

var gamePlayers = [
  {
    game: 'ronda',
    u1: 'RondaPlayer1',
    u2: 'RondaPlayer2',
    elo1: 1450,
    elo2: 1120,
    gp1: 186,
    gp2: 72,
    gw1: 102,
    gw2: 31,
    ws1: 4,
    ws2: 1,
    bws1: 8,
    bws2: 4,
    tp1: 28800000,
    tp2: 7200000,
  },
  {
    game: 'kdoub',
    u1: 'KdoubPlayer1',
    u2: 'KdoubPlayer2',
    elo1: 1380,
    elo2: 980,
    gp1: 154,
    gp2: 45,
    gw1: 85,
    gw2: 18,
    ws1: 3,
    ws2: 0,
    bws1: 7,
    bws2: 3,
    tp1: 21600000,
    tp2: 5400000,
  },
  {
    game: 'belote',
    u1: 'BelotePlayer1',
    u2: 'BelotePlayer2',
    elo1: 1620,
    elo2: 1250,
    gp1: 210,
    gp2: 98,
    gw1: 140,
    gw2: 52,
    ws1: 5,
    ws2: 2,
    bws1: 12,
    bws2: 6,
    tp1: 36000000,
    tp2: 14400000,
  },
  {
    game: 'poker',
    u1: 'PokerPlayer1',
    u2: 'PokerPlayer2',
    elo1: 1550,
    elo2: 870,
    gp1: 195,
    gp2: 38,
    gw1: 110,
    gw2: 12,
    ws1: 4,
    ws2: 0,
    bws1: 9,
    bws2: 2,
    tp1: 32400000,
    tp2: 3600000,
  },
  {
    game: 'tarot',
    u1: 'TarotPlayer1',
    u2: 'TarotPlayer2',
    elo1: 1280,
    elo2: 1050,
    gp1: 120,
    gp2: 55,
    gw1: 58,
    gw2: 22,
    ws1: 2,
    ws2: 1,
    bws1: 5,
    bws2: 3,
    tp1: 18000000,
    tp2: 9000000,
  },
  {
    game: 'scopa',
    u1: 'ScopaPlayer1',
    u2: 'ScopaPlayer2',
    elo1: 1350,
    elo2: 1180,
    gp1: 142,
    gp2: 88,
    gw1: 78,
    gw2: 45,
    ws1: 3,
    ws2: 2,
    bws1: 6,
    bws2: 5,
    tp1: 25200000,
    tp2: 12600000,
  },
  {
    game: 'okey',
    u1: 'OkeyPlayer1',
    u2: 'OkeyPlayer2',
    elo1: 1200,
    elo2: 950,
    gp1: 95,
    gp2: 32,
    gw1: 42,
    gw2: 10,
    ws1: 1,
    ws2: 0,
    bws1: 4,
    bws2: 2,
    tp1: 14400000,
    tp2: 4800000,
  },
  {
    game: 'concentration',
    u1: 'ConcentrationPlayer1',
    u2: 'ConcentrationPlayer2',
    elo1: 1150,
    elo2: 1020,
    gp1: 78,
    gp2: 42,
    gw1: 35,
    gw2: 18,
    ws1: 2,
    ws2: 1,
    bws1: 3,
    bws2: 2,
    tp1: 10800000,
    tp2: 5400000,
  },
  {
    game: 'solitaire',
    u1: 'SolitairePlayer1',
    u2: 'SolitairePlayer2',
    elo1: 1100,
    elo2: 900,
    gp1: 65,
    gp2: 25,
    gw1: 28,
    gw2: 8,
    ws1: 1,
    ws2: 0,
    bws1: 3,
    bws2: 1,
    tp1: 7200000,
    tp2: 3600000,
  },
  {
    game: 'quiestce',
    u1: 'QuiEstCePlayer1',
    u2: 'QuiEstCePlayer2',
    elo1: 1080,
    elo2: 1010,
    gp1: 52,
    gp2: 30,
    gw1: 24,
    gw2: 14,
    ws1: 1,
    ws2: 1,
    bws1: 2,
    bws2: 2,
    tp1: 5400000,
    tp2: 3600000,
  },
];

gamePlayers.forEach(function (gp) {
  var col = gp.game + '_users';

  // Player 1
  if (!db[col].findOne({ email: gp.game + '1@sallycards.com' })) {
    db[col].insertOne({
      email: gp.game + '1@sallycards.com',
      username: gp.u1,
      passwordHash: playerHash,
      avatar: '',
      role: 'player',
      status: 'offline',
      isGuest: false,
      isVerified: true,
      locale: 'fr',
      friends: [],
      friendRequests: [],
      blockedUsers: [],
      deviceTokens: [],
      lastSeenAt: null,
      stats: {
        gamesPlayed: gp.gp1,
        gamesWon: gp.gw1,
        elo: gp.elo1,
        winStreak: gp.ws1,
        bestWinStreak: gp.bws1,
        totalPlayTimeMs: gp.tp1,
      },
      settings: {
        theme: 'system',
        soundEnabled: true,
        hapticEnabled: true,
        language: 'fr',
        notificationsEnabled: true,
        autoMatchmaking: false,
        cardBackStyle: 'classic',
      },
      createdAt: new Date(
        Date.now() - Math.floor(Math.random() * 30 * 86400000),
      ),
      updatedAt: new Date(),
    });
  }

  // Player 2
  if (!db[col].findOne({ email: gp.game + '2@sallycards.com' })) {
    db[col].insertOne({
      email: gp.game + '2@sallycards.com',
      username: gp.u2,
      passwordHash: playerHash,
      avatar: '',
      role: 'player',
      status: 'offline',
      isGuest: false,
      isVerified: true,
      locale: 'fr',
      friends: [],
      friendRequests: [],
      blockedUsers: [],
      deviceTokens: [],
      lastSeenAt: null,
      stats: {
        gamesPlayed: gp.gp2,
        gamesWon: gp.gw2,
        elo: gp.elo2,
        winStreak: gp.ws2,
        bestWinStreak: gp.bws2,
        totalPlayTimeMs: gp.tp2,
      },
      settings: {
        theme: 'system',
        soundEnabled: true,
        hapticEnabled: true,
        language: 'fr',
        notificationsEnabled: true,
        autoMatchmaking: false,
        cardBackStyle: 'classic',
      },
      createdAt: new Date(
        Date.now() - Math.floor(Math.random() * 30 * 86400000),
      ),
      updatedAt: new Date(),
    });
  }

  print('Seeded players for: ' + col);
});

// ─── Shop packages (Sally Coins) ──────────────────
db.createCollection('shop_packages');
db.shop_packages.createIndex({ productId: 1 }, { unique: true });
db.shop_packages.createIndex({ active: 1, sortOrder: 1 });

var packages = [
  { productId: 'coins_100',   name: 'Poignée',      coins: 100,    bonus: 0,    priceEur: 0.99,  priceUsd: 1.09,  icon: '💰', gradient: ['#F59E0B', '#FBBF24'], sortOrder: 1, active: true, popular: false, bestValue: false },
  { productId: 'coins_500',   name: 'Sac',          coins: 500,    bonus: 25,   priceEur: 4.99,  priceUsd: 5.49,  icon: '💎', gradient: ['#3B82F6', '#06B6D4'], sortOrder: 2, active: true, popular: true,  bestValue: false },
  { productId: 'coins_1200',  name: 'Coffre',       coins: 1200,   bonus: 100,  priceEur: 9.99,  priceUsd: 10.99, icon: '🏆', gradient: ['#8B5CF6', '#EC4899'], sortOrder: 3, active: true, popular: false, bestValue: false },
  { productId: 'coins_3000',  name: 'Trésor',       coins: 3000,   bonus: 400,  priceEur: 19.99, priceUsd: 21.99, icon: '👑', gradient: ['#DC2626', '#F59E0B'], sortOrder: 4, active: true, popular: false, bestValue: true  },
  { productId: 'coins_8000',  name: 'Jackpot',      coins: 8000,   bonus: 1500, priceEur: 49.99, priceUsd: 54.99, icon: '🎰', gradient: ['#10B981', '#F59E0B'], sortOrder: 5, active: true, popular: false, bestValue: false },
  { productId: 'coins_20000', name: 'Mégajackpot',  coins: 20000,  bonus: 5000, priceEur: 99.99, priceUsd: 109.99, icon: '🌟', gradient: ['#EC4899', '#8B5CF6'], sortOrder: 6, active: true, popular: false, bestValue: false },
  { productId: 'premium_month',   name: 'Premium 30j', coins: 500,  bonus: 0, priceEur: 4.99, priceUsd: 5.49,   icon: '🎟️', gradient: ['#6366F1', '#A855F7'], sortOrder: 10, active: true, subscription: true, durationDays: 30 },
  { productId: 'premium_year',    name: 'Premium 1 an', coins: 6500, bonus: 1000, priceEur: 49.99, priceUsd: 54.99, icon: '👑', gradient: ['#D97706', '#DC2626'], sortOrder: 11, active: true, subscription: true, durationDays: 365 },
];
packages.forEach(function (p) {
  if (!db.shop_packages.findOne({ productId: p.productId })) {
    p.createdAt = new Date();
    db.shop_packages.insertOne(p);
  }
});
print('Shop packages seeded: ' + db.shop_packages.countDocuments({}));

// ─── Coin transactions ledger (audit trail) ─────
db.createCollection('coin_transactions');
db.coin_transactions.createIndex({ userId: 1, createdAt: -1 });
db.coin_transactions.createIndex({ type: 1, createdAt: -1 });

// ─── Daily challenges seed ──────────────────────
db.createCollection('challenges');
db.challenges.createIndex({ date: 1, gameType: 1 }, { unique: true });
db.challenges.createIndex({ active: 1 });

var today = new Date();
today.setHours(0, 0, 0, 0);
gameTypes.forEach(function (game) {
  if (!db.challenges.findOne({ date: today, gameType: game })) {
    db.challenges.insertOne({
      date: today,
      gameType: game,
      title: 'Défi du jour',
      description: 'Gagne 3 parties consécutives',
      rewardCoins: 50,
      rewardXp: 100,
      maxPlayers: 10,
      active: true,
      participants: [],
      createdAt: new Date(),
    });
  }
});
print('Daily challenges seeded for ' + gameTypes.length + ' games.');

print('SallyCards MongoDB indexes and seed data created successfully.');
