/**
 * @file generate-spider-deals.ts
 *
 * Régénère 300 deals validés (100 easy + 100 medium + 100 hard) pour
 * spider-2 et spider-4 dans la collection `deal_seeds`, en utilisant le
 * MOTEUR MOBILE (`apps/mobile/solitaire/src/game/spiderEngine.ts`).
 *
 * Pourquoi : les deals générés par le backend `reverseDealSpiderBackend`
 * ont une solution stockée qui devient invalide en cours de partie côté
 * mobile (engine divergence). Pour spider-1 le cascade fallback compense,
 * mais pour spider-2/4 le mobile reste bloqué ("partie réellement bloquée").
 *
 * Le moteur mobile fait sa propre validation stricte : `createInitialState`
 * relance jusqu'à 6 attempts puis tombe sur fallback V2, et **rejoue la
 * solution complète** pour vérifier que `completed.length === 8` AVANT de
 * retourner le deal. Donc chaque deal produit ici est garanti gagnant.
 *
 * Ce script :
 *   1. Wipe les docs `variant: 'spider-2'` et `'spider-4'` dans deal_seeds
 *   2. Pour chaque variante, génère 300 deals validés
 *   3. Buckets 100/100/100 par difficulty selon la longueur de solution
 *   4. Bulk insert avec dealHash unique
 *
 * USAGE :
 *   pnpm ts-node apps/api/scripts/generate-spider-deals.ts
 */
import { MongoClient } from 'mongodb';
import { createHash } from 'crypto';
import {
  createInitialState,
  getSpiderSolution,
  gameReducer,
  type GameState,
  type GameAction,
  type SuitMode,
} from '../../mobile/solitaire/src/game/spiderEngine';

const TARGET_PER_VARIANT = 300;
const SUIT_MODES: { mode: SuitMode; variant: string }[] = [
  { mode: 2, variant: 'spider-2' },
  { mode: 4, variant: 'spider-4' },
];

// Silence engine logs (sinon 600+ "✅ DONNE RANDOM SOLUBLE" pollutent stdout)
const origLog = console.log;
const origWarn = console.warn;
let silenced = false;
function silence() {
  if (silenced) return;
  silenced = true;
  console.log = () => {};
  console.warn = () => {};
}
function unsilence() {
  if (!silenced) return;
  silenced = false;
  console.log = origLog;
  console.warn = origWarn;
}

const CANDIDATE_URIS = [
  process.env.MONGODB_URI,
  'mongodb://sallycards:sallycards_dev@localhost:27017/sallycards?authSource=admin',
  'mongodb://sallycards:sallycards_dev@sallycards-mongo:27017/sallycards?authSource=admin',
].filter(Boolean) as string[];

async function tryConnect(): Promise<MongoClient> {
  let lastErr: any = null;
  for (const uri of CANDIDATE_URIS) {
    try {
      const client = new MongoClient(uri, { serverSelectionTimeoutMS: 4000 });
      await client.connect();
      origLog(`✅ Connecté à MongoDB : ${uri.replace(/\/\/.*@/, '//<creds>@')}`);
      return client;
    } catch (err: any) {
      lastErr = err;
      origWarn(`  ↻ Échec ${uri.replace(/\/\/.*@/, '//<creds>@')}: ${err?.message ?? err}`);
    }
  }
  throw lastErr ?? new Error('Aucune URI Mongo connectable');
}

function hashDeal(state: GameState): string {
  return createHash('sha1').update(JSON.stringify(state)).digest('hex').slice(0, 16);
}

function strictReplay(state: GameState, solution: GameAction[]): boolean {
  let s = state;
  for (const action of solution) {
    const next = gameReducer(s, action);
    if (next === s) return false; // action no-op = invalide
    s = next;
    if (s.completed.length === 8) return true;
  }
  return s.completed.length === 8;
}

interface CollectedDeal {
  state: GameState;
  solution: GameAction[];
  hash: string;
  solutionLen: number;
}

function generateValidatedDeal(mode: SuitMode): CollectedDeal | null {
  silence();
  try {
    const state = createInitialState(mode);
    const solution = getSpiderSolution();
    if (!solution || solution.length === 0) return null;
    // Re-validation stricte (defensive — createInitialState le fait déjà)
    if (!strictReplay(state, solution)) return null;
    return {
      state,
      solution,
      hash: hashDeal(state),
      solutionLen: solution.length,
    };
  } catch (e) {
    return null;
  } finally {
    unsilence();
  }
}

