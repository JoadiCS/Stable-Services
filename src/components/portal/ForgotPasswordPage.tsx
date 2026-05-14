import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordReset } from '@/lib/auth';
import {
  AuthCard,
  accentLine,
  errorStyle,
  fieldStyle,
  formGroupStyle,
  labelStyle,
} from './AuthCard';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await sendPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      setError(humanError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      eyebrow="Customer Portal"
      title={<>Reset your <em style={accentLine}>password.</em></>}
      subtitle={
        sent
          ? `If an account exists for ${email}, a reset link is on its way.`
          : 'Enter the email on your account and we will send you a reset link.'
      }
      footer={
        <Link to="/portal/login" style={{ color: '#c9a84c' }}>
          ← Back to sign in
        </Link>
      }
    >
      {!sent && (
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

          <button
            type="submit"
            disabled={busy}
            className="ss-btn-primary"
            style={{ width: '100%', justifyContent: 'center', opacity: busy ? 0.6 : 1 }}
          >
            {busy ? 'Sending…' : 'Send Reset Link'}
          </button>
        </form>
      )}
    </AuthCard>
  );
}

function humanError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  if (code === 'auth/invalid-email') return 'That email address is invalid.';
  if (code === 'auth/network-request-failed') return 'Network error. Check your connection.';
  return 'Could not send reset email. Please try again.';
}
