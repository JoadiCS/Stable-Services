import type { ChecklistItem, ServiceType } from '@/types/portal';

interface ChecklistTemplate {
  id: string;
  label: string;
}

const POOL: ChecklistTemplate[] = [
  { id: 'skim', label: 'Skim surface debris' },
  { id: 'baskets', label: 'Empty skimmer & pump baskets' },
  { id: 'brush', label: 'Brush walls & tile line' },
  { id: 'vacuum', label: 'Vacuum pool floor' },
  { id: 'backwash', label: 'Backwash filter (if pressure high)' },
  { id: 'test', label: 'Test water chemistry' },
  { id: 'chemicals', label: 'Add chemicals as needed' },
  { id: 'equipment', label: 'Inspect equipment (pump, heater, salt cell)' },
];

const LAWN: ChecklistTemplate[] = [
  { id: 'mow', label: 'Mow at target height' },
  { id: 'edge', label: 'Edge walkways & driveways' },
  { id: 'trim', label: 'Trim along fences & beds' },
  { id: 'blow', label: 'Blow clippings off hardscape' },
  { id: 'irrigation', label: 'Inspect irrigation heads' },
  { id: 'turf-notes', label: 'Note any turf concerns' },
];

const PRESSURE: ChecklistTemplate[] = [
  { id: 'prerinse', label: 'Pre-rinse surface' },
  { id: 'detergent', label: 'Apply detergent (where appropriate)' },
  { id: 'wash', label: 'Pressure wash target areas' },
  { id: 'rinse', label: 'Final rinse' },
  { id: 'photos', label: 'Photo before & after' },
];

const WINDOW: ChecklistTemplate[] = [
  { id: 'dust', label: 'Dust frames & sills' },
  { id: 'wash-exterior', label: 'Wash exterior glass' },
  { id: 'wash-interior', label: 'Wash interior glass (if scoped)' },
  { id: 'squeegee', label: 'Squeegee + detail' },
  { id: 'hardware', label: 'Polish hardware' },
];

const TEMPLATES: Record<ServiceType, ChecklistTemplate[]> = {
  pool: POOL,
  lawn: LAWN,
  pressure: PRESSURE,
  window: WINDOW,
};

export function getChecklistFor(serviceType: ServiceType): ChecklistItem[] {
  return TEMPLATES[serviceType].map((t) => ({
    id: t.id,
    label: t.label,
    completed: false,
    completedAt: null,
  }));
}

export function getChecklistTemplate(serviceType: ServiceType): ChecklistTemplate[] {
  return TEMPLATES[serviceType];
}
