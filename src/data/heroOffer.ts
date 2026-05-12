/**
 * The hero-right "competitive offer" card.
 * Edit this file to tweak the offer copy without touching any component code.
 */

import type { FunnelService } from '@/context/ModalContext';

export interface WaivedFee {
  /** What the fee is called (e.g. "Admin Fee") */
  label: string;
  /** Crossed-out amount shown next to the label (e.g. "$24.99/mo") */
  amount: string;
}

/**
 * A bullet in the offer card. If `accent` is set, that portion renders in
 * the gold accent color (matching the WAIVED tag) before the rest of `text`.
 */
export interface OfferBullet {
  /** Lead portion rendered in gold — optional */
  accent?: string;
  /** Remaining bullet text rendered in the default body color */
  text: string;
}

export interface HeroOffer {
  /** Small uppercase label at the very top */
  eyebrow: string;
  /** Big headline — supports a highlighted span via `headlineAccent` */
  headlineLead: string;
  /** Gold-accented portion of the headline (rendered in serif italic) */
  headlineAccent: string;
  /** Optional trailing portion after the accent */
  headlineTrail?: string;
  /** Short sub-headline below the headline */
  subhead: string;
  /**
   * What's being waived. Renders as a list of struck-through line items
   * directly above the final price so the savings are unmissable.
   */
  waivedFees: WaivedFee[];
  /** Final price label (e.g. "You pay just") */
  finalPriceLabel: string;
  /** Final price amount (e.g. "$129.99") */
  finalPriceAmount: string;
  /** Period suffix (e.g. "/month") */
  finalPricePeriod: string;
  /** Short note immediately under the final price (e.g. plan name) */
  finalPriceCaption: string;
  /** Feature bullets — keep to 3–4 for visual balance */
  bullets: OfferBullet[];
  /** Primary call-to-action label */
  ctaLabel: string;
  /**
   * What the CTA button does. If `service` + `plan` are provided, the
   * funnel opens pre-selected to that plan. Leave them out to open the
   * funnel cold so the visitor picks their own service.
   */
  ctaService?: FunnelService;
  ctaPlan?: string;
  /** Fine print under the CTA */
  finePrint: string;
  /** Star glyphs — typically '★★★★★' */
  trustStars: string;
  /** Rating number — rendered in serif italic gold next to the stars */
  trustRating: string;
  /** Caption underneath the stars — uppercased automatically */
  trustText: string;

  // ── PROMO BANNER (thin gold strip pinned above the nav) ──
  /** Flip to false when the promo ends to hide the banner entirely */
  bannerActive: boolean;
  /** Short banner text — keep under ~60 chars for mobile single-line fit */
  bannerText: string;
  /** Short CTA trailing the banner text */
  bannerCtaLabel: string;
}

export const heroOffer: HeroOffer = {
  eyebrow: 'Pre-Summer Pool Promo — Ends May 31',
  headlineLead: 'Pool Service.',
  headlineAccent: 'Fees Waived.',
  headlineTrail: 'Month-to-Month.',
  subhead:
    "New pool customers — sign up before May 31 and we waive both of our setup fees. Here's exactly what you save:",
  waivedFees: [
    { label: 'Admin Fee', amount: '$24.99/mo' },
    { label: 'Setup & Assessment Fee', amount: '$99 one-time' },
  ],
  finalPriceLabel: '',
  finalPriceAmount: '$139.99',
  finalPricePeriod: '/month',
  finalPriceCaption: 'Stable Standard Pool Service',
  bullets: [
    { accent: 'Chemicals Included', text: '— no hidden costs' },
    { text: 'Month-to-month — no contracts, cancel anytime' },
    { text: 'Same pool tech, same day, every week' },
    { text: "100% Satisfaction Guaranteed — or it's on us" },
  ],
  ctaLabel: 'Claim My Pool Promo →',
  ctaService: 'pool',
  ctaPlan: 'standard',
  finePrint:
    'New residential pool customers only. Must sign up by May 31, 2026. $24.99/mo Admin Fee and $99 one-time Setup & Assessment Fee waived on Stable Standard or Stable+ plans. All plans are month-to-month — no contracts.',
  trustStars: '★★★★★',
  trustRating: '5.0',
  trustText: 'Trusted by 200+ Arizona homes & businesses',

  // ── Banner above the nav ──
  bannerActive: true,
  bannerText: 'Pool Pre-Summer Promo: Admin + Setup Fees Waived · Ends May 31',
  bannerCtaLabel: 'Claim Offer →',
};
