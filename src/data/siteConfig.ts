/**
 * Site-wide configuration — phone, email, company info, legal text.
 * Update this file to change contact info across the whole site.
 */

export const siteConfig = {
  company: {
    name: 'Stable Services',
    legalName: 'Stable Services LLC',
    tagline: "Arizona's #1 Leading Residential & Commercial Service Provider",
    description:
      'High standard residential & commercial service provider trusted by Arizona\'s residents & businesses. Licensed, insured, accountable, and Stable.',
  },
  contact: {
    phoneDisplay: '(480) 290-3596',
    phoneE164: '+14802903596',
    email: 'hello@stablesvc.com',
    cityLabel: 'Phoenix, AZ',
  },
  legal: {
    copyrightYear: 2026,
    license: '',
    privacyUrl: '/privacy',
    termsUrl: '/terms',
  },
  social: {
    // Add when ready
    instagram: '',
    facebook: '',
    google: '',
  },
} as const;

export type SiteConfig = typeof siteConfig;
