import { FadeIn } from './FadeIn';
import { whyItems } from '@/data/whyItems';
import { whyIconMap } from './Icons';

export function Why() {
  return (
    <section className="ss-section ss-why" id="why">
      <FadeIn>
        <div className="ss-section-label">
          <div className="ss-section-label-line" />
          <span>Why Stable Services</span>
        </div>
        <h2 className="ss-section-h2">
          The standard others
          <br />
          <em>aspire to.</em>
        </h2>
      </FadeIn>
      <FadeIn>
        <div className="ss-why-layout">
          <div className="ss-why-photo-left">
            <img src="/img/why-photo.png" alt="Arizona luxury estate property" />
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '1.5rem',
                zIndex: 2,
                borderTop: '1px solid rgba(201,168,76,.2)',
                background: 'rgba(10,15,30,.78)',
                backdropFilter: 'blur(6px)',
              }}
            >
              <span
                style={{
                  fontFamily: 'Cormorant Garamond, Georgia, serif',
                  fontSize: '2.2rem',
                  fontWeight: 300,
                  color: '#e8c97a',
                  display: 'block',
                  lineHeight: 1,
                }}
              >
                5.0 ★
              </span>
              <span
                style={{
                  fontSize: '.68rem',
                  letterSpacing: '.1em',
                  textTransform: 'uppercase',
                  color: '#8b95a7',
                }}
              >
                Average rating across all services
              </span>
            </div>
          </div>
          <div className="ss-why-grid">
            {whyItems.map((item) => {
              const Icon = whyIconMap[item.icon];
              return (
                <div key={item.title} className="ss-why-item">
                  <div className="ss-why-item-icon" style={{ color: '#c9a84c' }}>
                    <Icon width={18} height={18} />
                  </div>
                  <div className="ss-why-item-title">{item.title}</div>
                  <p className="ss-why-item-text">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </FadeIn>
    </section>
  );
}