async function generateForVariant(mode: SuitMode, variant: string): Promise<CollectedDeal[]> {
  origLog(`\n🃏 Génération ${variant} (${TARGET_PER_VARIANT} deals validés)…`);
  const collected: CollectedDeal[] = [];
  const seenHashes = new Set<string>();
  let attempts = 0;
  const t0 = Date.now();
  let lastReport = t0;

  while (collected.length < TARGET_PER_VARIANT && attempts < TARGET_PER_VARIANT * 10) {
    attempts++;
    const deal = generateValidatedDeal(mode);
    if (!deal) continue;
    if (seenHashes.has(deal.hash)) continue;
    seenHashes.add(deal.hash);
    collected.push(deal);

    const now = Date.now();
    if (now - lastReport > 5000) {
      const elapsed = ((now - t0) / 1000).toFixed(1);
      origLog(
        `   → ${variant}: ${collected.length}/${TARGET_PER_VARIANT} (${attempts} tentatives, ${elapsed}s)`,
      );
      lastReport = now;
    }
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  origLog(
    `   ✓ ${variant}: ${collected.length} deals collectés en ${elapsed}s (${attempts} tentatives)`,
  );
  return collected;
}

function bucketByDifficulty(deals: CollectedDeal[]): {
  easy: CollectedDeal[];
  medium: CollectedDeal[];
  hard: CollectedDeal[];
} {
  // Trier par longueur de solution (court = easy, long = hard)
  const sorted = [...deals].sort((a, b) => a.solutionLen - b.solutionLen);
  const n = sorted.length;
  const third = Math.floor(n / 3);
  return {
    easy: sorted.slice(0, third),
    medium: sorted.slice(third, third * 2),
    hard: sorted.slice(third * 2),
  };
}

async function main() {
  origLog('═══════════════════════════════════════════════════════════════');
  origLog('   GÉNÉRATION DEALS SPIDER-2 + SPIDER-4 (validés mobile engine)  ');
  origLog('═══════════════════════════════════════════════════════════════');

  const client = await tryConnect();
  const db = client.db();
  const col = db.collection('deal_seeds');

  for (const { mode, variant } of SUIT_MODES) {
    // 1. Générer
    const deals = await generateForVariant(mode, variant);
    if (deals.length < TARGET_PER_VARIANT) {
      origLog(
        `⚠️  ${variant}: seulement ${deals.length}/${TARGET_PER_VARIANT} deals générés (limite tentatives atteinte)`,
      );
    }

    // 2. Bucketing par difficulty
    const { easy, medium, hard } = bucketByDifficulty(deals);
    origLog(`   📊 ${variant}: easy=${easy.length}, medium=${medium.length}, hard=${hard.length}`);

    // 3. Wipe + insert
    const wipeResult = await col.deleteMany({ variant });
    origLog(`   🗑  ${variant}: ${wipeResult.deletedCount} anciens docs supprimés`);

    const docsToInsert = [
      ...easy.map((d, i) => ({ deal: d, difficulty: 'easy', index: i })),
      ...medium.map((d, i) => ({ deal: d, difficulty: 'medium', index: easy.length + i })),
      ...hard.map((d, i) => ({ deal: d, difficulty: 'hard', index: easy.length + medium.length + i })),
    ].map(({ deal, difficulty, index }) => ({
      variant,
      seedIndex: index,
      initialState: deal.state,
      solution: deal.solution,
      difficulty,
      dealHash: deal.hash,
      metadata: {
        source: 'mobile-engine-validated',
        solutionLen: deal.solutionLen,
        suitMode: mode,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    if (docsToInsert.length > 0) {
      const insertResult = await col.insertMany(docsToInsert as any[], { ordered: false });
      origLog(`   ✅ ${variant}: ${insertResult.insertedCount} deals insérés`);
    }
  }

  // 4. Stats finales
  origLog('\n═══ Stats finales par variant × difficulty ═══');
  const stats = await col
    .aggregate([
      { $match: { variant: { $in: ['spider-2', 'spider-4'] } } },
      { $group: { _id: { v: '$variant', d: '$difficulty' }, n: { $sum: 1 } } },
      { $sort: { '_id.v': 1, '_id.d': 1 } },
    ])
    .toArray();
  for (const s of stats) {
    origLog(`   ${s._id.v}/${s._id.d}: ${s.n}`);
  }

  await client.close();
  origLog('\n✨ Terminé.');
}

main().catch((err) => {
  origLog('💥 ERREUR :', err);
  process.exit(1);
});
