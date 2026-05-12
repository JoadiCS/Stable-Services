/**
 * "How It Works" 4-step process content.
 */

export interface ProcessStep {
  num: string;
  title: string;
  text: string;
}

export const processSteps: ProcessStep[] = [
  {
    num: '01',
    title: 'Submit Your Request',
    text:
      "Choose your service online or give us a call — fill out a quick request and we'll have someone back to you within the hour.",
  },
  {
    num: '02',
    title: 'We Confirm & Schedule',
    text:
      'Our team reviews your request and reaches out within a few hours to confirm your first service date and window.',
  },
  {
    num: '03',
    title: 'First Visit & Assessment',
    text:
      'Your assigned technician arrives, documents baseline conditions, and completes your first full service.',
  },
  {
    num: '04',
    title: 'Stable Report Delivered',
    text:
      'After every visit, your Stable Report lands in your inbox — photos, readings, work completed. Full visibility, always.',
  },
];
