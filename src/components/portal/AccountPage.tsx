import { useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
} from 'firebase/auth';
import { useAuthUser } from '@/lib/auth';
import { auth } from '@/lib/firebase';

export function PortalAccountPage() {
  const { user, loading } = useAuthUser();

  if (loading) {
    return <Note>Loading your account…</Note>;
  }
  if (!user) {
    return <Note>Sign in to manage your account.</Note>;
  }

  return (
    <div>
      <header style={{ marginBottom: '1.75rem' }}>
        <div
          style={{
            fontSize: '0.65rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#c9a84c',
            marginBottom: '0.5rem',
          }}
        >
          Account
        </div>
        <h1
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(1.75rem, 3.4vw, 2.4rem)',
            fontWeight: 300,
          }}
        >
          Sign-in details
        </h1>
        <p style={{ color: '#8b95a7', fontSize: '0.88rem', marginTop: '0.5rem', lineHeight: 1.7, maxWidth: 600 }}>
          Signed in as <strong style={{ color: '#e8c97a' }}>{user.email}</strong>. To change your email
          or password, confirm your current password below.
        </p>
      </header>

      <div style={{ display: 'grid', gap: '1.25rem' }}>
        <EmailSection currentEmail={user.email ?? ''} />
        <PasswordSection />
      </div>
    </div>
  );
}

/* ─────────────────────── Email ─────────────────────── */
function EmailSection({ currentEmail }: { currentEmail: string }) {
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setToast(null);
    if (!newEmail.trim() || newEmail.trim() === currentEmail) {
      setErr('Enter a new email address that differs from the current one.');
      return;
    }
    setBusy(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error('Not signed in.');
      const cred = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, cred);
      await updateEmail(user, newEmail.trim());
      setToast('Email updated. Use the new address next time you sign in.');
      setNewEmail('');
      setCurrentPassword('');
    } catch (e) {
      setErr(humanAuthError(e, 'Could not update your email.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Change email">
      <form onSubmit={onSubmit} noValidate>
        {err && <ErrorBox>{err}</ErrorBox>}
        {toast && <SuccessBox>{toast}</SuccessBox>}

        <Field label="Current email">
          <input value={currentEmail} disabled style={{ ...textField, opacity: 0.7 }} />
        </Field>

        <Field label="New email">
          <input
            type="email"
            autoComplete="email"
            required
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            style={textField}
          />
        </Field>

        <Field label="Current password (to confirm)">
          <input
            type="password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            style={textField}
          />
        </Field>

        <div style={{ marginTop: '0.5rem' }}>
          <button type="submit" disabled={busy} className="ss-btn-primary" style={{ opacity: busy ? 0.6 : 1 }}>
            {busy ? 'Updating…' : 'Update Email'}
          </button>
        </div>
      </form>
    </Card>
  );
}

/* ─────────────────────── Password ─────────────────────── */
function PasswordSection() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setToast(null);
    if (newPassword.length < 8) {
      setErr('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirm) {
      setErr('New password and confirmation must match.');
      return;
    }
    setBusy(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error('Not signed in.');
      const cred = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPassword);
      setToast('Password updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
    } catch (e) {
      setErr(humanAuthError(e, 'Could not update your password.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Change password">
      <form onSubmit={onSubmit} noValidate>
        {err && <ErrorBox>{err}</ErrorBox>}
        {toast && <SuccessBox>{toast}</SuccessBox>}

        <Field label="Current password">
          <input
            type="password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            style={textField}
          />
        </Field>

        <Field label="New password">
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={textField}
          />
        </Field>

        <Field label="Confirm new password">
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            style={textField}
          />
        </Field>

        <div style={{ marginTop: '0.5rem' }}>
          <button type="submit" disabled={busy} className="ss-btn-primary" style={{ opacity: busy ? 0.6 : 1 }}>
            {busy ? 'Updating…' : 'Update Password'}
          </button>
        </div>
      </form>
    </Card>
  );
}

/* ─────────────────────── Shared ─────────────────────── */
function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section
      style={{
        background: '#111827',
        border: '1px solid rgba(201,168,76,0.18)',
        borderRadius: 2,
        padding: '1.5rem',
        maxWidth: 560,
      }}
    >
      <h2
        style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: '1.3rem',
          fontWeight: 300,
          marginBottom: '1.1rem',
          color: '#e8c97a',
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: '1rem' }}>
      <div
        style={{
          fontSize: '0.65rem',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#c9a84c',
          marginBottom: '0.35rem',
        }}
      >
        {label}
      </div>
      {children}
    </label>
  );
}

function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        background: 'rgba(220,80,80,0.08)',
        border: '1px solid rgba(220,80,80,0.35)',
        color: '#f0a5a5',
        fontSize: '0.82rem',
        padding: '0.6rem 0.8rem',
        marginBottom: '1rem',
        borderRadius: 2,
      }}
    >
      {children}
    </div>
  );
}

function SuccessBox({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        background: 'rgba(127,203,138,0.08)',
        border: '1px solid rgba(127,203,138,0.35)',
        color: '#7fcb8a',
        fontSize: '0.82rem',
        padding: '0.6rem 0.8rem',
        marginBottom: '1rem',
        borderRadius: 2,
      }}
    >
      {children}
    </div>
  );
}

function Note({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        background: '#111827',
        border: '1px solid rgba(201,168,76,0.18)',
        borderRadius: 2,
        padding: '2rem 1.5rem',
        textAlign: 'center',
        color: '#8b95a7',
        fontSize: '0.9rem',
        lineHeight: 1.7,
      }}
    >
      {children}
    </div>
  );
}

const textField: CSSProperties = {
  width: '100%',
  background: '#0a0f1e',
  border: '1px solid rgba(201,168,76,0.25)',
  color: '#ffffff',
  padding: '0.7rem 0.8rem',
  fontSize: '0.92rem',
  borderRadius: 2,
  outline: 'none',
  fontFamily: 'inherit',
};

function humanAuthError(err: unknown, fallback: string): string {
  const code = (err as { code?: string })?.code || '';
  if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
    return 'Current password is incorrect.';
  }
  if (code === 'auth/invalid-email') return 'That email address is invalid.';
  if (code === 'auth/email-already-in-use') return 'Another account is already using that email.';
  if (code === 'auth/weak-password') return 'New password is too weak.';
  if (code === 'auth/requires-recent-login') {
    return 'For security, please sign out, sign back in, and try again.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Email changes are disabled. Contact support to update your address.';
  }
  if (code === 'auth/network-request-failed') return 'Network error. Check your connection.';
  return fallback;
}
