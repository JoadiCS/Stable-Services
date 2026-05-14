import { useEffect, useState, type FormEvent } from 'react';
import {
  DEFAULT_PRICING,
  invalidatePricingCache,
  loadPricingConfig,
  savePricingConfig,
  type PricingConfig,
} from '@/lib/planPricing';
import type { PlanTier, ServiceType } from '@/types/portal';

type PriceTextMap = Record<ServiceType, Partial<Record<PlanTier, string>>>;

const SERVICE_LABELS: Record<ServiceType, string> = {
  pool: 'Pool',
  lawn: 'Lawn',
  pressure: 'Pressure Washing',
  window: 'Window Cleaning',
};

const PLAN_LABELS: Record<PlanTier, string> = {
  essential: 'Essential',
  standard: 'Standard',
  plus: 'Plus',
  custom: 'Custom',
};

const EDITABLE_TIERS: Record<ServiceType, PlanTier[]> = {
  pool: ['essential', 'standard', 'plus'],
  lawn: ['essential', 'standard', 'plus'],
  pressure: ['essential', 'standard'],
  window: ['essential', 'standard'],
};

export function PricingSettingsPage() {
  const [textMap, setTextMap] = useState<PriceTextMap | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cfg = await loadPricingConfig();
        if (!cancelled) setTextMap(configToText(cfg));
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Could not load pricing.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function patch(service: ServiceType, tier: PlanTier, value: string) {
    setTextMap((m) =>
      m
        ? { ...m, [service]: { ...m[service], [tier]: value } }
        : m,
    );
  }

  function resetDefaults() {
    setTextMap(configToText(DEFAULT_PRICING));
    setToast(null);
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!textMap) return;
    setBusy(true);
    setErr(null);
    setToast(null);
    try {
      const cfg = textToConfig(textMap);
      await savePricingConfig(cfg);
      invalidatePricingCache();
      setToast('Pricing saved.');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save pricing.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <header style={{ marginBottom: '1.75rem' }}>
        <div
          style={{
            fontSize: '0.65rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#c9a84c',
            marginBottom: '0.5rem',
          }}
        >
          Settings · Pricing
        </div>
        <h1
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(1.75rem, 3.4vw, 2.4rem)',
            fontWeight: 300,
          }}
        >
          Plan-tier pricing
        </h1>
        <p style={{ color: '#8b95a7', fontSize: '0.88rem', marginTop: '0.5rem', lineHeight: 1.7, maxWidth: 640 }}>
          These are the default monthly rates used to compute MRR and shown on customer
          records when no per-customer override is set. Per-customer overrides on the
          customer edit page take precedence.
        </p>
      </header>

      {err && (
        <div
          style={{
            background: 'rgba(220,80,80,0.08)',
            border: '1px solid rgba(220,80,80,0.35)',
            color: '#f0a5a5',
            fontSize: '0.85rem',
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            borderRadius: 2,
          }}
        >
          {err}
        </div>
      )}
      {toast && (
        <div
          style={{
            background: 'rgba(127,203,138,0.08)',
            border: '1px solid rgba(127,203,138,0.35)',
            color: '#7fcb8a',
            fontSize: '0.85rem',
            padding: '0.6rem 0.9rem',
            marginBottom: '1rem',
            borderRadius: 2,
          }}
        >
          {toast}
        </div>
      )}

      {!textMap ? (
        <Note>Loading…</Note>
      ) : (
        <form onSubmit={onSave} style={{ background: '#0a0f1e', border: '1px solid rgba(201,168,76,0.18)', borderRadius: 2, padding: '1.5rem' }}>
          {(Object.keys(SERVICE_LABELS) as ServiceType[]).map((service) => (
            <ServiceGroup
              key={service}
              service={service}
              textMap={textMap}
              onChange={patch}
            />
          ))}

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={resetDefaults} className="ss-btn-ghost">
              Reset to defaults
            </button>
            <button type="submit" disabled={busy} className="ss-btn-primary" style={{ opacity: busy ? 0.6 : 1 }}>
              {busy ? 'Saving…' : 'Save Pricing'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function ServiceGroup({
  service,
  textMap,
  onChange,
}: {
  service: ServiceType;
  textMap: PriceTextMap;
  onChange: (service: ServiceType, tier: PlanTier, value: string) => void;
}) {
  const tiers = EDITABLE_TIERS[service];
  return (
    <section
      style={{
        marginBottom: '1.25rem',
        paddingBottom: '1.25rem',
        borderBottom: '0.5px solid rgba(201,168,76,0.18)',
      }}
    >
      <div
        style={{
          fontSize: '0.62rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: '#c9a84c',
          marginBottom: '0.85rem',
        }}
      >
        {SERVICE_LABELS[service]}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
        {tiers.map((tier) => (
          <label key={tier} style={{ display: 'block' }}>
            <div
              style={{
                fontSize: '0.65rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#c9a84c',
                marginBottom: '0.35rem',
              }}
            >
              {PLAN_LABELS[tier]}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ color: '#e8c97a', fontSize: '0.9rem' }}>$</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={textMap[service]?.[tier] ?? ''}
                onChange={(e) => onChange(service, tier, e.target.value)}
                placeholder="—"
                style={{
                  width: '100%',
                  background: '#0a0f1e',
                  border: '1px solid rgba(201,168,76,0.25)',
                  color: '#ffffff',
                  padding: '0.6rem 0.7rem',
                  fontSize: '0.9rem',
                  borderRadius: 2,
                  outline: 'none',
                }}
              />
            </div>
          </label>
        ))}
      </div>
    </section>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#0a0f1e',
        border: '1px solid rgba(201,168,76,0.18)',
        borderRadius: 2,
        padding: '2rem',
        textAlign: 'center',
        color: '#8b95a7',
      }}
    >
      {children}
    </div>
  );
}

function configToText(cfg: PricingConfig): PriceTextMap {
  const map: PriceTextMap = { pool: {}, lawn: {}, pressure: {}, window: {} };
  for (const service of Object.keys(cfg) as ServiceType[]) {
    for (const tier of Object.keys(cfg[service]) as PlanTier[]) {
      const v = cfg[service][tier];
      map[service][tier] = typeof v === 'number' ? String(v) : '';
    }
  }
  return map;
}

function textToConfig(map: PriceTextMap): PricingConfig {
  const cfg: PricingConfig = { pool: {}, lawn: {}, pressure: {}, window: {} };
  for (const service of Object.keys(map) as ServiceType[]) {
    for (const tier of Object.keys(map[service]) as PlanTier[]) {
      const raw = map[service][tier];
      if (raw === undefined || raw.trim() === '') continue;
      const n = Number(raw);
      if (Number.isFinite(n) && n >= 0) {
        cfg[service][tier] = n;
      }
    }
  }
  return cfg;
}
