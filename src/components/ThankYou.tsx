import { useEffect, useMemo, useRef, useState } from 'react';
import { loadBooking, type StoredBooking } from '@/lib/bookingStorage';
import {
  fullName,
  formatSubmittedAt,
  planLabel,
  planPriceLabel,
  serviceLabel,
} from '@/lib/bookingDisplay';
import { siteConfig } from '@/data/siteConfig';
import { renderReceiptHtml } from './ThankYouReceipt';
import { buildZapierPayload, sendToZapier } from '@/lib/zapierWebhook';

/* ─────────────────────────────────────────────────────────────────────────
   Post-payment confirmation page.
   Renders when the URL contains ?status=success (configurable in Square's
   redirect URL setting). Reads booking details from sessionStorage and
   shows a summary, plus print-to-PDF receipt and email-me actions.
   ───────────────────────────────────────────────────────────────────────── */

export function ThankYou() {
  const booking = useMemo<StoredBooking | null>(() => loadBooking(), []);
  const [emailSent, setEmailSent] = useState(false);
  const paidWebhookSent = useRef(false);

  // Scroll to top + fire the "paid" Zapier webhook on first mount.
  useEffect(() => {
    window.scrollTo(0, 0);
    if (booking && !paidWebhookSent.current) {
      paidWebhookSent.current = true;
      void sendToZapier(
        buildZapierPayload(
          booking,
          'paid',
          booking.bookingId,
          booking.confirmationId,
        ),
      );
    }
  }, [booking]);

  function downloadReceipt() {
    if (!booking) return;
    // Open the receipt as an HTML page in a new window with print styles, so
    // the customer can save as PDF via their browser's print dialog.
    const html = renderReceiptHtml(booking);
    const win = window.open('', '_blank', 'noopener,noreferrer');
    if (!win) {
      // Pop-up blocked — fall back to data URL navigation in the same tab.
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.location.href = url;
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
  }

  function emailReceipt() {
    if (!booking) return;
    // No backend wired yet — for now we mark "sent" optimistically and let
    // the customer rely on Square's automatic emailed receipt (which goes
    // to the email they entered on the Square checkout page).
    //
    // TODO before launch: wire to a real transactional email service
    // (Resend, Postmark, SendGrid) — POST { booking, to: booking.contact.email }
    // to /api/email-receipt.
    setEmailSent(true);
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0f1e',
        color: '#ffffff',
        padding: '6rem 1.5rem 4rem',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div style={{ width: '100%', maxWidth: 720 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div
            style={{
              width: 64,
              height: 64,
              border: '1px solid #c9a84c',
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              fontSize: '1.75rem',
              color: '#c9a84c',
            }}
          >
            ✓
          </div>
          <div className="ss-section-label" style={{ justifyContent: 'center' }}>
            <div className="ss-section-label-line" />
            <span>Payment Received</span>
          </div>
          <h1
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 'clamp(2.2rem, 4vw, 3.4rem)',
              fontWeight: 300,
              lineHeight: 1.1,
              marginTop: '1rem',
              letterSpacing: '-0.01em',
            }}
          >
            Thank you
            {booking ? `, ` : '.'}
            {booking && (
              <em style={{ fontStyle: 'italic', color: '#e8c97a' }}>
                {booking.contact.firstName || 'neighbor'}!
              </em>
            )}
          </h1>
          <p
            style={{
              color: '#8b95a7',
              fontSize: '0.95rem',
              lineHeight: 1.7,
              fontWeight: 300,
              maxWidth: 480,
              margin: '1.25rem auto 0',
            }}
          >
            Your booking is confirmed. A Stable Services team member will
            reach out within a few hours to lock in your first visit. A
            payment receipt has also been sent to your email from Square.
          </p>
        </div>

        {/* Booking summary card */}
        {booking ? (
          <BookingSummary booking={booking} />
        ) : (
          <NoBookingFound />
        )}

        {/* Actions */}
        {booking && (
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              flexWrap: 'wrap',
              justifyContent: 'center',
              marginTop: '2rem',
            }}
          >
            <button className="ss-btn-primary" onClick={downloadReceipt}>
              Download Receipt
            </button>
            <button
              className="ss-btn-pricing"
              onClick={emailReceipt}
              disabled={emailSent}
              style={{ width: 'auto', padding: '0.85rem 2rem' }}
            >
              {emailSent ? '✓ Sent to ' + booking.contact.email : 'Email Me a Copy'}
            </button>
            <a href="/" className="ss-btn-ghost" style={{ marginLeft: '0.5rem' }}>
              Back to Site →
            </a>
          </div>
        )}

        {/* Help footer */}
        <div
          style={{
            marginTop: '4rem',
            paddingTop: '2rem',
            borderTop: '0.5px solid rgba(201,168,76,0.18)',
            textAlign: 'center',
            fontSize: '0.78rem',
            color: '#8b95a7',
            lineHeight: 1.8,
            fontWeight: 300,
          }}
        >
          Questions?{' '}
          <a
            href={`tel:${siteConfig.contact.phoneE164}`}
            style={{ color: '#c9a84c', textDecoration: 'none' }}
          >
            {siteConfig.contact.phoneDisplay}
          </a>{' '}
          ·{' '}
          <a
            href={`mailto:${siteConfig.contact.email}`}
            style={{ color: '#c9a84c', textDecoration: 'none' }}
          >
            {siteConfig.contact.email}
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Booking summary card
   ───────────────────────────────────────────────────────────────────────── */
function BookingSummary({ booking }: { booking: StoredBooking }) {
  const rows: Array<[string, string]> = [
    ['Service', serviceLabel(booking.service)],
    ['Plan', planLabel(booking.service, booking.plan)],
    ['Price', planPriceLabel(booking.service, booking.plan)],
    ['Customer', fullName(booking) || '—'],
    ['Phone', booking.contact.phone || '—'],
    ['Email', booking.contact.email || '—'],
    ['Preferred Contact', booking.contact.contactPref || '—'],
    [
      'Property Address',
      [booking.property.address, booking.property.city]
        .filter(Boolean)
        .join(', ') || '—',
    ],
    ['Scheduled Date', booking.schedule.date || '—'],
    ['Time Window', booking.schedule.timeWindow || '—'],
    ['Weekly Service Day', booking.schedule.weekday || '—'],
  ];

  if (booking.property.poolSize) rows.push(['Pool Size', booking.property.poolSize]);
  if (booking.property.poolType) rows.push(['Pool Type', booking.property.poolType]);
  if (booking.property.lawnSize) rows.push(['Lawn Size', booking.property.lawnSize]);
  if (booking.property.pressureArea)
    rows.push(['Pressure Wash Area', booking.property.pressureArea]);
  if (booking.property.notes) rows.push(['Notes', booking.property.notes]);

  return (
    <div
      style={{
        background: '#111827',
        border: '1px solid rgba(201,168,76,0.18)',
        borderRadius: 2,
        padding: '2rem 2rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1.5rem',
          paddingBottom: '1.5rem',
          borderBottom: '0.5px solid rgba(201,168,76,0.18)',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.65rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#c9a84c',
              marginBottom: '0.4rem',
            }}
          >
            Confirmation
          </div>
          <div
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: '1.4rem',
              fontWeight: 300,
              letterSpacing: '0.04em',
            }}
          >
            #{booking.confirmationId}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: '0.65rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#c9a84c',
              marginBottom: '0.4rem',
            }}
          >
            Submitted
          </div>
          <div style={{ fontSize: '0.88rem', color: '#f7f5f0' }}>
            {formatSubmittedAt(booking.submittedAt)}
          </div>
        </div>
      </div>

      <dl
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '0.75rem',
          margin: 0,
        }}
      >
        {rows.map(([label, value]) => (
          <div
            key={label}
            style={{
              display: 'grid',
              gridTemplateColumns: '180px 1fr',
              gap: '1rem',
              alignItems: 'baseline',
              padding: '0.4rem 0',
            }}
          >
            <dt
              style={{
                fontSize: '0.7rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#8b95a7',
                fontWeight: 400,
              }}
            >
              {label}
            </dt>
            <dd
              style={{
                fontSize: '0.92rem',
                color: '#ffffff',
                fontWeight: 300,
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Fallback when we have no booking in storage (refresh, shared link, etc.)
   ───────────────────────────────────────────────────────────────────────── */
function NoBookingFound() {
  return (
    <div
      style={{
        background: '#111827',
        border: '1px solid rgba(201,168,76,0.18)',
        borderRadius: 2,
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          color: '#8b95a7',
          fontSize: '0.9rem',
          lineHeight: 1.7,
          fontWeight: 300,
        }}
      >
        We couldn't find your booking details in this browser session. Your
        payment is still on file with Square, and our team will reach out
        within a few hours to confirm your service. If you don't hear from
        us, please call or email and reference your Square receipt.
      </p>
      <div
        style={{
          marginTop: '1.5rem',
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        <a href={`tel:${siteConfig.contact.phoneE164}`} className="ss-btn-primary">
          Call {siteConfig.contact.phoneDisplay}
        </a>
        <a href="/" className="ss-btn-ghost">
          Back to Site →
        </a>
      </div>
    </div>
  );
}
