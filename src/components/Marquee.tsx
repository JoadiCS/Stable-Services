import { marqueePhrases } from '@/data/marquee';

export function Marquee() {
  // Duplicate the array for a seamless loop (matches the original HTML).
  const items = [...marqueePhrases, ...marqueePhrases];
  return (
    <div className="ss-marquee-bar" aria-hidden="true">
      <div className="ss-marquee-inner">
        {items.map((phrase, i) => (
          <span key={`${phrase}-${i}`} className="ss-marquee-item">
            <span className="ss-marquee-dot" />
            {phrase}
          </span>
        ))}
      </div>
    </div>
  );
}
