/**
 * @file generate-freecell-deals.ts
 *
 * Régénère 300 deals VALIDÉS pour `freecell` dans la collection `deal_seeds`,
 * en utilisant le moteur mobile `apps/mobile/solitaire/src/game/freecellEngine.ts`.
 *
 * Pourquoi : le greedy mobile (`computeFreeCellSolution`) s'arrête à 80 iter
 * ou 500 ms — il peut produire une solution **tronquée** qui ne mène PAS à
 * la victoire. Côté mobile en jeu, la "Solution stockée" se déroule jusqu'à
 * idx 45/45 puis la partie est déclarée bloquée à 42/52 fondations.
 *
 * Ce script :
 *   1. Pour chaque deal candidat, génère via `createInitialState`
 *      (qui appelle reverseDealFreeCell — solvable par construction)
 *   2. Étend la solution greedy avec une boucle plus généreuse
 *      (jusqu'à 5000 iter, 5s timeout) jusqu'à phase='won'
 *   3. Si pas de victoire en 5s → rejette et retente
 *   4. 300 deals validés/insertés en BD avec 100/100/100 difficulty
 *
 * USAGE :
 *   pnpm ts-node apps/api/scripts/generate-freecell-deals.ts
 */
import { MongoClient } from 'mongodb';
import { createHash } from 'crypto';
import {
  createInitialState,
  gameReducer,
  findHint,
  isWon,
  type GameState,
  type GameAction,
} from '../../mobile/solitaire/src/game/freecellEngine';

const TARGET_PER_VARIANT = 300;
const VARIANT = 'freecell';

// Boucle greedy ÉTENDUE jusqu'à victoire (au lieu de 80 iter / 500 ms du mobile)
const MAX_SOLVE_ITER = 5000;
const SOLVE_TIMEOUT_MS = 5000;

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
].filter(Boolean) as string[];

async function tryConnect(): Promise<MongoClient> {
  for (const uri of CANDIDATE_URIS) {
    try {
      const client = new MongoClient(uri, { serverSelectionTimeoutMS: 4000 });
      await client.connect();
      origLog(`✅ Connecté à MongoDB : ${uri.replace(/\/\/.*@/, '//<creds>@')}`);
      return client;
    } catch {/* next */}
  }
  throw new Error('Aucune URI Mongo connectable');
}

function hashDeal(state: GameState): string {
  return createHash('sha1').update(JSON.stringify(state)).digest('hex').slice(0, 16);
}

/** Hash anti-cycle (état tableau + freeCells + lengths fondations) */
function stateKey(s: GameState): string {
  const t = s.tableau.map((c) => c.cards.map((x) => `${x.value}${x.suit[0]}`).join('')).join('|');
  const f = s.freeCells.map((c) => (c ? `${c.value}${c.suit[0]}` : '_')).join('');
  const fd = s.foundations.map((p) => p.cards.length).join('-');
  return `${t}#${f}#${fd}`;
}

/**
 * Solveur greedy ÉTENDU : utilise findHint en boucle, mais avec maxIter et
 * timeout généreux. Détecte les cycles via hash d'état.
 */
function solveToVictory(state: GameState): GameAction[] | null {
  const moves: GameAction[] = [];
  const seen = new Set<string>();
  seen.add(stateKey(state));
  let s = state;
  const t0 = Date.now();
  for (let i = 0; i < MAX_SOLVE_ITER; i++) {
    if (Date.now() - t0 > SOLVE_TIMEOUT_MS) return null;
    const action = findHint(s);
    if (!action) return null;
    const next = gameReducer(s, action);
    if (next === s) return null;
    const k = stateKey(next);
    if (seen.has(k)) return null; // cycle
    seen.add(k);
    moves.push(action);
    s = next;
    if (isWon(s)) return moves;
  }
  return null; // max iter sans victoire
}

interface CollectedDeal {
  state: GameState;
  solution: GameAction[];
  hash: string;
  solutionLen: number;
}

