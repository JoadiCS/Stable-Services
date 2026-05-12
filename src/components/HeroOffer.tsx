import { useModal } from '@/context/ModalContext';
import { heroOffer } from '@/data/heroOffer';

/**
 * Hero-right "competitive offer" card. Replaces the original video panel
 * to drive conversion. Copy lives in `src/data/heroOffer.ts` so this
 * component never has to change to refresh the offer.
 */
export function HeroOffer() {
  const { openFunnel } = useModal();
  const offer = heroOffer;

  return (
    <div className="ss-hero-right ss-hero-offer-wrap">
      {/* Offer card — the video now lives on the parent <section> */}
      <div className="ss-hero-offer-card">
        <div className="ss-hero-offer-trust">
          <div className="ss-hero-offer-trust-row">
            <span className="ss-hero-offer-trust-line ss-hero-offer-trust-line-left" />
            <span className="ss-hero-offer-trust-stars">
              {offer.trustStars}
            </span>
            <span className="ss-hero-offer-trust-rating">
              {offer.trustRating}
            </span>
            <span className="ss-hero-offer-trust-line ss-hero-offer-trust-line-right" />
          </div>
          <div className="ss-hero-offer-trust-text">{offer.trustText}</div>
        </div>

        <div className="ss-hero-offer-eyebrow">
          <span className="ss-hero-offer-dot" />
          {offer.eyebrow}
        </div>

        <h2 className="ss-hero-offer-headline">
          {offer.headlineLead}{' '}
          <em>{offer.headlineAccent}</em>
          {offer.headlineTrail ? <> {offer.headlineTrail}</> : null}
        </h2>

        <p className="ss-hero-offer-sub">{offer.subhead}</p>

        {/* Waived fees breakdown — shows exactly what's being waived */}
        <div className="ss-hero-offer-savings">
          {offer.waivedFees.map((fee) => (
            <div key={fee.label} className="ss-hero-offer-savings-row">
              <span className="ss-hero-offer-savings-x">✗</span>
              <span className="ss-hero-offer-savings-label">{fee.label}</span>
              <span className="ss-hero-offer-savings-amount">{fee.amount}</span>
              <span className="ss-hero-offer-savings-tag">WAIVED</span>
            </div>
          ))}
        </div>

        {/* Final price block — the punchline */}
        <div className="ss-hero-offer-final">
          {offer.finalPriceLabel && (
            <span className="ss-hero-offer-final-label">
              {offer.finalPriceLabel}
            </span>
          )}
          <div className="ss-hero-offer-final-row">
            <span className="ss-hero-offer-final-amount">
              {offer.finalPriceAmount}
            </span>
            <span className="ss-hero-offer-final-period">
              {offer.finalPricePeriod}
            </span>
          </div>
          {offer.finalPriceCaption && (
            <span className="ss-hero-offer-final-caption">
              {offer.finalPriceCaption}
            </span>
          )}
        </div>

        <ul className="ss-hero-offer-bullets">
          {offer.bullets.map((b, i) => (
            <li key={i} className="ss-hero-offer-bullet">
              <span className="ss-hero-offer-check">✦</span>
              <span>
                {b.accent && (
                  <span className="ss-hero-offer-bullet-accent">
                    {b.accent}
                  </span>
                )}
                {b.accent && b.text ? ' ' : ''}
                {b.text}
              </span>
            </li>
          ))}
        </ul>

        <button
          className="ss-hero-offer-cta"
          onClick={() =>
            openFunnel({
              service: offer.ctaService,
              plan: offer.ctaPlan,
            })
          }
        >
          {offer.ctaLabel}
        </button>

        <p className="ss-hero-offer-fine">{offer.finePrint}</p>
      </div>
    </div>
  );
}
