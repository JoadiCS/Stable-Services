/**
 * Pretty-print helpers for rendering a stored booking on the ThankYou page
 * and on the printable receipt.
 */

import { planData } from '@/data/plans';
import type { StoredBooking } from './bookingStorage';

const serviceLabels: Record<string, string> = {
  pool: 'Pool Service',
  lawn: 'Lawn Care',
  pressure: 'Pressure Washing',
  windows: 'Window Cleaning',
  multiple: 'Multiple Services',
};

export function serviceLabel(key: string): string {
  return serviceLabels[key] ?? key;
}

export function planLabel(serviceKey: string, planId: string): string {
  const list = planData[serviceKey as keyof typeof planData];
  if (!list) return planId;
  const found = list.find((p) => p.id === planId);
  if (!found) return planId;
  return found.nameSuffix ? `${found.name}${found.nameSuffix}` : found.name;
}

export function planPriceLabel(serviceKey: string, planId: string): string {
  const list = planData[serviceKey as keyof typeof planData];
  if (!list) return '';
  return list.find((p) => p.id === planId)?.fromPrice ?? '';
}

export function formatSubmittedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function fullName(b: StoredBooking): string {
  return [b.contact.firstName, b.contact.lastName].filter(Boolean).join(' ').trim();
}
