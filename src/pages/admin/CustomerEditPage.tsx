import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCustomer, updateCustomer, type CustomerInput } from '@/lib/customers';
import { listTechs } from '@/lib/staff';
import type {
  Customer,
  CustomerStatus,
  PlanTier,
  ServiceType,
  ServiceWindow,
  StaffMember,
} from '@/types/portal';

const SERVICE_OPTIONS: ServiceType[] = ['pool', 'lawn', 'pressure', 'window'];
const PLAN_OPTIONS: PlanTier[] = ['essential', 'standard', 'plus', 'custom'];
const STATUS_OPTIONS: CustomerStatus[] = ['active', 'paused', 'cancelled'];
const WINDOW_OPTIONS: ServiceWindow[] = ['AM', 'PM'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CustomerEditPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [techs, setTechs] = useState<StaffMember[]>([]);
  const [form, setForm] = useState<CustomerInput | null>(null);
  const [monthlyRateText, setMonthlyRateText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) return;
    let cancelled = false;
    (async () => {
      try {
        const [c, t] = await Promise.all([getCustomer(customerId), safeListTechs()]);
        if (cancelled) return;
        setCustomer(c);
        setTechs(t);
        if (c) {
          const { customerId: _id, createdAt: _ts, ...rest } = c;
          void _id;
          void _ts;
          setForm({ ...rest });
          setMonthlyRateText(
            typeof c.monthlyRate === 'number' && c.monthlyRate > 0 ? String(c.monthlyRate) : '',
          );
        }
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Could not load customer.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  function patch<K extends keyof CustomerInput>(k: K, v: CustomerInput[K]) {
    setForm((f) => (f ? { ...f, [k]: v } : f));
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!form || !customerId) return;
    setBusy(true);
    setErr(null);
    setToast(null);
    try {
      const monthlyRate = parseRate(monthlyRateText);
      const clearFields: ('monthlyRate')[] = monthlyRate === undefined ? ['monthlyRate'] : [];
      await updateCustomer(customerId, { ...form, monthlyRate }, clearFields);
      setToast('Saved.');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save customer.');
    } finally {
      setBusy(false);
    }
  }

  if (!customerId) {
    return <Note>Missing customer id.</Note>;
  }

  return (
    <div>
      <header style={{ marginBottom: '1.5rem' }}>
        <Link to="/admin/customers" style={{ color: '#c9a84c', textDecoration: 'none', fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          ← Customers
        </Link>
        <h1
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(1.75rem, 3.4vw, 2.4rem)',
            fontWeight: 300,
            marginTop: '0.5rem',
          }}
        >
          {customer ? `${customer.firstName} ${customer.lastName}` : 'Customer'}
        </h1>
      </header>

      {err && (
        <div style={errorBox}>{err}</div>
      )}
      {toast && (
        <div style={toastBox}>{toast}</div>
      )}

      {!form ? (
        <Note>Loading…</Note>
      ) : (
        <form onSubmit={onSave} style={{ background: '#0a0f1e', border: '1px solid rgba(201,168,76,0.18)', borderRadius: 2, padding: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
            <Field label="First name">
              <input value={form.firstName} onChange={(e) => patch('firstName', e.target.value)} style={textField} />
            </Field>
            <Field label="Last name">
              <input value={form.lastName} onChange={(e) => patch('lastName', e.target.value)} style={textField} />
            </Field>
            <Field label="Email">
              <input type="email" value={form.email} onChange={(e) => patch('email', e.target.value)} style={textField} />
            </Field>
            <Field label="Phone">
              <input value={form.phone} onChange={(e) => patch('phone', e.target.value)} style={textField} />
            </Field>
            <Field label="Address">
              <input value={form.address} onChange={(e) => patch('address', e.target.value)} style={textField} />
            </Field>
            <Field label="City">
              <input value={form.city} onChange={(e) => patch('city', e.target.value)} style={textField} />
            </Field>
            <Field label="Service type">
              <select value={form.serviceType} onChange={(e) => patch('serviceType', e.target.value as ServiceType)} style={textField}>
                {SERVICE_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Plan">
              <select value={form.plan} onChange={(e) => patch('plan', e.target.value as PlanTier)} style={textField}>
                {PLAN_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </Field>
            <Field label="Monthly rate ($)" hint="Leave blank to use the plan-tier default. Set this to lock in a grandfathered or custom rate.">
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={monthlyRateText}
                onChange={(e) => setMonthlyRateText(e.target.value)}
                placeholder="auto from plan"
                style={textField}
              />
            </Field>
            <Field label="Service day">
              <select value={form.serviceDayOfWeek} onChange={(e) => patch('serviceDayOfWeek', Number(e.target.value))} style={textField}>
                {DAY_LABELS.map((d, i) => (
                  <option key={i} value={i}>{d}</option>
                ))}
              </select>
            </Field>
            <Field label="Window">
              <select value={form.serviceTimeWindow} onChange={(e) => patch('serviceTimeWindow', e.target.value as ServiceWindow)} style={textField}>
                {WINDOW_OPTIONS.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </Field>
            <Field label="Assigned tech">
              <select value={form.assignedTechId ?? ''} onChange={(e) => patch('assignedTechId', e.target.value || undefined)} style={textField}>
                <option value="">— Unassigned —</option>
                {techs.map((t) => (
                  <option key={t.uid} value={t.uid}>{t.firstName} {t.lastName}</option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => patch('status', e.target.value as CustomerStatus)} style={textField}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>

          <div style={{ marginTop: '0.9rem' }}>
            <Field label="Notes">
              <textarea
                rows={4}
                value={form.notes ?? ''}
                onChange={(e) => patch('notes', e.target.value)}
                style={{ ...textField, resize: 'vertical', fontFamily: 'inherit' }}
              />
            </Field>
          </div>

          <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={busy} className="ss-btn-primary" style={{ opacity: busy ? 0.6 : 1 }}>
              {busy ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: 'block' }}>
      <div
        style={{
          fontSize: '0.65rem',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#c9a84c',
          marginBottom: '0.35rem',
        }}
      >
        {label}
      </div>
      {children}
      {hint && (
        <div style={{ marginTop: '0.35rem', fontSize: '0.7rem', color: '#8b95a7', lineHeight: 1.5 }}>
          {hint}
        </div>
      )}
    </label>
  );
}

function parseRate(text: string): number | undefined {
  const trimmed = text.trim();
  if (trimmed === '') return undefined;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return n;
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

async function safeListTechs(): Promise<StaffMember[]> {
  try {
    return await listTechs();
  } catch {
    return [];
  }
}

const textField: React.CSSProperties = {
  width: '100%',
  background: '#0a0f1e',
  border: '1px solid rgba(201,168,76,0.25)',
  color: '#ffffff',
  padding: '0.65rem 0.7rem',
  fontSize: '0.88rem',
  borderRadius: 2,
  outline: 'none',
};

const errorBox: React.CSSProperties = {
  background: 'rgba(220,80,80,0.08)',
  border: '1px solid rgba(220,80,80,0.35)',
  color: '#f0a5a5',
  fontSize: '0.85rem',
  padding: '0.75rem 1rem',
  marginBottom: '1rem',
  borderRadius: 2,
};

const toastBox: React.CSSProperties = {
  background: 'rgba(127,203,138,0.08)',
  border: '1px solid rgba(127,203,138,0.35)',
  color: '#7fcb8a',
  fontSize: '0.85rem',
  padding: '0.6rem 0.9rem',
  marginBottom: '1rem',
  borderRadius: 2,
};
