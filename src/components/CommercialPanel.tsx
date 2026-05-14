import { useState, type FormEvent } from 'react';
import { FadeIn } from './FadeIn';
import {
  commercialPropertyTypes,
  commercialServiceOptions,
  commercialServiceList,
} from '@/data/services';
import { newBookingId } from '@/lib/bookingStorage';
import { sendToZapier, type ZapierPayload } from '@/lib/zapierWebhook';
import { sendBackupEmail } from '@/lib/emailBackup';

export interface CommercialInquiryPayload {
  firstName: string;
  lastName: string;
  business: string;
  role: string;
  phone: string;
  email: string;
  propertyType: string;
  services: string;
  notes: string;
}

async function submitCommercialInquiry(payload: CommercialInquiryPayload) {
  // Fire to Zapier — stage="commercial" so the Zap filter routes it through.
  const fullName = `${payload.firstName} ${payload.lastName}`.trim();
  const zap: ZapierPayload = {
    stage: 'commercial',
    source: 'stablesvc-website',
    bookingId: newBookingId(),
    submittedAt: new Date().toISOString(),
    service: 'commercial',
    serviceLabel: 'Commercial Inquiry',
    plan: 'inquiry',
    planLabel: payload.services || 'Multiple / All Services',
    planPrice: 'Custom proposal',
    firstName: payload.firstName,
    lastName: payload.lastName,
    fullName,
    phone: payload.phone,
    email: payload.email,
    preferredContact: 'Email',
    address: '',
    city: '',
    fullAddress: '',
    notes: payload.notes,
    preferredDate: '',
    timeWindow: '',
    weeklyDay: '',
    businessName: payload.business,
    businessRole: payload.role,
    propertyType: payload.propertyType,
    servicesInterested: payload.services,
  };
  void sendToZapier(zap);
  void sendBackupEmail(zap);
}

