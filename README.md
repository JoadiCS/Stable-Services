# Stable Services LLC — Marketing Site

Production React + TypeScript + Vite + Tailwind CSS implementation of the Stable Services marketing website.

## Stack

- **React 18** + **TypeScript** — strict mode, no unused locals/parameters
- **Vite 5** — dev server + production bundler
- **Tailwind CSS 3** — utility-first styling, theme tokens mirror the original `:root` variables
- **No runtime backend coupling** — form submission handlers are stubs ready to be wired to your CRM / API of choice

## Quickstart

```bash
npm install
npm run dev        # local dev at http://localhost:5173
npm run build      # production build → dist/
npm run preview    # preview the production build locally
npm run typecheck  # tsc --noEmit
```

## Project layout

```
src/
├── main.tsx                  # React bootstrap
├── App.tsx                   # Page composition (Nav, Hero, sections, modals)
├── index.css                 # Tailwind + small set of irreducible global rules
├── context/
│   └── ModalContext.tsx      # Funnel + repair modal state
├── data/                     # All copy/content lives here — edit these to update the site
│   ├── siteConfig.ts         # Phone, email, address, legal text
│   ├── plans.ts              # Pricing plan catalog (used by pricing cards + funnel)
│   ├── services.ts           # Residential service tab definitions
│   ├── repairCategories.ts   # 12 repair categories for the repairs tab
│   ├── testimonials.ts       # Customer reviews
│   ├── coverage.ts           # Service-area cities
│   ├── marquee.ts            # Marquee bar phrases
│   ├── whyItems.ts           # "Why Stable" grid items
│   └── processSteps.ts       # 4-step process explanation
├── components/
│   ├── Nav.tsx, Hero.tsx, Marquee.tsx, Services.tsx, Process.tsx,
│   ├── Testimonials.tsx, Why.tsx, PhotoBand.tsx, Coverage.tsx,
│   ├── CTA.tsx, Footer.tsx, FloatingPhone.tsx,
│   ├── PricingCard.tsx, QuoteCard.tsx, FadeIn.tsx,
│   ├── funnel/FunnelModal.tsx + step components
│   └── repair/RepairModal.tsx
└── hooks/
    └── useScrolled.ts        # Nav scroll-class toggle
```

## Editing content

Everything user-facing is in `src/data/`. To change pricing, edit `plans.ts`. To add a testimonial, push a new entry to `testimonials.ts`. To swap phone or email, edit `siteConfig.ts`.

## Form submission — TODO before launch

Three submission handlers currently log to console and show a success state. Wire each to your backend:

1. `submitFunnel(payload)` — booking funnel — see `src/components/funnel/FunnelModal.tsx`
2. `submitCommercialInquiry(payload)` — commercial form — see `src/components/Services.tsx`
3. `submitRepairRequest(payload)` — repair modal — see `src/components/repair/RepairModal.tsx`

Each handler receives a typed payload object. Replace the stub body with a `fetch(...)` to your CRM/API.

## Deployment

Any static host works (Netlify, Vercel, Cloudflare Pages, S3+CloudFront, Nginx). After `npm run build`, upload the contents of `dist/`.

Recommended Netlify/Vercel build settings:

- **Build command:** `npm run build`
- **Output dir:** `dist`
- **Node version:** 18 or 20

## Assets

The hero references `/stable-hero.mp4`. Place that file in `public/` before deploying. Other photos live in `public/img/` and can be swapped freely — keep filenames or update `src/data/*.ts` accordingly.

## License

© 2026 Stable Services LLC. All rights reserved.
