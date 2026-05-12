import { useScrolled } from '@/hooks/useScrolled';
import { useModal } from '@/context/ModalContext';
import { siteConfig } from '@/data/siteConfig';

export function Nav() {
  const scrolled = useScrolled(60);
  const { openFunnel } = useModal();

  return (
    <nav id="nav" className={`ss-nav ${scrolled ? 'scrolled' : ''}`}>
      <a href="#" className="ss-nav-logo">
        <div className="ss-logo-mark">SS</div>
        <span className="ss-logo-text">{siteConfig.company.name}</span>
      </a>
      <ul className="ss-nav-links">
        <li>
          <a href="#services">Services</a>
        </li>
        <li>
          <a href="#process">How It Works</a>
        </li>
        <li>
          <a href="#reviews">Reviews</a>
        </li>
        <li>
          <a href="#coverage">Coverage</a>
        </li>
        <li>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              openFunnel();
            }}
            className="ss-nav-cta"
          >
            Get Started
          </a>
        </li>
      </ul>
    </nav>
  );
}
