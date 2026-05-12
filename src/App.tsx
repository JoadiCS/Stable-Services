import { Nav } from './components/Nav';
import { PromoBanner } from './components/PromoBanner';
import { Hero } from './components/Hero';
import { Marquee } from './components/Marquee';
import { Services } from './components/Services';
import { Process } from './components/Process';
import { Testimonials } from './components/Testimonials';
import { Why } from './components/Why';
import { PhotoBand } from './components/PhotoBand';
import { Coverage } from './components/Coverage';
import { CTA } from './components/CTA';
import { Footer } from './components/Footer';
import { FloatingPhone } from './components/FloatingPhone';
import { FunnelModal } from './components/funnel/FunnelModal';
import { RepairModal } from './components/repair/RepairModal';
import { ThankYou } from './components/ThankYou';
import { ModalProvider } from './context/ModalContext';
import { ServicesProvider } from './context/ServicesContext';

/**
 * Returns true when Square (or another payment processor) has redirected
 * the customer back to /?status=success. Set this redirect URL in your
 * Square Online Checkout dashboard for each payment link.
 */
function isPostPaymentReturn(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('status') === 'success';
}

export default function App() {
  if (isPostPaymentReturn()) {
    return <ThankYou />;
  }

  return (
    <ServicesProvider>
      <ModalProvider>
        <PromoBanner />
        <Nav />
        <Hero />
        <Marquee />
        <Services />
        <Process />
        <Testimonials />
        <Why />
        <PhotoBand />
        <Coverage />
        <CTA />
        <Footer />
        <FloatingPhone />
        <FunnelModal />
        <RepairModal />
      </ModalProvider>
    </ServicesProvider>
  );
}
