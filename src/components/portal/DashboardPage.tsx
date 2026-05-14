import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { useAuthUser } from '@/lib/auth';
import { getCustomer } from '@/lib/customers';
import {
  getLastCompletedVisitForCustomer,
  getNextScheduledVisitForCustomer,
  listVisitsForCustomer,
} from '@/lib/visits';
import { loadPricingConfig, monthlyRevenueFor, type PricingConfig } from '@/lib/planPricing';
import { formatMonthlyRate, planLabel } from '@/lib/planLabel';
import { SERVICE_DESCRIPTIONS } from '@/data/servicePlanDescriptions';
import type { Customer, ServiceType, Visit } from '@/types/portal';
import { formatVisitDate } from './visitDisplay';

const SERVICE_PILL: Record<ServiceType, string> = {
  pool: 'Pool',
  lawn: 'Lawn',
  pressure: 'Pressure',
  window: 'Window',
};

interface DashboardData {
  customer: Customer | null;
  pricing: PricingConfig | null;
  nextVisit: Visit | null;
  lastVisit: Visit | null;
}

export function DashboardPage() {
  const { user, loading: authLoading } = useAuthUser();
  const [data, setData] = useState<DashboardData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const firstName = deriveFirstName(user?.displayName, user?.email);
  const uid = user?.uid;

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    setData(null);
    setErr(null);
    (async () => {
      try {
        const customer = await getCustomer(uid);
        if (!customer) {
          if (!cancelled) {
            setData({ customer: null, pricing: null, nextVisit: null, lastVisit: null });
          }
          return;
        }
        const todayISO = format(new Date(), 'yyyy-MM-dd');
        const [pricing, nextVisit, lastVisit] = await Promise.all([
          loadPricingConfig(),
          safeGet(() => getNextScheduledVisitForCustomer(uid, todayISO)),
          safeGet(() => getLastCompletedVisitForCustomer(uid)),
        ]);
        if (!cancelled) {
          setData({ customer, pricing, nextVisit, lastVisit });
        }
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Could not load your dashboard.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  if (authLoading || (!data && !err)) {
    return <Loading />;
  }

  return (
    <div>
      <header style={{ marginBottom: '2.5rem' }}>
        <div
          style={{
            fontSize: '0.65rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#c9a84c',
            marginBottom: '0.5rem',
          }}
        >
          Your Stable Services
        </div>
        <h1
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(2rem, 4vw, 2.75rem)',
            fontWeight: 300,
            lineHeight: 1.1,
            letterSpacing: '-0.01em',
          }}
        >
          Welcome back,{' '}
          <em style={{ fontStyle: 'italic', color: '#e8c97a' }}>{firstName}.</em>
        </h1>
      </header>

      {err && (
        <div
          style={{
            background: 'rgba(220,80,80,0.08)',
            border: '1px solid rgba(220,80,80,0.35)',
            color: '#f0a5a5',
            fontSize: '0.85rem',
            padding: '0.75rem 1rem',
            marginBottom: '1.5rem',
            borderRadius: 2,
          }}
        >
          {err}
        </div>
      )}

      {data?.customer ? (
        <>
          <CustomerTiles
            customer={data.customer}
            pricing={data.pricing}
            nextVisit={data.nextVisit}
            lastVisit={data.lastVisit}
          />
          <RecentVisits customerId={data.customer.customerId} />
        </>
      ) : (
        <StaffNote />
      )}
    </div>
  );
}

/* ─────────────────────── Customer tiles ─────────────────────── */
function CustomerTiles({
  customer,
  pricing,
  nextVisit,
  lastVisit,
}: {
  customer: Customer;
  pricing: PricingConfig | null;
  nextVisit: Visit | null;
  lastVisit: Visit | null;
}) {
  const monthlyAmount = pricing ? monthlyRevenueFor(customer, pricing) : (customer.monthlyRate ?? 0);
  const description = SERVICE_DESCRIPTIONS[customer.serviceType];

  return (
    <section
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2.5rem',
      }}
    >
      <Card label="Your Plan" title={planLabel(customer.plan)}>
        <p style={cardMeta}>{formatMonthlyRate(monthlyAmount)}</p>
        <p style={cardBody}>{description}</p>
      </Card>

      <Card label="Next Appointment" title={nextVisit ? formatScheduledDate(nextVisit.scheduledDate) : '—'}>
        {nextVisit ? (
          <>
            <p style={cardMeta}>{windowLabel(nextVisit.scheduledWindow)}</p>
            <p style={cardBody}>
              Your tech {nextVisit.techName ? <>({nextVisit.techName})</> : null} will arrive within the window above.
            </p>
          </>
        ) : (
          <p style={cardBody}>
            Your next visit will appear here once it's been scheduled.
          </p>
        )}
      </Card>

      <Card
        label="Last Visit"
        title={lastVisit ? formatVisitDate(lastVisit) : '—'}
      >
        {lastVisit ? (
          <>
            <p style={cardMeta}>Stable Report available</p>
            <Link
              to={`/portal/visit/${lastVisit.visitId}`}
              style={{
                color: '#c9a84c',
                fontSize: '0.78rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                textDecoration: 'none',
              }}
            >
              View Report →
            </Link>
          </>
        ) : (
          <p style={cardBody}>
            Your first Stable Report will land here after your first service.
          </p>
        )}
      </Card>

      <Card label="Need Service?" title="Request a visit">
        <p style={cardBody}>
          Repairs, leak checks, equipment swaps, or one-time cleanings — let us know
          what you need.
        </p>
        <div style={{ marginTop: '1rem' }}>
          <Link to="/portal/requests/new" className="ss-btn-primary">
            New Request →
          </Link>
        </div>
      </Card>
    </section>
  );
}

