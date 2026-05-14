/**
 * Bulletproof backup email path.
 *
 * Every successful website submission fires to formsubmit.co IN PARALLEL with
 * the Zapier webhook. formsubmit.co is a free, no-signup service that turns
 * any HTTP POST into an email delivered to a fixed inbox.
 *
 * Why this exists: if Zapier has an outage, a filter mismatch, or a temporary
 * misconfiguration, leads would silently disappear. This second path
 * guarantees that sales@stablesvc.com gets every form submission, no matter
 * what.
 *
 * One-time setup required:
 *   The FIRST submission ever sent to formsubmit triggers a confirmation
 *   email at sales@stablesvc.com. The recipient must click "Activate Form" in
 *   that email exactly once. After that, all future submissions deliver
 *   immediately and silently.
 *
 * This file has NO external dependencies — it's plain `fetch()` with the
 * `keepalive` flag so the request survives even if the user closes the tab
 * the instant they hit submit.
 */

import type { ZapierPayload } from '@/lib/zapierWebhook';

/** The fixed inbox that receives every backup notification. */
const BACKUP_INBOX = 'sales@stablesvc.com';

/** formsubmit.co's submit endpoint, scoped to the backup inbox above. */
const FORMSUBMIT_ENDPOINT = `https://formsubmit.co/${BACKUP_INBOX}`;

/**
 * Fire-and-forget backup email. Never throws, never blocks. If anything goes
 * wrong (network, CORS, anything), the existing Zapier path still has the
 * lead. This is purely additive resilience.
 */
export async function sendBackupEmail(payload: ZapierPayload): Promise<void> {
  try {
    const form = new FormData();

    // formsubmit.co control fields (the underscore-prefixed names are special)
    form.append('_subject', buildSubject(payload));
    form.append('_template', 'table');
    form.append('_captcha', 'false');
    if (payload.email) {
      form.append('_replyto', payload.email);
    }

    // Human-readable lead summary fields (rendered as a table in the email)
    appendIfPresent(form, 'Lead Type', payload.stage);
    appendIfPresent(form, 'Source', payload.source);
    appendIfPresent(form, 'Booking ID', payload.bookingId);
    appendIfPresent(form, 'Submitted', payload.submittedAt);

    appendIfPresent(form, 'Customer Name', payload.fullName);
    appendIfPresent(form, 'Phone', payload.phone);
    appendIfPresent(form, 'Email', payload.email);
    appendIfPresent(form, 'Preferred Contact', payload.preferredContact);
    appendIfPresent(form, 'Address', payload.fullAddress);

    appendIfPresent(form, 'Service', payload.serviceLabel);
    appendIfPresent(form, 'Plan / Category', payload.planLabel);
    appendIfPresent(form, 'Price', payload.planPrice);

    appendIfPresent(form, 'Preferred Date', payload.preferredDate);
    appendIfPresent(form, 'Time Window', payload.timeWindow);
    appendIfPresent(form, 'Weekly Day', payload.weeklyDay);
    appendIfPresent(form, 'Pool Size', payload.poolSize);
    appendIfPresent(form, 'Pool Type', payload.poolType);
    appendIfPresent(form, 'Lawn Size', payload.lawnSize);
    appendIfPresent(form, 'Pressure Area', payload.pressureArea);

    appendIfPresent(form, 'Business Name', payload.businessName);
    appendIfPresent(form, 'Business Role', payload.businessRole);
    appendIfPresent(form, 'Property Type', payload.propertyType);
    appendIfPresent(form, 'Services Interested', payload.servicesInterested);

    appendIfPresent(form, 'Repair Category', payload.repairCategory);
    appendIfPresent(form, 'Urgency', payload.urgency);
    appendIfPresent(form, 'Description', payload.description);

    appendIfPresent(form, 'Customer Notes', payload.notes);
    appendIfPresent(form, 'Confirmation #', payload.confirmationId);

    await fetch(FORMSUBMIT_ENDPOINT, {
      method: 'POST',
      body: form,
      mode: 'no-cors',
      keepalive: true,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[Backup Email] formsubmit POST failed', err);
  }
}

function buildSubject(p: ZapierPayload): string {
  const stage = p.stage ? `[${p.stage.toUpperCase()}]` : '[LEAD]';
  const who = p.fullName || p.email || p.phone || 'Unknown';
  const what = p.serviceLabel || 'Stable Services';
  return `${stage} ${who} — ${what}`;
}

function appendIfPresent(
  form: FormData,
  label: string,
  value: string | undefined,
): void {
  if (value && value.trim().length > 0) {
    form.append(label, value);
  }
}
