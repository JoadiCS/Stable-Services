import { useCallback, useEffect, useRef, useState } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface Options {
  delayMs?: number;
}

/**
 * Returns a `schedule(fn)` function that debounces async saves by `delayMs`
 * and a status string suitable for a "Saved" indicator. The status flips to
 * "saved" briefly, then back to "idle".
 */
export function useDebouncedSave({ delayMs = 500 }: Options = {}) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
    };
  }, []);

  const schedule = useCallback(
    (fn: () => Promise<void>) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        try {
          setStatus('saving');
          await fn();
          setStatus('saved');
          if (fadeTimer.current) clearTimeout(fadeTimer.current);
          fadeTimer.current = setTimeout(() => setStatus('idle'), 1500);
        } catch {
          setStatus('error');
        }
      }, delayMs);
    },
    [delayMs],
  );

  return { status, schedule };
}
