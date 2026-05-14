import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { signInWithEmail } from '@/lib/auth';
import {
  AuthCard,
  accentLine,
  errorStyle,
  fieldStyle,
  formGroupStyle,
  labelStyle,
} from '@/components/portal/AuthCard';

interface LocationState {
  from?: string;
}

export function TechLoginPage() {
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
      const dest = (location.state as LocationState | null)?.from || '/tech/route';
      navigate(dest, { replace: true });
    } catch (err) {
      setError(humanError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      eyebrow="Stable Services Field"
      title={<>Tech <em style={accentLine}>sign in.</em></>}
      subtitle="For service techs on a route. Customers should use the customer portal."
    >
      <form onSubmit={onSubmit} noValidate>
        {error && <div style={errorStyle}>{error}</div>}

        <div style={formGroupStyle}>
          <label htmlFor="tech-email" style={labelStyle}>Email</label>
          <input
            id="tech-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={fieldStyle}
          />
        </div>

        <div style={formGroupStyle}>
          <label htmlFor="tech-password" style={labelStyle}>Password</label>
          <input
            id="tech-password"
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
  if (code === 'auth/network-request-failed') return 'Network error. Check your connection.';
  return 'Sign-in failed. Please try again.';
}
