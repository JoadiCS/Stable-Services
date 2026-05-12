import { useModal } from '@/context/ModalContext';
import { heroOffer } from '@/data/heroOffer';

/**
 * Thin gold strip pinned above the nav to reinforce the current promo.
 * To hide it (e.g. when the promo expires), flip `bannerActive` to false
 * in `src/data/heroOffer.ts`.
 */
export function PromoBanner() {
  const { openFunnel } = useModal();
  if (!heroOffer.bannerActive) return null;

  return (
    <button
      type="button"
      className="ss-promo-banner"
      onClick={() =>
        openFunnel({
          service: heroOffer.ctaService,
          plan: heroOffer.ctaPlan,
        })
      }
      aria-label={`${heroOffer.bannerText} ${heroOffer.bannerCtaLabel}`}
    >
      <span className="ss-promo-banner-text">{heroOffer.bannerText}</span>
      <span className="ss-promo-banner-cta">{heroOffer.bannerCtaLabel}</span>
    </button>
  );
}
