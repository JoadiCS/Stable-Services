import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { signUpWithEmail } from '@/lib/auth';
import { db } from '@/lib/firebase';
import {
  AuthCard,
  accentLine,
  errorStyle,
  fieldStyle,
  formGroupStyle,
  labelStyle,
} from './AuthCard';

export function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setBusy(true);
    try {
      const cred = await signUpWithEmail(email.trim(), password);
      await linkCustomerRecord(email.trim().toLowerCase(), cred.user.uid);
      navigate('/portal/dashboard', { replace: true });
    } catch (err) {
      setError(humanError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      eyebrow="Customer Portal"
      title={<>Set up your <em style={accentLine}>access.</em></>}
      subtitle="Use the email on file with Stable Services. We'll link this login to your customer record."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/portal/login" style={{ color: '#c9a84c' }}>
            Sign in →
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        {error && <div style={errorStyle}>{error}</div>}

        <div style={formGroupStyle}>
          <label htmlFor="email" style={labelStyle}>Email on file</label>
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
          <label htmlFor="password" style={labelStyle}>Create password</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={fieldStyle}
          />
          <div
            style={{
              marginTop: '0.4rem',
              fontSize: '0.72rem',
              color: '#8b95a7',
              letterSpacing: '0.04em',
            }}
          >
            At least 8 characters.
          </div>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="ss-btn-primary"
          style={{ width: '100%', justifyContent: 'center', opacity: busy ? 0.6 : 1 }}
        >
          {busy ? 'Creating account…' : 'Create Account'}
        </button>
      </form>
    </AuthCard>
  );
}

async function linkCustomerRecord(emailLower: string, uid: string): Promise<void> {
  try {
    const q = query(
      collection(db, 'customers'),
      where('email', '==', emailLower),
      limit(1),
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      await updateDoc(doc(db, 'customers', snap.docs[0].id), { uid });
    }
  } catch {
    // Phase 1 behavior: if no matching customer record exists or Firestore
    // rules block the lookup, we still want the auth account to be usable.
    // The link happens later (manually or in Phase 2).
  }
}

function humanError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  if (code === 'auth/email-already-in-use') {
    return 'An account already exists for that email. Sign in instead.';
  }
  if (code === 'auth/weak-password') return 'Password is too weak. Use at least 8 characters.';
  if (code === 'auth/invalid-email') return 'That email address is invalid.';
  if (code === 'auth/network-request-failed') return 'Network error. Check your connection.';
  return 'Could not create your account. Please try again.';
}
