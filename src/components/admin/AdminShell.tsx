import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { signOut, useAuthUser } from '@/lib/auth';

const navItems = [
  { to: '/admin/dashboard', label: 'Overview', end: true },
  { to: '/admin/customers', label: 'Customers' },
  { to: '/admin/requests', label: 'Service Requests' },
];

export function AdminShell() {
  const { user } = useAuthUser();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#070b18',
        color: '#ffffff',
        display: 'flex',
        fontFamily: 'DM Sans, system-ui, sans-serif',
      }}
    >
      <aside
        className="ss-admin-sidenav"
        data-open={mobileOpen ? 'true' : 'false'}
        style={{
          width: 240,
          background: '#0a0f1e',
          borderRight: '0.5px solid rgba(201,168,76,0.18)',
          padding: '1.5rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
        }}
      >
        <Link
          to="/admin/dashboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            color: '#ffffff',
            textDecoration: 'none',
            padding: '0.25rem 0.4rem',
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
              Stable Services
            </div>
            <div
              style={{
                fontSize: '0.6rem',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: '#c9a84c',
                marginTop: '0.2rem',
              }}
            >
              Admin
            </div>
          </div>
        </Link>

        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
            flex: 1,
          }}
        >
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
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
          <li>
            <span
              style={{
                display: 'block',
                padding: '0.7rem 0.9rem',
                fontSize: '0.78rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#5a6373',
                cursor: 'not-allowed',
              }}
              title="Coming soon"
            >
              Operations
            </span>
          </li>
        </ul>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.5rem',
            borderBottom: '0.5px solid rgba(201,168,76,0.18)',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle navigation"
              className="ss-admin-burger"
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
            <div
              style={{
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontSize: '1.1rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Stable Services Admin
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
              fontSize: '0.78rem',
            }}
          >
            <span style={{ color: '#8b95a7' }} className="ss-admin-user">
              {user?.email || ''}
            </span>
            <button
              onClick={handleSignOut}
              className="ss-btn-ghost"
              style={{ padding: '0.5rem 0.75rem' }}
            >
              Sign Out
            </button>
          </div>
        </header>

        <main style={{ flex: 1, padding: '2.5rem clamp(1rem, 4vw, 3rem)' }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        .ss-admin-burger { display: none; }
        @media (max-width: 768px) {
          .ss-admin-sidenav {
            position: fixed;
            top: 0;
            bottom: 0;
            left: 0;
            z-index: 50;
            display: none;
          }
          .ss-admin-sidenav[data-open="true"] { display: flex; }
          .ss-admin-burger { display: inline-flex; }
          .ss-admin-user { display: none; }
        }
      `}</style>
    </div>
  );
}
