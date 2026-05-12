import { useModal } from '@/context/ModalContext';
import { siteConfig } from '@/data/siteConfig';

export function CTA() {
  const { openFunnel } = useModal();
  return (
    <section className="ss-cta-section" id="contact">
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: "url('/img/cta-bg.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
          opacity: 0.35,
        }}
      />
      <div className="ss-cta-eyebrow">Ready to get started?</div>
      <h2 className="ss-cta-h2">
        Schedule your
        <br />
        first service today.
      </h2>
      <p className="ss-cta-sub">
        Serving homeowners and businesses across the entire Phoenix Metro. No
        long-term contracts. Just consistent, professional service — done
        right every time.
      </p>
      <div className="ss-cta-actions">
        <button className="ss-btn-cta-dark" onClick={() => openFunnel()}>
          Book Online Now
        </button>
        <a href={`tel:${siteConfig.contact.phoneE164}`} className="ss-btn-cta-outline">
          📞 {siteConfig.contact.phoneDisplay}
        </a>
      </div>
    </section>
  );
}