export function CommercialPanel() {
  const [submitted, setSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState('');
  const [submittedBiz, setSubmittedBiz] = useState('');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload: CommercialInquiryPayload = {
      firstName: String(fd.get('fname') ?? ''),
      lastName: String(fd.get('lname') ?? ''),
      business: String(fd.get('biz') ?? ''),
      role: String(fd.get('role') ?? ''),
      phone: String(fd.get('phone') ?? ''),
      email: String(fd.get('email') ?? ''),
      propertyType: String(fd.get('proptype') ?? ''),
      services: String(fd.get('services') ?? ''),
      notes: String(fd.get('notes') ?? ''),
    };
    await submitCommercialInquiry(payload);
    setSubmittedName(payload.firstName || 'there');
    setSubmittedBiz(payload.business);
    setSubmitted(true);
  }

  return (
    <FadeIn>
      <div className="ss-commercial-wrap">
        <div className="ss-commercial-hero">
          <div className="ss-commercial-copy">
            <h3>
              Built for
              <br />
              <em>businesses.</em>
            </h3>
            <p>
              Stable Services works with property managers, HOAs, hospitality
              venues, office parks, and retail centers across the Valley. We
              customize service schedules and scopes around your operation —
              not the other way around.
            </p>
            <div
              style={{
                fontSize: '.68rem',
                letterSpacing: '.18em',
                textTransform: 'uppercase',
                color: '#c9a84c',
                marginBottom: '.75rem',
              }}
            >
              Services We Offer Commercially
            </div>
            <div className="ss-commercial-services">
              {commercialServiceList.map((s) => (
                <div key={s} className="ss-commercial-service-row">
                  {s}
                </div>
              ))}
            </div>
            <div
              style={{
                border: '.5px solid rgba(201,168,76,.18)',
                borderRadius: 2,
                padding: '1.25rem 1.5rem',
                background: 'rgba(201,168,76,.04)',
              }}
            >
              <div
                style={{
                  fontSize: '.68rem',
                  letterSpacing: '.15em',
                  textTransform: 'uppercase',
                  color: '#c9a84c',
                  marginBottom: '.4rem',
                }}
              >
                Why businesses choose Stable
              </div>
              <p
                style={{
                  fontSize: '.82rem',
                  color: '#8b95a7',
                  lineHeight: 1.8,
                  fontWeight: 300,
                }}
              >
                Consistent crews, documented service reports, flexible
                billing, and a single point of contact — everything a property
                needs to stay guest-ready and professionally maintained
                year-round.
              </p>
            </div>
          </div>
          <div className="ss-commercial-form">
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div
                  style={{
                    width: 54,
                    height: 54,
                    border: '1px solid #c9a84c',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.25rem',
                    fontSize: '1.4rem',
                  }}
                >
                  ✓
                </div>
                <div
                  style={{
                    fontFamily: 'Cormorant Garamond, Georgia, serif',
                    fontSize: '1.6rem',
                    fontWeight: 300,
                    marginBottom: '.75rem',
                  }}
                >
                  Thanks,{' '}
                  <em style={{ color: '#e8c97a' }}>{submittedName}!</em>
                </div>
                <p
                  style={{
                    fontSize: '.85rem',
                    color: '#8b95a7',
                    lineHeight: 1.8,
                    fontWeight: 300,
                  }}
                >
                  We've received your inquiry
                  {submittedBiz ? ` for ${submittedBiz}` : ''} and will reach
                  out within one business day with a tailored proposal.
                  <br />
                  <br />
                  Welcome to Stable Services.
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate>
                <div className="ss-commercial-form-title">Get in Touch</div>
                <div className="ss-commercial-form-sub">
                  Tell us about your property and we'll put together a tailored
                  proposal — typically within one business day.
                </div>
                <div className="ss-cf-fields">
                  <div className="ss-cf-row">
                    <div className="ss-cf-field">
                      <label htmlFor="cf-fname">First Name</label>
                      <input
                        id="cf-fname"
                        name="fname"
                        type="text"
                        placeholder="Jane"
                      />
                    </div>
                    <div className="ss-cf-field">
                      <label htmlFor="cf-lname">Last Name</label>
                      <input
                        id="cf-lname"
                        name="lname"
                        type="text"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  <div className="ss-cf-field">
                    <label htmlFor="cf-biz">Business / Property Name</label>
                    <input
                      id="cf-biz"
                      name="biz"
                      type="text"
                      placeholder="Gainey Ranch Resort"
                    />
                  </div>
                  <div className="ss-cf-field">
                    <label htmlFor="cf-role">Your Role / Title</label>
                    <input
                      id="cf-role"
                      name="role"
                      type="text"
                      placeholder="Property Manager, GM, Owner..."
                    />
                  </div>
                  <div className="ss-cf-field">
                    <label htmlFor="cf-phone">Phone Number</label>
                    <input
                      id="cf-phone"
                      name="phone"
                      type="tel"
                      placeholder="(480) 555-0100"
                    />
                  </div>
                  <div className="ss-cf-field">
                    <label htmlFor="cf-email">Email Address</label>
                    <input
                      id="cf-email"
                      name="email"
                      type="email"
                      placeholder="you@company.com"
                    />
                  </div>
                  <div className="ss-cf-field">
                    <label htmlFor="cf-proptype">Property Type</label>
                    <select id="cf-proptype" name="proptype" defaultValue="">
                      <option value="">Select type</option>
                      {commercialPropertyTypes.map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div className="ss-cf-field">
                    <label htmlFor="cf-services">Services Interested In</label>
                    <select id="cf-services" name="services" defaultValue="">
                      <option value="">Select primary service</option>
                      {commercialServiceOptions.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="ss-cf-field">
                    <label htmlFor="cf-notes">
                      Tell us about your property &amp; needs
                    </label>
                    <textarea
                      id="cf-notes"
                      name="notes"
                      placeholder="Number of pools, property size, service frequency needs, special requirements..."
                    />
                  </div>
                  <button type="submit" className="ss-cf-submit">
                    Send Inquiry →
                  </button>
                  <div className="ss-commercial-note">
                    We'll respond within one business day. No obligation —
                    just a conversation.
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </FadeIn>
  );
}
