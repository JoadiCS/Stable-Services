import type { PlanTier, ServiceType } from '@/types/portal';

/**
 * Monthly recurring revenue contribution per service/plan combo, in USD.
 * Custom and one-off services contribute 0 (not auto-billed monthly).
 */
const PRICING: Record<ServiceType, Partial<Record<PlanTier, number>>> = {
  pool: { essential: 109.99, standard: 139.99, plus: 229.99 },
  lawn: { essential: 179.99 },
  pressure: {},
  window: {},
};

export function monthlyRevenueFor(serviceType: ServiceType, plan: PlanTier): number {
  return PRICING[serviceType]?.[plan] ?? 0;
}
