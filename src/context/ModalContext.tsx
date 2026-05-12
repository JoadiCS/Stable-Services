import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { ServiceKey } from '@/data/plans';

/* ─────────────────────────────────────────────────────────────────────────
   Modal context — owns the open state for the booking funnel and the
   repair-request modal, plus the funnel's wizard state.
   ───────────────────────────────────────────────────────────────────────── */

export type FunnelService = Exclude<ServiceKey, 'repairs'>;

export interface FunnelOpenOptions {
  service?: FunnelService;
  plan?: string;
}

export interface ModalContextValue {
  // ── Funnel ──
  funnelOpen: boolean;
  openFunnel: (opts?: FunnelOpenOptions) => void;
  closeFunnel: () => void;
  preselectedService: FunnelService | null;
  preselectedPlan: string | null;
  // ── Repair ──
  repairOpen: boolean;
  repairCategory: string;
  openRepair: (category: string) => void;
  closeRepair: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [funnelOpen, setFunnelOpen] = useState(false);
  const [preselectedService, setPreselectedService] =
    useState<FunnelService | null>(null);
  const [preselectedPlan, setPreselectedPlan] = useState<string | null>(null);

  const [repairOpen, setRepairOpen] = useState(false);
  const [repairCategory, setRepairCategory] = useState('Home Repair');

  const openFunnel = useCallback((opts?: FunnelOpenOptions) => {
    setPreselectedService(opts?.service ?? null);
    setPreselectedPlan(opts?.plan ?? null);
    setFunnelOpen(true);
  }, []);

  const closeFunnel = useCallback(() => {
    setFunnelOpen(false);
    // Clear preselection on close so a re-open without args is fresh
    setPreselectedService(null);
    setPreselectedPlan(null);
  }, []);

  const openRepair = useCallback((category: string) => {
    setRepairCategory(category);
    setRepairOpen(true);
  }, []);

  const closeRepair = useCallback(() => setRepairOpen(false), []);

  // Lock body scroll while any modal is open
  useEffect(() => {
    if (funnelOpen || repairOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [funnelOpen, repairOpen]);

  // Escape closes whichever is open
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (repairOpen) closeRepair();
      else if (funnelOpen) closeFunnel();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [funnelOpen, repairOpen, closeFunnel, closeRepair]);

  const value = useMemo<ModalContextValue>(
    () => ({
      funnelOpen,
      openFunnel,
      closeFunnel,
      preselectedService,
      preselectedPlan,
      repairOpen,
      repairCategory,
      openRepair,
      closeRepair,
    }),
    [
      funnelOpen,
      openFunnel,
      closeFunnel,
      preselectedService,
      preselectedPlan,
      repairOpen,
      repairCategory,
      openRepair,
      closeRepair,
    ],
  );

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
}

export function useModal(): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (!ctx) {
    throw new Error('useModal must be used inside <ModalProvider>');
  }
  return ctx;
}
