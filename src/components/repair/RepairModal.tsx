import { useEffect, useState, type FormEvent, type MouseEvent } from 'react';
import { useModal } from '@/context/ModalContext';
import {
  repairPropertyTypes,
  repairUrgencyOptions,
  contactPrefOptions,
} from '@/data/services';

/* ─────────────────────────────────────────────────────────────────────────
   Repair request modal.
   TODO before launch: replace stub submitRepairRequest() with real API call.
   ───────────────────────────────────────────────────────────────────────── */

export interface RepairRequestPayload {
  category: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  propertyType: string;
  urgency: string;
  description: string;
  contactPref: string;
}

async function submitRepairRequest(payload: RepairRequestPayload) {
  // eslint-disable-next-line no-console
  console.log('[Repair Request]', payload);
  // TODO: replace with real endpoint, e.g.
  // await fetch('/api/repair', { method: 'POST', body: JSON.stringify(payload) });
}

export function RepairModal() {
  const { repairOpen, repairCategory, closeRepair } = useModal();
  const [submitted, setSubmitted] = useState(false);

  // Reset on each open
  useEffect(() => {
    if (repairOpen) setSubmitted(false);
  }, [repairOpen]);

  if (!repairOpen) return null;

  function overlayClick(e: MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) closeRepair();
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload: RepairRequestPayload = {
      category: repairCategory,
      firstName: String(fd.get('fname') ?? ''),
      lastName: String(fd.get('lname') ?? ''),
      phone: String(fd.get('phone') ?? ''),
      email: String(fd.get('email') ?? ''),
      address: String(fd.get('address') ?? ''),
      propertyType: String(fd.get('proptype') ?? ''),
      urgency: String(fd.get('urgency') ?? ''),
      description: String(fd.get('desc') ?? ''),
      contactPref: String(fd.get('contact') ?? 'Text message'),
    };
    await submitRepairRequest(payload);
    setSubmitted(true);
  }

  return (
    <div className="ss-repair-overlay open" onClick={overlayClick}>
      <div className="ss-repair-modal">
        {submitted ? (
          <div className="ss-funnel-success">
            <div className="ss-success-icon">✓</div>
            <h3 className="ss-success-h3">
              Request <em>received.</em>
            </h3>
            <p className="ss-success-p">
              We've received your{' '}
              <strong style={{ color: '#e8c97a', fontWeight: 400 }}>
                {repairCategory}
              </strong>{' '}
              request. A member of the Stable Services team will be in touch
              within a few hours to confirm details and schedule your service.
            </p>
            <button
              className="ss-btn-primary"
              style={{ marginTop: '2rem' }}
              onClick={closeRepair}
            >
              Back to Site →
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <div className="ss-repair-modal-header">
              <div>
                <div
                  style={{
                    fontSize: '.65rem',
                    letterSpacing: '.18em',
                    textTransform: 'uppercase',
                    color: '#c9a84c',
                    marginBottom: '.5rem',
                  }}
                >
                  Repairs &amp; Upgrades
                </div>
                <div className="ss-repair-modal-title">
                  Request Service:
                  <br />
                  <em>{repairCategory}</em>
                </div>
              </div>
              <button
                type="button"
                className="ss-funnel-close"
                onClick={closeRepair}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="ss-repair-modal-body">
              <div className="ss-repair-note">
                <strong>What happens next:</strong> Submit your request and a
                member of the Stable Services team will reach out within a few
                hours to confirm scope, timing, and next steps.
              </div>

              <div className="ss-cf-fields">
                <div className="ss-cf-row">
                  <div className="ss-cf-field">
                    <label htmlFor="rr-fname">First Name</label>
                    <input
                      id="rr-fname"
                      name="fname"
                      type="text"
                      placeholder="Jane"
                    />
                  </div>
                  <div className="ss-cf-field">
                    <label htmlFor="rr-lname">Last Name</label>
                    <input
                      id="rr-lname"
                      name="lname"
                      type="text"
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div className="ss-cf-field">
                  <label htmlFor="rr-phone">Phone Number</label>
                  <input
                    id="rr-phone"
                    name="phone"
                    type="tel"
                    placeholder="(480) 555-0100"
                  />
                </div>
                <div className="ss-cf-field">
                  <label htmlFor="rr-email">Email Address</label>
                  <input
                    id="rr-email"
                    name="email"
                    type="email"
                    placeholder="you@email.com"
                  />
                </div>
                <div className="ss-cf-field">
                  <label htmlFor="rr-address">Property Address</label>
                  <input
                    id="rr-address"
                    name="address"
                    type="text"
                    placeholder="1234 E Camelback Rd, Scottsdale"
                  />
                </div>
                <div className="ss-cf-field">
                  <label htmlFor="rr-proptype">Property Type</label>
                  <select id="rr-proptype" name="proptype" defaultValue="">
                    <option value="">Select type</option>
                    {repairPropertyTypes.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div className="ss-cf-field">
                  <label htmlFor="rr-urgency">How urgent is this?</label>
                  <select id="rr-urgency" name="urgency" defaultValue="">
                    <option value="">Select urgency</option>
                    {repairUrgencyOptions.map((u) => (
                      <option key={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div className="ss-cf-field">
                  <label htmlFor="rr-desc">Describe the job or issue</label>
                  <textarea
                    id="rr-desc"
                    name="desc"
                    style={{ minHeight: 100 }}
                    placeholder="Tell us what's going on — as much detail as you can. Photos can be shared after we connect."
                  />
                </div>
                <div className="ss-cf-field">
                  <label htmlFor="rr-contact">Best way to reach you</label>
                  <select
                    id="rr-contact"
                    name="contact"
                    defaultValue="Text message"
                  >
                    {contactPrefOptions.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="ss-repair-modal-footer">
              <button
                type="button"
                className="ss-f-btn-back"
                onClick={closeRepair}
              >
                Cancel
              </button>
              <button type="submit" className="ss-f-btn-next">
                Submit Request →
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
