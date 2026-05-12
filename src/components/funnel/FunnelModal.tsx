import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { useModal, type FunnelService } from '@/context/ModalContext';
import { planData, type PricingPlan } from '@/data/plans';
import { saveBooking, newBookingId } from '@/lib/bookingStorage';
import { buildZapierPayload, sendToZapier } from '@/lib/zapierWebhook';
import {
  funnelServiceOptions,
  poolSizeOptions,
  poolTypeOptions,
  lawnSizeOptions,
  pressureAreaOptions,
  timeWindowOptions,
  weekdayOptions,
  contactPrefOptions,
} from '@/data/services';
import {
  IconPoolWave,
  IconLandscape,
  IconPest,
  IconWindow,
  IconGrid,
} from '../Icons';

/* ─────────────────────────────────────────────────────────────────────────
   FunnelModal — 5-step booking wizard.
   TODO before launch: replace stub submitFunnel() with a real API call.
   ───────────────────────────────────────────────────────────────────────── */

export interface FunnelSubmission {
  service: FunnelService;
  plan: string;
  property: {
    address: string;
    city: string;
    poolSize?: string;
    poolType?: string;
    lawnSize?: string;
    pressureArea?: string;
    notes: string;
  };
  schedule: {
    date: string;
    timeWindow: string;
    weekday: string;
  };
  contact: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    contactPref: string;
  };
}

async function submitFunnel(payload: FunnelSubmission) {
  // eslint-disable-next-line no-console
  console.log('[Funnel Submission]', payload);
  // TODO: replace with real endpoint, e.g.
  // await fetch('/api/booking', { method: 'POST', body: JSON.stringify(payload) });
}

const serviceIconMap: Record<FunnelService, typeof IconPoolWave> = {
  pool: IconPoolWave,
  lawn: IconLandscape,
  pressure: IconPest,
  windows: IconWindow,
  multiple: IconGrid,
};

const TOTAL_STEPS = 5;

interface PropertyForm {
  address: string;
  city: string;
  poolSize: string;
  poolType: string;
  lawnSize: string;
  pressureArea: string;
  notes: string;
}
interface ScheduleForm {
  date: string;
  timeWindow: string;
  weekday: string;
}
interface ContactForm {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  contactPref: string;
}

const emptyProperty: PropertyForm = {
  address: '',
  city: '',
  poolSize: '',
  poolType: '',
  lawnSize: '',
  pressureArea: '',
  notes: '',
};
const emptySchedule: ScheduleForm = {
  date: '',
  timeWindow: '',
  weekday: '',
};
const emptyContact: ContactForm = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  contactPref: 'Text message',
};

