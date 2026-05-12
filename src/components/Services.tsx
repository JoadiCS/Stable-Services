import { FadeIn } from './FadeIn';
import { PricingCard } from './PricingCard';
import { useModal } from '@/context/ModalContext';
import { useServices } from '@/context/ServicesContext';
import { poolPlans, lawnPlans } from '@/data/plans';
import {
  serviceTabs,
  pressureProjects,
  windowProjects,
} from '@/data/services';
import {
  repairCategories,
  repairsTrustItems,
} from '@/data/repairCategories';
import { repairIconMap, IconPool, IconWindow } from './Icons';
import { CommercialPanel } from './CommercialPanel';

export function Services() {
  const { openFunnel } = useModal();
  const { segment, setSegment, activeTab, setActiveTab } = useServices();

  return (
    <section className="ss-section ss-service-tabs" id="services">
      <FadeIn>
        <div className="ss-section-label">
          <div className="ss-section-label-line" />
          <span>Our Services</span>
        </div>
        <h2 className="ss-section-h2">
          Premium plans for every
          <br />
          <em>corner of your property.</em>
        </h2>
        <div className="ss-seg-toggle">
          <button
            className={`ss-seg-btn ${segment === 'residential' ? 'active' : ''}`}
            onClick={() => setSegment('residential')}
          >
            Residential
          </button>
          <button
            className={`ss-seg-btn ${segment === 'commercial' ? 'active' : ''}`}
            onClick={() => setSegment('commercial')}
          >
            Commercial
          </button>
        </div>
      </FadeIn>

      {segment === 'residential' && (
        <div id="seg-residential">
          <FadeIn>
            <div className="ss-tabs-nav" style={{ marginTop: '2.5rem' }}>
              {serviceTabs.map((tab) => (
                <button
                  key={tab.key}
                  className={`ss-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </FadeIn>

          {activeTab === 'pool' && (
            <FadeIn>
              <div className="ss-pricing-grid cols-3">
                {poolPlans.map((p) => (
                  <PricingCard key={p.id} plan={p} service="pool" />
                ))}
              </div>
            </FadeIn>
          )}

          {activeTab === 'lawn' && (
            <FadeIn>
              <div className="ss-pricing-grid cols-2">
                {lawnPlans.map((p) => (
                  <PricingCard
                    key={p.id}
                    plan={p}
                    service="lawn"
                    style={{ alignSelf: 'start' }}
                  />
                ))}
                <div className="ss-quote-card" style={{ alignSelf: 'start' }}>
                  <div className="ss-quote-card-icon" style={{ color: '#c9a84c' }}>
                    <IconPool width={22} height={22} />
                  </div>
                  <div
                    className="ss-pricing-tier"
                    style={{ marginBottom: '.5rem' }}
                  >
                    Custom Add-Ons
                  </div>
                  <div className="ss-quote-card-title">Need More?</div>
                  <p className="ss-quote-card-desc">
                    Fertilization, flower bed maintenance, irrigation checks,
                    and more available as add-on services.
                  </p>
                  <button
                    className="ss-btn-pricing"
                    style={{
                      width: 'auto',
                      padding: '.75rem 1.75rem',
                      marginTop: '.5rem',
                    }}
                    onClick={() => openFunnel({ service: 'lawn' })}
                  >
                    Request a Quote →
                  </button>
                </div>
              </div>
            </FadeIn>
          )}

          {activeTab === 'pressure' && (
            <FadeIn>
              <div className="ss-pricing-grid cols-2">
                <div
                  className="ss-quote-card"
                  style={{ padding: '3rem 2.5rem' }}
                >
                  <div
                    className="ss-quote-card-icon"
                    style={{ width: 60, height: 60, color: '#c9a84c' }}
                  >
                    <svg
                      width={26}
                      height={26}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <div
                    className="ss-pricing-tier"
                    style={{ margin: '.5rem 0 .25rem' }}
                  >
                    Custom Pricing
                  </div>
                  <div
                    className="ss-quote-card-title"
                    style={{ fontSize: '2rem' }}
                  >
                    Pressure Washing
                  </div>
                  <p
                    className="ss-quote-card-desc"
                    style={{ maxWidth: 320, textAlign: 'center' }}
                  >
                    Every project is different. We provide fast, transparent
                    estimates for driveways, pool decks, patios, home
                    exteriors, and more.
                  </p>
                  <button
                    className="ss-btn-primary"
                    style={{ marginTop: '1rem' }}
                    onClick={() => openFunnel({ service: 'pressure' })}
                  >
                    Request a Free Estimate →
                  </button>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                  }}
                >
                  <div
                    style={{
                      fontSize: '.7rem',
                      letterSpacing: '.18em',
                      textTransform: 'uppercase',
                      color: '#c9a84c',
                      marginBottom: '.25rem',
                    }}
                  >
                    Common Projects
                  </div>
                  {pressureProjects.map((p) => (
                    <div
                      key={p}
                      className="ss-project-row"
                      onClick={() => openFunnel({ service: 'pressure' })}
                    >
                      <span>{p}</span>
                      <span className="ss-project-cta">Get Estimate →</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          )}

          {activeTab === 'windows' && (
            <FadeIn>
              <div className="ss-pricing-grid cols-2">
                <div
                  className="ss-quote-card"
                  style={{ padding: '3rem 2.5rem' }}
                >
                  <div
                    className="ss-quote-card-icon"
                    style={{ width: 60, height: 60, color: '#c9a84c' }}
                  >
                    <IconWindow width={26} height={26} />
                  </div>
                  <div
                    className="ss-pricing-tier"
                    style={{ margin: '.5rem 0 .25rem' }}
                  >
                    Custom Pricing
                  </div>
                  <div
                    className="ss-quote-card-title"
                    style={{ fontSize: '2rem' }}
                  >
                    Window Cleaning
                  </div>
                  <p
                    className="ss-quote-card-desc"
                    style={{ maxWidth: 320, textAlign: 'center' }}
                  >
                    Crystal-clear results on every pane. We quote based on
                    window count, access complexity, and property size.
                  </p>
                  <button
                    className="ss-btn-primary"
                    style={{ marginTop: '1rem' }}
                    onClick={() => openFunnel({ service: 'windows' })}
                  >
                    Request a Free Estimate →
                  </button>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                  }}
                >
                  <div
                    style={{
                      fontSize: '.7rem',
                      letterSpacing: '.18em',
                      textTransform: 'uppercase',
                      color: '#c9a84c',
                      marginBottom: '.25rem',
                    }}
                  >
                    Common Projects
                  </div>
                  {windowProjects.map((p) => (
                    <div
                      key={p}
                      className="ss-project-row"
                      onClick={() => openFunnel({ service: 'windows' })}
                    >
                      <span>{p}</span>
                      <span className="ss-project-cta">Get Estimate →</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          )}

          {activeTab === 'repairs' && <RepairsTab />}
        </div>
      )}

      {segment === 'commercial' && <CommercialPanel />}
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Repairs tab — extracted for clarity
   ───────────────────────────────────────────────────────────────────────── */
function RepairsTab() {
  const { openRepair } = useModal();
  return (
    <>
      <FadeIn>
        <div className="ss-repairs-intro">
          <div>
            <div
              className="ss-section-label"
              style={{ marginBottom: '.75rem' }}
            >
              <div className="ss-section-label-line" />
              <span>Stable Repairs &amp; Upgrades</span>
            </div>
            <h3 className="ss-repairs-h3">
              Every repair.
              <br />
              <em>One company.</em>
            </h3>
            <p className="ss-repairs-sub">
              From a leaking faucet to a full AC replacement — Stable Services
              handles it. Our team covers the full spectrum of home and
              commercial repair, maintenance, and upgrade work so you never
              have to search for someone you can trust. Submit a request and
              we'll take it from there.
            </p>
          </div>
          <div className="ss-repairs-trust-bar">
            {repairsTrustItems.map((t) => (
              <div key={t.label} className="ss-trust-item">
                <span className="ss-trust-num">{t.num}</span>
                <span className="ss-trust-label">{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>

      <FadeIn>
        <div className="ss-repair-cat-label">
          Select a category to request service
        </div>
        <div className="ss-repair-cat-grid">
          {repairCategories.map((cat) => {
            const Icon = repairIconMap[cat.icon];
            return (
              <div
                key={cat.id}
                className={`ss-repair-cat ${cat.isOther ? 'ss-repair-cat-other' : ''}`}
                onClick={() => openRepair(cat.label)}
              >
                <div
                  className="ss-repair-cat-icon"
                  style={{ color: '#c9a84c' }}
                >
                  <Icon width={22} height={22} />
                </div>
                <div className="ss-repair-cat-name">{cat.name}</div>
                <div className="ss-repair-cat-desc">{cat.description}</div>
                <span className="ss-repair-cat-cta">{cat.cta}</span>
              </div>
            );
          })}
        </div>
      </FadeIn>
    </>
  );
}
