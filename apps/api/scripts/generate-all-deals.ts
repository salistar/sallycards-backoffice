/**
 * @file generate-all-deals.ts
 *
 * Régénère 300 deals VALIDÉS (100 easy + 100 medium + 100 hard) pour
 * TOUTES les variantes restantes (hors Spider, FreeCell, Pyramid déjà faits).
 *
 * Variantes traitées :
 *   - klondike-1, klondike-3, klondike-vegas (même moteur solitaireFrEngine)
 *   - yukon
 *   - golf
 *   - tripeaks
 *   - forty-thieves
 *   - accordion
 *
 * Pour chaque deal :
 *   1. createInitialState() (engine mobile, génère deal soluble par construction)
 *   2. solveToVictory : étend la solution greedy via findHint jusqu'à isWon (ou rejette)
 *   3. Validation stricte : on ne garde que les deals avec solution menant à phase='won'
 *   4. Hash dedup, bucketing par longueur de solution
 *
 * USAGE :
 *   pnpm ts-node apps/api/scripts/generate-all-deals.ts [variant1,variant2,...]
 *
 *   Sans argument : régénère TOUTES les variantes ci-dessus.
 *   Avec argument CSV : régénère uniquement celles passées.
 */
import { MongoClient } from 'mongodb';
import { createHash } from 'crypto';
import * as Klondike from '../../mobile/solitaire/src/game/solitaireFrEngine';
import * as Yukon from '../../mobile/solitaire/src/game/yukonEngine';
import * as Golf from '../../mobile/solitaire/src/game/golfEngine';
import * as TriPeaks from '../../mobile/solitaire/src/game/tripeaksEngine';
import * as FortyThieves from '../../mobile/solitaire/src/game/fortyThievesEngine';
import * as Accordion from '../../mobile/solitaire/src/game/accordionEngine';

const TARGET_DEFAULT = 300;
const MAX_SOLVE_ITER_DEFAULT = 5000;
const SOLVE_TIMEOUT_DEFAULT_MS = 5000;

// Overrides pour variantes "dures" (greedy souvent en échec).
// On accepte un target inférieur ET on raccourcit le timeout par tentative
// pour rejeter rapidement les deals non-greedy-solvables.
const VARIANT_OVERRIDES: Record<string, { target?: number; iter?: number; timeoutMs?: number }> = {
  'forty-thieves': { target: 100, iter: 2000, timeoutMs: 1500 },
  'accordion':     { target: 100, iter: 2000, timeoutMs: 1500 },
};

interface EngineApi {
  createInitialState: (...args: any[]) => any;
  gameReducer: (s: any, a: any) => any;
  findHint: (s: any) => any | null;
  isWon: (s: any) => boolean;
}

interface VariantSpec {
  variant: string;
  engine: EngineApi;
  /** Klondike a 3 variants partageant le même moteur */
  shareEngineWith?: string[];
}

const ALL_VARIANTS: VariantSpec[] = [
  { variant: 'klondike-1', engine: Klondike as any },
  { variant: 'klondike-3', engine: Klondike as any },
  { variant: 'klondike-vegas', engine: Klondike as any },
  { variant: 'yukon', engine: Yukon as any },
  { variant: 'golf', engine: Golf as any },
  { variant: 'tripeaks', engine: TriPeaks as any },
  { variant: 'forty-thieves', engine: FortyThieves as any },
  { variant: 'accordion', engine: Accordion as any },
];

const origLog = console.log;
const origWarn = console.warn;
let silenced = false;
const silence = () => { if (!silenced) { silenced = true; console.log = () => {}; console.warn = () => {}; } };
const unsilence = () => { if (silenced) { silenced = false; console.log = origLog; console.warn = origWarn; } };

const CANDIDATE_URIS = [
  process.env.MONGODB_URI,
  'mongodb://sallycards:sallycards_dev@localhost:27017/sallycards?authSource=admin',
].filter(Boolean) as string[];

async function tryConnect(): Promise<MongoClient> {
  for (const uri of CANDIDATE_URIS) {
    try {
      const c = new MongoClient(uri, { serverSelectionTimeoutMS: 4000 });
      await c.connect();
      origLog(`✅ Connecté : ${uri.replace(/\/\/.*@/, '//<creds>@')}`);
      return c;
    } catch {/* next */}
  }
  throw new Error('Aucune URI Mongo connectable');
}

const hashDeal = (s: any) => createHash('sha1').update(JSON.stringify(s)).digest('hex').slice(0, 16);

/** Hash d'état générique pour cycle-detection. JSON.stringify est OK : états < 5KB. */
function stateKey(s: any): string {
  // On ne hash que les CONTENUS visibles (cards), pas les compteurs (moves, score)
  // sinon chaque coup = nouveau key même si en cycle structurel.
  const safe = { ...s };
  delete safe.moves;
  delete safe.score;
  delete safe.movesSinceLastProgress;
  delete safe.stockCycles;
  delete safe.combo;
  delete safe.phase;
  delete safe.selected; // Pyramid/Klondike : selection visuelle, pas structure
  return JSON.stringify(safe);
}

function solveToVictory(state: any, engine: EngineApi, maxIter: number, timeoutMs: number): any[] | null {
  const moves: any[] = [];
  const seen = new Set<string>();
  seen.add(stateKey(state));
  let s = state;
  const t0 = Date.now();
  for (let i = 0; i < maxIter; i++) {
    if (Date.now() - t0 > timeoutMs) return null;
    const action = engine.findHint(s);
    if (!action) return null;
    const next = engine.gameReducer(s, action);
    if (next === s) return null; // no-op
    const k = stateKey(next);
    if (seen.has(k)) return null; // cycle
    seen.add(k);
    moves.push(action);
    s = next;
    if (engine.isWon(s)) return moves;
  }
  return null;
}

