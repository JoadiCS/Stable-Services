import { useEffect, useState, type FormEvent } from 'react';
import {
  DEFAULT_CHECKLIST_TEMPLATES,
  loadChecklistsConfig,
  saveChecklistsConfig,
  type ChecklistConfig,
  type ChecklistTemplate,
} from '@/data/checklists';
import type { ServiceType } from '@/types/portal';

const SERVICE_LABELS: Record<ServiceType, string> = {
  pool: 'Pool',
  lawn: 'Lawn',
  pressure: 'Pressure Washing',
  window: 'Window Cleaning',
};

export function ChecklistsSettingsPage() {
  const [config, setConfig] = useState<ChecklistConfig | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cfg = await loadChecklistsConfig();
        if (!cancelled) setConfig(clone(cfg));
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Could not load checklists.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function updateItems(service: ServiceType, items: ChecklistTemplate[]) {
    setConfig((c) => (c ? { ...c, [service]: items } : c));
  }

  function resetDefaults() {
    setConfig(clone(DEFAULT_CHECKLIST_TEMPLATES));
    setToast(null);
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!config) return;
    setBusy(true);
    setErr(null);
    setToast(null);
    try {
      await saveChecklistsConfig(config);
      setToast('Checklists saved. New visits will use the updated template.');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save checklists.');
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
          Settings · Checklists
        </div>
        <h1
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(1.75rem, 3.4vw, 2.4rem)',
            fontWeight: 300,
          }}
        >
          Visit checklists
        </h1>
        <p style={{ color: '#8b95a7', fontSize: '0.88rem', marginTop: '0.5rem', lineHeight: 1.7, maxWidth: 640 }}>
          These templates are baked into a visit when it's created. Existing visits
          keep their original checklist — edits only affect visits generated after
          you save.
        </p>
      </header>

      {err && <ErrorBox>{err}</ErrorBox>}
      {toast && <ToastBox>{toast}</ToastBox>}

      {!config ? (
        <Note>Loading…</Note>
      ) : (
        <form onSubmit={onSave} style={{ background: '#0a0f1e', border: '1px solid rgba(201,168,76,0.18)', borderRadius: 2, padding: '1.5rem' }}>
          {(Object.keys(SERVICE_LABELS) as ServiceType[]).map((s) => (
            <ServiceChecklist
              key={s}
              service={s}
              items={config[s]}
              onChange={(items) => updateItems(s, items)}
            />
          ))}
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={resetDefaults} className="ss-btn-ghost">
              Reset to defaults
            </button>
            <button type="submit" disabled={busy} className="ss-btn-primary" style={{ opacity: busy ? 0.6 : 1 }}>
              {busy ? 'Saving…' : 'Save Checklists'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function ServiceChecklist({
  service,
  items,
  onChange,
}: {
  service: ServiceType;
  items: ChecklistTemplate[];
  onChange: (items: ChecklistTemplate[]) => void;
}) {
  function update(i: number, patch: Partial<ChecklistTemplate>) {
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  function remove(i: number) {
    onChange(items.filter((_, idx) => idx !== i));
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = items.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }
  function add() {
    const id = `item-${Date.now().toString(36).slice(-5)}`;
    onChange([...items, { id, label: '' }]);
  }

  return (
    <section
      style={{
        marginBottom: '1.5rem',
        paddingBottom: '1.5rem',
        borderBottom: '0.5px solid rgba(201,168,76,0.18)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: '0.85rem',
          gap: '0.75rem',
        }}
      >
        <div
          style={{
            fontSize: '0.62rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#c9a84c',
          }}
        >
          {SERVICE_LABELS[service]} · {items.length} items
        </div>
        <button type="button" onClick={add} className="ss-btn-ghost">
          + Add item
        </button>
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.4rem' }}>
        {items.map((it, i) => (
          <li
            key={`${it.id}-${i}`}
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto',
              gap: '0.5rem',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label="Move up"
                style={moveBtn}
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === items.length - 1}
                aria-label="Move down"
                style={moveBtn}
              >
                ▼
              </button>
            </div>
            <input
              value={it.label}
              onChange={(e) => update(i, { label: e.target.value })}
              placeholder="Checklist item label"
              style={textField}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label="Remove"
              style={removeBtn}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </section>
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

function clone<T>(o: T): T {
  return JSON.parse(JSON.stringify(o));
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

const moveBtn: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(201,168,76,0.25)',
  color: '#c9a84c',
  fontSize: '0.65rem',
  padding: '0.1rem 0.4rem',
  borderRadius: 2,
  cursor: 'pointer',
  lineHeight: 1,
};

const removeBtn: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(240,165,165,0.35)',
  color: '#f0a5a5',
  padding: '0.4rem 0.55rem',
  borderRadius: 2,
  cursor: 'pointer',
  fontSize: '0.75rem',
};
