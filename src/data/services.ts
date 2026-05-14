/**
 * Service tab definitions — drives the residential service tab nav,
 * common-project lists, and funnel "service" picker options.
 */
import type { ServiceKey } from './plans';

export interface ServiceTab {
  key: Exclude<ServiceKey, 'multiple'>;
  label: string;
}

export const serviceTabs: ServiceTab[] = [
  { key: 'pool', label: 'Pool Service' },
  { key: 'lawn', label: 'Lawn Care' },
  { key: 'cleaning', label: 'Residential Cleaning' },
  { key: 'pressure', label: 'Pressure Washing' },
  { key: 'windows', label: 'Window Cleaning' },
  { key: 'repairs', label: 'Repairs & Upgrades' },
];

/** Service options shown in the funnel's first step */
export interface FunnelServiceOption {
  key: Exclude<ServiceKey, 'repairs'>;
  name: string;
  description: string;
  priceLabel: string;
}

export const funnelServiceOptions: FunnelServiceOption[] = [
  {
    key: 'pool',
    name: 'Pool Service',
    description: 'Weekly cleaning, chemistry & maintenance',
    priceLabel: 'from $109.99/mo',
  },
  {
    key: 'lawn',
    name: 'Lawn Care',
    description: 'Mowing, trimming & weed control',
    priceLabel: '$179.99/mo',
  },
  {
    key: 'cleaning',
    name: 'Residential Cleaning',
    description: 'Professional home cleaning & sanitization',
    priceLabel: 'from $139.99/mo',
  },
  {
    key: 'pressure',
    name: 'Pressure Washing',
    description: 'Driveways, decks, patios & more',
    priceLabel: 'Custom estimate',
  },
  {
    key: 'windows',
    name: 'Window Cleaning',
    description: 'Interior, exterior, screens & skylights',
    priceLabel: 'Custom estimate',
  },
  {
    key: 'multiple',
    name: 'Multiple Services',
    description: 'Bundle pool, lawn & more',
    priceLabel: 'Bundled savings available',
  },
];

/** Common pressure washing projects */
export const pressureProjects = [
  'Driveway & Walkways',
  'Pool Deck & Patio',
  'Home Exterior',
  'Fence & Walls',
  'Garage Floor',
];

/** Common window cleaning projects */
export const windowProjects = [
  'Interior & Exterior Windows',
  'Sliding Glass Doors',
  'Skylights & High Windows',
  'Screen Cleaning & Reinstall',
  'Post-Construction Cleanup',
  'Commercial Properties',
];

/** Property size / area options for the funnel's property step */
export const poolSizeOptions = [
  'Small (under 10,000 gal)',
  'Medium (10,000–20,000 gal)',
  'Large (20,000–30,000 gal)',
  'Extra Large (30,000+ gal)',
];

export const poolTypeOptions = ['Chlorine', 'Salt Water', 'Not sure'];

export const lawnSizeOptions = [
  'Small (under 2,500 sq ft)',
  'Medium (2,500–5,000 sq ft)',
  'Large (5,000–10,000 sq ft)',
  'Extra Large (10,000+ sq ft)',
];

export const houseSizeOptions = [
  'Small (1-2 bedrooms)',
  'Medium (3 bedrooms)',
  'Large (4-5 bedrooms)',
  'Extra Large (5+ bedrooms)',
];

export const pressureAreaOptions = [
  'Driveway & walkways',
  'Pool deck / patio',
  'Home exterior',
  'Fence & walls',
  'Multiple areas',
];

export const timeWindowOptions = [
  'Morning (7am – 10am)',
  'Midday (10am – 1pm)',
  'Afternoon (1pm – 4pm)',
  'Flexible — any time',
];

export const weekdayOptions = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'No preference',
];

export const contactPrefOptions = ['Text message', 'Phone call', 'Email'];

/** Commercial form options */
export const commercialPropertyTypes = [
  'Hotel / Resort',
  'HOA / Community',
  'Office Park / Complex',
  'Retail / Shopping Center',
  'Restaurant / Hospitality',
  'Multi-Family / Apartments',
  'Other Commercial',
];

export const commercialServiceOptions = [
  'Pool & Spa Maintenance',
  'Grounds & Lawn Care',
  'Pressure Washing',
  'Window Cleaning',
  'Repairs & Upgrades',
  'Multiple / All Services',
];

export const commercialServiceList = [
  'Pool & Spa Maintenance (Hotels, Clubs, HOAs)',
  'Grounds & Lawn Care',
  'Pressure Washing — Parking Lots, Storefronts, Patios',
  'Window Cleaning — Multi-Story & Storefront',
  'Repairs & Upgrades — HVAC, Plumbing, Electrical & More',
  'Recurring Contracts & Custom Schedules',
  'Property Manager Partnerships',
];

/** Property types for repair modal */
export const repairPropertyTypes = [
  'Single Family Home',
  'Condo / Townhome',
  'Multi-Family / Investment Property',
  'Commercial / Business',
];

export const repairUrgencyOptions = [
  'Emergency — needs attention ASAP',
  'Soon — within the next few days',
  'This week works',
  'Planning ahead — flexible timing',
];
