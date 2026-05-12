/**
 * Renders a standalone HTML receipt for a stored booking. We open this in
 * a new window so the customer can print it (Save as PDF) or just keep
 * it for their records.
 *
 * Kept as plain HTML (no React) so the receipt window is fully
 * self-contained — no Vite, no JS, no dependencies. Just print it.
 */

import type { StoredBooking } from '@/lib/bookingStorage';
import {
  fullName,
  formatSubmittedAt,
  planLabel,
  planPriceLabel,
  serviceLabel,
} from '@/lib/bookingDisplay';
import { siteConfig } from '@/data/siteConfig';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function row(label: string, value: string): string {
  if (!value) return '';
  return `
    <tr>
      <th style="text-align:left;padding:8px 0;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#8b95a7;font-weight:400;width:200px;vertical-align:top">${esc(label)}</th>
      <td style="padding:8px 0;font-size:13px;color:#111;line-height:1.55">${esc(value)}</td>
    </tr>
  `;
}

export function renderReceiptHtml(b: StoredBooking): string {
  const customer = fullName(b) || '—';
  const addr =
    [b.property.address, b.property.city].filter(Boolean).join(', ') || '—';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Stable Services — Booking Confirmation #${esc(b.confirmationId)}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    color: #111;
    margin: 0;
    padding: 40px;
    background: #f7f5f0;
    line-height: 1.5;
  }
  .receipt {
    max-width: 720px;
    margin: 0 auto;
    background: #fff;
    border: 1px solid #ddd;
    padding: 48px 48px 40px;
  }
  .brand {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 2px solid #c9a84c;
    padding-bottom: 24px;
    margin-bottom: 24px;
  }
  .brand-name {
    font-family: "Cormorant Garamond", Georgia, serif;
    font-size: 22px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #0a0f1e;
  }
  .brand-sub {
    font-size: 11px;
    color: #8b95a7;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    text-align: right;
  }
  h1 {
    font-family: "Cormorant Garamond", Georgia, serif;
    font-weight: 300;
    font-size: 28px;
    margin: 0 0 4px;
    color: #0a0f1e;
  }
  .meta {
    display: flex;
    justify-content: space-between;
    margin: 16px 0 32px;
    font-size: 12px;
    color: #555;
  }
  .meta strong { color: #0a0f1e; display: block; font-size: 14px; font-family: "Cormorant Garamond", Georgia, serif; font-weight: 400; }
  table { width: 100%; border-collapse: collapse; }
  .section-title {
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #c9a84c;
    margin: 24px 0 8px;
    border-bottom: 1px solid #eee;
    padding-bottom: 6px;
  }
  .footer {
    margin-top: 36px;
    padding-top: 20px;
    border-top: 1px solid #eee;
    font-size: 11px;
    color: #8b95a7;
    line-height: 1.7;
  }
  .footer a { color: #c9a84c; text-decoration: none; }
  .print-cta {
    text-align: center;
    margin: 24px 0;
  }
  .print-cta button {
    background: #c9a84c;
    color: #0a0f1e;
    border: none;
    padding: 10px 24px;
    font-size: 12px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    font-weight: 500;
    cursor: pointer;
    border-radius: 2px;
  }
  @media print {
    body { background: #fff; padding: 0; }
    .receipt { border: none; padding: 24px; }
    .print-cta { display: none; }
  }
</style>
</head>
<body>
  <div class="receipt">
    <div class="brand">
      <div>
        <div class="brand-name">${esc(siteConfig.company.name)}</div>
        <div style="font-size:11px;color:#8b95a7;margin-top:4px">${esc(siteConfig.company.legalName)}</div>
      </div>
      <div class="brand-sub">
        ${esc(siteConfig.contact.phoneDisplay)}<br/>
        ${esc(siteConfig.contact.email)}
      </div>
    </div>

    <h1>Booking Confirmation</h1>
    <div style="font-size:13px;color:#555">Thank you for choosing Stable Services. Your booking has been received.</div>

    <div class="meta">
      <div>
        <span style="font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#8b95a7">Confirmation #</span>
        <strong>${esc(b.confirmationId)}</strong>
      </div>
      <div style="text-align:right">
        <span style="font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#8b95a7">Submitted</span>
        <strong>${esc(formatSubmittedAt(b.submittedAt))}</strong>
      </div>
    </div>

    <div class="section-title">Service</div>
    <table>
      ${row('Service', serviceLabel(b.service))}
      ${row('Plan', planLabel(b.service, b.plan))}
      ${row('Price', planPriceLabel(b.service, b.plan))}
    </table>

    <div class="section-title">Customer</div>
    <table>
      ${row('Name', customer)}
      ${row('Phone', b.contact.phone)}
      ${row('Email', b.contact.email)}
      ${row('Preferred Contact', b.contact.contactPref)}
    </table>

    <div class="section-title">Property</div>
    <table>
      ${row('Address', addr)}
      ${row('Pool Size', b.property.poolSize || '')}
      ${row('Pool Type', b.property.poolType || '')}
      ${row('Lawn Size', b.property.lawnSize || '')}
      ${row('Pressure Wash Area', b.property.pressureArea || '')}
      ${row('Notes', b.property.notes)}
    </table>

    <div class="section-title">Schedule</div>
    <table>
      ${row('First Visit Date', b.schedule.date)}
      ${row('Time Window', b.schedule.timeWindow)}
      ${row('Weekly Service Day', b.schedule.weekday)}
    </table>

    <div class="print-cta">
      <button onclick="window.print()">Print / Save as PDF</button>
    </div>

    <div class="footer">
      Questions about this booking? Reach us at
      <a href="tel:${esc(siteConfig.contact.phoneE164)}">${esc(siteConfig.contact.phoneDisplay)}</a>
      or
      <a href="mailto:${esc(siteConfig.contact.email)}">${esc(siteConfig.contact.email)}</a>.
      <br/>
      ${esc(siteConfig.legal.license)} · © ${b.submittedAt.slice(0, 4)} ${esc(siteConfig.company.legalName)}
    </div>
  </div>
</body>
</html>`;
}
