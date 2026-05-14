import type { ReactNode } from 'react';

export function AdminDashboardPage() {
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
          Overview
        </div>
        <h1
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(2rem, 4vw, 2.6rem)',
            fontWeight: 300,
            lineHeight: 1.1,
          }}
        >
          Operations at a glance
        </h1>
      </header>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        <Metric label="Customers" value="0" sub="Total active customers" />
        <Metric label="Open Requests" value="0" sub="Awaiting triage or visit" />
        <Metric label="Today's Appointments" value="0" sub="Scheduled visits today" />
      </section>

      <div
        style={{
          background: '#0a0f1e',
          border: '1px solid rgba(201,168,76,0.18)',
          padding: '1.5rem',
          borderRadius: 2,
          color: '#8b95a7',
          fontSize: '0.85rem',
          lineHeight: 1.7,
        }}
      >
        Phase 1 placeholder. Metric values will read from Firestore once Phase 2
        wires up the <code style={{ color: '#c9a84c' }}>customers</code>,{' '}
        <code style={{ color: '#c9a84c' }}>requests</code>, and{' '}
        <code style={{ color: '#c9a84c' }}>appointments</code> collections.
      </div>
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: ReactNode; sub: string }) {
  return (
    <article
      style={{
        background: '#0a0f1e',
        border: '1px solid rgba(201,168,76,0.18)',
        borderRadius: 2,
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          fontSize: '0.62rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: '#c9a84c',
          marginBottom: '0.65rem',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: '2.6rem',
          fontWeight: 300,
          lineHeight: 1,
          color: '#e8c97a',
        }}
      >
        {value}
      </div>
      <div
        style={{
          marginTop: '0.6rem',
          fontSize: '0.78rem',
          color: '#8b95a7',
        }}
      >
        {sub}
      </div>
    </article>
  );
}
