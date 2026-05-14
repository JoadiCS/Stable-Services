import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createCustomer, listCustomers, type CustomerInput } from '@/lib/customers';
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

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [techs, setTechs] = useState<StaffMember[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  async function reload() {
    setErr(null);
    try {
      const [c, t] = await Promise.all([listCustomers(), safeListTechs()]);
      setCustomers(c);
      setTechs(t);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load customers.');
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.75rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div
            style={{
              fontSize: '0.65rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#c9a84c',
              marginBottom: '0.5rem',
            }}
          >
            Customers
          </div>
          <h1
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 'clamp(1.75rem, 3.4vw, 2.4rem)',
              fontWeight: 300,
            }}
          >
            Customer directory
          </h1>
        </div>
        <button onClick={() => setShowAdd(true)} className="ss-btn-primary">
          + Add Customer
        </button>
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

      {customers === null ? (
        <Empty>Loading…</Empty>
      ) : customers.length === 0 ? (
        <Empty>No customers yet. Use “Add Customer” to create the first record.</Empty>
      ) : (
        <CustomerTable customers={customers} techs={techs} />
      )}

      {showAdd && (
        <AddCustomerModal
          techs={techs}
          onClose={() => setShowAdd(false)}
          onCreated={async () => {
            setShowAdd(false);
            await reload();
          }}
        />
      )}
    </div>
  );
}

