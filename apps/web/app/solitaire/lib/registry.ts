/**
 * @file apps/web/app/solitaire/lib/registry.ts
 * @description Catalogue de variantes de solitaire. Combine les variantes
 *   phares (flagships) et le catalogue généré (130 variantes : 107 tableau +
 *   23 paires). Expose la liste + un chargeur qui renvoie l'état initial et le
 *   reducer de la bonne famille pour une clé donnée.
 */
import * as Tableau from './engines/_genericTableau';
import * as Pairs from './engines/_genericPairs';
import { MODULES, FAMILY } from './registry.gen';
import { FLAGSHIPS } from './flagships';

export type Family = 'tableau' | 'pairs';
export interface VariantInfo { key: string; label: string; family: Family; category: string; flagship: boolean }

function titleize(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Liste complète des variantes (phares d'abord). */
export const VARIANTS: VariantInfo[] = (() => {
  const out: VariantInfo[] = [];
  for (const [key, f] of Object.entries(FLAGSHIPS)) out.push({ key, label: f.label, family: 'tableau', category: f.category, flagship: true });
  for (const key of Object.keys(MODULES).sort()) {
    const family = FAMILY[key] || 'tableau';
    const mod = MODULES[key];
    const cfg = family === 'pairs' ? mod.PAIRS_CONFIG : mod.CONFIG;
    const label = (cfg?.name as string) || titleize(key);
    out.push({ key, label, family, category: family === 'pairs' ? 'Paires & Pyramides' : 'Tableau', flagship: false });
  }
  return out;
})();

export function getVariant(key: string): VariantInfo | undefined { return VARIANTS.find((v) => v.key === key); }

/** Crée l'état initial + renvoie le reducer pour une variante. */
export function loadVariant(key: string, seed?: number | string | null): { family: Family; state: any; reducer: (s: any, a: any) => any } | null {
  // Flagship ?
  const fl = FLAGSHIPS[key];
  if (fl) return { family: 'tableau', state: Tableau.createInitialStateFor(fl.config, seed ?? null), reducer: Tableau.gameReducer as any };
  const family = FAMILY[key];
  const mod = MODULES[key];
  if (!mod || !family) return null;
  if (family === 'pairs') return { family: 'pairs', state: Pairs.createInitialStateFor(mod.PAIRS_CONFIG, seed ?? null), reducer: Pairs.gameReducer as any };
  return { family: 'tableau', state: mod.createInitialState(typeof seed === 'number' ? seed : undefined), reducer: mod.gameReducer as any };
}
