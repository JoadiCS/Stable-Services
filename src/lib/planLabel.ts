import type { PlanTier, ServiceType } from '@/types/portal';

const TIER_BRAND: Record<PlanTier, string> = {
  essential: 'Stable Essential',
  standard: 'Stable Standard',
  plus: 'Stable Plus',
  custom: 'Stable Custom',
};

const SERVICE_BRAND: Record<ServiceType, string> = {
  pool: 'Pool',
  lawn: 'Lawn',
  pressure: 'Pressure Washing',
  window: 'Window Cleaning',
};

export function planLabel(plan: PlanTier): string {
  return TIER_BRAND[plan];
}

export function serviceLabel(service: ServiceType): string {
  return SERVICE_BRAND[service];
}

export function formatMonthlyRate(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return '—';
  return `$${amount.toFixed(2)} / month`;
}
