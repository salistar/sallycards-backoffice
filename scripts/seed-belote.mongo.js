// scripts/seed-belote.mongo.js
// Seed 20 dummy Belote players with realistic ELO + win-streak + coins + gems.
// Run with:
//   ssh -i ~/.ssh/sallycards_ed25519 deploy@91.99.70.43 \
//     'docker exec -i sallycards-mongo mongosh -u sallycards -p <MONGO_PWD> \
//      --authenticationDatabase admin sallycards' < scripts/seed-belote.mongo.js
//
// Idempotent: re-running upserts by email (no duplicates).

const FIRST_NAMES = [
  'Hamza', 'Amine', 'Nadia', 'Youssef', 'Fatima', 'Karim',
  'Salma', 'Mehdi', 'Soukaina', 'Anas', 'Hanane', 'Younes',
  'Ibtissam', 'Saad', 'Hajar', 'Ismail', 'Loubna', 'Tarik',
  'Ouafae', 'Reda',
];
const CITIES = [
  'Casablanca', 'Rabat', 'Marrakech', 'Fes', 'Tanger', 'Agadir',
  'Meknes', 'Oujda', 'Kenitra', 'Tetouan', 'Sale', 'Nador',
  'El Jadida', 'Beni Mellal', 'Khouribga', 'Ouarzazate', 'Errachidia',
  'Settat', 'Larache', 'Berkane',
];

const now = new Date();
const aWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

print('=== Seeding belote_users ===');

let upserted = 0;
let skipped = 0;
for (let i = 0; i < 20; i++) {
  const fn = FIRST_NAMES[i % FIRST_NAMES.length];
  const city = CITIES[i % CITIES.length];
  const email = `${fn.toLowerCase()}_belote@sallycards.demo`;

  // Realistic ELO bell curve around 1500, +/- 600
  const elo = Math.round(1500 + (Math.random() - 0.5) * 1200);
  const gamesPlayed = 30 + Math.floor(Math.random() * 200);
  const winRate = 0.30 + Math.random() * 0.40; // 30%..70%
  const gamesWon = Math.floor(gamesPlayed * winRate);
  const winStreak = Math.floor(Math.random() * 8);
  const bestWinStreak = winStreak + Math.floor(Math.random() * 15);
  const coins = 200 + Math.floor(Math.random() * 8000);
  const gems = Math.floor(Math.random() * 120);
  const lastSeenAt = new Date(aWeekAgo.getTime() + Math.random() * (now.getTime() - aWeekAgo.getTime()));

  const doc = {
    email,
    username: fn,
    passwordHash: 'seed-' + Math.random().toString(36).slice(2),
    avatar: '',
    locale: 'fr',
    bio: `Joueur de Belote depuis ${city} — ELO ${elo}`,
    provider: 'local',
    providerId: '',
    role: 'player',
    gameType: 'belote',
    isGuest: false,
    isVerified: true,
    status: 'offline',
    lastSeenAt,
    deviceTokens: [],
    coins,
    gems,
    location: { city, country: 'MA' },
    settings: {
      theme: 'system', soundEnabled: true, hapticEnabled: true,
      language: 'fr', notificationsEnabled: true,
      autoMatchmaking: false, cardBackStyle: 'classic',
    },
    friends: [],
    friendRequests: [],
    blockedUsers: [],
    stats: {
      gamesPlayed, gamesWon,
      elo,
      winStreak, bestWinStreak,
      totalPlayTimeMs: gamesPlayed * 8 * 60 * 1000,
    },
    createdAt: lastSeenAt,
    updatedAt: now,
  };

  const r = db.belote_users.updateOne(
    { email: doc.email },
    { $setOnInsert: doc },
    { upsert: true },
  );
  if (r.upsertedCount === 1) {
    upserted++;
    print('  + ' + email + '  ELO=' + elo + '  wins=' + gamesWon + '/' + gamesPlayed + '  coins=' + coins + '  gems=' + gems);
  } else {
    skipped++;
  }
}
print('--- belote_users : ' + upserted + ' inserted, ' + skipped + ' already-present ---');

// ── Seed daily challenge (BELOTE) ────────────────────────────────────────────
print('=== Seeding belote daily challenge ===');
const today = new Date(); today.setUTCHours(0, 0, 0, 0);
const tomorrow = new Date(today.getTime() + 86400000);
db.challenges.updateOne(
  { gameType: 'belote', date: today },
  {
    $setOnInsert: {
      gameType: 'belote',
      date: today,
      title: 'Defi du jour - Belote',
      description: 'Gagne une partie 2v2 avec un atout coeurs.',
      rewardCoins: 50,
      rewardGems: 2,
      difficulty: 'medium',
      participants: 0,
      activeUntil: tomorrow,
      createdAt: new Date(),
    },
  },
  { upsert: true },
);
print('--- daily challenge for ' + today.toISOString().slice(0, 10) + ' ready ---');

// ── Seed 3 sample Hkim sport routes around Casablanca ────────────────────────
print('=== Seeding Hkim sport challenge routes ===');
const HKIMS = [
  { name: 'Hkim Corniche',  km: 2.3, kind: 'run',  start: [33.5731, -7.5898], end: [33.5910, -7.6500] },
  { name: 'Hkim Anfa Park', km: 4.1, kind: 'walk', start: [33.5570, -7.6700], end: [33.5400, -7.6300] },
  { name: 'Hkim Tour Hassan',km: 6.7, kind: 'run',  start: [34.0241, -6.8222], end: [34.0150, -6.8400] },
];
HKIMS.forEach((h) => {
  db.hkims.updateOne(
    { name: h.name },
    {
      $setOnInsert: {
        ...h,
        type: 'public-seed',
        createdAt: new Date(),
        completedBy: [],
      },
    },
    { upsert: true },
  );
  print('  + ' + h.name + ' (' + h.km + ' km, ' + h.kind + ')');
});

print('=== Seed complete ===');
print('   - 20 belote users');
print('   - 1 daily challenge');
print('   - 3 Hkim routes');
