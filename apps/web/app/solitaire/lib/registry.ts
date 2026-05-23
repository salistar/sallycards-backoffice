/**
 * @file apps/web/app/solitaire/lib/registry.ts
 * @description Catalogue de variantes de solitaire. Combine les variantes
 *   phares (flagships), le catalogue généré (107 tableau + 23 paires) et les
 *   familles dédiées (Spider 1/2/4, Horloge ×5, Maze). Expose la liste + un
 *   chargeur qui renvoie l'état initial et le reducer de la bonne famille.
 */
import * as Tableau from './engines/_genericTableau';
import * as Pairs from './engines/_genericPairs';
import * as Maze from './engines/_mazeEngine';
import * as MClock from './engines/clock_solitaire';
import * as MBigBen from './engines/big_ben';
import * as MGfClock from './engines/grandfathers_clock';
import * as MHdd from './engines/hickory_dickory_dock';
import * as MTrav from './engines/travellers';
import * as MMaze from './engines/maze';
import { MODULES, FAMILY } from './registry.gen';
import { FLAGSHIPS } from './flagships';

export type Family = 'tableau' | 'pairs' | 'spider' | 'dist' | 'maze';
export interface VariantInfo { key: string; label: string; family: Family; category: string; flagship: boolean }

const DIST_MODS: Record<string, any> = { clock_solitaire: MClock, big_ben: MBigBen, grandfathers_clock: MGfClock, hickory_dickory_dock: MHdd, travellers: MTrav };
const SPIDER = [
  { key: 'spider-1', label: 'Spider 1 couleur' },
  { key: 'spider-2', label: 'Spider 2 couleurs' },
  { key: 'spider-4', label: 'Spider 4 couleurs' },
];

function titleize(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Numéro de couleurs d'une clé spider (spider-1/2/4). */
export function spiderSuits(key: string): 1 | 2 | 4 { const n = Number(key.split('-')[1]); return (n === 1 || n === 2 ? n : 4); }

/** Liste complète des variantes (phares d'abord). */
export const VARIANTS: VariantInfo[] = (() => {
  const out: VariantInfo[] = [];
  for (const [key, f] of Object.entries(FLAGSHIPS)) out.push({ key, label: f.label, family: 'tableau', category: f.category, flagship: true });
  for (const s of SPIDER) out.push({ key: s.key, label: s.label, family: 'spider', category: 'Spider', flagship: true });
  for (const key of Object.keys(MODULES).sort()) {
    const family: Family = FAMILY[key] === 'pairs' ? 'pairs' : 'tableau';
    const mod = MODULES[key];
    const cfg = family === 'pairs' ? mod.PAIRS_CONFIG : mod.CONFIG;
    out.push({ key, label: (cfg?.name as string) || titleize(key), family, category: family === 'pairs' ? 'Paires & Pyramides' : 'Tableau', flagship: false });
  }
  for (const key of Object.keys(DIST_MODS)) out.push({ key, label: (DIST_MODS[key].CONFIG?.name as string) || titleize(key), family: 'dist', category: 'Horloge', flagship: false });
  out.push({ key: 'maze', label: (MMaze.MAZE_CONFIG?.name as string) || 'Maze', family: 'maze', category: 'Maze', flagship: false });
  return out;
})();

export function getVariant(key: string): VariantInfo | undefined { return VARIANTS.find((v) => v.key === key); }

/** Crée l'état initial + renvoie le reducer pour une variante (familles avec état partagé). */
export function loadVariant(key: string, seed?: number | string | null): { family: Family; state: any; reducer: (s: any, a: any) => any } | null {
  const fl = FLAGSHIPS[key];
  if (fl) return { family: 'tableau', state: Tableau.createInitialStateFor(fl.config, seed ?? null), reducer: Tableau.gameReducer as any };
  if (DIST_MODS[key]) { const m = DIST_MODS[key]; return { family: 'dist', state: m.createInitialState(), reducer: m.gameReducer as any }; }
  if (key === 'maze') return { family: 'maze', state: Maze.createInitialStateFor(MMaze.MAZE_CONFIG, seed ?? null), reducer: Maze.gameReducer as any };
  const family = FAMILY[key];
  const mod = MODULES[key];
  if (!mod || !family) return null;
  if (family === 'pairs') return { family: 'pairs', state: Pairs.createInitialStateFor(mod.PAIRS_CONFIG, seed ?? null), reducer: Pairs.gameReducer as any };
  return { family: 'tableau', state: mod.createInitialState(typeof seed === 'number' ? seed : undefined), reducer: mod.gameReducer as any };
}
