/**
 * "Why Stable Services" grid — 4 trust items shown next to the photo block.
 */

export type WhyIconKey = 'shield' | 'report' | 'clock' | 'star';

export interface WhyItem {
  icon: WhyIconKey;
  title: string;
  text: string;
}

export const whyItems: WhyItem[] = [
  {
    icon: 'shield',
    title: 'AZ Licensed & Fully Insured',
    text:
      'Every technician is licensed, background-checked, and covered. Your property and family are always protected.',
  },
  {
    icon: 'report',
    title: 'Stable Report After Every Visit',
    text:
      'A detailed digital report with photos, readings, and work completed lands in your inbox after every single service — zero guesswork.',
  },
  {
    icon: 'clock',
    title: 'Same Day, Every Week',
    text:
      'Consistent scheduling with your dedicated technician. No last-minute changes, no rotating strangers — just reliable service you can plan around.',
  },
  {
    icon: 'star',
    title: '100% Satisfaction Guaranteed',
    text:
      "If you're ever unhappy with a visit, we return and make it right — no questions asked, no extra charges.",
  },
];
