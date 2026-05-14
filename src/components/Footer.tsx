import { Link } from 'react-router-dom';
import { useModal } from '@/context/ModalContext';
import { useServices } from '@/context/ServicesContext';
import { useAuthUser } from '@/lib/auth';
import { siteConfig } from '@/data/siteConfig';

export function Footer() {
  const { openFunnel } = useModal();
  const { goToTab } = useServices();
  const { user } = useAuthUser();
  const loggedIn = !!user;
  const clientLinkTo = loggedIn ? '/portal/dashboard' : '/portal/login';
  const clientLinkLabel = loggedIn ? 'My Account' : 'Client Login';

  return (
    <footer className="ss-footer">
      <div className="ss-footer-top">
        <div className="ss-footer-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
            <div
              className="ss-logo-mark"
              style={{ width: 30, height: 30, fontSize: 13 }}
            >
              SS
            </div>
            <span
              style={{
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontSize: '1.1rem',
                letterSpacing: '.08em',
                textTransform: 'uppercase',
              }}
            >
              {siteConfig.company.name}
            </span>
          </div>
          <p>{siteConfig.company.description}</p>
        </div>
        <div>
          <div className="ss-footer-col-title">Pool Services</div>
          <ul className="ss-footer-links">
            <li>
              <a
                href="#services"
                onClick={(e) => {
                  e.preventDefault();
                  goToTab('pool');
                }}
              >
                Stable Essential — $109.99/mo
              </a>
            </li>
            <li>
              <a
                href="#services"
                onClick={(e) => {
                  e.preventDefault();
                  goToTab('pool');
                }}
              >
                Stable Standard — $139.99/mo
              </a>
            </li>
            <li>
              <a
                href="#services"
                onClick={(e) => {
                  e.preventDefault();
                  goToTab('pool');
                }}
              >
                Stable+ — $229.99/mo
              </a>
            </li>
          </ul>
        </div>
        <div>
          <div className="ss-footer-col-title">Other Services</div>
          <ul className="ss-footer-links">
            <li>
              <a
                href="#services"
                onClick={(e) => {
                  e.preventDefault();
                  goToTab('lawn');
                }}
              >
                Lawn Care — $179.99/mo
              </a>
            </li>
            <li>
              <a
                href="#services"
                onClick={(e) => {
                  e.preventDefault();
                  goToTab('pressure');
                }}
              >
                Pressure Washing — Get Estimate
              </a>
            </li>
            <li>
              <a
                href="#services"
                onClick={(e) => {
                  e.preventDefault();
                  goToTab('windows');
                }}
              >
                Window Cleaning — Get Estimate
              </a>
            </li>
            <li>
              <a href="#why">Why Stable Services</a>
            </li>
            <li>
              <a href="#reviews">Client Reviews</a>
            </li>
          </ul>
        </div>
        <div>
          <div className="ss-footer-col-title">Contact</div>
          <ul className="ss-footer-links">
            <li>
              <a href={`tel:${siteConfig.contact.phoneE164}`}>
                {siteConfig.contact.phoneDisplay}
              </a>
            </li>
            <li>
              <a href={`mailto:${siteConfig.contact.email}`}>
                {siteConfig.contact.email}
              </a>
            </li>
            <li>
              <a href="#">{siteConfig.contact.cityLabel}</a>
            </li>
            <li>
              <Link to={clientLinkTo}>{clientLinkLabel}</Link>
            </li>
            <li>
              <Link to="/tech/login" style={{ color: '#8b95a7', fontSize: '0.85em' }}>
                Tech Login
              </Link>
            </li>
            <li style={{ marginTop: '.75rem' }}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  openFunnel();
                }}
                style={{ color: '#c9a84c' }}
              >
                → Book Online
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="ss-footer-bottom">
        <span>
          © {siteConfig.legal.copyrightYear} {siteConfig.company.legalName}. All
          Rights Reserved.
        </span>
        <div className="ss-footer-legal">
          <a href={siteConfig.legal.privacyUrl}>Privacy Policy</a>
          <a href={siteConfig.legal.termsUrl}>Terms of Service</a>
          {siteConfig.legal.license && (
            <a href="#">{siteConfig.legal.license}</a>
          )}
        </div>
      </div>
    </footer>
  );
}
