import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { heroOffer, type WaivedFee } from '@/data/heroOffer';

/**
 * Subset of marketing copy the owner can edit from /admin/settings/site-content
 * without a code push. Anything not in this overlay stays in heroOffer.ts.
 */
export interface SiteContent {
  bannerActive: boolean;
  bannerText: string;
  bannerCtaLabel: string;
  eyebrow: string;
  finalPriceAmount: string;
  finalPriceCaption: string;
  finePrint: string;
  waivedFees: WaivedFee[];
}

export const DEFAULT_SITE_CONTENT: SiteContent = {
  bannerActive: heroOffer.bannerActive,
  bannerText: heroOffer.bannerText,
  bannerCtaLabel: heroOffer.bannerCtaLabel,
  eyebrow: heroOffer.eyebrow,
  finalPriceAmount: heroOffer.finalPriceAmount,
  finalPriceCaption: heroOffer.finalPriceCaption,
  finePrint: heroOffer.finePrint,
  waivedFees: heroOffer.waivedFees,
};

let cachePromise: Promise<SiteContent> | null = null;

/**
 * Reads /config/site (publicly readable, owner/admin writable). Falls
 * back to DEFAULT_SITE_CONTENT if the doc is missing — the marketing site
 * keeps working even with no Firestore reachable.
 */
export function loadSiteContent(): Promise<SiteContent> {
  if (!cachePromise) {
    cachePromise = (async () => {
      try {
        const snap = await getDoc(doc(db, 'config', 'site'));
        if (!snap.exists()) return DEFAULT_SITE_CONTENT;
        const data = snap.data() as Partial<SiteContent>;
        return { ...DEFAULT_SITE_CONTENT, ...data };
      } catch {
        return DEFAULT_SITE_CONTENT;
      }
    })();
  }
  return cachePromise;
}

export function invalidateSiteContentCache(): void {
  cachePromise = null;
}

export async function saveSiteContent(content: SiteContent): Promise<void> {
  await setDoc(doc(db, 'config', 'site'), content);
  invalidateSiteContentCache();
}

/**
 * Returns site content with synchronous default fallback, then swaps in
 * the live values after Firestore load. Suitable for marketing components
 * that mount immediately on page load.
 */
export function useSiteContent(): SiteContent {
  const [content, setContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  useEffect(() => {
    let cancelled = false;
    loadSiteContent().then((c) => {
      if (!cancelled) setContent(c);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return content;
}
