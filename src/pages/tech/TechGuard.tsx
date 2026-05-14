import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { signOut, useAuthUser, useStaffRole } from '@/lib/auth';

const ALLOWED: ReadonlyArray<string> = ['tech', 'lead_tech', 'owner', 'admin'];

export function TechGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuthUser();
  const { role, loading: roleLoading } = useStaffRole(user?.uid);
  const location = useLocation();

  if (loading || (user && roleLoading)) {
    return <CenteredMessage>Loading…</CenteredMessage>;
  }

  if (!user) {
    return <Navigate to="/tech/login" replace state={{ from: location.pathname }} />;
  }

  if (!role || !ALLOWED.includes(role)) {
    return (
      <CenteredMessage>
        <div
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: '1.8rem',
            fontWeight: 300,
            marginBottom: '1rem',
            color: '#ffffff',
          }}
        >
          Tech access required
        </div>
        <p
          style={{
            color: '#8b95a7',
            fontSize: '0.9rem',
            lineHeight: 1.7,
            maxWidth: 380,
            margin: '0 auto 1.5rem',
          }}
        >
          This account isn't set up as a tech. Sign out and try again with a
          tech account.
        </p>
        <button
          onClick={() => void signOut()}
          className="ss-btn-primary"
          style={{ justifyContent: 'center' }}
        >
          Sign Out
        </button>
      </CenteredMessage>
    );
  }

  return <>{children}</>;
}

function CenteredMessage({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#070b18',
        color: '#8b95a7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '2rem',
        fontFamily: 'DM Sans, system-ui, sans-serif',
        fontSize: '0.85rem',
        letterSpacing: '0.08em',
      }}
    >
      <div>{children}</div>
    </div>
  );
}
