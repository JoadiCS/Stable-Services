export function AdminRequestsPage() {
  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <div
          style={{
            fontSize: '0.65rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#c9a84c',
            marginBottom: '0.5rem',
          }}
        >
          Service Requests
        </div>
        <h1
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(1.75rem, 3.4vw, 2.4rem)',
            fontWeight: 300,
          }}
        >
          All customer requests
        </h1>
      </header>

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
        Service requests list coming soon.
      </div>
    </div>
  );
}
