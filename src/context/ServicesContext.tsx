import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { ServiceTab } from '@/data/services';

/* ─────────────────────────────────────────────────────────────────────────
   ServicesContext — keeps the segment (residential/commercial) and active
   residential tab state in sync between the Services section and links
   elsewhere on the page (e.g. footer "Stable Standard" link).
   ───────────────────────────────────────────────────────────────────────── */

export type Segment = 'residential' | 'commercial';

export interface ServicesContextValue {
  segment: Segment;
  setSegment: (s: Segment) => void;
  activeTab: ServiceTab['key'];
  setActiveTab: (k: ServiceTab['key']) => void;
  /** Switch to residential + a specific tab + scroll to #services */
  goToTab: (k: ServiceTab['key']) => void;
}

const ServicesContext = createContext<ServicesContextValue | null>(null);

export function ServicesProvider({ children }: { children: ReactNode }) {
  const [segment, setSegment] = useState<Segment>('residential');
  const [activeTab, setActiveTab] = useState<ServiceTab['key']>('pool');

  const goToTab = useCallback((k: ServiceTab['key']) => {
    setSegment('residential');
    setActiveTab(k);
    const el = document.getElementById('services');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const value = useMemo<ServicesContextValue>(
    () => ({ segment, setSegment, activeTab, setActiveTab, goToTab }),
    [segment, activeTab, goToTab],
  );

  return (
    <ServicesContext.Provider value={value}>
      {children}
    </ServicesContext.Provider>
  );
}

export function useServices(): ServicesContextValue {
  const ctx = useContext(ServicesContext);
  if (!ctx) {
    throw new Error('useServices must be used inside <ServicesProvider>');
  }
  return ctx;
}
