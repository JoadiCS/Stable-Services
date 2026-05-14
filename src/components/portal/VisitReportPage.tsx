import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getVisit } from '@/lib/visits';
import {
  POOL_RANGES,
  RANGE_COLORS,
  statusFor,
  type RangeKey,
} from '@/data/poolRanges';
import type { PhotoType, ServiceType, Visit } from '@/types/portal';
import { siteConfig } from '@/data/siteConfig';
import { formatVisitDate } from './visitDisplay';

const SERVICE_LABEL: Record<ServiceType, string> = {
  pool: 'Pool service',
  lawn: 'Lawn service',
  pressure: 'Pressure washing',
  window: 'Window cleaning',
};

const PHOTO_GROUPS: { type: PhotoType; label: string }[] = [
  { type: 'before', label: 'Before' },
  { type: 'after', label: 'After' },
  { type: 'issue', label: 'Issues' },
  { type: 'other', label: 'Other' },
];

const READINGS_ORDER: RangeKey[] = [
  'ph',
  'chlorineFree',
  'chlorineTotal',
  'alkalinity',
  'calciumHardness',
  'cyanuricAcid',
  'salt',
  'tds',
];

export function VisitReportPage() {
  const { visitId } = useParams<{ visitId: string }>();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!visitId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const v = await getVisit(visitId);
        if (!cancelled) setVisit(v);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Could not load report.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visitId]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0f1e',
        color: '#ffffff',
        fontFamily: 'DM Sans, system-ui, sans-serif',
        padding: '3rem clamp(1rem, 4vw, 3rem) 5rem',
      }}
    >
      <style>{`
        @media print {
          body { background: #ffffff !important; color: #0a0f1e !important; }
          .ss-no-print { display: none !important; }
          .ss-report-root { background: #ffffff !important; color: #0a0f1e !important; box-shadow: none !important; }
          .ss-report-root * { color: #0a0f1e !important; }
          .ss-report-root .ss-report-card { background: #ffffff !important; border: 1px solid #d4cdb9 !important; }
          .ss-report-root .ss-report-accent { color: #8a7a3a !important; }
        }
      `}</style>

      <div style={{ maxWidth: 880, margin: '0 auto' }} className="ss-report-root">
        <nav
          className="ss-no-print"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
            gap: '1rem',
          }}
        >
          <Link
            to="/portal/dashboard"
            style={{ color: '#c9a84c', textDecoration: 'none', fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}
          >
            ← Dashboard
          </Link>
          {visit && (
            <button
              onClick={() => window.print()}
              className="ss-btn-primary"
            >
              Download as PDF
            </button>
          )}
        </nav>

        {loading && <Note>Loading report…</Note>}
        {err && !loading && <Note>{err}</Note>}
        {!loading && !err && !visit && <Note>Report not found.</Note>}

        {visit && (
          <article className="ss-report-card">
            <ReportHeader visit={visit} />
            <ChecklistSummary visit={visit} />
            {visit.serviceType === 'pool' && <ChemicalsSummary visit={visit} />}
            {visit.serviceType === 'pool' && (visit.chemicalsAdded?.length ?? 0) > 0 && (
              <ChemicalsAddedSummary visit={visit} />
            )}
            <PhotosSummary visit={visit} />
            {visit.customerNotes && <CustomerNotes visit={visit} />}
            <ReportFooter />
          </article>
        )}
      </div>
    </div>
  );
}

function ReportHeader({ visit }: { visit: Visit }) {
  return (
    <header
      style={{
        textAlign: 'center',
        padding: '2.5rem 2rem 2rem',
        borderBottom: '0.5px solid rgba(201,168,76,0.18)',
      }}
    >
      <div
        className="ss-report-accent"
        style={{
          fontSize: '0.65rem',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: '#c9a84c',
          marginBottom: '0.5rem',
        }}
      >
        Stable Report
      </div>
      <h1
        style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(2rem, 4.5vw, 2.8rem)',
          fontWeight: 300,
          lineHeight: 1.1,
          marginBottom: '0.75rem',
        }}
      >
        {formatVisitDate(visit)}
      </h1>
      <div style={{ fontSize: '0.88rem', color: '#8b95a7' }}>
        {SERVICE_LABEL[visit.serviceType]} · {visit.techName || 'Stable Services team'}
      </div>
    </header>
  );
}

function ChecklistSummary({ visit }: { visit: Visit }) {
  const items = visit.checklist ?? [];
  if (items.length === 0) return null;
  return (
    <ReportSection title="Service Checklist">
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {items.map((i) => (
          <li
            key={i.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.7rem',
              padding: '0.5rem 0',
              borderBottom: '0.5px dashed rgba(201,168,76,0.15)',
            }}
          >
            <span
              aria-hidden
              style={{
                width: 20,
                height: 20,
                borderRadius: 2,
                border: '1px solid rgba(201,168,76,0.5)',
                background: i.completed ? '#c9a84c' : 'transparent',
                color: '#0a0f1e',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                flexShrink: 0,
              }}
            >
              {i.completed ? '✓' : '—'}
            </span>
            <span style={{ fontSize: '0.92rem', color: i.completed ? '#ffffff' : '#8b95a7' }}>
              {i.label}
            </span>
          </li>
        ))}
      </ul>
    </ReportSection>
  );
}

