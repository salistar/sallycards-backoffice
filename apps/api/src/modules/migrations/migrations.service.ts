/**
 * @file migrations.service.ts
 * @description Module de migrations Mongo léger (pas de dépendance externe).
 *
 * Pattern :
 *  - Chaque migration a un `id` unique + une fn `up(connection)`.
 *  - Au boot : check `_migrations` collection ; exécute uniquement les
 *    migrations non-encore appliquées.
 *
 * Pour une vraie production, envisager `mongoose-migrate-2` ou `migrate-mongo`,
 * mais ce système couvre 90% des besoins.
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

interface Migration {
  id: string;
  description: string;
  up: (conn: Connection) => Promise<void>;
}

@Injectable()
export class MigrationsService implements OnModuleInit {
  private readonly logger = new Logger(MigrationsService.name);

  /**
   * Liste ordonnée des migrations. Ajouter en bas, jamais réordonner.
   */
  private readonly migrations: Migration[] = [
    {
      id: '001-deal-seeds-indexes',
      description: 'Vérifie les index obligatoires sur deal_seeds',
      up: async (conn) => {
        const col = conn.collection('deal_seeds');
        await col.createIndex({ variant: 1, dealHash: 1 }, { unique: true, name: 'variant_dealHash_unique' });
        await col.createIndex({ variant: 1, difficulty: 1 }, { name: 'variant_difficulty' });
      },
    },
    {
      id: '002-solitaire-scores-indexes',
      description: 'Index pour leaderboard solitaire',
      up: async (conn) => {
        const col = conn.collection('solitaire_scores');
        await col.createIndex({ variant: 1, score: -1 }, { name: 'variant_score_desc' });
        await col.createIndex({ variant: 1, durationMs: 1 }, { name: 'variant_duration_asc' });
      },
    },
    {
      id: '003-tournaments-default-prizes',
      description: 'Fallback prizes vides → defaults',
      up: async (conn) => {
        const col = conn.collection('tournaments');
        await col.updateMany(
          { $or: [{ prizes: null }, { prizes: { $exists: false } }] },
          {
            $set: {
              prizes: [
                { rank: 1, gold: 500 },
                { rank: 2, gold: 250 },
                { rank: 3, gold: 100 },
              ],
            },
          },
        );
      },
    },
    {
      id: '004-seed-belote-content',
      description: 'Seed boutique (items + coin packs) + tournoi belote pour les écrans Belote',
      up: async (conn) => {
        const now = Date.now();
        // ── shop_items (catalogue cosmétique) ──
        const items = [
          { name: 'Avatar Joker', category: 'avatar', description: 'Un avatar joker exclusif, animé.', priceEur: 1.99, priceCoins: 500, active: true, sortOrder: 1 },
          { name: 'Avatar Reine de Pique', category: 'avatar', description: 'Portrait stylisé de la Reine de Pique.', priceEur: 1.99, priceCoins: 500, active: true, sortOrder: 2 },
          { name: 'Thème Bois Royal', category: 'theme', description: 'Tapis de jeu en bois sombre verni.', priceEur: 2.99, priceCoins: 800, active: true, sortOrder: 3 },
          { name: 'Thème Néon', category: 'theme', description: 'Table néon cyberpunk pour les parties nocturnes.', priceEur: 2.99, priceCoins: 800, active: true, sortOrder: 4 },
          { name: 'Deck Français Classique', category: 'deck', description: 'Cartes françaises traditionnelles HD.', priceEur: 2.99, priceCoins: 800, active: true, sortOrder: 5 },
          { name: 'Deck Marocain', category: 'deck', description: 'Cartes aux motifs zellige marocains.', priceEur: 2.99, priceCoins: 800, active: true, sortOrder: 6 },
          { name: 'Sally Plus (mensuel)', category: 'premium', description: 'Sans pub, défis illimités, avatars exclusifs.', priceEur: 4.99, active: true, sortOrder: 7 },
          { name: 'Boost XP x2 (24h)', category: 'boost', description: 'Double ton XP pendant 24 heures.', priceEur: 1.99, priceCoins: 600, active: true, sortOrder: 8 },
        ];
        for (const it of items) {
          await conn.collection('shop_items').updateOne(
            { name: it.name },
            { $set: { ...it, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
            { upsert: true },
          );
        }
        // ── shop_packages (coin packs) si absents ──
        const packs = [
          { productId: 'coins_100', coins: 100, priceEur: 0.99, label: '100 pièces', active: true, sortOrder: 1 },
          { productId: 'coins_500', coins: 500, priceEur: 4.99, label: '500 pièces', active: true, sortOrder: 2, bonus: 50 },
          { productId: 'coins_2000', coins: 2000, priceEur: 19.99, label: '2000 pièces', active: true, sortOrder: 3, bonus: 400 },
          { productId: 'coins_10000', coins: 10000, priceEur: 49.99, label: '10000 pièces', active: true, sortOrder: 4, bonus: 3000 },
        ];
        for (const pk of packs) {
          await conn.collection('shop_packages').updateOne(
            { productId: pk.productId },
            { $set: { ...pk, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
            { upsert: true },
          );
        }
        // ── 1 tournoi belote ouvert (fenêtre 30j, pour les écrans Tournois) ──
        await conn.collection('tournaments').updateOne(
          { code: 'SEED-belote-open' },
          {
            $set: {
              code: 'SEED-belote-open', type: 'daily', variant: 'belote', difficulty: 'medium',
              status: 'open', startsAt: now, endsAt: now + 30 * 24 * 3600 * 1000,
              prizes: [{ rank: 1, gold: 500 }, { rank: 2, gold: 250 }, { rank: 3, gold: 100 }],
              updatedAt: new Date(),
            },
            $setOnInsert: { entries: [], createdAt: new Date() },
          },
          { upsert: true },
        );
      },
    },
    {
      id: '005-seed-demo-account',
      description: 'Compte démo (demo@sallycards.com / Demo123456) dans toutes les collections *_users',
      up: async (conn) => {
        const bcrypt = require('bcrypt');
        const passwordHash = await bcrypt.hash('Demo123456', 12);
        const games = ['ronda', 'kdoub', 'belote', 'poker', 'tarot', 'scopa', 'okey', 'concentration', 'solitaire', 'quiestce', 'kantcopy'];
        const now = new Date();
        for (const gameType of games) {
          await conn.collection(`${gameType}_users`).updateOne(
            { email: 'demo@sallycards.com' },
            {
              $set: {
                email: 'demo@sallycards.com',
                username: 'Demo',
                passwordHash,
                avatar: '',
                locale: 'fr',
                gameType,
                coins: 500,
                stats: { gamesPlayed: 0, gamesWon: 0, elo: 1000, winStreak: 0, bestWinStreak: 0, totalPlayTimeMs: 0 },
                settings: { theme: 'system', soundEnabled: true, hapticEnabled: true, language: 'fr', notificationsEnabled: true, autoMatchmaking: false, cardBackStyle: 'classic' },
                role: 'player',
                isGuest: false,
                status: 'offline',
                isVerified: true,
                updatedAt: now,
              },
              $setOnInsert: { friends: [], friendRequests: [], blockedUsers: [], deviceTokens: [], createdAt: now },
            },
            { upsert: true },
          );
        }
      },
    },
    {
      id: '006-seed-demo-belote-data',
      description: 'Seed démo Belote : niveau, vouchers, notifications, amis, défis sport, tournois, leaderboard',
      up: async (conn) => {
        const now = Date.now();
        const day = 24 * 3600 * 1000;
        const D = (ms: number) => new Date(ms);

        // userId = _id du compte démo dans ronda_users (gameType par défaut du login web)
        const demo = await conn.collection('ronda_users').findOne({ email: 'demo@sallycards.com' });
        if (!demo) return;
        const uid = demo._id.toString();

        // ── Niveau / XP Belote ──
        await conn.collection('levels').updateOne(
          { userId: uid, gameType: 'belote' },
          { $set: { userId: uid, gameType: 'belote', level: 7, xp: 180, nextLevelXp: 240, unlockedFeatures: ['Avatars animés', 'Thème Néon', 'Tournois VIP'], lastXpGainAt: D(now), updatedAt: D(now) }, $setOnInsert: { createdAt: D(now) } },
          { upsert: true },
        );

        // ── Bons d'achat ──
        const vouchers: any[] = [
          { code: 'BELOTE-AMZ-25', amount: 25, currency: 'EUR', providerStoreCode: 'amazon', reason: 'Vainqueur tournoi hebdo Belote', status: 'issued' },
          { code: 'BELOTE-GP-10', amount: 10, currency: 'EUR', providerStoreCode: 'google_play', reason: 'Palier niveau 5 atteint', status: 'issued' },
          { code: 'BELOTE-DECA-50', amount: 50, currency: 'MAD', providerStoreCode: 'decathlon', reason: 'Défi sport réussi', status: 'claimed' },
        ];
        for (const v of vouchers) {
          await conn.collection('rewards-vouchers').updateOne(
            { code: v.code },
            { $set: { ...v, userId: uid, issuedAt: D(now - 6 * day), expiresAt: D(now + 180 * day), ...(v.status === 'claimed' ? { claimedAt: D(now - 2 * day) } : {}), updatedAt: D(now) }, $setOnInsert: { createdAt: D(now) } },
            { upsert: true },
          );
        }

        // ── Notifications (idempotent par userId+title) ──
        const notifs: any[] = [
          { type: 'system', title: 'Bienvenue sur SallyCards', body: 'Ton compte démo est prêt. Découvre la Belote en ligne !', read: true, ago: 7 },
          { type: 'tournament', title: 'Tournoi Belote hebdo ouvert', body: 'Inscris-toi avant dimanche — 500 gold pour le 1er.', read: false, ago: 2 },
          { type: 'friend', title: 'Nouvelle demande d’ami', body: 'SaraMansouri souhaite t’ajouter en ami.', read: false, ago: 1 },
          { type: 'reward', title: 'Bon Amazon 25€ débloqué', body: 'Récupère-le dans l’onglet Récompenses.', read: false, ago: 0 },
        ];
        for (const n of notifs) {
          const set: any = { userId: uid, type: n.type, title: n.title, body: n.body, sentAt: D(now - n.ago * day) };
          if (n.read) set.readAt = D(now - n.ago * day + 3600 * 1000);
          await conn.collection('notifications').updateOne({ userId: uid, title: n.title }, { $set: set }, { upsert: true });
        }

        // ── Amis ──
        const friends: any[] = [
          { requesterId: uid, receiverId: 'AmineKabbaj', status: 'accepted' },
          { requesterId: uid, receiverId: 'NadiaReda', status: 'accepted' },
          { requesterId: 'YoussefTazi', receiverId: uid, status: 'accepted' },
          { requesterId: 'SaraMansouri', receiverId: uid, status: 'pending' },
          { requesterId: uid, receiverId: 'KarimLemrini', status: 'pending' },
        ];
        for (const f of friends) {
          await conn.collection('friends').updateOne(
            { requesterId: f.requesterId, receiverId: f.receiverId },
            { $set: { ...f, requestedAt: D(now - 5 * day), ...(f.status === 'accepted' ? { acceptedAt: D(now - 4 * day) } : {}) } },
            { upsert: true },
          );
        }

        // ── Défis sport (guard: seed une seule fois) ──
        const chCount = await conn.collection('challenges-sport').countDocuments({ $or: [{ userIdGiver: uid }, { userIdReceiver: uid }] });
        if (chCount === 0) {
          const A = { lat: 33.5731, lng: -7.5898, label: 'Place Mohammed V' };
          const B = { lat: 33.595, lng: -7.618, label: 'Corniche Aïn Diab' };
          await conn.collection('challenges-sport').insertMany([
            { userIdGiver: 'YoussefTazi', userIdReceiver: uid, gameType: 'belote', type: 'walk', distanceMeters: 1500, pointA: A, pointB: B, deadlineAt: D(now + 2 * day), status: 'in-progress', elapsedTimeMs: 0, rewardPoints: 50, gpsTrack: [], sharedOn: [], createdAt: D(now - day) },
            { userIdGiver: 'AmineKabbaj', userIdReceiver: uid, gameType: 'belote', type: 'run', distanceMeters: 3000, pointA: A, pointB: B, deadlineAt: D(now - day), status: 'done', elapsedTimeMs: 22 * 60000, rewardPoints: 80, completedAt: D(now - 3 * day), gpsTrack: [], sharedOn: [], createdAt: D(now - 6 * day) },
            { userIdGiver: uid, userIdReceiver: 'NadiaReda', gameType: 'belote', type: 'walk', distanceMeters: 2000, pointA: A, pointB: B, deadlineAt: D(now - 4 * day), status: 'done', elapsedTimeMs: 18 * 60000, rewardPoints: 60, completedAt: D(now - 5 * day), gpsTrack: [], sharedOn: [], createdAt: D(now - 8 * day) },
          ]);
        }

        // ── Tournois Belote (entries → participantsCount) ──
        const mkEntries = (k: number) => Array.from({ length: k }, (_, i) => ({ userId: `seed-${i}`, displayName: `Joueur ${i + 1}`, score: 1000 - i * 7 }));
        await conn.collection('tournaments').updateOne({ code: 'SEED-belote-open' }, { $set: { entries: mkEntries(18), updatedAt: D(now) } });
        await conn.collection('tournaments').updateOne(
          { code: 'SEED-belote-weekly' },
          { $set: { code: 'SEED-belote-weekly', type: 'weekly', variant: 'belote', difficulty: 'medium', status: 'open', startsAt: now, endsAt: now + 7 * day, prizes: [{ rank: 1, gold: 1000 }, { rank: 2, gold: 500 }, { rank: 3, gold: 250 }], entries: mkEntries(42), updatedAt: D(now) }, $setOnInsert: { createdAt: D(now) } },
          { upsert: true },
        );

        // ── Leaderboard belote_users ──
        await conn.collection('belote_users').updateOne(
          { email: 'demo@sallycards.com' },
          { $set: { 'stats.elo': 1428, 'stats.gamesPlayed': 64, 'stats.gamesWon': 41, isGuest: false, updatedAt: D(now) } },
        );
        const players: [string, string, number, number, number][] = [
          ['hamza_belote', 'Hamza', 2180, 412, 360],
          ['amine_cards', 'Amine', 2090, 380, 322],
          ['nadia_r', 'Nadia', 1980, 350, 288],
          ['youssef_t', 'Youssef', 1875, 300, 240],
          ['sara_m', 'Sara', 1790, 270, 205],
          ['karim_l', 'Karim', 1655, 240, 168],
          ['leila_b', 'Leila', 1540, 210, 138],
          ['omar_s', 'Omar', 1390, 180, 99],
          ['imane_z', 'Imane', 1260, 150, 70],
          ['rachid_a', 'Rachid', 1130, 120, 48],
          ['fatima_e', 'Fatima', 1015, 95, 33],
          ['mehdi_k', 'Mehdi', 930, 70, 20],
        ];
        for (const [email, username, elo, gp, gw] of players) {
          await conn.collection('belote_users').updateOne(
            { email: `${email}@sallycards.demo` },
            { $set: { email: `${email}@sallycards.demo`, username, gameType: 'belote', isGuest: false, role: 'player', avatar: '', locale: 'fr', stats: { elo, gamesPlayed: gp, gamesWon: gw, winStreak: 0, bestWinStreak: 0, totalPlayTimeMs: 0 }, updatedAt: D(now) }, $setOnInsert: { createdAt: D(now) } },
            { upsert: true },
          );
        }
      },
    },
    {
      id: '007-seed-scopa-tarot-data',
      description: 'Seed démo Scopa & Tarot : niveau/XP, tournois, leaderboard',
      up: async (conn) => {
        const now = Date.now();
        const day = 24 * 3600 * 1000;
        const D = (ms: number) => new Date(ms);
        const demo = await conn.collection('ronda_users').findOne({ email: 'demo@sallycards.com' });
        const uid = demo ? demo._id.toString() : null;

        const mkEntries = (k: number) => Array.from({ length: k }, (_, i) => ({ userId: `seed-${i}`, displayName: `Joueur ${i + 1}`, score: 1000 - i * 7 }));
        const rosters: Record<string, [string, string, number, number, number][]> = {
          scopa: [
            ['gennaro_na', 'Gennaro', 2120, 360, 300], ['marco_roma', 'Marco', 2010, 320, 258], ['luca_sici', 'Luca', 1930, 290, 222],
            ['sofia_mi', 'Sofia', 1840, 260, 190], ['giulia_to', 'Giulia', 1760, 230, 158], ['paolo_ve', 'Paolo', 1640, 200, 124],
            ['chiara_fi', 'Chiara', 1520, 175, 96], ['matteo_ge', 'Matteo', 1380, 150, 70], ['elena_bo', 'Elena', 1250, 125, 50],
            ['davide_pa', 'Davide', 1120, 100, 34], ['anna_ca', 'Anna', 1010, 80, 24], ['rosa_tr', 'Rosa', 920, 60, 15],
          ],
          tarot: [
            ['henri_paris', 'Henri', 2150, 380, 322], ['claire_lyon', 'Claire', 2040, 340, 280], ['julien_marseille', 'Julien', 1950, 300, 236],
            ['marie_lille', 'Marie', 1860, 270, 198], ['thomas_nantes', 'Thomas', 1770, 240, 162], ['camille_nice', 'Camille', 1650, 210, 128],
            ['lucas_rennes', 'Lucas', 1530, 180, 98], ['emma_toulouse', 'Emma', 1390, 155, 72], ['hugo_bordeaux', 'Hugo', 1260, 130, 52],
            ['lea_strasbourg', 'Léa', 1130, 105, 36], ['nathan_dijon', 'Nathan', 1010, 85, 26], ['jade_reims', 'Jade', 925, 65, 16],
          ],
        };
        const games: { gt: string; level: number; xp: number; next: number; feats: string[] }[] = [
          { gt: 'scopa', level: 5, xp: 120, next: 200, feats: ['Tapis Napoli', 'Deck Sicilia'] },
          { gt: 'tarot', level: 6, xp: 150, next: 220, feats: ['Atouts dorés', 'Tapis velours'] },
        ];

        for (const g of games) {
          if (uid) {
            await conn.collection('levels').updateOne(
              { userId: uid, gameType: g.gt },
              { $set: { userId: uid, gameType: g.gt, level: g.level, xp: g.xp, nextLevelXp: g.next, unlockedFeatures: g.feats, lastXpGainAt: D(now), updatedAt: D(now) }, $setOnInsert: { createdAt: D(now) } },
              { upsert: true },
            );
          }
          await conn.collection('tournaments').updateOne(
            { code: `SEED-${g.gt}-open` },
            { $set: { code: `SEED-${g.gt}-open`, type: 'daily', variant: g.gt, difficulty: 'medium', status: 'open', startsAt: now, endsAt: now + 30 * day, prizes: [{ rank: 1, gold: 500 }, { rank: 2, gold: 250 }, { rank: 3, gold: 100 }], entries: mkEntries(14), updatedAt: D(now) }, $setOnInsert: { createdAt: D(now) } },
            { upsert: true },
          );
          await conn.collection('tournaments').updateOne(
            { code: `SEED-${g.gt}-weekly` },
            { $set: { code: `SEED-${g.gt}-weekly`, type: 'weekly', variant: g.gt, difficulty: 'medium', status: 'open', startsAt: now, endsAt: now + 7 * day, prizes: [{ rank: 1, gold: 1000 }, { rank: 2, gold: 500 }, { rank: 3, gold: 250 }], entries: mkEntries(33), updatedAt: D(now) }, $setOnInsert: { createdAt: D(now) } },
            { upsert: true },
          );
          for (const [email, username, elo, gp, gw] of (rosters[g.gt] || [])) {
            await conn.collection(`${g.gt}_users`).updateOne(
              { email: `${email}@sallycards.demo` },
              { $set: { email: `${email}@sallycards.demo`, username, gameType: g.gt, isGuest: false, role: 'player', avatar: '', locale: 'fr', stats: { elo, gamesPlayed: gp, gamesWon: gw, winStreak: 0, bestWinStreak: 0, totalPlayTimeMs: 0 }, updatedAt: D(now) }, $setOnInsert: { createdAt: D(now) } },
              { upsert: true },
            );
          }
          await conn.collection(`${g.gt}_users`).updateOne(
            { email: 'demo@sallycards.com' },
            { $set: { 'stats.elo': 1395, 'stats.gamesPlayed': 42, 'stats.gamesWon': 25, isGuest: false, updatedAt: D(now) } },
          );
        }
      },
    },
    {
      id: '008-seed-admin-account',
      description: 'Compte admin (admin@sallycards.com / Admin123456) rôle admin dans toutes les collections *_users',
      up: async (conn) => {
        const bcrypt = require('bcrypt');
        const passwordHash = await bcrypt.hash('Admin123456', 12);
        const games = ['ronda', 'kdoub', 'belote', 'poker', 'tarot', 'scopa', 'okey', 'concentration', 'solitaire', 'quiestce', 'kantcopy'];
        const now = new Date();
        for (const gameType of games) {
          await conn.collection(`${gameType}_users`).updateOne(
            { email: 'admin@sallycards.com' },
            {
              $set: {
                email: 'admin@sallycards.com', username: 'Admin', passwordHash, avatar: '', locale: 'fr', gameType,
                coins: 9999,
                stats: { gamesPlayed: 0, gamesWon: 0, elo: 1000, winStreak: 0, bestWinStreak: 0, totalPlayTimeMs: 0 },
                settings: { theme: 'system', soundEnabled: true, hapticEnabled: true, language: 'fr', notificationsEnabled: true, autoMatchmaking: false, cardBackStyle: 'classic' },
                role: 'admin', isGuest: false, status: 'offline', isVerified: true, updatedAt: now,
              },
              $setOnInsert: { friends: [], friendRequests: [], blockedUsers: [], deviceTokens: [], createdAt: now },
            },
            { upsert: true },
          );
        }
      },
    },
    {
      id: '009-seed-admin-data',
      description: 'Seed admin : profil (niveaux/vouchers/notifs), tournois ADM-*, activité étalée 30j',
      up: async (conn) => {
        const now = Date.now();
        const day = 24 * 3600 * 1000;
        const D = (ms: number) => new Date(ms);
        const admin = await conn.collection('ronda_users').findOne({ email: 'admin@sallycards.com' });
        if (!admin) return;
        const uid = admin._id.toString();

        for (const gt of ['belote', 'scopa', 'tarot']) {
          await conn.collection('levels').updateOne(
            { userId: uid, gameType: gt },
            { $set: { userId: uid, gameType: gt, level: 12, xp: 300, nextLevelXp: 400, unlockedFeatures: ['Badge Admin', 'Avatars exclusifs'], lastXpGainAt: D(now), updatedAt: D(now) }, $setOnInsert: { createdAt: D(now) } },
            { upsert: true },
          );
        }

        const vouchers: any[] = [
          { code: 'ADMIN-AMZ-100', amount: 100, currency: 'EUR', providerStoreCode: 'amazon', reason: 'Dotation admin', status: 'issued' },
          { code: 'ADMIN-GP-50', amount: 50, currency: 'EUR', providerStoreCode: 'google_play', reason: 'Dotation admin', status: 'issued' },
        ];
        for (const v of vouchers) {
          await conn.collection('rewards-vouchers').updateOne(
            { code: v.code },
            { $set: { ...v, userId: uid, issuedAt: D(now), expiresAt: D(now + 365 * day), updatedAt: D(now) }, $setOnInsert: { createdAt: D(now) } },
            { upsert: true },
          );
        }

        const notifs: any[] = [
          { title: 'Bienvenue Admin', body: 'Accès au tableau de bord SallyAdmin.', read: true, ago: 3 },
          { title: 'Pic d’inscriptions', body: 'Beaucoup de nouveaux joueurs aujourd’hui.', read: false, ago: 0 },
          { title: 'Tournoi à surveiller', body: 'Un tournoi hebdo arrive à échéance.', read: false, ago: 1 },
        ];
        for (const n of notifs) {
          const set: any = { userId: uid, type: 'system', title: n.title, body: n.body, sentAt: D(now - n.ago * day) };
          if (n.read) set.readAt = D(now - n.ago * day + 3600000);
          await conn.collection('notifications').updateOne({ userId: uid, title: n.title }, { $set: set }, { upsert: true });
        }

        await conn.collection('belote_users').updateOne(
          { email: 'admin@sallycards.com' },
          { $set: { 'stats.elo': 1800, 'stats.gamesPlayed': 120, 'stats.gamesWon': 90, isGuest: false, updatedAt: D(now) } },
        );

        const entries = (k: number) => Array.from({ length: k }, (_, i) => ({ userId: `seed-${i}`, displayName: `Joueur ${i + 1}`, score: 1500 - i * 9 }));
        for (const gt of ['belote', 'scopa', 'tarot']) {
          await conn.collection('tournaments').updateOne(
            { code: `ADM-${gt}-monthly` },
            { $set: { code: `ADM-${gt}-monthly`, type: 'monthly', variant: gt, difficulty: 'medium', status: 'open', startsAt: now, endsAt: now + 30 * day, prizes: [{ rank: 1, gold: 2000 }, { rank: 2, gold: 1000 }, { rank: 3, gold: 500 }], entries: entries(24), updatedAt: D(now) }, $setOnInsert: { createdAt: D(now) } },
            { upsert: true },
          );
        }

        // Activité étalée sur 30 j : backdate les joueurs seedés (@sallycards.demo)
        for (const gt of ['belote', 'scopa', 'tarot']) {
          const seeded = await conn.collection(`${gt}_users`).find({ email: { $regex: '@sallycards.demo$' } }, { projection: { _id: 1 } }).toArray();
          let i = 0;
          for (const u of seeded) {
            await conn.collection(`${gt}_users`).updateOne({ _id: u._id }, { $set: { createdAt: D(now - (i % 28) * day - Math.floor(Math.random() * day)) } });
            i++;
          }
        }
      },
    },
    {
      id: '010-seed-game-history',
      description: 'Seed historique de parties (game_history) étalé sur 30j → graphe parties/jour réel',
      up: async (conn) => {
        const existing = await conn.collection('game_history').countDocuments({ gameId: { $regex: '^seed-' } });
        if (existing > 0) return;
        const now = Date.now();
        const day = 24 * 3600 * 1000;
        const counts: Record<string, number> = { belote: 220, scopa: 160, tarot: 160, ronda: 60, kdoub: 40 };
        const docs: any[] = [];
        let n = 0;
        for (const gt of Object.keys(counts)) {
          for (let i = 0; i < counts[gt]; i++) {
            const ago = Math.floor(Math.random() * 30);
            const ended = new Date(now - ago * day - Math.floor(Math.random() * day));
            const dur = 120 + Math.floor(Math.random() * 600);
            docs.push({ gameId: `seed-${gt}-${n++}`, gameType: gt, players: [], result: {}, duration: dur, mode: 'online', startedAt: new Date(ended.getTime() - dur * 1000), endedAt: ended, createdAt: ended, updatedAt: ended });
          }
        }
        for (let i = 0; i < docs.length; i += 200) await conn.collection('game_history').insertMany(docs.slice(i, i + 200));
      },
    },
    {
      id: '011-seed-okey-quiestce-data',
      description: 'Seed Okey & Qui-est-ce : niveau/XP, tournois, leaderboard, historique parties',
      up: async (conn) => {
        const now = Date.now();
        const day = 24 * 3600 * 1000;
        const D = (ms: number) => new Date(ms);
        const demo = await conn.collection('ronda_users').findOne({ email: 'demo@sallycards.com' });
        const uid = demo ? demo._id.toString() : null;

        const mkEntries = (k: number) => Array.from({ length: k }, (_, i) => ({ userId: `seed-${i}`, displayName: `Joueur ${i + 1}`, score: 1000 - i * 7 }));
        const rosters: Record<string, [string, string, number, number, number][]> = {
          okey: [
            ['mehmet_ist', 'Mehmet', 2180, 410, 340], ['ayse_ank', 'Ayşe', 2060, 360, 290], ['mustafa_izm', 'Mustafa', 1970, 320, 248],
            ['zeynep_bur', 'Zeynep', 1870, 285, 206], ['emre_ada', 'Emre', 1780, 250, 168], ['elif_ant', 'Elif', 1660, 220, 132],
            ['burak_kon', 'Burak', 1540, 190, 100], ['deniz_gaz', 'Deniz', 1400, 162, 74], ['cem_mer', 'Cem', 1270, 135, 54],
            ['selin_kay', 'Selin', 1140, 108, 38], ['kerem_esk', 'Kerem', 1020, 88, 27], ['derya_sam', 'Derya', 930, 66, 17],
          ],
          quiestce: [
            ['leon_paris', 'Léon', 2090, 300, 250], ['alice_lyon', 'Alice', 1990, 270, 214], ['victor_lille', 'Victor', 1900, 240, 180],
            ['rose_nantes', 'Rose', 1810, 215, 150], ['gaspard_nice', 'Gaspard', 1720, 190, 122], ['jeanne_rennes', 'Jeanne', 1600, 165, 96],
            ['theo_tours', 'Théo', 1490, 142, 74], ['manon_metz', 'Manon', 1360, 120, 56], ['noe_brest', 'Noé', 1240, 100, 40],
            ['lina_caen', 'Lina', 1120, 82, 28], ['sacha_pau', 'Sacha', 1010, 64, 20], ['zoe_arras', 'Zoé', 920, 48, 12],
          ],
        };
        const games: { gt: string; level: number; xp: number; next: number; feats: string[] }[] = [
          { gt: 'okey', level: 5, xp: 110, next: 200, feats: ['Tuiles ivoire', 'Chevalet bois'] },
          { gt: 'quiestce', level: 4, xp: 90, next: 180, feats: ['Galerie déco', 'Indices bonus'] },
        ];

        for (const g of games) {
          if (uid) {
            await conn.collection('levels').updateOne(
              { userId: uid, gameType: g.gt },
              { $set: { userId: uid, gameType: g.gt, level: g.level, xp: g.xp, nextLevelXp: g.next, unlockedFeatures: g.feats, lastXpGainAt: D(now), updatedAt: D(now) }, $setOnInsert: { createdAt: D(now) } },
              { upsert: true },
            );
          }
          await conn.collection('tournaments').updateOne(
            { code: `SEED-${g.gt}-open` },
            { $set: { code: `SEED-${g.gt}-open`, type: 'daily', variant: g.gt, difficulty: 'medium', status: 'open', startsAt: now, endsAt: now + 30 * day, prizes: [{ rank: 1, gold: 500 }, { rank: 2, gold: 250 }, { rank: 3, gold: 100 }], entries: mkEntries(14), updatedAt: D(now) }, $setOnInsert: { createdAt: D(now) } },
            { upsert: true },
          );
          await conn.collection('tournaments').updateOne(
            { code: `SEED-${g.gt}-weekly` },
            { $set: { code: `SEED-${g.gt}-weekly`, type: 'weekly', variant: g.gt, difficulty: 'medium', status: 'open', startsAt: now, endsAt: now + 7 * day, prizes: [{ rank: 1, gold: 1000 }, { rank: 2, gold: 500 }, { rank: 3, gold: 250 }], entries: mkEntries(33), updatedAt: D(now) }, $setOnInsert: { createdAt: D(now) } },
            { upsert: true },
          );
          for (const [email, username, elo, gp, gw] of (rosters[g.gt] || [])) {
            await conn.collection(`${g.gt}_users`).updateOne(
              { email: `${email}@sallycards.demo` },
              { $set: { email: `${email}@sallycards.demo`, username, gameType: g.gt, isGuest: false, role: 'player', avatar: '', locale: 'fr', stats: { elo, gamesPlayed: gp, gamesWon: gw, winStreak: 0, bestWinStreak: 0, totalPlayTimeMs: 0 }, updatedAt: D(now) }, $setOnInsert: { createdAt: D(now) } },
              { upsert: true },
            );
          }
          await conn.collection(`${g.gt}_users`).updateOne(
            { email: 'demo@sallycards.com' },
            { $set: { 'stats.elo': g.gt === 'okey' ? 1410 : 1320, 'stats.gamesPlayed': g.gt === 'okey' ? 38 : 22, 'stats.gamesWon': g.gt === 'okey' ? 21 : 13, isGuest: false, updatedAt: D(now) } },
          );
        }

        // Historique de parties pour le graphe parties/jour (Okey/Qui-est-ce).
        const existing = await conn.collection('game_history').countDocuments({ gameId: { $regex: '^seed-okey-|^seed-quiestce-' } });
        if (existing === 0) {
          const counts: Record<string, number> = { okey: 140, quiestce: 90 };
          const docs: any[] = [];
          let n = 0;
          for (const gt of Object.keys(counts)) {
            for (let i = 0; i < counts[gt]; i++) {
              const ago = Math.floor(Math.random() * 30);
              const ended = new Date(now - ago * day - Math.floor(Math.random() * day));
              const dur = 120 + Math.floor(Math.random() * 600);
              docs.push({ gameId: `seed-${gt}-${n++}`, gameType: gt, players: [], result: {}, duration: dur, mode: 'online', startedAt: new Date(ended.getTime() - dur * 1000), endedAt: ended, createdAt: ended, updatedAt: ended });
            }
          }
          for (let i = 0; i < docs.length; i += 200) await conn.collection('game_history').insertMany(docs.slice(i, i + 200));
        }
      },
    },
    {
      id: '012-seed-kdoub-data',
      description: 'Seed Kdoub : niveau/XP, tournois, leaderboard, historique parties',
      up: async (conn) => {
        const now = Date.now();
        const day = 24 * 3600 * 1000;
        const D = (ms: number) => new Date(ms);
        const demo = await conn.collection('ronda_users').findOne({ email: 'demo@sallycards.com' });
        const uid = demo ? demo._id.toString() : null;
        const mkEntries = (k: number) => Array.from({ length: k }, (_, i) => ({ userId: `seed-${i}`, displayName: `Joueur ${i + 1}`, score: 1000 - i * 7 }));
        const roster: [string, string, number, number, number][] = [
          ['hamza_casa', 'Hamza', 2160, 400, 330], ['fatima_rabat', 'Fatima', 2050, 355, 286], ['youssef_fes', 'Youssef', 1960, 315, 244],
          ['amina_marrakech', 'Amina', 1870, 282, 204], ['omar_tanger', 'Omar', 1780, 248, 166], ['khadija_agadir', 'Khadija', 1660, 218, 130],
          ['mehdi_oujda', 'Mehdi', 1540, 188, 98], ['salma_tetouan', 'Salma', 1400, 160, 72], ['rachid_meknes', 'Rachid', 1270, 134, 53],
          ['nadia_kenitra', 'Nadia', 1140, 107, 37], ['karim_safi', 'Karim', 1020, 87, 26], ['houda_nador', 'Houda', 930, 65, 16],
        ];
        if (uid) {
          await conn.collection('levels').updateOne(
            { userId: uid, gameType: 'kdoub' },
            { $set: { userId: uid, gameType: 'kdoub', level: 5, xp: 130, nextLevelXp: 210, unlockedFeatures: ['Tapis souk', 'Dos de cartes zellige'], lastXpGainAt: D(now), updatedAt: D(now) }, $setOnInsert: { createdAt: D(now) } },
            { upsert: true },
          );
        }
        await conn.collection('tournaments').updateOne(
          { code: 'SEED-kdoub-open' },
          { $set: { code: 'SEED-kdoub-open', type: 'daily', variant: 'kdoub', difficulty: 'medium', status: 'open', startsAt: now, endsAt: now + 30 * day, prizes: [{ rank: 1, gold: 500 }, { rank: 2, gold: 250 }, { rank: 3, gold: 100 }], entries: mkEntries(14), updatedAt: D(now) }, $setOnInsert: { createdAt: D(now) } },
          { upsert: true },
        );
        await conn.collection('tournaments').updateOne(
          { code: 'SEED-kdoub-weekly' },
          { $set: { code: 'SEED-kdoub-weekly', type: 'weekly', variant: 'kdoub', difficulty: 'medium', status: 'open', startsAt: now, endsAt: now + 7 * day, prizes: [{ rank: 1, gold: 1000 }, { rank: 2, gold: 500 }, { rank: 3, gold: 250 }], entries: mkEntries(33), updatedAt: D(now) }, $setOnInsert: { createdAt: D(now) } },
          { upsert: true },
        );
        for (const [email, username, elo, gp, gw] of roster) {
          await conn.collection('kdoub_users').updateOne(
            { email: `${email}@sallycards.demo` },
            { $set: { email: `${email}@sallycards.demo`, username, gameType: 'kdoub', isGuest: false, role: 'player', avatar: '', locale: 'fr', stats: { elo, gamesPlayed: gp, gamesWon: gw, winStreak: 0, bestWinStreak: 0, totalPlayTimeMs: 0 }, updatedAt: D(now) }, $setOnInsert: { createdAt: D(now) } },
            { upsert: true },
          );
        }
        await conn.collection('kdoub_users').updateOne(
          { email: 'demo@sallycards.com' },
          { $set: { 'stats.elo': 1380, 'stats.gamesPlayed': 30, 'stats.gamesWon': 17, isGuest: false, updatedAt: D(now) } },
        );
        const existing = await conn.collection('game_history').countDocuments({ gameId: { $regex: '^seed-kdoub-' } });
        if (existing === 0) {
          const docs: any[] = [];
          for (let i = 0; i < 120; i++) {
            const ago = Math.floor(Math.random() * 30);
            const ended = new Date(now - ago * day - Math.floor(Math.random() * day));
            const dur = 120 + Math.floor(Math.random() * 600);
            docs.push({ gameId: `seed-kdoub-${i}`, gameType: 'kdoub', players: [], result: {}, duration: dur, mode: 'online', startedAt: new Date(ended.getTime() - dur * 1000), endedAt: ended, createdAt: ended, updatedAt: ended });
          }
          for (let i = 0; i < docs.length; i += 200) await conn.collection('game_history').insertMany(docs.slice(i, i + 200));
        }
      },
    },
    {
      id: '013-seed-kantcopy-data',
      description: 'Seed Kant Copy : niveau/XP, tournois, leaderboard, historique parties',
      up: async (conn) => {
        const now = Date.now();
        const day = 24 * 3600 * 1000;
        const D = (ms: number) => new Date(ms);
        const demo = await conn.collection('ronda_users').findOne({ email: 'demo@sallycards.com' });
        const uid = demo ? demo._id.toString() : null;
        const mkEntries = (k: number) => Array.from({ length: k }, (_, i) => ({ userId: `seed-${i}`, displayName: `Joueur ${i + 1}`, score: 1000 - i * 7 }));
        const roster: [string, string, number, number, number][] = [
          ['yassine_casa', 'Yassine', 2150, 395, 325], ['imane_rabat', 'Imane', 2045, 352, 282], ['bilal_fes', 'Bilal', 1955, 312, 240],
          ['sara_marrakech', 'Sara', 1865, 280, 202], ['anas_tanger', 'Anas', 1775, 246, 164], ['ghita_agadir', 'Ghita', 1655, 216, 128],
          ['zakaria_oujda', 'Zakaria', 1535, 186, 97], ['meryem_tetouan', 'Meryem', 1395, 158, 71], ['othmane_meknes', 'Othmane', 1265, 132, 52],
          ['hind_kenitra', 'Hind', 1135, 106, 36], ['reda_safi', 'Reda', 1015, 86, 25], ['asmae_nador', 'Asmae', 925, 64, 15],
        ];
        if (uid) {
          await conn.collection('levels').updateOne(
            { userId: uid, gameType: 'kantcopy' },
            { $set: { userId: uid, gameType: 'kantcopy', level: 4, xp: 95, nextLevelXp: 190, unlockedFeatures: ['Tapis équipe', 'Signaux dorés'], lastXpGainAt: D(now), updatedAt: D(now) }, $setOnInsert: { createdAt: D(now) } },
            { upsert: true },
          );
        }
        await conn.collection('tournaments').updateOne(
          { code: 'SEED-kantcopy-open' },
          { $set: { code: 'SEED-kantcopy-open', type: 'daily', variant: 'kantcopy', difficulty: 'medium', status: 'open', startsAt: now, endsAt: now + 30 * day, prizes: [{ rank: 1, gold: 500 }, { rank: 2, gold: 250 }, { rank: 3, gold: 100 }], entries: mkEntries(14), updatedAt: D(now) }, $setOnInsert: { createdAt: D(now) } },
          { upsert: true },
        );
        await conn.collection('tournaments').updateOne(
          { code: 'SEED-kantcopy-weekly' },
          { $set: { code: 'SEED-kantcopy-weekly', type: 'weekly', variant: 'kantcopy', difficulty: 'medium', status: 'open', startsAt: now, endsAt: now + 7 * day, prizes: [{ rank: 1, gold: 1000 }, { rank: 2, gold: 500 }, { rank: 3, gold: 250 }], entries: mkEntries(33), updatedAt: D(now) }, $setOnInsert: { createdAt: D(now) } },
          { upsert: true },
        );
        for (const [email, username, elo, gp, gw] of roster) {
          await conn.collection('kantcopy_users').updateOne(
            { email: `${email}@sallycards.demo` },
            { $set: { email: `${email}@sallycards.demo`, username, gameType: 'kantcopy', isGuest: false, role: 'player', avatar: '', locale: 'fr', stats: { elo, gamesPlayed: gp, gamesWon: gw, winStreak: 0, bestWinStreak: 0, totalPlayTimeMs: 0 }, updatedAt: D(now) }, $setOnInsert: { createdAt: D(now) } },
            { upsert: true },
          );
        }
        await conn.collection('kantcopy_users').updateOne(
          { email: 'demo@sallycards.com' },
          { $set: { 'stats.elo': 1360, 'stats.gamesPlayed': 26, 'stats.gamesWon': 15, isGuest: false, updatedAt: D(now) } },
        );
        const existing = await conn.collection('game_history').countDocuments({ gameId: { $regex: '^seed-kantcopy-' } });
        if (existing === 0) {
          const docs: any[] = [];
          for (let i = 0; i < 110; i++) {
            const ago = Math.floor(Math.random() * 30);
            const ended = new Date(now - ago * day - Math.floor(Math.random() * day));
            const dur = 120 + Math.floor(Math.random() * 600);
            docs.push({ gameId: `seed-kantcopy-${i}`, gameType: 'kantcopy', players: [], result: {}, duration: dur, mode: 'online', startedAt: new Date(ended.getTime() - dur * 1000), endedAt: ended, createdAt: ended, updatedAt: ended });
          }
          for (let i = 0; i < docs.length; i += 200) await conn.collection('game_history').insertMany(docs.slice(i, i + 200));
        }
      },
    },
    {
      id: '014-seed-concentration-data',
      description: 'Seed Concentration : niveau/XP, tournois, leaderboard, historique parties',
      up: async (conn) => {
        const now = Date.now();
        const day = 24 * 3600 * 1000;
        const D = (ms: number) => new Date(ms);
        const demo = await conn.collection('ronda_users').findOne({ email: 'demo@sallycards.com' });
        const uid = demo ? demo._id.toString() : null;
        const mkEntries = (k: number) => Array.from({ length: k }, (_, i) => ({ userId: `seed-${i}`, displayName: `Joueur ${i + 1}`, score: 1000 - i * 7 }));
        const roster: [string, string, number, number, number][] = [
          ['mia_paris', 'Mia', 2140, 420, 360], ['noah_lyon', 'Noah', 2035, 380, 312], ['olivia_lille', 'Olivia', 1945, 340, 270],
          ['liam_nantes', 'Liam', 1855, 305, 232], ['ava_nice', 'Ava', 1765, 270, 192], ['ethan_rennes', 'Ethan', 1645, 238, 152],
          ['sofia_tours', 'Sofia', 1525, 205, 116], ['lucas_metz', 'Lucas', 1385, 175, 86], ['chloe_brest', 'Chloé', 1255, 145, 62],
          ['adam_caen', 'Adam', 1125, 116, 42], ['nina_pau', 'Nina', 1015, 92, 30], ['leo_arras', 'Leo', 925, 70, 18],
        ];
        if (uid) {
          await conn.collection('levels').updateOne(
            { userId: uid, gameType: 'concentration' },
            { $set: { userId: uid, gameType: 'concentration', level: 6, xp: 140, nextLevelXp: 220, unlockedFeatures: ['Dos néon', 'Grille 6×6'], lastXpGainAt: D(now), updatedAt: D(now) }, $setOnInsert: { createdAt: D(now) } },
            { upsert: true },
          );
        }
        await conn.collection('tournaments').updateOne(
          { code: 'SEED-concentration-open' },
          { $set: { code: 'SEED-concentration-open', type: 'daily', variant: 'concentration', difficulty: 'medium', status: 'open', startsAt: now, endsAt: now + 30 * day, prizes: [{ rank: 1, gold: 500 }, { rank: 2, gold: 250 }, { rank: 3, gold: 100 }], entries: mkEntries(14), updatedAt: D(now) }, $setOnInsert: { createdAt: D(now) } },
          { upsert: true },
        );
        await conn.collection('tournaments').updateOne(
          { code: 'SEED-concentration-weekly' },
          { $set: { code: 'SEED-concentration-weekly', type: 'weekly', variant: 'concentration', difficulty: 'medium', status: 'open', startsAt: now, endsAt: now + 7 * day, prizes: [{ rank: 1, gold: 1000 }, { rank: 2, gold: 500 }, { rank: 3, gold: 250 }], entries: mkEntries(33), updatedAt: D(now) }, $setOnInsert: { createdAt: D(now) } },
          { upsert: true },
        );
        for (const [email, username, elo, gp, gw] of roster) {
          await conn.collection('concentration_users').updateOne(
            { email: `${email}@sallycards.demo` },
            { $set: { email: `${email}@sallycards.demo`, username, gameType: 'concentration', isGuest: false, role: 'player', avatar: '', locale: 'fr', stats: { elo, gamesPlayed: gp, gamesWon: gw, winStreak: 0, bestWinStreak: 0, totalPlayTimeMs: 0 }, updatedAt: D(now) }, $setOnInsert: { createdAt: D(now) } },
            { upsert: true },
          );
        }
        await conn.collection('concentration_users').updateOne(
          { email: 'demo@sallycards.com' },
          { $set: { 'stats.elo': 1430, 'stats.gamesPlayed': 44, 'stats.gamesWon': 28, isGuest: false, updatedAt: D(now) } },
        );
        const existing = await conn.collection('game_history').countDocuments({ gameId: { $regex: '^seed-concentration-' } });
        if (existing === 0) {
          const docs: any[] = [];
          for (let i = 0; i < 130; i++) {
            const ago = Math.floor(Math.random() * 30);
            const ended = new Date(now - ago * day - Math.floor(Math.random() * day));
            const dur = 60 + Math.floor(Math.random() * 360);
            docs.push({ gameId: `seed-concentration-${i}`, gameType: 'concentration', players: [], result: {}, duration: dur, mode: 'online', startedAt: new Date(ended.getTime() - dur * 1000), endedAt: ended, createdAt: ended, updatedAt: ended });
          }
          for (let i = 0; i < docs.length; i += 200) await conn.collection('game_history').insertMany(docs.slice(i, i + 200));
        }
      },
    },
    {
      id: '015-seed-poker-data',
      description: 'Seed Poker : niveau/XP, tournois, leaderboard, historique parties',
      up: async (conn) => {
        const now = Date.now();
        const day = 24 * 3600 * 1000;
        const D = (ms: number) => new Date(ms);
        const demo = await conn.collection('ronda_users').findOne({ email: 'demo@sallycards.com' });
        const uid = demo ? demo._id.toString() : null;
        const mkEntries = (k: number) => Array.from({ length: k }, (_, i) => ({ userId: `seed-${i}`, displayName: `Joueur ${i + 1}`, score: 1000 - i * 7 }));
        const roster: [string, string, number, number, number][] = [
          ['carlos_madrid', 'Carlos', 2230, 460, 380], ['maria_sevilla', 'Maria', 2110, 410, 330], ['pedro_valencia', 'Pedro', 2010, 360, 286],
          ['lucia_bilbao', 'Lucia', 1910, 320, 244], ['diego_malaga', 'Diego', 1810, 286, 206], ['carmen_zaragoza', 'Carmen', 1680, 250, 164],
          ['javier_murcia', 'Javier', 1550, 214, 122], ['elena_palma', 'Elena', 1410, 180, 90], ['mateo_vigo', 'Mateo', 1275, 150, 64],
          ['paula_gijon', 'Paula', 1140, 120, 44], ['sergio_coruna', 'Sergio', 1020, 95, 31], ['rosa_granada', 'Rosa', 930, 70, 18],
        ];
        if (uid) {
          await conn.collection('levels').updateOne(
            { userId: uid, gameType: 'poker' },
            { $set: { userId: uid, gameType: 'poker', level: 7, xp: 160, nextLevelXp: 240, unlockedFeatures: ['Tapis VIP', 'Jetons or'], lastXpGainAt: D(now), updatedAt: D(now) }, $setOnInsert: { createdAt: D(now) } },
            { upsert: true },
          );
        }
        await conn.collection('tournaments').updateOne(
          { code: 'SEED-poker-open' },
          { $set: { code: 'SEED-poker-open', type: 'daily', variant: 'poker', difficulty: 'medium', status: 'open', startsAt: now, endsAt: now + 30 * day, prizes: [{ rank: 1, gold: 500 }, { rank: 2, gold: 250 }, { rank: 3, gold: 100 }], entries: mkEntries(14), updatedAt: D(now) }, $setOnInsert: { createdAt: D(now) } },
          { upsert: true },
        );
        await conn.collection('tournaments').updateOne(
          { code: 'SEED-poker-weekly' },
          { $set: { code: 'SEED-poker-weekly', type: 'weekly', variant: 'poker', difficulty: 'hard', status: 'open', startsAt: now, endsAt: now + 7 * day, prizes: [{ rank: 1, gold: 2000 }, { rank: 2, gold: 1000 }, { rank: 3, gold: 500 }], entries: mkEntries(48), updatedAt: D(now) }, $setOnInsert: { createdAt: D(now) } },
          { upsert: true },
        );
        for (const [email, username, elo, gp, gw] of roster) {
          await conn.collection('poker_users').updateOne(
            { email: `${email}@sallycards.demo` },
            { $set: { email: `${email}@sallycards.demo`, username, gameType: 'poker', isGuest: false, role: 'player', avatar: '', locale: 'fr', stats: { elo, gamesPlayed: gp, gamesWon: gw, winStreak: 0, bestWinStreak: 0, totalPlayTimeMs: 0 }, updatedAt: D(now) }, $setOnInsert: { createdAt: D(now) } },
            { upsert: true },
          );
        }
        await conn.collection('poker_users').updateOne(
          { email: 'demo@sallycards.com' },
          { $set: { 'stats.elo': 1450, 'stats.gamesPlayed': 52, 'stats.gamesWon': 31, isGuest: false, updatedAt: D(now) } },
        );
        const existing = await conn.collection('game_history').countDocuments({ gameId: { $regex: '^seed-poker-' } });
        if (existing === 0) {
          const docs: any[] = [];
          for (let i = 0; i < 150; i++) {
            const ago = Math.floor(Math.random() * 30);
            const ended = new Date(now - ago * day - Math.floor(Math.random() * day));
            const dur = 180 + Math.floor(Math.random() * 900);
            docs.push({ gameId: `seed-poker-${i}`, gameType: 'poker', players: [], result: {}, duration: dur, mode: 'online', startedAt: new Date(ended.getTime() - dur * 1000), endedAt: ended, createdAt: ended, updatedAt: ended });
          }
          for (let i = 0; i < docs.length; i += 200) await conn.collection('game_history').insertMany(docs.slice(i, i + 200));
        }
      },
    },
    {
      id: '016-seed-ronda-data',
      description: 'Seed Ronda : niveau/XP, tournois, leaderboard, historique parties',
      up: async (conn) => {
        const now = Date.now();
        const day = 24 * 3600 * 1000;
        const D = (ms: number) => new Date(ms);
        const demo = await conn.collection('ronda_users').findOne({ email: 'demo@sallycards.com' });
        const uid = demo ? demo._id.toString() : null;
        const mkEntries = (k: number) => Array.from({ length: k }, (_, i) => ({ userId: `seed-${i}`, displayName: `Joueur ${i + 1}`, score: 1000 - i * 7 }));
        const roster: [string, string, number, number, number][] = [
          ['hamza_casa', 'Hamza', 2200, 450, 372], ['fatima_rabat', 'Fatima', 2080, 405, 322], ['youssef_fes', 'Youssef', 1985, 358, 280],
          ['amina_marrakech', 'Amina', 1890, 318, 240], ['nabil_tanger', 'Nabil', 1795, 282, 200], ['samira_agadir', 'Samira', 1670, 248, 160],
          ['khalid_oujda', 'Khalid', 1545, 212, 120], ['latifa_tetouan', 'Latifa', 1405, 178, 90], ['tarik_meknes', 'Tarik', 1270, 148, 63],
          ['najat_kenitra', 'Najat', 1140, 118, 43], ['soufiane_safi', 'Soufiane', 1020, 93, 30], ['wafa_nador', 'Wafa', 930, 70, 17],
        ];
        if (uid) {
          await conn.collection('levels').updateOne(
            { userId: uid, gameType: 'ronda' },
            { $set: { userId: uid, gameType: 'ronda', level: 8, xp: 175, nextLevelXp: 260, unlockedFeatures: ['Tapis souk', 'Cartes andalouses'], lastXpGainAt: D(now), updatedAt: D(now) }, $setOnInsert: { createdAt: D(now) } },
            { upsert: true },
          );
        }
        await conn.collection('tournaments').updateOne(
          { code: 'SEED-ronda-open' },
          { $set: { code: 'SEED-ronda-open', type: 'daily', variant: 'ronda', difficulty: 'medium', status: 'open', startsAt: now, endsAt: now + 30 * day, prizes: [{ rank: 1, gold: 500 }, { rank: 2, gold: 250 }, { rank: 3, gold: 100 }], entries: mkEntries(14), updatedAt: D(now) }, $setOnInsert: { createdAt: D(now) } },
          { upsert: true },
        );
        await conn.collection('tournaments').updateOne(
          { code: 'SEED-ronda-weekly' },
          { $set: { code: 'SEED-ronda-weekly', type: 'weekly', variant: 'ronda', difficulty: 'medium', status: 'open', startsAt: now, endsAt: now + 7 * day, prizes: [{ rank: 1, gold: 1000 }, { rank: 2, gold: 500 }, { rank: 3, gold: 250 }], entries: mkEntries(33), updatedAt: D(now) }, $setOnInsert: { createdAt: D(now) } },
          { upsert: true },
        );
        for (const [email, username, elo, gp, gw] of roster) {
          await conn.collection('ronda_users').updateOne(
            { email: `${email}@sallycards.demo` },
            { $set: { email: `${email}@sallycards.demo`, username, gameType: 'ronda', isGuest: false, role: 'player', avatar: '', locale: 'fr', stats: { elo, gamesPlayed: gp, gamesWon: gw, winStreak: 0, bestWinStreak: 0, totalPlayTimeMs: 0 }, updatedAt: D(now) }, $setOnInsert: { createdAt: D(now) } },
            { upsert: true },
          );
        }
        await conn.collection('ronda_users').updateOne(
          { email: 'demo@sallycards.com' },
          { $set: { 'stats.elo': 1465, 'stats.gamesPlayed': 58, 'stats.gamesWon': 35, isGuest: false, updatedAt: D(now) } },
        );
        const existing = await conn.collection('game_history').countDocuments({ gameId: { $regex: '^seed-ronda-' } });
        if (existing === 0) {
          const docs: any[] = [];
          for (let i = 0; i < 160; i++) {
            const ago = Math.floor(Math.random() * 30);
            const ended = new Date(now - ago * day - Math.floor(Math.random() * day));
            const dur = 120 + Math.floor(Math.random() * 500);
            docs.push({ gameId: `seed-ronda-${i}`, gameType: 'ronda', players: [], result: {}, duration: dur, mode: 'online', startedAt: new Date(ended.getTime() - dur * 1000), endedAt: ended, createdAt: ended, updatedAt: ended });
          }
          for (let i = 0; i < docs.length; i += 200) await conn.collection('game_history').insertMany(docs.slice(i, i + 200));
        }
      },
    },
    {
      id: '017-seed-solitaire-data',
      description: 'Seed Solitaire : niveau/XP, tournoi deal-du-jour, leaderboard, historique parties',
      up: async (conn) => {
        const now = Date.now();
        const day = 24 * 3600 * 1000;
        const D = (ms: number) => new Date(ms);
        const demo = await conn.collection('ronda_users').findOne({ email: 'demo@sallycards.com' });
        const uid = demo ? demo._id.toString() : null;
        const mkEntries = (k: number) => Array.from({ length: k }, (_, i) => ({ userId: `seed-${i}`, displayName: `Joueur ${i + 1}`, score: 5000 - i * 130 }));
        const roster: [string, string, number, number, number][] = [
          ['emma_lyon', 'Emma', 2280, 620, 540], ['noah_paris', 'Noah', 2150, 560, 472], ['lea_nice', 'Léa', 2040, 500, 410],
          ['adam_lille', 'Adam', 1930, 450, 358], ['mia_nantes', 'Mia', 1820, 400, 308], ['leo_rennes', 'Leo', 1700, 352, 250],
          ['chloe_tours', 'Chloé', 1570, 300, 196], ['hugo_metz', 'Hugo', 1430, 250, 150], ['jade_brest', 'Jade', 1290, 200, 110],
          ['paul_caen', 'Paul', 1150, 155, 74], ['nina_pau', 'Nina', 1025, 110, 46], ['theo_dijon', 'Théo', 935, 78, 28],
        ];
        if (uid) {
          await conn.collection('levels').updateOne(
            { userId: uid, gameType: 'solitaire' },
            { $set: { userId: uid, gameType: 'solitaire', level: 9, xp: 200, nextLevelXp: 300, unlockedFeatures: ['Dos premium', 'Tapis classiques', '+130 variantes'], lastXpGainAt: D(now), updatedAt: D(now) }, $setOnInsert: { createdAt: D(now) } },
            { upsert: true },
          );
        }
        await conn.collection('tournaments').updateOne(
          { code: 'SEED-solitaire-open' },
          { $set: { code: 'SEED-solitaire-open', type: 'daily', variant: 'solitaire', difficulty: 'medium', status: 'open', startsAt: now, endsAt: now + day, prizes: [{ rank: 1, gold: 400 }, { rank: 2, gold: 200 }, { rank: 3, gold: 100 }], entries: mkEntries(20), updatedAt: D(now) }, $setOnInsert: { createdAt: D(now) } },
          { upsert: true },
        );
        await conn.collection('tournaments').updateOne(
          { code: 'SEED-solitaire-weekly' },
          { $set: { code: 'SEED-solitaire-weekly', type: 'weekly', variant: 'solitaire', difficulty: 'hard', status: 'open', startsAt: now, endsAt: now + 7 * day, prizes: [{ rank: 1, gold: 1500 }, { rank: 2, gold: 750 }, { rank: 3, gold: 300 }], entries: mkEntries(40), updatedAt: D(now) }, $setOnInsert: { createdAt: D(now) } },
          { upsert: true },
        );
        for (const [email, username, elo, gp, gw] of roster) {
          await conn.collection('solitaire_users').updateOne(
            { email: `${email}@sallycards.demo` },
            { $set: { email: `${email}@sallycards.demo`, username, gameType: 'solitaire', isGuest: false, role: 'player', avatar: '', locale: 'fr', stats: { elo, gamesPlayed: gp, gamesWon: gw, winStreak: 0, bestWinStreak: 0, totalPlayTimeMs: 0 }, updatedAt: D(now) }, $setOnInsert: { createdAt: D(now) } },
            { upsert: true },
          );
        }
        await conn.collection('solitaire_users').updateOne(
          { email: 'demo@sallycards.com' },
          { $set: { 'stats.elo': 1500, 'stats.gamesPlayed': 88, 'stats.gamesWon': 61, isGuest: false, updatedAt: D(now) } },
        );
        const existing = await conn.collection('game_history').countDocuments({ gameId: { $regex: '^seed-solitaire-' } });
        if (existing === 0) {
          const docs: any[] = [];
          for (let i = 0; i < 180; i++) {
            const ago = Math.floor(Math.random() * 30);
            const ended = new Date(now - ago * day - Math.floor(Math.random() * day));
            const dur = 90 + Math.floor(Math.random() * 600);
            docs.push({ gameId: `seed-solitaire-${i}`, gameType: 'solitaire', players: [], result: {}, duration: dur, mode: 'solo', startedAt: new Date(ended.getTime() - dur * 1000), endedAt: ended, createdAt: ended, updatedAt: ended });
          }
          for (let i = 0; i < docs.length; i += 200) await conn.collection('game_history').insertMany(docs.slice(i, i + 200));
        }
      },
    },
  ];

  constructor(@InjectConnection() private readonly connection: Connection) {}

  async onModuleInit() {
    try {
      await this.runPending();
    } catch (err: any) {
      this.logger.error(`Migrations fail: ${err?.message ?? err}`);
    }
  }

  /** Liste les migrations pending. */
  async listPending(): Promise<Migration[]> {
    const col = this.connection.collection('_migrations');
    const applied = await col.find({}, { projection: { id: 1 } }).toArray();
    const appliedIds = new Set(applied.map((d) => d.id));
    return this.migrations.filter((m) => !appliedIds.has(m.id));
  }

  /** Applique toutes les migrations pending. */
  async runPending(): Promise<{ applied: string[] }> {
    const pending = await this.listPending();
    const applied: string[] = [];
    if (pending.length === 0) {
      this.logger.log(`✓ Migrations à jour (${this.migrations.length} appliquées)`);
      return { applied };
    }
    this.logger.log(`📦 ${pending.length} migration(s) à appliquer…`);
    const col = this.connection.collection('_migrations');
    for (const m of pending) {
      const t0 = Date.now();
      try {
        await m.up(this.connection);
        await col.insertOne({ id: m.id, description: m.description, appliedAt: new Date() });
        const dt = Date.now() - t0;
        this.logger.log(`  ✓ ${m.id} (${dt}ms) — ${m.description}`);
        applied.push(m.id);
      } catch (err: any) {
        // Résilient : on logge et on CONTINUE — une migration en échec (ex.
        // conflit d'index préexistant) ne doit pas bloquer les suivantes.
        // Elle restera "pending" et sera retentée au prochain boot.
        this.logger.error(`  ✗ ${m.id} FAILED (skip): ${err?.message ?? err}`);
      }
    }
    return { applied };
  }

  /** Status des migrations (pour endpoint admin). */
  async getStatus(): Promise<{
    total: number; applied: number; pending: { id: string; description: string }[];
  }> {
    const pending = await this.listPending();
    return {
      total: this.migrations.length,
      applied: this.migrations.length - pending.length,
      pending: pending.map((m) => ({ id: m.id, description: m.description })),
    };
  }
}
