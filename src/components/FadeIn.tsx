import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react';

interface FadeInProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Pass-through for native `id` */
  id?: string;
}

/**
 * Wraps content with the original `.fade-in` -> `.visible` transition
 * driven by an IntersectionObserver.
 */
export function FadeIn({ children, className = '', style, id }: FadeInProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      id={id}
      style={style}
      className={`ss-fade-in ${visible ? 'visible' : ''} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
