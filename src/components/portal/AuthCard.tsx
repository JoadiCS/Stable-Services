import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { siteConfig } from '@/data/siteConfig';

interface AuthCardProps {
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthCard({ eyebrow, title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0f1e',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 1.25rem',
        fontFamily: 'DM Sans, system-ui, sans-serif',
      }}
    >
      <div style={{ width: '100%', maxWidth: 440 }}>
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            color: '#ffffff',
            textDecoration: 'none',
            marginBottom: '2rem',
          }}
        >
          <div className="ss-logo-mark" style={{ width: 30, height: 30, fontSize: 13 }}>
            SS
          </div>
          <span
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: '1rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {siteConfig.company.name}
          </span>
        </Link>

        <div
          style={{
            background: '#111827',
            border: '1px solid rgba(201,168,76,0.18)',
            borderRadius: 2,
            padding: '2.25rem 2rem',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div
              style={{
                fontSize: '0.65rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#c9a84c',
                marginBottom: '0.6rem',
              }}
            >
              {eyebrow}
            </div>
            <h1
              style={{
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontSize: '1.85rem',
                fontWeight: 300,
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
              }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                style={{
                  color: '#8b95a7',
                  fontSize: '0.85rem',
                  lineHeight: 1.7,
                  fontWeight: 300,
                  marginTop: '0.75rem',
                }}
              >
                {subtitle}
              </p>
            )}
          </div>

          {children}
        </div>

        {footer && (
          <div
            style={{
              marginTop: '1.5rem',
              textAlign: 'center',
              fontSize: '0.8rem',
              color: '#8b95a7',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export const fieldStyle: CSSProperties = {
  width: '100%',
  background: '#0a0f1e',
  border: '1px solid rgba(201,168,76,0.25)',
  color: '#ffffff',
  padding: '0.85rem 0.9rem',
  fontSize: '0.92rem',
  fontFamily: 'DM Sans, system-ui, sans-serif',
  borderRadius: 2,
  outline: 'none',
};

export const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: '0.7rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: '#c9a84c',
  marginBottom: '0.45rem',
  fontWeight: 500,
};

export const formGroupStyle: CSSProperties = {
  marginBottom: '1.1rem',
};

export const errorStyle: CSSProperties = {
  background: 'rgba(220,80,80,0.08)',
  border: '1px solid rgba(220,80,80,0.35)',
  color: '#f0a5a5',
  fontSize: '0.82rem',
  padding: '0.6rem 0.8rem',
  marginBottom: '1rem',
  borderRadius: 2,
};

export const accentLine: CSSProperties = {
  fontStyle: 'italic',
  color: '#e8c97a',
};
