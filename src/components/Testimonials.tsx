import { FadeIn } from './FadeIn';
import { testimonials } from '@/data/testimonials';

export function Testimonials() {
  // Duplicate for seamless marquee.
  const items = [...testimonials, ...testimonials];
  return (
    <section className="ss-section ss-testimonials" id="reviews">
      <FadeIn>
        <div className="ss-section-label">
          <div className="ss-section-label-line" />
          <span>Client Reviews</span>
        </div>
        <h2 className="ss-section-h2">
          What Our Customers
          <br />
          <em>Are Saying.</em>
        </h2>
      </FadeIn>
      <div className="ss-testimonial-scroll-wrap">
        <div className="ss-testimonial-track">
          {items.map((t, i) => (
            <div key={`${t.name}-${i}`} className="ss-testimonial-card">
              <div className="ss-testimonial-stars">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <span key={idx} className="ss-star">
                    ★
                  </span>
                ))}
              </div>
              <p className="ss-testimonial-text">"{t.quote}"</p>
              <div className="ss-testimonial-author">
                <div className="ss-author-avatar">{t.initials}</div>
                <div>
                  <div className="ss-author-name">{t.name}</div>
                  <div className="ss-author-location">{t.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
