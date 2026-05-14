import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { fieldStyle, formGroupStyle, labelStyle } from './AuthCard';

const categories = ['Pool', 'Lawn', 'Pressure Washing', 'Window Cleaning', 'Other'];
const urgencies = ['Low', 'Standard', 'Urgent'];

export function NewRequestPage() {
  const [category, setCategory] = useState(categories[0]);
  const [urgency, setUrgency] = useState(urgencies[1]);
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    // Phase 2 will wire this to Firestore.
    // eslint-disable-next-line no-console
    console.log('[new-request]', { category, urgency, description });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div
        style={{
          background: '#111827',
          border: '1px solid rgba(201,168,76,0.18)',
          borderRadius: 2,
          padding: '2.5rem 2rem',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: '0.65rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#c9a84c',
            marginBottom: '0.5rem',
          }}
        >
          Request Captured
        </div>
        <h2
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: '1.6rem',
            fontWeight: 300,
            marginBottom: '0.75rem',
          }}
        >
          Got it — we'll be in touch.
        </h2>
        <p
          style={{
            color: '#8b95a7',
            fontSize: '0.88rem',
            lineHeight: 1.7,
            maxWidth: 420,
            margin: '0 auto 1.5rem',
          }}
        >
          (Phase 1: this is a stub — your request was logged to the browser console.
          Phase 2 will persist it to Firestore and notify the team.)
        </p>
        <Link to="/portal/requests" className="ss-btn-primary">
          Back to Requests →
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <header style={{ marginBottom: '2rem' }}>
        <div
          style={{
            fontSize: '0.65rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#c9a84c',
            marginBottom: '0.5rem',
          }}
        >
          New Service Request
        </div>
        <h1
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(1.75rem, 3.4vw, 2.4rem)',
            fontWeight: 300,
          }}
        >
          Tell us what you need
        </h1>
      </header>

      <form
        onSubmit={onSubmit}
        style={{
          background: '#111827',
          border: '1px solid rgba(201,168,76,0.18)',
          borderRadius: 2,
          padding: '2rem',
        }}
      >
        <div style={formGroupStyle}>
          <label htmlFor="category" style={labelStyle}>Category</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={fieldStyle}
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div style={formGroupStyle}>
          <label htmlFor="urgency" style={labelStyle}>Urgency</label>
          <select
            id="urgency"
            value={urgency}
            onChange={(e) => setUrgency(e.target.value)}
            style={fieldStyle}
          >
            {urgencies.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>

        <div style={formGroupStyle}>
          <label htmlFor="description" style={labelStyle}>Description</label>
          <textarea
            id="description"
            required
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ ...fieldStyle, resize: 'vertical', minHeight: 120 }}
          />
        </div>

        <button
          type="submit"
          className="ss-btn-primary"
          style={{ justifyContent: 'center' }}
        >
          Submit Request
        </button>
      </form>
    </div>
  );
}