interface CD { state: any; solution: any[]; hash: string; len: number; }

function genOne(engine: EngineApi, iter: number, timeoutMs: number): CD | null {
  silence();
  try {
    const state = engine.createInitialState();
    const sol = solveToVictory(state, engine, iter, timeoutMs);
    if (!sol) return null;
    return { state, solution: sol, hash: hashDeal(state), len: sol.length };
  } catch { return null; }
  finally { unsilence(); }
}

async function generateForVariant(spec: VariantSpec): Promise<CD[]> {
  const ov = VARIANT_OVERRIDES[spec.variant] ?? {};
  const target = ov.target ?? TARGET_DEFAULT;
  const iter = ov.iter ?? MAX_SOLVE_ITER_DEFAULT;
  const timeoutMs = ov.timeoutMs ?? SOLVE_TIMEOUT_DEFAULT_MS;
  origLog(`\n🃏 ${spec.variant} : génération ${target} deals validés (iter=${iter}, timeout=${timeoutMs}ms)...`);
  const out: CD[] = [];
  const seen = new Set<string>();
  let attempts = 0, rejects = 0;
  const t0 = Date.now();
  let tLast = t0;
  const HARD_CAP = target * 2000; // cap dur pour éviter boucle infinie

  while (out.length < target && attempts < HARD_CAP) {
    attempts++;
    const d = genOne(spec.engine, iter, timeoutMs);
    if (!d) { rejects++; continue; }
    if (seen.has(d.hash)) continue;
    seen.add(d.hash);
    out.push(d);
    const now = Date.now();
    if (now - tLast > 5000) {
      origLog(`   → ${spec.variant}: ${out.length}/${target} (${attempts} tents, ${rejects} rejets, ${((now - t0) / 1000).toFixed(1)}s)`);
      tLast = now;
    }
  }
  origLog(`   ✓ ${spec.variant}: ${out.length} deals collectés en ${((Date.now() - t0) / 1000).toFixed(1)}s (${attempts} tents, ${rejects} rejets)`);
  return out;
}

function bucket(deals: CD[]) {
  const sorted = [...deals].sort((a, b) => a.len - b.len);
  const n = sorted.length, third = Math.floor(n / 3);
  return {
    easy: sorted.slice(0, third),
    medium: sorted.slice(third, third * 2),
    hard: sorted.slice(third * 2),
  };
}

async function processVariant(client: MongoClient, spec: VariantSpec): Promise<void> {
  const col = client.db().collection('deal_seeds');
  const ov = VARIANT_OVERRIDES[spec.variant] ?? {};
  const target = ov.target ?? TARGET_DEFAULT;
  const deals = await generateForVariant(spec);
  if (deals.length < target) {
    origLog(`⚠️  ${spec.variant}: seulement ${deals.length}/${target} générés`);
  }
  const { easy, medium, hard } = bucket(deals);
  origLog(`   📊 ${spec.variant}: easy=${easy.length}, medium=${medium.length}, hard=${hard.length}`);

  const w = await col.deleteMany({ variant: spec.variant });
  origLog(`   🗑  ${w.deletedCount} anciens supprimés`);

  const docs = [
    ...easy.map((d, i) => ({ d, diff: 'easy', idx: i })),
    ...medium.map((d, i) => ({ d, diff: 'medium', idx: easy.length + i })),
    ...hard.map((d, i) => ({ d, diff: 'hard', idx: easy.length + medium.length + i })),
  ].map(({ d, diff, idx }) => ({
    variant: spec.variant,
    seedIndex: idx,
    initialState: d.state,
    solution: d.solution,
    difficulty: diff,
    dealHash: d.hash,
    metadata: { source: 'mobile-engine-validated', solutionLen: d.len },
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  if (docs.length) {
    const r = await col.insertMany(docs as any[], { ordered: false });
    origLog(`   ✅ ${spec.variant}: ${r.insertedCount} deals insérés`);
  }
}

async function main() {
  origLog('═══════════════════════════════════════════════════════════════');
  origLog('   GÉNÉRATION DEALS toutes variantes (validés mobile engine)    ');
  origLog('═══════════════════════════════════════════════════════════════');

  const argFilter = process.argv[2]
    ? process.argv[2].split(',').map((s) => s.trim()).filter(Boolean)
    : null;
  const toProcess = argFilter
    ? ALL_VARIANTS.filter((v) => argFilter.includes(v.variant))
    : ALL_VARIANTS;

  origLog(`Variantes à traiter (${toProcess.length}) : ${toProcess.map((v) => v.variant).join(', ')}\n`);

  const client = await tryConnect();
  for (const spec of toProcess) {
    await processVariant(client, spec);
  }

  origLog('\n═══ Stats finales toutes variantes ═══');
  const col = client.db().collection('deal_seeds');
  const stats = await col.aggregate([
    { $group: { _id: { v: '$variant', d: '$difficulty' }, n: { $sum: 1 } } },
    { $sort: { '_id.v': 1, '_id.d': 1 } },
  ]).toArray();
  let cur = '', line = '';
  for (const s of stats) {
    if (cur !== s._id.v) {
      if (line) origLog(line);
      cur = s._id.v;
      line = `   ${cur}: `;
    } else line += ', ';
    line += `${s._id.d}=${s.n}`;
  }
  if (line) origLog(line);
  origLog(`\n   Total deal_seeds : ${await col.countDocuments()}`);
  origLog(`   Validés mobile engine : ${await col.countDocuments({ 'metadata.source': 'mobile-engine-validated' })}`);

  await client.close();
  origLog('\n✨ Terminé.');
}

main().catch((e) => { origLog('💥', e); process.exit(1); });
