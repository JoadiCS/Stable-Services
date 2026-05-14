import { useEffect, useState } from 'react';
import {
  createStaffMember,
  listAllStaff,
  STAFF_ROLE_OPTIONS,
  updateStaffMember,
} from '@/lib/staff';
import type { StaffMember, StaffRole } from '@/types/portal';

export function TechsPage() {
  const [staff, setStaff] = useState<StaffMember[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  async function reload() {
    setErr(null);
    try {
      const list = await listAllStaff();
      setStaff(list);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load staff.');
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  return (
    <div>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: '1rem',
          flexWrap: 'wrap',
          marginBottom: '1.75rem',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.65rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#c9a84c',
              marginBottom: '0.5rem',
            }}
          >
            Techs &amp; Staff
          </div>
          <h1
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 'clamp(1.75rem, 3.4vw, 2.4rem)',
              fontWeight: 300,
            }}
          >
            Field roster
          </h1>
        </div>
        <button onClick={() => setShowAdd(true)} className="ss-btn-primary">
          + Add Tech
        </button>
      </header>

      {err && (
        <div
          style={{
            background: 'rgba(220,80,80,0.08)',
            border: '1px solid rgba(220,80,80,0.35)',
            color: '#f0a5a5',
            fontSize: '0.85rem',
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            borderRadius: 2,
          }}
        >
          {err}
        </div>
      )}

      {staff === null ? (
        <Empty>Loading…</Empty>
      ) : staff.length === 0 ? (
        <Empty>No staff yet. Use “Add Tech” to create the first record.</Empty>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.6rem' }}>
          {staff.map((s) => (
            <StaffRow key={s.uid} member={s} onUpdated={reload} />
          ))}
        </ul>
      )}

      {showAdd && (
        <AddTechModal
          onClose={() => setShowAdd(false)}
          onCreated={async () => {
            setShowAdd(false);
            await reload();
          }}
        />
      )}
    </div>
  );
}

function StaffRow({ member, onUpdated }: { member: StaffMember; onUpdated: () => void }) {
  const [busy, setBusy] = useState(false);

  async function toggleActive() {
    setBusy(true);
    try {
      await updateStaffMember(member.uid, { active: !member.active });
      onUpdated();
    } finally {
      setBusy(false);
    }
  }

  return (
    <li
      style={{
        background: '#0a0f1e',
        border: '1px solid rgba(201,168,76,0.18)',
        borderRadius: 2,
        padding: '1rem 1.1rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div>
        <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.15rem', fontWeight: 300 }}>
          {member.firstName} {member.lastName}
        </div>
        <div style={{ color: '#8b95a7', fontSize: '0.82rem', marginTop: '0.25rem' }}>
          {member.email} {member.phone ? `· ${member.phone}` : ''}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <Pill>{member.role}</Pill>
        <Pill state={member.active ? 'ok' : 'warn'}>{member.active ? 'Active' : 'Inactive'}</Pill>
        <button onClick={() => void toggleActive()} disabled={busy} className="ss-btn-ghost">
          {member.active ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    </li>
  );
}

function AddTechModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [uid, setUid] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<StaffRole>('tech');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSave() {
    setBusy(true);
    setErr(null);
    try {
      if (!uid.trim()) throw new Error('UID is required — paste the new tech\'s Firebase Auth UID after they create their account.');
      await createStaffMember(uid.trim(), {
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        role,
        active: true,
      });
      onCreated();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not create tech.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modalCard} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeader}>
          <div>
            <div
              style={{
                fontSize: '0.62rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#c9a84c',
                marginBottom: '0.3rem',
              }}
            >
              New Tech
            </div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.5rem', fontWeight: 300 }}>
              Add to roster
            </h2>
          </div>
          <button onClick={onClose} aria-label="Close" style={closeButton}>✕</button>
        </div>

        {err && (
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
            {err}
          </div>
        )}

        <p style={{ color: '#8b95a7', fontSize: '0.82rem', marginBottom: '1rem', lineHeight: 1.7 }}>
          The tech first signs themselves up at <strong style={{ color: '#c9a84c' }}>/tech/login → Forgot Password</strong>{' '}
          (or you create their account in Firebase Console). Then paste their Auth UID below
          so this record links to their login.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
          <Field label="Firebase Auth UID">
            <input value={uid} onChange={(e) => setUid(e.target.value)} style={textField} />
          </Field>
          <Field label="Role">
            <select value={role} onChange={(e) => setRole(e.target.value as StaffRole)} style={textField}>
              {STAFF_ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </Field>
          <Field label="First name">
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} style={textField} />
          </Field>
          <Field label="Last name">
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} style={textField} />
          </Field>
          <Field label="Email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={textField} />
          </Field>
          <Field label="Phone">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} style={textField} />
          </Field>
        </div>

        <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="ss-btn-ghost">Cancel</button>
          <button
            onClick={() => void onSave()}
            disabled={busy}
            className="ss-btn-primary"
            style={{ opacity: busy ? 0.6 : 1 }}
          >
            {busy ? 'Saving…' : 'Create Tech'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
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

function Pill({ children, state }: { children: React.ReactNode; state?: 'ok' | 'warn' }) {
  const fg = state === 'ok' ? '#7fcb8a' : state === 'warn' ? '#e8c97a' : '#c9a84c';
  const bg =
    state === 'ok'
      ? 'rgba(127,203,138,0.12)'
      : state === 'warn'
        ? 'rgba(232,201,122,0.12)'
        : 'rgba(201,168,76,0.12)';
  return (
    <span
      style={{
        padding: '0.25rem 0.55rem',
        fontSize: '0.62rem',
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        borderRadius: 2,
        color: fg,
        background: bg,
      }}
    >
      {children}
    </span>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#0a0f1e',
        border: '1px solid rgba(201,168,76,0.18)',
        borderRadius: 2,
        padding: '3rem 1.5rem',
        textAlign: 'center',
        color: '#8b95a7',
        fontSize: '0.95rem',
        lineHeight: 1.7,
      }}
    >
      {children}
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.65)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100,
  padding: '1.5rem',
};

const modalCard: React.CSSProperties = {
  background: '#0a0f1e',
  border: '1px solid rgba(201,168,76,0.25)',
  borderRadius: 2,
  padding: '1.5rem',
  width: '100%',
  maxWidth: 620,
  maxHeight: '90vh',
  overflowY: 'auto',
};

const modalHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '1rem',
  marginBottom: '1.25rem',
};

const closeButton: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(201,168,76,0.4)',
  color: '#c9a84c',
  padding: '0.4rem 0.6rem',
  borderRadius: 2,
  cursor: 'pointer',
};

const textField: React.CSSProperties = {
  width: '100%',
  background: '#0a0f1e',
  border: '1px solid rgba(201,168,76,0.25)',
  color: '#ffffff',
  padding: '0.65rem 0.7rem',
  fontSize: '0.88rem',
  borderRadius: 2,
  outline: 'none',
};
