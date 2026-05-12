import { FadeIn } from './FadeIn';
import { processSteps } from '@/data/processSteps';

export function Process() {
  return (
    <section className="ss-section ss-process" id="process">
      <FadeIn>
        <div className="ss-section-label">
          <div className="ss-section-label-line" />
          <span>How It Works</span>
        </div>
        <h2 className="ss-section-h2">
          From request to service
          <br />
          <em>in under 48 hours.</em>
        </h2>
      </FadeIn>
      <FadeIn>
        <div className="ss-process-steps">
          {processSteps.map((s) => (
            <div key={s.num} className="ss-process-step">
              <div className="ss-process-num">{s.num}</div>
              <div className="ss-process-title">{s.title}</div>
              <p className="ss-process-text">{s.text}</p>
            </div>
          ))}
        </div>
      </FadeIn>
    </section>
  );
}
