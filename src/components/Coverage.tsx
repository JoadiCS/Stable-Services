import { FadeIn } from './FadeIn';
import { coverageAreas } from '@/data/coverage';

export function Coverage() {
  return (
    <section className="ss-section ss-coverage" id="coverage">
      <FadeIn>
        <div className="ss-section-label">
          <div className="ss-section-label-line" />
          <span>Service Area</span>
        </div>
        <h2 className="ss-section-h2">
          Serving the <em>entire</em>
          <br />
          Phoenix Metro.
        </h2>
      </FadeIn>
      <FadeIn>
        <div className="ss-coverage-grid">
          {coverageAreas.map((c) => (
            <div key={c.city} className="ss-coverage-pill">
              {c.city}
              <span>{c.label}</span>
            </div>
          ))}
        </div>
      </FadeIn>
    </section>
  );
}
