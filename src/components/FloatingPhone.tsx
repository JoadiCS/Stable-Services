import { siteConfig } from '@/data/siteConfig';
import { IconPhone } from './Icons';

export function FloatingPhone() {
  return (
    <a
      href={`tel:${siteConfig.contact.phoneE164}`}
      className="ss-floating-phone"
    >
      <IconPhone width={14} height={14} />
      Call Now
    </a>
  );
}