function CustomerTable({ customers, techs }: { customers: Customer[]; techs: StaffMember[] }) {
  const techById = new Map(techs.map((t) => [t.uid, t]));
  return (
    <div
      style={{
        background: '#0a0f1e',
        border: '1px solid rgba(201,168,76,0.18)',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 0.9fr 0.7fr 0.6fr 1fr 0.7fr',
          gap: '0.5rem',
          padding: '0.65rem 1rem',
          background: '#111827',
          fontSize: '0.62rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#c9a84c',
        }}
      >
        <div>Name</div>
        <div>Service</div>
        <div>Plan</div>
        <div>Day</div>
        <div>Tech</div>
        <div>Status</div>
      </div>
      {customers.map((c) => {
        const tech = c.assignedTechId ? techById.get(c.assignedTechId) : null;
        const techName = tech ? `${tech.firstName} ${tech.lastName}`.trim() : '—';
        return (
          <Link
            key={c.customerId}
            to={`/admin/customers/${c.customerId}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr 0.9fr 0.7fr 0.6fr 1fr 0.7fr',
              gap: '0.5rem',
              padding: '0.85rem 1rem',
              borderTop: '0.5px solid rgba(201,168,76,0.12)',
              fontSize: '0.85rem',
              color: '#ffffff',
              textDecoration: 'none',
            }}
          >
            <div>
              <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.05rem', fontWeight: 300 }}>
                {c.firstName} {c.lastName}
              </div>
              <div style={{ color: '#8b95a7', fontSize: '0.75rem' }}>{c.email}</div>
            </div>
            <div style={{ textTransform: 'capitalize', color: '#e8c97a' }}>{c.serviceType}</div>
            <div style={{ textTransform: 'capitalize', color: '#d6d2c4' }}>{c.plan}</div>
            <div style={{ color: '#8b95a7' }}>{DAY_LABELS[c.serviceDayOfWeek] ?? '—'}</div>
            <div style={{ color: '#8b95a7' }}>{techName}</div>
            <div>
              <span
                style={{
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.62rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  borderRadius: 2,
                  background:
                    c.status === 'active'
                      ? 'rgba(127,203,138,0.12)'
                      : c.status === 'paused'
                        ? 'rgba(232,201,122,0.12)'
                        : 'rgba(240,165,165,0.12)',
                  color:
                    c.status === 'active'
                      ? '#7fcb8a'
                      : c.status === 'paused'
                        ? '#e8c97a'
                        : '#f0a5a5',
                }}
              >
                {c.status}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function AddCustomerModal({
  techs,
  onClose,
  onCreated,
}: {
  techs: StaffMember[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<CustomerInput>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    serviceType: 'pool',
    plan: 'standard',
    assignedTechId: '',
    serviceDayOfWeek: 2,
    serviceTimeWindow: 'AM',
    notes: '',
    status: 'active',
  });
  const [monthlyRateText, setMonthlyRateText] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function patch<K extends keyof CustomerInput>(k: K, v: CustomerInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSave() {
    setBusy(true);
    setErr(null);
    try {
      const cleanedTech = form.assignedTechId?.trim() || undefined;
      const cleanedId = customerId.trim() || undefined;
      const monthlyRate = parseRate(monthlyRateText);
      await createCustomer(
        { ...form, assignedTechId: cleanedTech, monthlyRate },
        cleanedId,
      );
      onCreated();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not create customer.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modalCard} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeader}>
          <div>
            <div
              style={{
                fontSize: '0.62rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#c9a84c',
                marginBottom: '0.3rem',
              }}
            >
              New Customer
            </div>
            <h2
              style={{
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontSize: '1.5rem',
                fontWeight: 300,
              }}
            >
              Add to directory
            </h2>
          </div>
          <button onClick={onClose} aria-label="Close" style={closeButton}>✕</button>
        </div>

        {err && (
          <div
            style={{
              background: 'rgba(220,80,80,0.08)',
              border: '1px solid rgba(220,80,80,0.35)',
              color: '#f0a5a5',
              fontSize: '0.82rem',
              padding: '0.6rem 0.8rem',
              marginBottom: '1rem',
              borderRadius: 2,
            }}
          >
            {err}
          </div>
        )}

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
            <select
              value={form.serviceDayOfWeek}
              onChange={(e) => patch('serviceDayOfWeek', Number(e.target.value))}
              style={textField}
            >
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
            <select
              value={form.assignedTechId ?? ''}
              onChange={(e) => patch('assignedTechId', e.target.value || undefined)}
              style={textField}
            >
              <option value="">— Unassigned —</option>
              {techs.map((t) => (
                <option key={t.uid} value={t.uid}>
                  {t.firstName} {t.lastName}
                </option>
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
          <Field label="Customer ID (optional — use the customer's auth UID to link)">
            <input value={customerId} onChange={(e) => setCustomerId(e.target.value)} placeholder="auto-generated if empty" style={textField} />
          </Field>
        </div>

        <div style={{ marginTop: '0.9rem' }}>
          <Field label="Notes">
            <textarea
              rows={3}
              value={form.notes ?? ''}
              onChange={(e) => patch('notes', e.target.value)}
              style={{ ...textField, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </Field>
        </div>

        <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="ss-btn-ghost">Cancel</button>
          <button
            onClick={() => void onSave()}
            disabled={busy}
            className="ss-btn-primary"
            style={{ opacity: busy ? 0.6 : 1 }}
          >
            {busy ? 'Saving…' : 'Create Customer'}
          </button>
        </div>
      </div>
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
        <div
          style={{
            marginTop: '0.35rem',
            fontSize: '0.7rem',
            color: '#8b95a7',
            lineHeight: 1.5,
          }}
        >
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

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#0a0f1e',
        border: '1px solid rgba(201,168,76,0.18)',
        borderRadius: 2,
        padding: '3rem 1.5rem',
        textAlign: 'center',
        color: '#8b95a7',
        fontSize: '0.95rem',
        lineHeight: 1.7,
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

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.65)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100,
  padding: '1.5rem',
};

const modalCard: React.CSSProperties = {
  background: '#0a0f1e',
  border: '1px solid rgba(201,168,76,0.25)',
  borderRadius: 2,
  padding: '1.5rem',
  width: '100%',
  maxWidth: 720,
  maxHeight: '90vh',
  overflowY: 'auto',
};

const modalHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '1rem',
  marginBottom: '1.25rem',
};

const closeButton: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(201,168,76,0.4)',
  color: '#c9a84c',
  padding: '0.4rem 0.6rem',
  borderRadius: 2,
  cursor: 'pointer',
};

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
