import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut, useAuthUser, useStaffMember } from '@/lib/auth';

export function TechShell({ children }: { children: ReactNode }) {
  const { user } = useAuthUser();
  const { member } = useStaffMember(user?.uid);
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/tech/login', { replace: true });
  }

  const techName = member
    ? `${member.firstName} ${member.lastName}`.trim()
    : user?.email || 'Tech';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0f1e',
        color: '#ffffff',
        fontFamily: 'DM Sans, system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1.25rem',
          borderBottom: '0.5px solid rgba(201,168,76,0.18)',
          background: '#0a0f1e',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}
      >
        <Link
          to="/tech/route"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            color: '#ffffff',
            textDecoration: 'none',
          }}
        >
          <div className="ss-logo-mark" style={{ width: 30, height: 30, fontSize: 12 }}>
            SS
          </div>
          <div>
            <div
              style={{
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontSize: '0.95rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Stable Field
            </div>
            <div
              style={{
                fontSize: '0.6rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#c9a84c',
                marginTop: '0.15rem',
              }}
            >
              {techName}
            </div>
          </div>
        </Link>

        <button
          onClick={handleSignOut}
          className="ss-btn-ghost"
          style={{ padding: '0.45rem 0.7rem' }}
        >
          Sign Out
        </button>
      </header>

      <main style={{ flex: 1, padding: '1.25rem clamp(0.75rem, 3vw, 2rem) 6rem' }}>
        {children}
      </main>
    </div>
  );
}
