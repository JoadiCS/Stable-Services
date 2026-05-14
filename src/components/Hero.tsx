import { useModal } from '@/context/ModalContext';
import { HeroOffer } from './HeroOffer';

export function Hero() {
  const { openFunnel } = useModal();

  return (
    <section className="ss-hero" id="home">
      {/* Cinematic Scottsdale aerial loop — full-bleed background.
          Mobile gets a lighter 720p file via the media query; desktop gets full 1080p. */}
      <video
        className="ss-hero-bg-video"
        autoPlay
        muted
        loop
        playsInline
        poster="/img/scottsdale-hero-poster.jpg"
        preload="metadata"
        aria-hidden="true"
      >
        <source
          src="/video/scottsdale-hero-mobile.mp4"
          type="video/mp4"
          media="(max-width: 960px)"
        />
        <source src="/video/scottsdale-hero.mp4" type="video/mp4" />
      </video>
      {/* Layered overlays — darken left for text readability, fade bottom to navy */}
      <div className="ss-hero-bg-overlay" aria-hidden="true" />

      <div className="ss-hero-left">
        <div className="ss-hero-eyebrow">
          <div className="ss-hero-eyebrow-line" />
          <span>Arizona's #1 Leading Residential &amp; Commercial Service Provider</span>
        </div>
        <h1 className="ss-hero-h1">
          Your All in One
          <br />
          <em>Residential &amp;</em>
          <br />
          <em>Commercial</em>
          <br />
          Service Provider
        </h1>
        <p className="ss-hero-sub">
          You set the standard. <em>We exceed it.</em>
        </p>
        <div className="ss-hero-actions">
          <button className="ss-btn-primary" onClick={() => openFunnel()}>
            Schedule Your First Service
          </button>
          <button
            className="ss-btn-ghost"
            onClick={() =>
              document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })
            }
          >
            View Plans →
          </button>
        </div>
        <div className="ss-hero-stats">
          <div>
            <span className="ss-hero-stat-num">48hr</span>
            <span className="ss-hero-stat-label">First Service Turnaround</span>
          </div>
          <div>
            <span className="ss-hero-stat-num">AZ</span>
            <span className="ss-hero-stat-label">Licensed &amp; Insured</span>
          </div>
          <div>
            <span className="ss-hero-stat-num">5★</span>
            <span className="ss-hero-stat-label">Rated Service</span>
          </div>
        </div>
      </div>
      <HeroOffer />
    </section>
  );
}
