/**
 * Service-area cities — drives the Coverage section grid.
 */

export interface CoverageArea {
  city: string;
  label: string;
}

export const coverageAreas: CoverageArea[] = [
  { city: 'Scottsdale', label: 'Full Coverage' },
  { city: 'Phoenix', label: 'Full Coverage' },
  { city: 'Paradise Valley', label: 'Full Coverage' },
  { city: 'Mesa', label: 'Full Coverage' },
  { city: 'Tempe', label: 'Full Coverage' },
  { city: 'Chandler', label: 'Full Coverage' },
  { city: 'Gilbert', label: 'Full Coverage' },
  { city: 'Queen Creek', label: 'Full Coverage' },
  { city: 'Glendale', label: 'Full Coverage' },
];
