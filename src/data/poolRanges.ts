import type { ChemicalReadings } from '@/types/portal';

export interface RangeSpec {
  min: number;
  max: number;
  unit: string;
  label: string;
  hint: string;
}

export const POOL_RANGES: Record<keyof Omit<ChemicalReadings, 'recordedAt'>, RangeSpec> = {
  ph: { min: 7.2, max: 7.6, unit: '', label: 'pH', hint: '7.2 – 7.6' },
  chlorineFree: { min: 1, max: 3, unit: 'ppm', label: 'Free Chlorine', hint: '1 – 3 ppm' },
  chlorineTotal: { min: 1, max: 3, unit: 'ppm', label: 'Total Chlorine', hint: '1 – 3 ppm' },
  alkalinity: { min: 80, max: 120, unit: 'ppm', label: 'Alkalinity', hint: '80 – 120 ppm' },
  calciumHardness: { min: 200, max: 400, unit: 'ppm', label: 'Calcium Hardness', hint: '200 – 400 ppm' },
  cyanuricAcid: { min: 30, max: 50, unit: 'ppm', label: 'Cyanuric Acid', hint: '30 – 50 ppm' },
  salt: { min: 2700, max: 3400, unit: 'ppm', label: 'Salt', hint: '2700 – 3400 ppm' },
  tds: { min: 0, max: 2500, unit: 'ppm', label: 'TDS', hint: '< 2500 ppm' },
};

export type RangeKey = keyof typeof POOL_RANGES;

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
