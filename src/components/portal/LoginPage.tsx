import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signInWithEmail } from '@/lib/auth';
import {
  AuthCard,
  accentLine,
  errorStyle,
  fieldStyle,
  formGroupStyle,
  labelStyle,
} from './AuthCard';

interface LocationState {
  from?: string;
}

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signInWithEmail(email.trim(), password);
      const dest = (location.state as LocationState | null)?.from || '/portal/dashboard';
      navigate(dest, { replace: true });
    } catch (err) {
      setError(humanError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      eyebrow="Customer Portal"
      title={<>Welcome <em style={accentLine}>back.</em></>}
      subtitle="Sign in to manage your service, request work, and review reports."
      footer={
        <>
          Don't have an account?{' '}
          <Link to="/portal/signup" style={{ color: '#c9a84c' }}>
            Set up access →
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        {error && <div style={errorStyle}>{error}</div>}

        <div style={formGroupStyle}>
          <label htmlFor="email" style={labelStyle}>Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={fieldStyle}
          />
        </div>

        <div style={formGroupStyle}>
          <label htmlFor="password" style={labelStyle}>Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={fieldStyle}
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="ss-btn-primary"
          style={{ width: '100%', justifyContent: 'center', opacity: busy ? 0.6 : 1 }}
        >
          {busy ? 'Signing in…' : 'Sign In'}
        </button>

        <div
          style={{
            marginTop: '1rem',
            textAlign: 'center',
            fontSize: '0.78rem',
          }}
        >
          <Link to="/portal/forgot-password" style={{ color: '#c9a84c' }}>
            Forgot password?
          </Link>
        </div>
      </form>
    </AuthCard>
  );
}

function humanError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
    return 'Email or password is incorrect.';
  }
  if (code === 'auth/user-not-found') return 'No account found for that email.';
  if (code === 'auth/too-many-requests') {
    return 'Too many attempts. Try again in a few minutes.';
  }
  if (code === 'auth/invalid-email') return 'That email address is invalid.';
  if (code === 'auth/network-request-failed') return 'Network error. Check your connection.';
  return 'Sign-in failed. Please try again.';
}
