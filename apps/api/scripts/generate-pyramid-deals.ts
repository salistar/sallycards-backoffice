/**
 * @file generate-pyramid-deals.ts
 *
 * Régénère 300 deals VALIDÉS pour `pyramid` dans `deal_seeds`, en utilisant
 * le moteur mobile `apps/mobile/solitaire/src/game/pyramidEngine.ts`.
 *
 * Même problème que FreeCell : la solution stockée par le backend est tronquée,
 * la partie est déclarée bloquée alors qu'on n'a retiré que 4/28 cartes.
 *
 * Stratégie identique : on génère un deal via createInitialState (qui doit
 * normalement être soluble), puis on étend la solution greedy avec maxIter
 * généreux jusqu'à phase='won' (ou isWon true). Si pas de victoire → rejette.
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
} from '../../mobile/solitaire/src/game/pyramidEngine';

const TARGET = 300;
const VARIANT = 'pyramid';
const MAX_SOLVE_ITER = 5000;
const SOLVE_TIMEOUT_MS = 5000;

const origLog = console.log;
const origWarn = console.warn;
let silenced = false;
const silence = () => { if (!silenced) { silenced = true; console.log = () => {}; console.warn = () => {}; } };
const unsilence = () => { if (silenced) { silenced = false; console.log = origLog; console.warn = origWarn; } };

async function tryConnect(): Promise<MongoClient> {
  const uris = [
    process.env.MONGODB_URI,
    'mongodb://sallycards:sallycards_dev@localhost:27017/sallycards?authSource=admin',
  ].filter(Boolean) as string[];
  for (const uri of uris) {
    try {
      const c = new MongoClient(uri, { serverSelectionTimeoutMS: 4000 });
      await c.connect();
      origLog(`✅ Connecté : ${uri.replace(/\/\/.*@/, '//<creds>@')}`);
      return c;
    } catch {/* next */}
  }
  throw new Error('Aucune URI Mongo');
}

const hashDeal = (s: GameState) => createHash('sha1').update(JSON.stringify(s)).digest('hex').slice(0, 16);

function stateKey(s: GameState): string {
  // PyramidSlot = Card | null (pas un objet wrapper)
  const py = s.pyramid.map((row: any[]) =>
    row.map((slot: any) => slot === null ? '_' : `${slot.value}${slot.suit[0]}`).join(','),
  ).join('|');
  const stockLen = s.stock?.length ?? 0;
  const wasteTop = s.waste && s.waste.length > 0 ? `${s.waste[s.waste.length - 1].value}${s.waste[s.waste.length - 1].suit[0]}` : '';
  const sel = s.selected ? JSON.stringify(s.selected) : '';
  return `${py}#${stockLen}#${wasteTop}#${sel}`;
}

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
    if (seen.has(k)) return null;
    seen.add(k);
    moves.push(action);
    s = next;
    if (isWon(s)) return moves;
  }
  return null;
}

interface CD { state: GameState; solution: GameAction[]; hash: string; len: number; }

function genOne(): CD | null {
  silence();
  try {
    const state = createInitialState();
    const sol = solveToVictory(state);
    if (!sol) return null;
    return { state, solution: sol, hash: hashDeal(state), len: sol.length };
  } catch { return null; }
  finally { unsilence(); }
}

async function genAll(): Promise<CD[]> {
  origLog(`\n🃏 ${VARIANT} : génération ${TARGET} deals validés...`);
  const out: CD[] = [];
  const seen = new Set<string>();
  let attempts = 0, rejects = 0;
  const t0 = Date.now();
  let tLast = t0;
  while (out.length < TARGET && attempts < TARGET * 1000) {
    attempts++;
    const d = genOne();
    if (!d) { rejects++; continue; }
    if (seen.has(d.hash)) continue;
    seen.add(d.hash);
    out.push(d);
    const now = Date.now();
    if (now - tLast > 5000) {
      origLog(`   → ${VARIANT}: ${out.length}/${TARGET} (${attempts} tents, ${rejects} rejets, ${((now - t0) / 1000).toFixed(1)}s)`);
      tLast = now;
    }
  }
  origLog(`   ✓ ${VARIANT}: ${out.length} deals collectés en ${((Date.now() - t0) / 1000).toFixed(1)}s (${attempts} tents, ${rejects} rejets)`);
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

async function main() {
  origLog(`═══ Régénération ${VARIANT} (validation stricte mobile engine) ═══`);
  const client = await tryConnect();
  const col = client.db().collection('deal_seeds');

  const deals = await genAll();
  if (deals.length < TARGET) origLog(`⚠️  Seulement ${deals.length}/${TARGET} générés`);

  const { easy, medium, hard } = bucket(deals);
  origLog(`   📊 ${VARIANT}: easy=${easy.length}, medium=${medium.length}, hard=${hard.length}`);

  const w = await col.deleteMany({ variant: VARIANT });
  origLog(`   🗑  ${w.deletedCount} anciens supprimés`);

  const docs = [
    ...easy.map((d, i) => ({ d, diff: 'easy', idx: i })),
    ...medium.map((d, i) => ({ d, diff: 'medium', idx: easy.length + i })),
    ...hard.map((d, i) => ({ d, diff: 'hard', idx: easy.length + medium.length + i })),
  ].map(({ d, diff, idx }) => ({
    variant: VARIANT,
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
    origLog(`   ✅ ${r.insertedCount} deals insérés`);
  }

  const stats = await col.aggregate([
    { $match: { variant: VARIANT } },
    { $group: { _id: '$difficulty', n: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]).toArray();
  origLog('\n═══ Stats ═══');
  for (const s of stats) origLog(`   ${VARIANT}/${s._id}: ${s.n}`);

  await client.close();
  origLog('\n✨ Terminé.');
}

main().catch((e) => { origLog('💥', e); process.exit(1); });