/* ─────────────────────── Recent Visits ─────────────────────── */
function RecentVisits({ customerId }: { customerId: string }) {
  const [visits, setVisits] = useState<Visit[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setVisits(null);
    setErr(null);
    (async () => {
      try {
        const all = await listVisitsForCustomer(customerId);
        const recent = all
          .filter((v) => v.status === 'completed' && v.reportGenerated)
          .slice(0, 10);
        if (!cancelled) setVisits(recent);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Could not load visits.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  return (
    <section>
      <div
        style={{
          fontSize: '0.65rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#c9a84c',
          marginBottom: '0.5rem',
        }}
      >
        Recent Visits
      </div>
      <h2
        style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: '1.6rem',
          fontWeight: 300,
          marginBottom: '1.25rem',
        }}
      >
        Your service history
      </h2>

      {err ? (
        <Empty>{err}</Empty>
      ) : visits === null ? (
        <Empty>Loading…</Empty>
      ) : visits.length === 0 ? (
        <Empty>
          No completed visits yet. Once your tech finishes a service, the Stable
          Report will show up here.
        </Empty>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.75rem' }}>
          {visits.map((v) => (
            <li key={v.visitId}>
              <Link
                to={`/portal/visit/${v.visitId}`}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem 1rem',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#111827',
                  border: '1px solid rgba(201,168,76,0.18)',
                  borderRadius: 2,
                  padding: '0.95rem 1.1rem',
                  textDecoration: 'none',
                  color: '#ffffff',
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: 'Cormorant Garamond, Georgia, serif',
                      fontSize: '1.15rem',
                      fontWeight: 300,
                    }}
                  >
                    {formatVisitDate(v)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem' }}>
                    <ServicePill type={v.serviceType} />
                    <span style={{ color: '#8b95a7', fontSize: '0.78rem' }}>
                      {v.techName || 'Stable Services team'}
                    </span>
                  </div>
                </div>
                <span
                  style={{
                    color: '#c9a84c',
                    fontSize: '0.78rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  View Report →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ServicePill({ type }: { type: ServiceType }) {
  return (
    <span
      style={{
        padding: '0.2rem 0.5rem',
        fontSize: '0.62rem',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        borderRadius: 2,
        background: 'rgba(201,168,76,0.12)',
        color: '#c9a84c',
      }}
    >
      {SERVICE_PILL[type]}
    </span>
  );
}

/* ─────────────────────── Empty / loading / staff fallback ─────────────────────── */

function StaffNote() {
  return (
    <section
      style={{
        background: '#111827',
        border: '1px solid rgba(201,168,76,0.18)',
        borderRadius: 2,
        padding: '2.25rem 2rem',
        textAlign: 'center',
        maxWidth: 560,
      }}
    >
      <div
        style={{
          fontSize: '0.62rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: '#c9a84c',
          marginBottom: '0.6rem',
        }}
      >
        Customer Portal
      </div>
      <h2
        style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: '1.5rem',
          fontWeight: 300,
          marginBottom: '0.75rem',
        }}
      >
        This dashboard is for customer accounts.
      </h2>
      <p style={{ color: '#8b95a7', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '1.25rem' }}>
        To manage operations, visit the admin dashboard.
      </p>
      <Link to="/admin/dashboard" className="ss-btn-primary">
        Go to Admin →
      </Link>
    </section>
  );
}

function Loading() {
  return (
    <div
      style={{
        color: '#8b95a7',
        fontSize: '0.85rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        padding: '2rem 0',
      }}
    >
      Loading your dashboard…
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        background: '#111827',
        border: '1px solid rgba(201,168,76,0.18)',
        borderRadius: 2,
        padding: '1.5rem',
        color: '#8b95a7',
        fontSize: '0.88rem',
        lineHeight: 1.7,
      }}
    >
      {children}
    </div>
  );
}

function Card({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <article
      style={{
        background: '#111827',
        border: '1px solid rgba(201,168,76,0.18)',
        borderRadius: 2,
        padding: '1.5rem 1.5rem 1.75rem',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          fontSize: '0.65rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#c9a84c',
          marginBottom: '0.5rem',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: '1.4rem',
          fontWeight: 300,
          letterSpacing: '0.01em',
          marginBottom: '0.75rem',
        }}
      >
        {title}
      </div>
      {children}
    </article>
  );
}

const cardMeta: CSSProperties = {
  color: '#e8c97a',
  fontSize: '0.85rem',
  letterSpacing: '0.06em',
  marginBottom: '0.65rem',
};

const cardBody: CSSProperties = {
  color: '#8b95a7',
  fontSize: '0.85rem',
  lineHeight: 1.7,
  fontWeight: 300,
};

function formatScheduledDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return format(new Date(y, m - 1, d), 'EEEE, MMM d');
}

function windowLabel(w: 'AM' | 'PM'): string {
  return w === 'AM' ? 'AM window (7am – 12pm)' : 'PM window (12pm – 5pm)';
}

function deriveFirstName(displayName: string | null | undefined, email: string | null | undefined): string {
  if (displayName) {
    const first = displayName.trim().split(/\s+/)[0];
    if (first) return first;
  }
  if (email) {
    const local = email.split('@')[0];
    if (local) {
      const cleaned = local.replace(/[._-]+/g, ' ').split(' ')[0];
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
  }
  return 'neighbor';
}

async function safeGet<T>(fn: () => Promise<T | null>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}
