import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ChemicalReadings } from '@/types/portal';

export interface RangeSpec {
  min: number;
  max: number;
  unit: string;
  label: string;
  hint: string;
}

export type RangeKey = keyof Omit<ChemicalReadings, 'recordedAt'>;

export const DEFAULT_POOL_RANGES: Record<RangeKey, RangeSpec> = {
  ph: { min: 7.2, max: 7.6, unit: '', label: 'pH', hint: '7.2 – 7.6' },
  chlorineFree: { min: 1, max: 3, unit: 'ppm', label: 'Free Chlorine', hint: '1 – 3 ppm' },
  chlorineTotal: { min: 1, max: 3, unit: 'ppm', label: 'Total Chlorine', hint: '1 – 3 ppm' },
  alkalinity: { min: 80, max: 120, unit: 'ppm', label: 'Alkalinity', hint: '80 – 120 ppm' },
  calciumHardness: { min: 200, max: 400, unit: 'ppm', label: 'Calcium Hardness', hint: '200 – 400 ppm' },
  cyanuricAcid: { min: 30, max: 50, unit: 'ppm', label: 'Cyanuric Acid', hint: '30 – 50 ppm' },
  salt: { min: 2700, max: 3400, unit: 'ppm', label: 'Salt', hint: '2700 – 3400 ppm' },
  tds: { min: 0, max: 2500, unit: 'ppm', label: 'TDS', hint: '< 2500 ppm' },
};

/**
 * Synchronous in-memory ranges. Defaults to DEFAULT_POOL_RANGES; replaced
 * after loadPoolRangesConfig() resolves. Consumers that don't await still
 * see safe defaults, and re-renders triggered by config load will pick up
 * the updated values.
 */
export const POOL_RANGES: Record<RangeKey, RangeSpec> = { ...DEFAULT_POOL_RANGES };

export type RangeStatus = 'in-range' | 'low' | 'high' | 'unknown';

export function statusFor(key: RangeKey, value: number | undefined): RangeStatus {
  if (value === undefined || Number.isNaN(value)) return 'unknown';
  const spec = POOL_RANGES[key];
  if (value < spec.min) return 'low';
  if (value > spec.max) return 'high';
  return 'in-range';
}

export const RANGE_COLORS: Record<RangeStatus, { fg: string; bg: string }> = {
  'in-range': { fg: '#7fcb8a', bg: 'rgba(127,203,138,0.12)' },
  low: { fg: '#e8c97a', bg: 'rgba(232,201,122,0.12)' },
  high: { fg: '#f0a5a5', bg: 'rgba(240,165,165,0.12)' },
  unknown: { fg: '#8b95a7', bg: 'rgba(139,149,167,0.08)' },
};

/**
 * Reads /config/poolRanges from Firestore — admin can edit. Falls back
 * to DEFAULT_POOL_RANGES if the doc is missing or unreadable. Doc shape
 * is partial: only fields with both min and max get merged over the
 * defaults; other fields keep their defaults.
 */
export type PoolRangesConfig = Record<RangeKey, RangeSpec>;

let rangesPromise: Promise<PoolRangesConfig> | null = null;

export function loadPoolRangesConfig(): Promise<PoolRangesConfig> {
  if (!rangesPromise) {
    rangesPromise = (async () => {
      try {
        const snap = await getDoc(doc(db, 'config', 'poolRanges'));
        if (!snap.exists()) return DEFAULT_POOL_RANGES;
        const data = snap.data() as Partial<Record<RangeKey, Partial<RangeSpec>>>;
        const merged = mergeRanges(DEFAULT_POOL_RANGES, data);
        // Update the live module-level map so synchronous consumers
        // pick up the admin-tuned values once the load completes.
        Object.assign(POOL_RANGES, merged);
        return merged;
      } catch {
        return DEFAULT_POOL_RANGES;
      }
    })();
  }
  return rangesPromise;
}

export function invalidatePoolRangesCache(): void {
  rangesPromise = null;
}

export async function savePoolRangesConfig(config: PoolRangesConfig): Promise<void> {
  await setDoc(doc(db, 'config', 'poolRanges'), config);
  Object.assign(POOL_RANGES, config);
  invalidatePoolRangesCache();
}

function mergeRanges(
  base: PoolRangesConfig,
  override: Partial<Record<RangeKey, Partial<RangeSpec>>>,
): PoolRangesConfig {
  const result: PoolRangesConfig = { ...base };
  (Object.keys(base) as RangeKey[]).forEach((k) => {
    const o = override[k];
    if (!o) return;
    const min = typeof o.min === 'number' ? o.min : base[k].min;
    const max = typeof o.max === 'number' ? o.max : base[k].max;
    result[k] = {
      ...base[k],
      min,
      max,
      hint: o.hint ?? formatHint(min, max, base[k].unit),
    };
  });
  return result;
}

function formatHint(min: number, max: number, unit: string): string {
  const u = unit ? ` ${unit}` : '';
  return `${min} – ${max}${u}`;
}
