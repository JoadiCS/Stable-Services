/**
 * Persists the most recently submitted booking across the Square redirect.
 *
 * We stash the FunnelSubmission in sessionStorage right before sending the
 * customer off to Square checkout. When Square redirects back to
 * /?status=success, the ThankYou page reads from this key to hydrate the
 * booking summary.
 *
 * sessionStorage survives same-tab navigations (which is how we redirect to
 * Square) but is cleared when the tab is closed — good enough for a
 * single-session confirmation flow.
 */

import type { FunnelSubmission } from '@/components/funnel/FunnelModal';

const KEY = 'stable_last_booking_v1';

export interface StoredBooking extends FunnelSubmission {
  /** ISO timestamp of when the booking was submitted */
  submittedAt: string;
  /** Random short id for display ("Confirmation #") */
  confirmationId: string;
  /** Stable id used to correlate "lead" and "paid" Zapier webhooks */
  bookingId: string;
}

function genConfirmationId(): string {
  // 8-char base36 id, e.g. "K3F9P2QM"
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

/** UUID-ish id used to correlate the lead → paid webhook events in Zapier. */
function genBookingId(): string {
  return (
    Date.now().toString(36) +
    '-' +
    Math.random().toString(36).slice(2, 10)
  );
}

/** Standalone id generator (separate from confirmation id) for the lead/paid correlation. */
export const newBookingId = genBookingId;

export function saveBooking(
  submission: FunnelSubmission,
  bookingId?: string,
): StoredBooking {
  const stored: StoredBooking = {
    ...submission,
    submittedAt: new Date().toISOString(),
    confirmationId: genConfirmationId(),
    bookingId: bookingId ?? genBookingId(),
  };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(stored));
  } catch {
    // sessionStorage may throw in private mode or if quota is exceeded —
    // we swallow so the redirect still happens.
  }
  return stored;
}

export function loadBooking(): StoredBooking | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredBooking;
  } catch {
    return null;
  }
}

export function clearBooking(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
