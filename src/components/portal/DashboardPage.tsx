import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuthUser } from '@/lib/auth';

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
