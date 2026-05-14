import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Customer, PlanTier, ServiceType } from '@/types/portal';

export type PricingConfig = Record<ServiceType, Partial<Record<PlanTier, number>>>;

/**
 * Fallback plan-tier prices used when /config/pricing is missing or fails
 * to load. Match the published rates on the marketing site.
 */
export const DEFAULT_PRICING: PricingConfig = {
  pool: { essential: 109.99, standard: 139.99, plus: 229.99 },
  lawn: { essential: 179.99 },
  pressure: {},
  window: {},
};

let pricingPromise: Promise<PricingConfig> | null = null;

/**
 * Loads the pricing config from /config/pricing once per page load and
 * caches the promise. Returns DEFAULT_PRICING merged with whatever is in
 * the doc (so missing keys fall back gracefully).
 */
export function loadPricingConfig(): Promise<PricingConfig> {
  if (!pricingPromise) {
    pricingPromise = (async () => {
      try {
        const snap = await getDoc(doc(db, 'config', 'pricing'));
        if (!snap.exists()) return DEFAULT_PRICING;
        const data = snap.data() as Partial<PricingConfig>;
        return mergePricing(DEFAULT_PRICING, data);
      } catch {
        return DEFAULT_PRICING;
      }
    })();
  }
  return pricingPromise;
}

/** Force a re-read on next call. Call this after saving new pricing. */
export function invalidatePricingCache(): void {
  pricingPromise = null;
}

export async function savePricingConfig(config: PricingConfig): Promise<void> {
  await setDoc(doc(db, 'config', 'pricing'), config);
  invalidatePricingCache();
}

function mergePricing(base: PricingConfig, override: Partial<PricingConfig>): PricingConfig {
  const result: PricingConfig = {
    pool: { ...base.pool, ...(override.pool ?? {}) },
    lawn: { ...base.lawn, ...(override.lawn ?? {}) },
    pressure: { ...base.pressure, ...(override.pressure ?? {}) },
    window: { ...base.window, ...(override.window ?? {}) },
  };
  return result;
}

/**
 * Monthly recurring revenue contribution for a customer. Uses the
 * customer's monthlyRate override when set (and > 0), otherwise falls back
 * to the configured plan-tier price. Returns 0 if neither is available.
 *
 * Callers should `await loadPricingConfig()` once before calling this for
 * a batch of customers (the result is cached, but each call still reads
 * the cached promise, so pre-loading keeps it explicit).
 */
export function monthlyRevenueFor(customer: Customer, config: PricingConfig): number {
  if (typeof customer.monthlyRate === 'number' && customer.monthlyRate > 0) {
    return customer.monthlyRate;
  }
  const tier = config[customer.serviceType]?.[customer.plan];
  return tier ?? 0;
}
