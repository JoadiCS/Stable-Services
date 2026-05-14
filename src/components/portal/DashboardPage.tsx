import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuthUser } from '@/lib/auth';
import { listVisitsForCustomer } from '@/lib/visits';
import type { ServiceType, Visit } from '@/types/portal';
import { formatVisitDate } from './visitDisplay';

const SERVICE_LABEL: Record<ServiceType, string> = {
  pool: 'Pool',
  lawn: 'Lawn',
  pressure: 'Pressure',
  window: 'Window',
};

export function DashboardPage() {
  const { user } = useAuthUser();
  const firstName = deriveFirstName(user?.displayName, user?.email);

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

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2.5rem',
        }}
      >
        <Card label="Your Plan" title="Stable Standard">
          <p style={cardMeta}>$139.99 / month</p>
          <p style={cardBody}>
            Weekly pool service · chemical balance · skim &amp; brush · equipment check.
          </p>
        </Card>

        <Card label="Next Appointment" title="Tuesday, May 19">
          <p style={cardMeta}>9:00 AM</p>
          <p style={cardBody}>
            Your assigned technician will arrive within a 60-minute window.
          </p>
        </Card>

        <Card label="Last Visit" title="May 12">
          <p style={cardMeta}>Stable Report available</p>
          <p style={cardBody}>
            Chlorine, pH, and equipment status logged. Tap to review the latest report.
          </p>
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

      <RecentVisits customerId={user?.uid} />
    </div>
  );
}

function RecentVisits({ customerId }: { customerId: string | undefined }) {
  const [visits, setVisits] = useState<Visit[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) return;
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
        <Empty>No completed visits yet. Once your first service is wrapped, the report appears here.</Empty>
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
                  <div style={{ color: '#8b95a7', fontSize: '0.82rem', marginTop: '0.25rem' }}>
                    {SERVICE_LABEL[v.serviceType]} · {v.techName || 'Tech'}
                  </div>
                </div>
                <span style={{ color: '#c9a84c', fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
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
