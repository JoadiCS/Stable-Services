/**
 * Repair & Upgrade categories — drives the repair tab grid + repair modal label.
 */

export interface RepairCategory {
  id: string;
  /** Display name */
  name: string;
  /** Full label sent to the modal (matches HTML's openRepairRequest argument) */
  label: string;
  description: string;
  /** Optional "other / catch-all" style flag — renders with dashed border */
  isOther?: boolean;
  /** Icon key — see RepairCategoryIcon component */
  icon: RepairIconKey;
  /** CTA text */
  cta: string;
}

export type RepairIconKey =
  | 'hvac'
  | 'plumbing'
  | 'pool'
  | 'electrical'
  | 'roof'
  | 'paint'
  | 'flooring'
  | 'landscape'
  | 'appliance'
  | 'doors'
  | 'pest'
  | 'other';

export const repairCategories: RepairCategory[] = [
  {
    id: 'hvac',
    name: 'HVAC & AC',
    label: 'HVAC & Air Conditioning',
    description: 'Repairs, tune-ups, replacements, new installs, duct cleaning',
    icon: 'hvac',
    cta: 'Request →',
  },
  {
    id: 'plumbing',
    name: 'Plumbing',
    label: 'Plumbing',
    description: 'Leak repairs, drain clearing, fixture installs, water heaters, re-pipes',
    icon: 'plumbing',
    cta: 'Request →',
  },
  {
    id: 'pool',
    name: 'Pool Equipment',
    label: 'Pool Equipment & Repairs',
    description: 'Pump replacements, filter systems, heaters, automation, salt cells, lighting',
    icon: 'pool',
    cta: 'Request →',
  },
  {
    id: 'electrical',
    name: 'Electrical',
    label: 'Electrical',
    description: 'Panel upgrades, outlets, EV chargers, ceiling fans, landscape lighting, generators',
    icon: 'electrical',
    cta: 'Request →',
  },
  {
    id: 'roofing',
    name: 'Roofing & Gutters',
    label: 'Roofing & Gutters',
    description: 'Leak repairs, tile replacement, full re-roofs, gutter cleaning & installation',
    icon: 'roof',
    cta: 'Request →',
  },
  {
    id: 'paint',
    name: 'Painting & Drywall',
    label: 'Painting & Drywall',
    description: 'Interior & exterior painting, drywall patching, texture matching, stucco',
    icon: 'paint',
    cta: 'Request →',
  },
  {
    id: 'flooring',
    name: 'Flooring',
    label: 'Flooring',
    description: 'Tile, wood, LVP, carpet, grout repairs, full installs & refinishing',
    icon: 'flooring',
    cta: 'Request →',
  },
  {
    id: 'landscape',
    name: 'Landscaping & Hardscape',
    label: 'Landscaping & Hardscape',
    description: 'Irrigation, pavers, retaining walls, desert landscaping, artificial turf',
    icon: 'landscape',
    cta: 'Request →',
  },
  {
    id: 'appliances',
    name: 'Appliances',
    label: 'Appliance Repair & Installation',
    description: 'Washer, dryer, refrigerator, oven, dishwasher repair & new appliance installs',
    icon: 'appliance',
    cta: 'Request →',
  },
  {
    id: 'doors',
    name: 'Doors, Windows & Locks',
    label: 'Doors, Windows & Locks',
    description: 'Door installs, window replacements, smart locks, screen repairs, weather sealing',
    icon: 'doors',
    cta: 'Request →',
  },
  {
    id: 'pest',
    name: 'Pest Control',
    label: 'Pest Control',
    description: 'Scorpion, termite, rodent & general pest prevention and treatment',
    icon: 'pest',
    cta: 'Request →',
  },
  {
    id: 'other',
    name: 'Something Else?',
    label: 'Other / Not Sure',
    description: "Don't see your job? Tell us what you need — if it's a home or commercial repair, we handle it.",
    isOther: true,
    icon: 'other',
    cta: 'Tell Us →',
  },
];

export const repairsTrustItems = [
  { num: 'Licensed', label: 'Fully Licensed & Insured' },
  { num: 'Full Scope', label: 'Repairs to Upgrades' },
  { num: 'Res & Com', label: 'Residential & Commercial' },
  { num: 'One Call', label: 'Stable Handles It All' },
];