function generateValidatedDeal(): CollectedDeal | null {
  silence();
  try {
    const state = createInitialState();
    const solution = solveToVictory(state);
    if (!solution) return null;
    return {
      state,
      solution,
      hash: hashDeal(state),
      solutionLen: solution.length,
    };
  } catch {
    return null;
  } finally {
    unsilence();
  }
}

async function generateAll(): Promise<CollectedDeal[]> {
  origLog(`\n🃏 Génération ${VARIANT} (${TARGET_PER_VARIANT} deals validés)…`);
  const collected: CollectedDeal[] = [];
  const seen = new Set<string>();
  let attempts = 0;
  let rejected = 0;
  const t0 = Date.now();
  let lastReport = t0;

  while (collected.length < TARGET_PER_VARIANT && attempts < TARGET_PER_VARIANT * 20) {
    attempts++;
    const deal = generateValidatedDeal();
    if (!deal) { rejected++; continue; }
    if (seen.has(deal.hash)) continue;
    seen.add(deal.hash);
    collected.push(deal);

    const now = Date.now();
    if (now - lastReport > 5000) {
      const elapsed = ((now - t0) / 1000).toFixed(1);
      origLog(
        `   → ${VARIANT}: ${collected.length}/${TARGET_PER_VARIANT} (${attempts} tentatives, ${rejected} rejetés, ${elapsed}s)`,
      );
      lastReport = now;
    }
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  origLog(
    `   ✓ ${VARIANT}: ${collected.length} deals collectés en ${elapsed}s (${attempts} tentatives, ${rejected} rejets)`,
  );
  return collected;
}

function bucketByDifficulty(deals: CollectedDeal[]) {
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
  origLog('   GÉNÉRATION DEALS FREECELL (validés mobile engine, victoire stricte)');
  origLog('═══════════════════════════════════════════════════════════════');

  const client = await tryConnect();
  const db = client.db();
  const col = db.collection('deal_seeds');

  const deals = await generateAll();
  if (deals.length < TARGET_PER_VARIANT) {
    origLog(`⚠️  ${VARIANT}: ${deals.length}/${TARGET_PER_VARIANT} générés (limite atteinte)`);
  }

  const { easy, medium, hard } = bucketByDifficulty(deals);
  origLog(`   📊 ${VARIANT}: easy=${easy.length}, medium=${medium.length}, hard=${hard.length}`);

  const wipeResult = await col.deleteMany({ variant: VARIANT });
  origLog(`   🗑  ${VARIANT}: ${wipeResult.deletedCount} anciens docs supprimés`);

  const docs = [
    ...easy.map((d, i) => ({ deal: d, difficulty: 'easy', index: i })),
    ...medium.map((d, i) => ({ deal: d, difficulty: 'medium', index: easy.length + i })),
    ...hard.map((d, i) => ({ deal: d, difficulty: 'hard', index: easy.length + medium.length + i })),
  ].map(({ deal, difficulty, index }) => ({
    variant: VARIANT,
    seedIndex: index,
    initialState: deal.state,
    solution: deal.solution,
    difficulty,
    dealHash: deal.hash,
    metadata: {
      source: 'mobile-engine-validated',
      solutionLen: deal.solutionLen,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  if (docs.length > 0) {
    const r = await col.insertMany(docs as any[], { ordered: false });
    origLog(`   ✅ ${VARIANT}: ${r.insertedCount} deals insérés`);
  }

  origLog('\n═══ Stats finales ═══');
  const stats = await col
    .aggregate([
      { $match: { variant: VARIANT } },
      { $group: { _id: '$difficulty', n: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ])
    .toArray();
  for (const s of stats) origLog(`   ${VARIANT}/${s._id}: ${s.n}`);

  await client.close();
  origLog('\n✨ Terminé.');
}

main().catch((err) => { origLog('💥 ERREUR :', err); process.exit(1); });
