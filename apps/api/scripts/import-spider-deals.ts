/**
 * @file import-spider-deals.ts
 *
 * Importe les 100 deals Spider Solitaire pré-générés depuis le fichier JSON
 * `C:/Users/21266/Downloads/spider_deals_with_distributions.json` dans la
 * collection MongoDB `spider_deals_v2`.
 *
 * USAGE
 * ─────
 * Option 1 (depuis le host, via ts-node) :
 *   pnpm ts-node apps/api/scripts/import-spider-deals.ts
 *
 * Option 2 (depuis le container API, après build) :
 *   pnpm nx build api
 *   docker exec sallycards-api node dist/apps/api/scripts/import-spider-deals.js
 *
 * Option 3 (en mode dev container, via ts-node-dev exposé) :
 *   docker exec sallycards-api pnpm ts-node apps/api/scripts/import-spider-deals.ts
 *
 * VARIABLES D'ENV
 * ───────────────
 *   MONGODB_URI : URL Mongo (default : mongodb://mongo:27017/sallycards en
 *                 container, fallback mongodb://localhost:27017/sallycards
 *                 en host)
 *   SPIDER_DEALS_JSON : chemin vers le JSON (default : Downloads/...)
 *
 * Le script est IDEMPOTENT : ré-import = upsert, pas de doublon.
 */
import * as fs from 'fs';
import * as path from 'path';
import { MongoClient } from 'mongodb';

// On accepte plusieurs fichiers JSON (séparés par ;). Si SPIDER_DEALS_JSON
// n'est pas défini, on essaie automatiquement les 3 fichiers spider_*suit*_deals.json
// + l'ancien spider_deals_with_distributions.json (rétrocompat).
const DEFAULT_JSON_PATHS_WIN = [
  'C:/Users/21266/Downloads/spider_1suit_deals.json',
  'C:/Users/21266/Downloads/spider_2suits_deals.json',
  'C:/Users/21266/Downloads/spider_4suits_deals.json',
  'C:/Users/21266/Downloads/spider_deals_with_distributions.json', // ancien format
];
const DEFAULT_JSON_PATHS_NIX = [
  '/data/spider_1suit_deals.json',
  '/data/spider_2suits_deals.json',
  '/data/spider_4suits_deals.json',
  '/data/spider_deals_with_distributions.json',
];

const JSON_PATHS: string[] = process.env.SPIDER_DEALS_JSON
  ? process.env.SPIDER_DEALS_JSON.split(';').map((s) => s.trim()).filter(Boolean)
  : (process.platform === 'win32' ? DEFAULT_JSON_PATHS_WIN : DEFAULT_JSON_PATHS_NIX);
// Tente d'abord l'URI fourni, puis le hostname container, puis localhost
const CANDIDATE_URIS = [
  process.env.MONGODB_URI,
  'mongodb://sallycards:sallycards_dev@sallycards-mongo:27017/sallycards?authSource=admin',
  'mongodb://mongo:27017/sallycards',
  'mongodb://sallycards:sallycards_dev@localhost:27017/sallycards?authSource=admin',
  'mongodb://localhost:27017/sallycards',
].filter(Boolean) as string[];

async function tryConnect(): Promise<MongoClient> {
  let lastErr: any = null;
  for (const uri of CANDIDATE_URIS) {
    try {
      const client = new MongoClient(uri, { serverSelectionTimeoutMS: 4000 });
      await client.connect();
      console.log(`✅ Connecté à MongoDB : ${uri.replace(/\/\/.*@/, '//<creds>@')}`);
      return client;
    } catch (err: any) {
      lastErr = err;
      console.warn(`  ↻ Échec ${uri.replace(/\/\/.*@/, '//<creds>@')}: ${err?.message ?? err}`);
    }
  }
  throw lastErr ?? new Error('Aucune URI Mongo connectable');
}