function ChemicalsSummary({ visit }: { visit: Visit }) {
  const r = visit.chemicalReadings;
  if (!r) return null;
  return (
    <ReportSection title="Water Chemistry">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.85rem',
        }}
      >
        {READINGS_ORDER.map((key) => {
          const value = r[key];
          if (value === undefined || Number.isNaN(value)) return null;
          const spec = POOL_RANGES[key];
          const st = statusFor(key, value);
          const color = RANGE_COLORS[st];
          return (
            <div
              key={key}
              style={{
                border: '1px solid rgba(201,168,76,0.18)',
                borderRadius: 2,
                padding: '0.8rem 0.9rem',
              }}
            >
              <div
                className="ss-report-accent"
                style={{
                  fontSize: '0.62rem',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: '#c9a84c',
                  marginBottom: '0.3rem',
                }}
              >
                {spec.label}
              </div>
              <div
                style={{
                  fontFamily: 'Cormorant Garamond, Georgia, serif',
                  fontSize: '1.5rem',
                  fontWeight: 300,
                  lineHeight: 1,
                }}
              >
                {value} {spec.unit && <span style={{ fontSize: '0.65rem', color: '#8b95a7' }}>{spec.unit}</span>}
              </div>
              <div
                style={{
                  marginTop: '0.4rem',
                  fontSize: '0.62rem',
                  color: color.fg,
                  background: color.bg,
                  padding: '0.2rem 0.4rem',
                  borderRadius: 2,
                  display: 'inline-block',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                {st === 'in-range' ? 'In range' : st === 'unknown' ? '—' : st}
              </div>
            </div>
          );
        })}
      </div>
    </ReportSection>
  );
}

function ChemicalsAddedSummary({ visit }: { visit: Visit }) {
  const additions = visit.chemicalsAdded ?? [];
  return (
    <ReportSection title="Chemicals Added">
      <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
        {additions.map((a, i) => (
          <li key={i} style={{ marginBottom: '0.4rem', fontSize: '0.9rem' }}>
            <strong style={{ color: '#e8c97a', fontWeight: 500 }}>{a.name || '—'}</strong>
            {a.amount && <> · {a.amount}</>}
            {a.reason && <span style={{ color: '#8b95a7' }}> — {a.reason}</span>}
          </li>
        ))}
      </ul>
    </ReportSection>
  );
}

function PhotosSummary({ visit }: { visit: Visit }) {
  const photos = visit.photos ?? [];
  if (photos.length === 0) return null;
  return (
    <ReportSection title="Photos">
      {PHOTO_GROUPS.map((group) => {
        const subset = photos.filter((p) => p.type === group.type);
        if (subset.length === 0) return null;
        return (
          <div key={group.type} style={{ marginBottom: '1.5rem' }}>
            <div
              className="ss-report-accent"
              style={{
                fontSize: '0.6rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#c9a84c',
                marginBottom: '0.6rem',
              }}
            >
              {group.label}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: '0.6rem',
              }}
            >
              {subset.map((p) => (
                <figure
                  key={p.publicId}
                  style={{
                    margin: 0,
                    border: '1px solid rgba(201,168,76,0.18)',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={p.secureUrl}
                    alt={p.caption || group.label}
                    style={{ width: '100%', display: 'block', aspectRatio: '1 / 1', objectFit: 'cover' }}
                  />
                  {p.caption && (
                    <figcaption
                      style={{
                        padding: '0.4rem 0.6rem',
                        fontSize: '0.75rem',
                        color: '#8b95a7',
                      }}
                    >
                      {p.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </div>
        );
      })}
    </ReportSection>
  );
}

function CustomerNotes({ visit }: { visit: Visit }) {
  return (
    <ReportSection title="Notes from your tech">
      <p
        style={{
          fontSize: '1rem',
          lineHeight: 1.8,
          color: '#ffffff',
          whiteSpace: 'pre-wrap',
        }}
      >
        {visit.customerNotes}
      </p>
    </ReportSection>
  );
}

function ReportFooter() {
  return (
    <footer
      style={{
        padding: '1.5rem 2rem 2rem',
        textAlign: 'center',
        borderTop: '0.5px solid rgba(201,168,76,0.18)',
        fontSize: '0.82rem',
        color: '#8b95a7',
        lineHeight: 1.7,
      }}
    >
      Questions? Call us at{' '}
      <a href={`tel:${siteConfig.contact.phoneE164}`} style={{ color: '#c9a84c', textDecoration: 'none' }}>
        {siteConfig.contact.phoneDisplay}
      </a>{' '}
      ·{' '}
      <a href={`mailto:${siteConfig.contact.email}`} style={{ color: '#c9a84c', textDecoration: 'none' }}>
        {siteConfig.contact.email}
      </a>
    </footer>
  );
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ padding: '1.75rem 2rem', borderBottom: '0.5px solid rgba(201,168,76,0.12)' }}>
      <h2
        className="ss-report-accent"
        style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: '1.3rem',
          fontWeight: 300,
          marginBottom: '1rem',
          color: '#e8c97a',
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#111827',
        border: '1px solid rgba(201,168,76,0.18)',
        borderRadius: 2,
        padding: '2rem 1.5rem',
        textAlign: 'center',
        color: '#8b95a7',
      }}
    >
      {children}
    </div>
  );
}
