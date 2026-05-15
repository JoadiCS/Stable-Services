import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ChecklistItem, ServiceType } from '@/types/portal';

export interface ChecklistTemplate {
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

export const DEFAULT_CHECKLIST_TEMPLATES: Record<ServiceType, ChecklistTemplate[]> = {
  pool: POOL,
  lawn: LAWN,
  pressure: PRESSURE,
  window: WINDOW,
};

export type ChecklistConfig = Record<ServiceType, ChecklistTemplate[]>;

let configPromise: Promise<ChecklistConfig> | null = null;

/**
 * Loads checklist templates from /config/checklists, falling back to the
 * hard-coded defaults if the doc is missing or unreadable. Result is
 * cached for the page lifetime — call invalidateChecklistsCache() after
 * a save to force a refresh.
 */
export function loadChecklistsConfig(): Promise<ChecklistConfig> {
  if (!configPromise) {
    configPromise = (async () => {
      try {
        const snap = await getDoc(doc(db, 'config', 'checklists'));
        if (!snap.exists()) return DEFAULT_CHECKLIST_TEMPLATES;
        const data = snap.data() as Partial<ChecklistConfig>;
        return mergeChecklists(DEFAULT_CHECKLIST_TEMPLATES, data);
      } catch {
        return DEFAULT_CHECKLIST_TEMPLATES;
      }
    })();
  }
  return configPromise;
}

export function invalidateChecklistsCache(): void {
  configPromise = null;
}

export async function saveChecklistsConfig(config: ChecklistConfig): Promise<void> {
  await setDoc(doc(db, 'config', 'checklists'), config);
  invalidateChecklistsCache();
}

function mergeChecklists(base: ChecklistConfig, override: Partial<ChecklistConfig>): ChecklistConfig {
  return {
    pool: override.pool && override.pool.length ? override.pool : base.pool,
    lawn: override.lawn && override.lawn.length ? override.lawn : base.lawn,
    pressure: override.pressure && override.pressure.length ? override.pressure : base.pressure,
    window: override.window && override.window.length ? override.window : base.window,
  };
}

/**
 * Returns the checklist items for a fresh visit. If the cached config is
 * available, uses the admin-managed template; otherwise falls back to
 * the hard-coded defaults. Callers that can `await` should prefer
 * getChecklistForAsync.
 */
export function getChecklistFor(serviceType: ServiceType): ChecklistItem[] {
  return DEFAULT_CHECKLIST_TEMPLATES[serviceType].map(toItem);
}

export async function getChecklistForAsync(serviceType: ServiceType): Promise<ChecklistItem[]> {
  const cfg = await loadChecklistsConfig();
  return cfg[serviceType].map(toItem);
}

function toItem(t: ChecklistTemplate): ChecklistItem {
  return {
    id: t.id,
    label: t.label,
    completed: false,
    completedAt: null,
  };
}

export function getChecklistTemplate(serviceType: ServiceType): ChecklistTemplate[] {
  return DEFAULT_CHECKLIST_TEMPLATES[serviceType];
}
