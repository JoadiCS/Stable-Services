import { useModal } from '@/context/ModalContext';
import { heroOffer } from '@/data/heroOffer';
import { useSiteContent } from '@/lib/siteContent';

/**
 * Thin gold strip pinned above the nav to reinforce the current promo.
 * Banner copy + on/off state lives in /config/site (admin-editable via
 * /admin/settings/site-content). Falls back to heroOffer.ts defaults when
 * the doc is missing.
 */
export function PromoBanner() {
  const { openFunnel } = useModal();
  const site = useSiteContent();
  if (!site.bannerActive) return null;

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
      aria-label={`${site.bannerText} ${site.bannerCtaLabel}`}
    >
      <span className="ss-promo-banner-text">{site.bannerText}</span>
      <span className="ss-promo-banner-cta">{site.bannerCtaLabel}</span>
    </button>
  );
}
