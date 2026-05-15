import { useEffect, useState } from 'react';
import {
  DEFAULT_POOL_RANGES,
  loadPoolRangesConfig,
  type PoolRangesConfig,
} from '@/data/poolRanges';

/**
 * Returns the current pool-range config. Defaults synchronously, then
 * swaps in the admin-managed values from /config/poolRanges once they
 * load. Use this in any component that displays range hints or computes
 * in/out-of-range status against admin-managed bounds.
 */
export function usePoolRanges(): PoolRangesConfig {
  const [ranges, setRanges] = useState<PoolRangesConfig>(DEFAULT_POOL_RANGES);

  useEffect(() => {
    let cancelled = false;
    loadPoolRangesConfig().then((r) => {
      if (!cancelled) setRanges(r);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return ranges;
}
