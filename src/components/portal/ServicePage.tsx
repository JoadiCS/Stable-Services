import { useEffect, useState, type ReactNode } from 'react';
import { useAuthUser } from '@/lib/auth';
import { getCustomer } from '@/lib/customers';
import { loadPricingConfig, monthlyRevenueFor, type PricingConfig } from '@/lib/planPricing';
import { formatMonthlyRate, planLabel, serviceLabel } from '@/lib/planLabel';
import type { Customer } from '@/types/portal';

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WINDOW_LABELS = {
  AM: 'AM window (7am – 12pm)',
  PM: 'PM window (12pm – 5pm)',
} as const;

const STATUS_LABEL = {
  active: 'Active',
  paused: 'Paused',
  cancelled: 'Cancelled',
} as const;

export function PortalServicePage() {
  const { user, loading: authLoading } = useAuthUser();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [pricing, setPricing] = useState<PricingConfig | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const uid = user?.uid;

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    setLoaded(false);
    setErr(null);
    (async () => {
      try {
        const [c, p] = await Promise.all([getCustomer(uid), loadPricingConfig()]);
        if (!cancelled) {
          setCustomer(c);
          setPricing(p);
          setLoaded(true);
        }
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Could not load your service.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  if (authLoading || !loaded) {
    return <Note>Loading your service…</Note>;
  }

  if (err) {
    return <Note>{err}</Note>;
  }

  if (!customer) {
    return (
      <Note>
        We couldn't find a customer record linked to this account yet. If you just
        signed up, your account manager will link it shortly. Reach out if it's
        been more than a day.
      </Note>
    );
  }

  const monthlyAmount = pricing ? monthlyRevenueFor(customer, pricing) : customer.monthlyRate ?? 0;

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
          My Service
        </div>
        <h1
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(1.75rem, 3.4vw, 2.4rem)',
            fontWeight: 300,
          }}
        >
          {planLabel(customer.plan)}{' '}
          <span style={{ color: '#8b95a7', fontSize: '0.8em' }}>· {serviceLabel(customer.serviceType)}</span>
        </h1>
        <p style={{ color: '#8b95a7', fontSize: '0.88rem', marginTop: '0.5rem', lineHeight: 1.7, maxWidth: 600 }}>
          A read-only summary of your service. If something needs to change (move days,
          pause, upgrade), give us a call or open a service request.
        </p>
      </header>

      <section
        style={{
          background: '#111827',
          border: '1px solid rgba(201,168,76,0.18)',
          borderRadius: 2,
          padding: '1.5rem',
        }}
      >
        <dl
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem 1.5rem',
            margin: 0,
          }}
        >
          <Row label="Plan" value={planLabel(customer.plan)} />
          <Row label="Service Type" value={serviceLabel(customer.serviceType)} />
          <Row label="Monthly Rate" value={formatMonthlyRate(monthlyAmount)} />
          <Row label="Status" value={STATUS_LABEL[customer.status]} />
          <Row label="Service Day" value={DAY_LABELS[customer.serviceDayOfWeek] ?? '—'} />
          <Row label="Time Window" value={WINDOW_LABELS[customer.serviceTimeWindow]} />
          <Row label="Service Address" value={`${customer.address}${customer.city ? `, ${customer.city}` : ''}`} />
          <Row label="Phone" value={customer.phone || '—'} />
          {customer.notes && <Row label="Notes" value={customer.notes} fullWidth />}
        </dl>
      </section>
    </div>
  );
}

function Row({
  label,
  value,
  fullWidth,
}: {
  label: string;
  value: string;
  fullWidth?: boolean;
}) {
  return (
    <div style={fullWidth ? { gridColumn: '1 / -1' } : undefined}>
      <dt
        style={{
          fontSize: '0.62rem',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: '#c9a84c',
          marginBottom: '0.3rem',
        }}
      >
        {label}
      </dt>
      <dd
        style={{
          margin: 0,
          fontSize: '0.95rem',
          color: '#ffffff',
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
        }}
      >
        {value}
      </dd>
    </div>
  );
}

function Note({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        background: '#111827',
        border: '1px solid rgba(201,168,76,0.18)',
        borderRadius: 2,
        padding: '2rem 1.5rem',
        textAlign: 'center',
        color: '#8b95a7',
        fontSize: '0.9rem',
        lineHeight: 1.7,
      }}
    >
      {children}
    </div>
  );
}