export function FunnelModal() {
  const {
    funnelOpen,
    closeFunnel,
    preselectedService,
    preselectedPlan,
  } = useModal();

  const [service, setService] = useState<FunnelService | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [property, setProperty] = useState<PropertyForm>(emptyProperty);
  const [schedule, setSchedule] = useState<ScheduleForm>(emptySchedule);
  const [contact, setContact] = useState<ContactForm>(emptyContact);
  const [submitted, setSubmitted] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Reset & apply preselection when opened
  useEffect(() => {
    if (!funnelOpen) return;
    setSubmitted(false);
    setRedirecting(false);
    setStep(0);
    setProperty(emptyProperty);
    setSchedule(emptySchedule);
    setContact(emptyContact);
    if (preselectedService) {
      setService(preselectedService);
      if (preselectedPlan) {
        setPlan(preselectedPlan);
        setStep(2); // skip past service + plan
      } else {
        setStep(1);
      }
    } else {
      setService(null);
      setPlan(null);
    }
  }, [funnelOpen, preselectedService, preselectedPlan]);

  // Min date = tomorrow
  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, [funnelOpen]); // recompute each open

  if (!funnelOpen) return null;

  const planList = service ? planData[service] : [];
  const schedQ =
    service === 'pressure'
      ? 'When is a good time for your free estimate?'
      : service === 'windows'
      ? 'When works best for your window cleaning estimate?'
      : 'When works best for your first visit?';

  const showPool = service === 'pool' || service === 'multiple';
  const showLawn = service === 'lawn';
  const showPressure = service === 'pressure';

  function selectService(s: FunnelService) {
    setService(s);
    setPlan(null);
    // Auto-select single-plan services for convenience
    const list = planData[s];
    if (list.length === 1) setPlan(list[0].id);
  }

  function next() {
    if (step === 0 && !service) return;
    if (step === 1 && !plan) return;
    if (step === TOTAL_STEPS - 1) {
      void doSubmit();
      return;
    }
    setStep((s) => s + 1);
  }

  function back() {
    if (step === 0) return;
    setStep((s) => s - 1);
  }

  async function doSubmit() {
    if (!service || !plan) return;
    const payload: FunnelSubmission = {
      service,
      plan,
      property: {
        address: property.address,
        city: property.city,
        notes: property.notes,
        ...(showPool && {
          poolSize: property.poolSize,
          poolType: property.poolType,
        }),
        ...(showLawn && { lawnSize: property.lawnSize }),
        ...(showPressure && { pressureArea: property.pressureArea }),
      },
      schedule,
      contact,
    };
    await submitFunnel(payload);

    // Generate a stable booking id so the "lead" and "paid" Zapier events
    // can be correlated by your Zap.
    const bookingId = newBookingId();

    // Fire the "lead" webhook to Zapier — captures every completed funnel,
    // even if the customer abandons checkout. Fire-and-forget; never blocks.
    void sendToZapier(buildZapierPayload(payload, 'lead', bookingId));

    // If the chosen plan has a hosted checkout URL (Square), persist the
    // booking + bookingId and send the customer to payment. Otherwise fall
    // back to the standard success screen.
    const selectedPlan: PricingPlan | undefined = planList.find(
      (p) => p.id === plan,
    );
    if (selectedPlan?.checkoutUrl) {
      // Stash the full submission so the ThankYou page can render a summary
      // once Square redirects the customer back to /?status=success.
      saveBooking(payload, bookingId);
      setRedirecting(true);
      // Brief pause so the "Redirecting..." state is readable before navigation.
      window.setTimeout(() => {
        window.location.href = selectedPlan.checkoutUrl!;
      }, 800);
      return;
    }

    setSubmitted(true);
  }

  function overlayClick(e: MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) closeFunnel();
  }

  const successMsg =
    service === 'pressure' ? (
      <>
        We've received your estimate request and will reach out within a few
        hours with a transparent quote for your pressure washing project.
        <br />
        <br />
        Welcome to Stable Services.
      </>
    ) : service === 'windows' ? (
      <>
        We've received your window cleaning estimate request and will be in
        touch within a few hours to discuss your project.
        <br />
        <br />
        Welcome to Stable Services.
      </>
    ) : (
      <>
        We've received your service request and will contact you within a few
        hours to confirm your first visit.
        <br />
        <br />
        Welcome to Stable Services.
      </>
    );

  const nextDisabled =
    (step === 0 && !service) || (step === 1 && !plan);

  // The Submit button label and the final-step "submit" text both depend on
  // whether the selected plan routes to a hosted checkout (Square) or just
  // submits a request.
  const selectedPlanObj = plan ? planList.find((p) => p.id === plan) : undefined;
  const hasCheckout = Boolean(selectedPlanObj?.checkoutUrl);
  const submitButtonLabel = hasCheckout
    ? 'Proceed to Payment →'
    : 'Submit Request →';

  return (
    <div className="ss-funnel-overlay open" onClick={overlayClick}>
      <div className="ss-funnel-modal">
        {redirecting ? (
          <div className="ss-funnel-success">
            <div className="ss-success-icon">→</div>
            <h3 className="ss-success-h3">
              Redirecting to <em>secure checkout…</em>
            </h3>
            <p className="ss-success-p">
              Hang tight, {contact.firstName || 'neighbor'} — we're sending
              you to our secure payment page to complete your booking.
            </p>
          </div>
        ) : submitted ? (
          <div className="ss-funnel-success">
            <div className="ss-success-icon">✓</div>
            <h3 className="ss-success-h3">
              You're all set,{' '}
              <em>{contact.firstName ? `${contact.firstName}!` : 'neighbor.'}</em>
            </h3>
            <p className="ss-success-p">{successMsg}</p>
            <button
              className="ss-btn-primary"
              style={{ marginTop: '2rem' }}
              onClick={closeFunnel}
            >
              Back to Site →
            </button>
          </div>
        ) : (
          <>
            <div className="ss-funnel-header">
              <div className="ss-funnel-title">
                Let's get <em>started.</em>
              </div>
              <button
                className="ss-funnel-close"
                onClick={closeFunnel}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="ss-funnel-body">
              <div className="ss-funnel-progress">
                {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                  <div
                    key={i}
                    className={`ss-funnel-dot ${
                      i < step ? 'done' : i === step ? 'active' : ''
                    }`}
                  />
                ))}
              </div>

              {step === 0 && (
                <div>
                  <div className="ss-f-step-label">Step 1 of 5</div>
                  <div className="ss-f-step-q">
                    What service are you looking for?
                  </div>
                  <div className="ss-f-options cols-2">
                    {funnelServiceOptions.map((opt) => {
                      const Icon = serviceIconMap[opt.key];
                      return (
                        <div
                          key={opt.key}
                          className={`ss-f-option ${
                            service === opt.key ? 'selected' : ''
                          }`}
                          onClick={() => selectService(opt.key)}
                        >
                          <div
                            className="ss-f-option-icon"
                            style={{ color: '#c9a84c' }}
                          >
                            <Icon width={20} height={20} />
                          </div>
                          <div>
                            <div className="ss-f-option-name">{opt.name}</div>
                            <div className="ss-f-option-desc">
                              {opt.description}
                            </div>
                            <div className="ss-f-option-price">
                              {opt.priceLabel}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 1 && service && (
                <div>
                  <div className="ss-f-step-label">Step 2 of 5</div>
                  <div className="ss-f-step-q">
                    {service === 'pressure'
                      ? 'Tell us about your pressure washing project.'
                      : service === 'multiple'
                      ? 'Which services do you need?'
                      : 'Which plan fits your needs?'}
                  </div>
                  <div className="ss-f-plan-grid">
                    {planList.map((p) => (
                      <div
                        key={p.id}
                        className={`ss-f-plan-option ${
                          plan === p.id ? 'selected' : ''
                        }`}
                        onClick={() => setPlan(p.id)}
                      >
                        <div>
                          <div className="ss-f-plan-name">{p.name}</div>
                          <div className="ss-f-plan-features">
                            {p.funnelBlurb}
                          </div>
                        </div>
                        <div className="ss-f-plan-price">{p.fromPrice}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <div className="ss-f-step-label">Step 3 of 5</div>
                  <div className="ss-f-step-q">
                    Tell us about your property.
                  </div>
                  <div className="ss-f-fields">
                    <div className="ss-f-row">
                      <div className="ss-f-field">
                        <label htmlFor="f-address">Property Address</label>
                        <input
                          id="f-address"
                          type="text"
                          placeholder="1234 E Camelback Rd"
                          value={property.address}
                          onChange={(e) =>
                            setProperty((s) => ({
                              ...s,
                              address: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="ss-f-field">
                        <label htmlFor="f-city">City / Neighborhood</label>
                        <input
                          id="f-city"
                          type="text"
                          placeholder="Scottsdale"
                          value={property.city}
                          onChange={(e) =>
                            setProperty((s) => ({
                              ...s,
                              city: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    {showPool && (
                      <>
                        <div className="ss-f-field">
                          <label htmlFor="f-poolsize">
                            Approximate Pool Size
                          </label>
                          <select
                            id="f-poolsize"
                            value={property.poolSize}
                            onChange={(e) =>
                              setProperty((s) => ({
                                ...s,
                                poolSize: e.target.value,
                              }))
                            }
                          >
                            <option value="">Select size</option>
                            {poolSizeOptions.map((o) => (
                              <option key={o}>{o}</option>
                            ))}
                          </select>
                        </div>
                        <div className="ss-f-field">
                          <label htmlFor="f-pooltype">Pool Type</label>
                          <select
                            id="f-pooltype"
                            value={property.poolType}
                            onChange={(e) =>
                              setProperty((s) => ({
                                ...s,
                                poolType: e.target.value,
                              }))
                            }
                          >
                            <option value="">Select type</option>
                            {poolTypeOptions.map((o) => (
                              <option key={o}>{o}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}

                    {showLawn && (
                      <div className="ss-f-field">
                        <label htmlFor="f-lawnsize">
                          Approximate Lawn Size
                        </label>
                        <select
                          id="f-lawnsize"
                          value={property.lawnSize}
                          onChange={(e) =>
                            setProperty((s) => ({
                              ...s,
                              lawnSize: e.target.value,
                            }))
                          }
                        >
                          <option value="">Select size</option>
                          {lawnSizeOptions.map((o) => (
                            <option key={o}>{o}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {showPressure && (
                      <div className="ss-f-field">
                        <label htmlFor="f-pressurearea">
                          What needs to be pressure washed?
                        </label>
                        <select
                          id="f-pressurearea"
                          value={property.pressureArea}
                          onChange={(e) =>
                            setProperty((s) => ({
                              ...s,
                              pressureArea: e.target.value,
                            }))
                          }
                        >
                          <option value="">Select area</option>
                          {pressureAreaOptions.map((o) => (
                            <option key={o}>{o}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="ss-f-field">
                      <label htmlFor="f-notes">
                        Any notes or special requests?
                      </label>
                      <textarea
                        id="f-notes"
                        placeholder="e.g. gate code, dog in yard, specific concerns..."
                        value={property.notes}
                        onChange={(e) =>
                          setProperty((s) => ({
                            ...s,
                            notes: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <div className="ss-f-step-label">Step 4 of 5</div>
                  <div className="ss-f-step-q">{schedQ}</div>
                  <div className="ss-f-fields">
                    <div className="ss-f-schedule-grid">
                      <div className="ss-f-field">
                        <label htmlFor="f-date">Preferred Date</label>
                        <input
                          id="f-date"
                          type="date"
                          min={minDate}
                          value={schedule.date}
                          onChange={(e) =>
                            setSchedule((s) => ({
                              ...s,
                              date: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="ss-f-field">
                        <label htmlFor="f-time">Preferred Time Window</label>
                        <select
                          id="f-time"
                          value={schedule.timeWindow}
                          onChange={(e) =>
                            setSchedule((s) => ({
                              ...s,
                              timeWindow: e.target.value,
                            }))
                          }
                        >
                          <option value="">Select window</option>
                          {timeWindowOptions.map((o) => (
                            <option key={o}>{o}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="ss-f-field">
                      <label htmlFor="f-weekday">
                        Preferred Service Day (weekly)
                      </label>
                      <select
                        id="f-weekday"
                        value={schedule.weekday}
                        onChange={(e) =>
                          setSchedule((s) => ({
                            ...s,
                            weekday: e.target.value,
                          }))
                        }
                      >
                        <option value="">Select day</option>
                        {weekdayOptions.map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                    <div
                      style={{
                        background: 'rgba(201,168,76,.07)',
                        border: '.5px solid rgba(201,168,76,.18)',
                        borderRadius: 2,
                        padding: '1rem 1.1rem',
                        fontSize: '.8rem',
                        color: '#8b95a7',
                        lineHeight: 1.6,
                      }}
                    >
                      <span style={{ color: '#c9a84c', fontWeight: 500 }}>
                        Note:
                      </span>{' '}
                      We'll confirm your appointment within a few hours by
                      phone or text and lock in your recurring weekly day.
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div>
                  <div className="ss-f-step-label">Step 5 of 5</div>
                  <div className="ss-f-step-q">How do we reach you?</div>
                  <div className="ss-f-fields">
                    <div className="ss-f-row">
                      <div className="ss-f-field">
                        <label htmlFor="f-fname">First Name</label>
                        <input
                          id="f-fname"
                          type="text"
                          placeholder="Jane"
                          value={contact.firstName}
                          onChange={(e) =>
                            setContact((c) => ({
                              ...c,
                              firstName: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="ss-f-field">
                        <label htmlFor="f-lname">Last Name</label>
                        <input
                          id="f-lname"
                          type="text"
                          placeholder="Doe"
                          value={contact.lastName}
                          onChange={(e) =>
                            setContact((c) => ({
                              ...c,
                              lastName: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="ss-f-field">
                      <label htmlFor="f-phone">Phone Number</label>
                      <input
                        id="f-phone"
                        type="tel"
                        placeholder="(480) 555-0100"
                        value={contact.phone}
                        onChange={(e) =>
                          setContact((c) => ({ ...c, phone: e.target.value }))
                        }
                      />
                    </div>
                    <div className="ss-f-field">
                      <label htmlFor="f-email">Email Address</label>
                      <input
                        id="f-email"
                        type="email"
                        placeholder="hello@email.com"
                        value={contact.email}
                        onChange={(e) =>
                          setContact((c) => ({ ...c, email: e.target.value }))
                        }
                      />
                    </div>
                    <div className="ss-f-field">
                      <label htmlFor="f-contact-pref">Best contact method</label>
                      <select
                        id="f-contact-pref"
                        value={contact.contactPref}
                        onChange={(e) =>
                          setContact((c) => ({
                            ...c,
                            contactPref: e.target.value,
                          }))
                        }
                      >
                        {contactPrefOptions.map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                    <div
                      style={{
                        fontSize: '.72rem',
                        color: '#8b95a7',
                        lineHeight: 1.6,
                        marginTop: '.25rem',
                      }}
                    >
                      By submitting, you agree to be contacted by Stable
                      Services regarding your service request. No spam — ever.
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="ss-funnel-footer">
              <button
                className="ss-f-btn-back"
                onClick={back}
                style={{ visibility: step === 0 ? 'hidden' : 'visible' }}
              >
                ← Back
              </button>
              <span className="ss-f-step-counter">
                Step {step + 1} of {TOTAL_STEPS}
              </span>
              <button
                className="ss-f-btn-next"
                onClick={next}
                disabled={nextDisabled}
              >
                {step === TOTAL_STEPS - 1 ? submitButtonLabel : 'Continue →'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
