import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { signOut, useAuthUser } from '@/lib/auth';
import { siteConfig } from '@/data/siteConfig';

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
}

const navItems: NavItem[] = [
  { to: '/portal/dashboard', label: 'Dashboard', end: true },
  { to: '/portal/service', label: 'My Service' },
  { to: '/portal/requests', label: 'Requests' },
  { to: '/portal/account', label: 'Account' },
];

export function PortalShell() {
  const { user } = useAuthUser();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    navigate('/portal/login', { replace: true });
  }

  const displayName = user?.displayName || user?.email || 'Customer';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0f1e',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'DM Sans, system-ui, sans-serif',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.5rem',
          borderBottom: '0.5px solid rgba(201,168,76,0.18)',
          background: '#0a0f1e',
          gap: '1rem',
        }}
      >
        <Link
          to="/portal/dashboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: '#ffffff',
            textDecoration: 'none',
          }}
        >
          <div className="ss-logo-mark" style={{ width: 32, height: 32, fontSize: 13 }}>
            SS
          </div>
          <span
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: '1.05rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {siteConfig.company.name}
          </span>
        </Link>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            fontSize: '0.78rem',
            letterSpacing: '0.08em',
          }}
        >
          <span style={{ color: '#8b95a7' }} className="ss-portal-user">
            {displayName}
          </span>
          <button
            onClick={handleSignOut}
            className="ss-btn-ghost"
            style={{ padding: '0.5rem 0.75rem' }}
          >
            Sign Out
          </button>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle navigation"
            className="ss-portal-burger"
            style={{
              background: 'none',
              border: '1px solid rgba(201,168,76,0.4)',
              color: '#c9a84c',
              padding: '0.45rem 0.7rem',
              borderRadius: 2,
              cursor: 'pointer',
            }}
          >
            ☰
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <aside
          className="ss-portal-sidenav"
          data-open={mobileOpen ? 'true' : 'false'}
          style={{
            width: 240,
            borderRight: '0.5px solid rgba(201,168,76,0.18)',
            padding: '2rem 1rem',
            background: '#0a0f1e',
          }}
        >
          <PortalNavList onNavigate={() => setMobileOpen(false)} />
        </aside>

        <main style={{ flex: 1, padding: '2.5rem clamp(1rem, 4vw, 3rem)', minWidth: 0 }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        .ss-portal-burger { display: none; }
        @media (max-width: 768px) {
          .ss-portal-sidenav {
            position: fixed;
            top: 64px;
            bottom: 0;
            left: 0;
            width: 220px;
            z-index: 50;
            display: none;
          }
          .ss-portal-sidenav[data-open="true"] { display: block; }
          .ss-portal-burger { display: inline-flex; }
          .ss-portal-user { display: none; }
        }
      `}</style>
    </div>
  );
}

function PortalNavList({ onNavigate }: { onNavigate: () => void }) {
  return (
    <ul
      style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
      }}
    >
      {navItems.map((item) => (
        <li key={item.label}>
          <NavLink
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            style={({ isActive }) => ({
              display: 'block',
              padding: '0.7rem 0.9rem',
              fontSize: '0.78rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: isActive ? '#0a0f1e' : '#d6d2c4',
              background: isActive ? '#c9a84c' : 'transparent',
              borderRadius: 2,
              textDecoration: 'none',
              fontWeight: isActive ? 500 : 400,
            })}
          >
            {item.label}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}
