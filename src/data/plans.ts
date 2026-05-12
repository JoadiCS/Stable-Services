/**
 * Pricing plans — drives both the pricing cards on the Services section
 * and the funnel modal's "select a plan" step.
 */

export type ServiceKey = 'pool' | 'lawn' | 'pressure' | 'windows' | 'multiple' | 'repairs';

export interface PricingPlan {
  id: string;
  tier: string;
  name: string;
  /** Optional accent character appended to name (e.g. "+") */
  nameSuffix?: string;
  dollar: string;
  amount: string;
  period: string;
  description: string;
  features: string[];
  /** Funnel quick-pick blurb (shorter than features) */
  funnelBlurb: string;
  ctaLabel: string;
  /** From-price label shown in funnel service picker */
  fromPrice: string;
  /** Marks card as the featured/highlighted card on the page */
  featured?: boolean;
  /** Badge text shown above featured cards (e.g. "Most Popular") */
  badge?: string;
  /**
   * Optional direct-checkout URL. When set, the pricing card's CTA becomes
   * a link to this URL (opens in a new tab) instead of opening the booking
   * funnel. Use this to point a plan at a hosted checkout (Square, Stripe,
   * etc.).
   */
  checkoutUrl?: string;
}

/** Pool plans */
export const poolPlans: PricingPlan[] = [
  {
    id: 'essential',
    tier: 'Pool — Essential',
    name: 'Stable Essential',
    dollar: '$',
    amount: '109',
    period: '.99 / month',
    description:
      'Chemistry-focused weekly care for pool owners who handle the physical cleaning themselves.',
    features: [
      'Chemicals Included — no hidden costs',
      'Weekly chemistry testing & balancing',
      'Stable Report after every visit',
      'Algae prevention treatment',
      'Phosphate treatment',
    ],
    funnelBlurb: 'Chemicals included, Chemistry testing, Stable Report, Algae & Phosphate treatment',
    ctaLabel: 'Get Started →',
    fromPrice: '$109.99/mo',
    checkoutUrl: 'https://square.link/u/cWfD3UIx',
  },
  {
    id: 'standard',
    tier: 'Pool — Standard',
    name: 'Stable Standard',
    dollar: '$',
    amount: '139',
    period: '.99 / month',
    description:
      'Complete weekly pool maintenance — the most chosen plan for Scottsdale homeowners.',
    features: [
      'Chemicals Included — no hidden costs',
      'Weekly skim, scrub & vacuum',
      'Complete water chemistry & balancing',
      'Weekly equipment inspection',
      'Weekly Stable Report',
      'Backwash as needed',
      'Monthly pressure washing — pool deck area',
    ],
    funnelBlurb:
      'Chemicals included, Skim/scrub/vacuum, Chemistry, Equipment inspection, Monthly deck wash',
    ctaLabel: 'Get Started →',
    fromPrice: '$139.99/mo',
    featured: true,
    badge: 'Most Popular',
    checkoutUrl: 'https://square.link/u/DxSrrdO3',
  },
  {
    id: 'plus',
    tier: 'Pool — Premium',
    name: 'Stable',
    nameSuffix: '+',
    dollar: '$',
    amount: '229',
    period: '.99 / month',
    description:
      'The white-glove experience. Estate-level care with emergency access and concierge home services.',
    features: [
      'Chemicals Included — no hidden costs',
      'Weekly skim, scrub & vacuum',
      'Complete water chemistry & balancing',
      'Weekly equipment inspection',
      'Weekly Stable Report',
      'On-call emergency cleanups',
      'Backwash as needed',
      'Bi-weekly pressure washing — pool deck area',
      'Home services concierge — repairs, upgrades & more handled by Stable',
      '10% off all repairs, maintenance & upgrades (up to $8,000)',
    ],
    funnelBlurb:
      'Chemicals included + Everything in Standard + Emergency cleanups, Bi-weekly deck wash, Concierge, 10% off repairs',
    ctaLabel: 'Get Started →',
    fromPrice: '$229.99/mo',
    checkoutUrl: 'https://square.link/u/oteEnFr2',
  },
];

/** Lawn plans */
export const lawnPlans: PricingPlan[] = [
  {
    id: 'lawn-essential',
    tier: 'Lawn Care — Essential',
    name: 'Stable Essential',
    dollar: '$',
    amount: '179',
    period: '.99 / month',
    description:
      'Consistent, reliable weekly lawn care to keep your property looking its best all season long.',
    features: ['Mowing', 'Trimming', 'Weed whacking'],
    funnelBlurb: 'Mowing, Trimming, Weed whacking',
    ctaLabel: 'Get Started →',
    fromPrice: '$179.99/mo',
    featured: true,
    checkoutUrl: 'https://square.link/u/UNVXET5n',
  },
];

/** Plan lookup used by the funnel modal */
export const planData: Record<Exclude<ServiceKey, 'repairs'>, PricingPlan[]> = {
  pool: poolPlans,
  lawn: lawnPlans,
  pressure: [
    {
      id: 'estimate',
      tier: 'Pressure Washing — Estimate',
      name: 'Free Estimate',
      dollar: '$',
      amount: '0',
      period: '',
      description:
        "We'll assess your project and provide a transparent quote.",
      features: [],
      funnelBlurb: "We'll assess your project and provide a transparent quote",
      ctaLabel: 'Request →',
      fromPrice: 'Custom pricing',
    },
  ],
  windows: [
    {
      id: 'win-estimate',
      tier: 'Window Cleaning — Estimate',
      name: 'Free Estimate',
      dollar: '$',
      amount: '0',
      period: '',
      description:
        'Interior & exterior cleaning, screens, skylights, glass doors & more.',
      features: [],
      funnelBlurb:
        'Interior & exterior cleaning, screens, skylights, glass doors & more',
      ctaLabel: 'Request →',
      fromPrice: 'Custom pricing',
    },
  ],
  multiple: [
    {
      id: 'pool-lawn',
      tier: 'Bundle — Pool + Lawn',
      name: 'Pool + Lawn Bundle',
      dollar: '$',
      amount: '279',
      period: '.99 / month+',
      description: 'Pool Standard + Lawn Essential — ask about bundle pricing.',
      features: [],
      funnelBlurb: 'Pool Standard + Lawn Essential — Ask about bundle pricing',
      ctaLabel: 'Get Started →',
      fromPrice: 'From $279.99/mo',
    },
    {
      id: 'custom',
      tier: 'Custom Bundle',
      name: 'Custom Bundle',
      dollar: '$',
      amount: '0',
      period: '',
      description:
        "Mix any services — we'll build a quote for your property.",
      features: [],
      funnelBlurb:
        "Mix any services — we'll build a quote for your property",
      ctaLabel: 'Request →',
      fromPrice: 'Custom pricing',
    },
  ],
};
