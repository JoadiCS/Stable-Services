/**
 * Posts booking data to a Zapier "Catch Hook" webhook URL.
 *
 * The webhook URL is read from VITE_ZAPIER_WEBHOOK_URL at build time.
 * Set it in a .env / .env.local file or in your hosting provider's
 * environment variables (Vercel, Netlify, Cloudflare Pages, etc).
 *
 * We send the same shape twice during a booking:
 *   1) stage="lead"  — fired before Square redirect. Captures EVERY
 *      completed funnel so a job exists in Housecall Pro even if the
 *      customer abandons checkout.
 *   2) stage="paid"  — fired when Square redirects back to /?status=success.
 *      Lets the Zap mark the job as paid / scheduled.
 *
 * The function is fire-and-forget — failures never block the user flow.
 */

import type { FunnelSubmission } from '@/components/funnel/FunnelModal';
import {
  planLabel,
  planPriceLabel,
  serviceLabel,
} from '@/lib/bookingDisplay';

export type WebhookStage = 'lead' | 'paid' | 'estimate' | 'commercial' | 'repair';

export interface ZapierPayload {
  stage: WebhookStage;
  source: 'stablesvc-website';
  /** Generated client-side so the "paid" event can match the "lead" event */
  bookingId: string;
  /** ISO timestamp */
  submittedAt: string;

  // Service
  service: string;
  serviceLabel: string;
  plan: string;
  planLabel: string;
  planPrice: string;

  // Customer (flat fields so Zapier mapping is trivial)
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  email: string;
  preferredContact: string;

  // Property
  address: string;
  city: string;
  fullAddress: string;
  poolSize?: string;
  poolType?: string;
  lawnSize?: string;
  houseSize?: string;
  pressureArea?: string;
  notes: string;

  // Schedule
  preferredDate: string;
  timeWindow: string;
  weeklyDay: string;

  // Square / payment
  confirmationId?: string;

  // Commercial inquiry only
  businessName?: string;
  businessRole?: string;
  propertyType?: string;
  servicesInterested?: string;

  // Repair request only
  repairCategory?: string;
  urgency?: string;
  description?: string;
}

function getWebhookUrl(): string | undefined {
  // Vite exposes env vars prefixed with VITE_ at build time on import.meta.env.
  const url = (import.meta as ImportMeta & { env?: Record<string, string> }).env
    ?.VITE_ZAPIER_WEBHOOK_URL;
  return url && url.length > 0 ? url : undefined;
}

export function buildZapierPayload(
  submission: FunnelSubmission,
  stage: WebhookStage,
  bookingId: string,
  confirmationId?: string,
): ZapierPayload {
  const fullName = [submission.contact.firstName, submission.contact.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  const fullAddress = [submission.property.address, submission.property.city]
    .filter(Boolean)
    .join(', ');

  return {
    stage,
    source: 'stablesvc-website',
    bookingId,
    submittedAt: new Date().toISOString(),

    service: submission.service,
    serviceLabel: serviceLabel(submission.service),
    plan: submission.plan,
    planLabel: planLabel(submission.service, submission.plan),
    planPrice: planPriceLabel(submission.service, submission.plan),

    firstName: submission.contact.firstName,
    lastName: submission.contact.lastName,
    fullName: fullName || '',
    phone: submission.contact.phone,
    email: submission.contact.email,
    preferredContact: submission.contact.contactPref,

    address: submission.property.address,
    city: submission.property.city,
    fullAddress,
    poolSize: submission.property.poolSize,
    poolType: submission.property.poolType,
    lawnSize: submission.property.lawnSize,
    houseSize: submission.property.houseSize,
    pressureArea: submission.property.pressureArea,
    notes: submission.property.notes,

    preferredDate: submission.schedule.date,
    timeWindow: submission.schedule.timeWindow,
    weeklyDay: submission.schedule.weekday,

    confirmationId,
  };
}

/**
 * POST the payload to Zapier. Fire-and-forget: this never throws and never
 * blocks the caller — if the webhook is misconfigured or Zapier is down,
 * the user flow continues uninterrupted.
 */
export async function sendToZapier(payload: ZapierPayload): Promise<void> {
  const url = getWebhookUrl();
  if (!url) {
    // No webhook configured — log to console for dev visibility.
    // eslint-disable-next-line no-console
    console.warn(
      '[Zapier] VITE_ZAPIER_WEBHOOK_URL not set — skipping webhook',
      payload,
    );
    return;
  }
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      // Zapier webhooks return permissive CORS, but we use "no-cors" anyway
      // because we don't need the response — this guarantees the request
      // is sent even from browsers with stricter defaults.
      mode: 'no-cors',
      keepalive: true, // ensures the request survives a navigation (Square redirect)
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[Zapier] webhook POST failed', err);
  }
}
