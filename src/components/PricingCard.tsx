import type { CSSProperties } from 'react';
import type { PricingPlan } from '@/data/plans';
import { useModal } from '@/context/ModalContext';
import type { FunnelService } from '@/context/ModalContext';

interface PricingCardProps {
  plan: PricingPlan;
  service: FunnelService;
  /** Inline style override (e.g. align-self start) */
  style?: CSSProperties;
}

export function PricingCard({ plan, service, style }: PricingCardProps) {
  const { openFunnel } = useModal();
  return (
    <div
      className={`ss-pricing-card ${plan.featured ? 'featured' : ''}`}
      style={style}
    >
      {plan.badge && <div className="ss-pricing-badge">{plan.badge}</div>}
      <div className="ss-pricing-tier">{plan.tier}</div>
      <div className="ss-pricing-name">
        {plan.name}
        {plan.nameSuffix && (
          <span style={{ color: '#c9a84c' }}>{plan.nameSuffix}</span>
        )}
      </div>
      <div className="ss-pricing-price">
        <span className="ss-pricing-dollar">{plan.dollar}</span>
        <span className="ss-pricing-amount">{plan.amount}</span>
        <span className="ss-pricing-period">{plan.period}</span>
      </div>
      <p className="ss-pricing-desc">{plan.description}</p>
      <div className="ss-pricing-divider" />
      <ul className="ss-pricing-features">
        {plan.features.map((f) => (
          <li key={f} className="ss-pricing-feature">
            <span className="ss-pricing-check">✦</span>
            {f}
          </li>
        ))}
      </ul>
      <button
        className="ss-btn-pricing"
        onClick={() => openFunnel({ service, plan: plan.id })}
      >
        {plan.ctaLabel}
      </button>
    </div>
  );
}
