import type { ServiceType } from '@/types/portal';

/**
 * Short one-line plan description shown on the customer dashboard's
 * "Your Plan" tile. Keep these warm and human — the customer reads
 * them every time they sign in.
 */
export const SERVICE_DESCRIPTIONS: Record<ServiceType, string> = {
  pool:
    'Weekly pool service · chemistry · skim & brush · equipment check.',
  lawn:
    'Mow, edge, trim, and irrigation inspection — kept on schedule.',
  pressure:
    'Pressure washing for driveways, patios, decks, and exteriors.',
  window:
    'Interior and exterior windows, frames, and hardware detailed.',
};
