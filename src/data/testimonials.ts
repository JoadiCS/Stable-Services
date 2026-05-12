/**
 * Customer testimonials — push a new object to add a card.
 * The component duplicates the array internally to create the seamless
 * infinite-scroll marquee, so don't duplicate entries here.
 */

export interface Testimonial {
  initials: string;
  name: string;
  location: string;
  quote: string;
  rating?: number;
}

export const testimonials: Testimonial[] = [
  {
    initials: 'MR',
    name: 'Michael R.',
    location: 'Scottsdale — Stable+',
    quote:
      'The Stable Report after every visit is a game changer. I know exactly what was done and what shape my pool is in without ever having to ask.',
  },
  {
    initials: 'SL',
    name: 'Sandra L.',
    location: 'Paradise Valley — Standard + Lawn',
    quote:
      'I use them for pool and lawn. Having one company I trust for both has been so much easier than juggling two separate vendors.',
  },
  {
    initials: 'DK',
    name: 'David K.',
    location: 'North Scottsdale — Standard',
    quote:
      "Green pool after the monsoons. They had it crystal clear in 48 hours. No extra fees, no drama. I've been with them on a monthly plan since.",
  },
  {
    initials: 'JH',
    name: 'Jennifer H.',
    location: 'Chandler, AZ — Pressure Washing',
    quote:
      'The pressure washing quote was fair and the work was flawless. My driveway and patio look brand new. Booked them again for the spring already.',
  },
  {
    initials: 'TC',
    name: 'Tom C.',
    location: 'Paradise Valley — Stable+',
    quote:
      'Same technician every week, same day every week. That kind of reliability is rare. My pool has never looked better and my lawn is consistently sharp.',
  },
];
