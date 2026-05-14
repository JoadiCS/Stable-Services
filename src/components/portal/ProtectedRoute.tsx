import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthUser } from '@/lib/auth';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuthUser();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0a0f1e',
          color: '#8b95a7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'DM Sans, system-ui, sans-serif',
          fontSize: '0.85rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/portal/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
