import { useEffect, useState, type FormEvent } from 'react';
import {
  DEFAULT_POOL_RANGES,
  loadPoolRangesConfig,
  savePoolRangesConfig,
  type PoolRangesConfig,
  type RangeKey,
  type RangeSpec,
} from '@/data/poolRanges';

const ORDER: RangeKey[] = [
  'ph',
  'chlorineFree',
  'chlorineTotal',
  'alkalinity',
  'calciumHardness',
  'cyanuricAcid',
  'salt',
  'tds',
];

interface TextSpec {
  min: string;
  max: string;
}

type TextMap = Record<RangeKey, TextSpec>;

export function PoolRangesSettingsPage() {
  const [textMap, setTextMap] = useState<TextMap | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cfg = await loadPoolRangesConfig();
        if (!cancelled) setTextMap(toText(cfg));
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Could not load ranges.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function patch(key: RangeKey, field: keyof TextSpec, value: string) {
    setTextMap((m) => (m ? { ...m, [key]: { ...m[key], [field]: value } } : m));
  }

  function resetDefaults() {
    setTextMap(toText(DEFAULT_POOL_RANGES));
    setToast(null);
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!textMap) return;
    setBusy(true);
    setErr(null);
    setToast(null);
    try {
      const next = toConfig(textMap);
      await savePoolRangesConfig(next);
      setToast('Ranges saved. Tech + report views will use the updated bounds.');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save ranges.');
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
          Settings · Pool Ranges
        </div>
        <h1
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(1.75rem, 3.4vw, 2.4rem)',
            fontWeight: 300,
          }}
        >
          Pool chemistry safe ranges
        </h1>
        <p style={{ color: '#8b95a7', fontSize: '0.88rem', marginTop: '0.5rem', lineHeight: 1.7, maxWidth: 640 }}>
          Min/max bounds drive the in-range / low / high badges on the tech visit page,
          the Stable Report, and the admin out-of-range tile.
        </p>
      </header>

      {err && <ErrorBox>{err}</ErrorBox>}
      {toast && <ToastBox>{toast}</ToastBox>}

      {!textMap ? (
        <Note>Loading…</Note>
      ) : (
        <form onSubmit={onSave} style={{ background: '#0a0f1e', border: '1px solid rgba(201,168,76,0.18)', borderRadius: 2, padding: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {ORDER.map((key) => {
              const spec = DEFAULT_POOL_RANGES[key];
              return (
                <div key={key} style={{ border: '1px solid rgba(201,168,76,0.15)', padding: '0.85rem 0.95rem', borderRadius: 2 }}>
                  <div
                    style={{
                      fontSize: '0.62rem',
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      color: '#c9a84c',
                      marginBottom: '0.6rem',
                    }}
                  >
                    {spec.label} {spec.unit && <span style={{ color: '#8b95a7' }}>· {spec.unit}</span>}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <Field label="Min">
                      <input
                        type="number"
                        step="any"
                        value={textMap[key].min}
                        onChange={(e) => patch(key, 'min', e.target.value)}
                        style={textField}
                      />
                    </Field>
                    <Field label="Max">
                      <input
                        type="number"
                        step="any"
                        value={textMap[key].max}
                        onChange={(e) => patch(key, 'max', e.target.value)}
                        style={textField}
                      />
                    </Field>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={resetDefaults} className="ss-btn-ghost">
              Reset to defaults
            </button>
            <button type="submit" disabled={busy} className="ss-btn-primary" style={{ opacity: busy ? 0.6 : 1 }}>
              {busy ? 'Saving…' : 'Save Ranges'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <div
        style={{
          fontSize: '0.6rem',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#8b95a7',
          marginBottom: '0.3rem',
        }}
      >
        {label}
      </div>
      {children}
    </label>
  );
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
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
      {children}
    </div>
  );
}

function ToastBox({ children }: { children: React.ReactNode }) {
  return (
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
      {children}
    </div>
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

function toText(cfg: PoolRangesConfig): TextMap {
  const map = {} as TextMap;
  (Object.keys(cfg) as RangeKey[]).forEach((k) => {
    map[k] = { min: String(cfg[k].min), max: String(cfg[k].max) };
  });
  return map;
}

function toConfig(map: TextMap): PoolRangesConfig {
  const next = {} as PoolRangesConfig;
  (Object.keys(DEFAULT_POOL_RANGES) as RangeKey[]).forEach((k) => {
    const base = DEFAULT_POOL_RANGES[k];
    const tMin = Number(map[k].min);
    const tMax = Number(map[k].max);
    const min = Number.isFinite(tMin) ? tMin : base.min;
    const max = Number.isFinite(tMax) ? tMax : base.max;
    const unit = base.unit ? ` ${base.unit}` : '';
    const hint = `${min} – ${max}${unit}`;
    next[k] = { ...base, min, max, hint } satisfies RangeSpec;
  });
  return next;
}

const textField: React.CSSProperties = {
  width: '100%',
  background: '#0a0f1e',
  border: '1px solid rgba(201,168,76,0.25)',
  color: '#ffffff',
  padding: '0.55rem 0.7rem',
  fontSize: '0.88rem',
  borderRadius: 2,
  outline: 'none',
};