function loadDealsFromFile(filePath: string): any[] {
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⏭  Fichier absent : ${filePath} (ignoré)`);
    return [];
  }
  const stat = fs.statSync(filePath);
  console.log(`  📂 ${filePath} (${(stat.size / 1024 / 1024).toFixed(1)} MB)`);
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const json = JSON.parse(raw);
    const deals: any[] = Array.isArray(json) ? json : json?.deals;
    if (!Array.isArray(deals)) {
      console.warn(`  ⚠️  Format invalide pour ${filePath} (pas de tableau deals)`);
      return [];
    }
    return deals;
  } catch (err: any) {
    console.warn(`  ⚠️  Erreur lecture ${filePath} : ${err?.message ?? err}`);
    return [];
  }
}

async function main() {
  console.log('📂 Recherche des fichiers JSON Spider…');
  const allDeals: any[] = [];
  const filesUsed: string[] = [];
  for (const p of JSON_PATHS) {
    const ds = loadDealsFromFile(p);
    if (ds.length > 0) {
      allDeals.push(...ds);
      filesUsed.push(`${p} (${ds.length} deals)`);
    }
  }
  if (allDeals.length === 0) {
    console.error(`❌ Aucun deal trouvé. Fichiers cherchés :`);
    for (const p of JSON_PATHS) console.error(`   ${p}`);
    process.exit(1);
  }
  console.log(`\n📦 Total : ${allDeals.length} deals depuis ${filesUsed.length} fichier(s)`);
  for (const f of filesUsed) console.log(`   ${f}`);

  // Stats par variant/difficulty
  const breakdown: Record<string, Record<string, number>> = {};
  for (const d of allDeals) {
    const v = d?.variant ?? 'unknown';
    const diff = d?.difficulty ?? 'unknown';
    breakdown[v] = breakdown[v] ?? {};
    breakdown[v][diff] = (breakdown[v][diff] ?? 0) + 1;
  }
  console.log('\n📊 Répartition à importer :');
  for (const v of Object.keys(breakdown)) {
    const parts = Object.entries(breakdown[v])
      .map(([d, n]) => `${d}=${n}`)
      .join(', ');
    console.log(`   ${v} : ${parts}`);
  }

  const client = await tryConnect();
  try {
    const db = client.db('sallycards');
    const col = db.collection('spider_deals_v2');

    let upserted = 0;
    let modified = 0;
    let errors = 0;
    const t0 = Date.now();

    for (let i = 0; i < allDeals.length; i++) {
      const d = allDeals[i];
      if (!d?._id) {
        errors++;
        continue;
      }
      try {
        const res = await col.updateOne(
          { _id: d._id as any },
          {
            $set: {
              variant: d.variant ?? 'unknown',
              difficulty: d.difficulty ?? 'medium',
              solvable: d.solvable !== false,
              total_turns: d.total_turns ?? (Array.isArray(d.turns) ? d.turns.length : 0),
              solution_length: d.solution_length ?? 0,
              turns: Array.isArray(d.turns) ? d.turns : [],
              imported_at: new Date(),
            },
          },
          { upsert: true },
        );
        if (res.upsertedCount > 0) upserted++;
        if (res.modifiedCount > 0) modified++;
      } catch (err: any) {
        errors++;
        console.warn(`  ⚠️ Erreur deal ${d._id}: ${err?.message ?? err}`);
      }
      if ((i + 1) % 50 === 0) {
        const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
        console.log(`   → ${i + 1}/${allDeals.length} traités (${elapsed}s, ${upserted} upserted, ${modified} modifiés)`);
      }
    }

    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    const totalInDB = await col.countDocuments({});
    console.log(
      `\n✅ Import terminé en ${elapsed}s :\n` +
        `   upserted = ${upserted}\n` +
        `   modifiés = ${modified}\n` +
        `   erreurs  = ${errors}\n` +
        `   total en BD = ${totalInDB}`,
    );

    // Stats finales par variant/difficulty
    const allVariantsInDB = await col
      .aggregate([
        { $group: { _id: { variant: '$variant', difficulty: '$difficulty' }, count: { $sum: 1 } } },
        { $sort: { '_id.variant': 1, '_id.difficulty': 1 } },
      ])
      .toArray();
    console.log('\n📊 État final BD spider_deals_v2 :');
    for (const e of allVariantsInDB) {
      console.log(`   ${e._id.variant} / ${e._id.difficulty} : ${e.count}`);
    }
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error('❌ Erreur fatale :', err);
  process.exit(1);
});
