import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { addDays, endOfWeek, format, startOfWeek } from 'date-fns';
import { useAuthUser } from '@/lib/auth';
import {
  listVisitsForTechDate,
  listVisitsForTechWeek,
} from '@/lib/visits';
import type { ServiceType, Visit, VisitStatus } from '@/types/portal';
import { TechShell } from './TechShell';

type Tab = 'today' | 'tomorrow' | 'week';

function todayISO() {
  return format(new Date(), 'yyyy-MM-dd');
}

function tomorrowISO() {
  return format(addDays(new Date(), 1), 'yyyy-MM-dd');
}

function weekRangeISO() {
  const now = new Date();
  return {
    start: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    end: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
  };
}

const STATUS_LABEL: Record<VisitStatus, string> = {
  scheduled: 'Scheduled',
  in_progress: 'In progress',
  completed: 'Completed',
  missed: 'Missed',
};

const STATUS_COLOR: Record<VisitStatus, { fg: string; bg: string }> = {
  scheduled: { fg: '#c9a84c', bg: 'rgba(201,168,76,0.12)' },
  in_progress: { fg: '#7fcb8a', bg: 'rgba(127,203,138,0.12)' },
  completed: { fg: '#8b95a7', bg: 'rgba(139,149,167,0.12)' },
  missed: { fg: '#f0a5a5', bg: 'rgba(240,165,165,0.12)' },
};

const SERVICE_LABEL: Record<ServiceType, string> = {
  pool: 'Pool',
  lawn: 'Lawn',
  pressure: 'Pressure',
  window: 'Window',
};

export function TechRoutePage() {
  const { user } = useAuthUser();
  const [tab, setTab] = useState<Tab>('today');
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const techId = user?.uid;

  useEffect(() => {
    if (!techId) return;
    let cancelled = false;
    setLoading(true);
    setErr(null);
    (async () => {
      try {
        let result: Visit[];
        if (tab === 'today') {
          result = await listVisitsForTechDate(techId, todayISO());
        } else if (tab === 'tomorrow') {
          result = await listVisitsForTechDate(techId, tomorrowISO());
        } else {
          const r = weekRangeISO();
          result = await listVisitsForTechWeek(techId, r.start, r.end);
        }
        if (!cancelled) setVisits(result);
      } catch (e) {
        if (!cancelled) setErr(extractError(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [techId, tab]);

  return (
    <TechShell>
      <header style={{ marginBottom: '1.25rem' }}>
        <div
          style={{
            fontSize: '0.62rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#c9a84c',
            marginBottom: '0.4rem',
          }}
        >
          {format(new Date(), 'EEEE · MMMM d')}
        </div>
        <h1
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(1.65rem, 5vw, 2.2rem)',
            fontWeight: 300,
            lineHeight: 1.1,
          }}
        >
          Today's route
        </h1>
      </header>

      <nav
        style={{
          display: 'flex',
          gap: '0.4rem',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
        }}
      >
        {(['today', 'tomorrow', 'week'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '0.55rem 1rem',
              fontSize: '0.72rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              borderRadius: 2,
              border: '1px solid rgba(201,168,76,0.25)',
              background: tab === t ? '#c9a84c' : 'transparent',
              color: tab === t ? '#0a0f1e' : '#d6d2c4',
              cursor: 'pointer',
              fontWeight: tab === t ? 500 : 400,
            }}
          >
            {t === 'today' ? 'Today' : t === 'tomorrow' ? 'Tomorrow' : 'This Week'}
          </button>
        ))}
      </nav>

      {err && (
        <div
          style={{
            background: 'rgba(220,80,80,0.08)',
            border: '1px solid rgba(220,80,80,0.35)',
            color: '#f0a5a5',
            fontSize: '0.85rem',
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            borderRadius: 2,
          }}
        >
          {err}
        </div>
      )}

      {loading ? (
        <Empty>Loading visits…</Empty>
      ) : visits.length === 0 ? (
        <Empty>
          {tab === 'today'
            ? 'No visits scheduled today.'
            : tab === 'tomorrow'
              ? 'No visits scheduled tomorrow.'
              : 'No visits scheduled this week.'}
        </Empty>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          {visits.map((v) => (
            <li key={v.visitId}>
              <VisitCard visit={v} />
            </li>
          ))}
        </ul>
      )}
    </TechShell>
  );
}

function VisitCard({ visit }: { visit: Visit }) {
  const checklistCount = useMemo(() => {
    if (!visit.checklist) return null;
    const total = visit.checklist.length;
    const done = visit.checklist.filter((i) => i.completed).length;
    return total ? `${done} / ${total}` : null;
  }, [visit.checklist]);

  const statusStyle = STATUS_COLOR[visit.status];

  return (
    <Link
      to={`/tech/visit/${visit.visitId}`}
      style={{
        display: 'block',
        background: '#111827',
        border: '1px solid rgba(201,168,76,0.18)',
        borderRadius: 2,
        padding: '1rem 1.1rem',
        textDecoration: 'none',
        color: '#ffffff',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '0.75rem',
          marginBottom: '0.5rem',
        }}
      >
        <div
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: '1.25rem',
            fontWeight: 300,
            lineHeight: 1.2,
          }}
        >
          {visit.customerName}
        </div>
        <span
          style={{
            fontSize: '0.62rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            padding: '0.25rem 0.55rem',
            borderRadius: 2,
            background: statusStyle.bg,
            color: statusStyle.fg,
            whiteSpace: 'nowrap',
          }}
        >
          {STATUS_LABEL[visit.status]}
        </span>
      </div>

      <div
        style={{
          fontSize: '0.82rem',
          color: '#8b95a7',
          lineHeight: 1.5,
          marginBottom: '0.5rem',
        }}
      >
        {visit.customerAddress}
      </div>

      <div
        style={{
          display: 'flex',
          gap: '0.4rem',
          flexWrap: 'wrap',
          fontSize: '0.7rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        <Pill>{SERVICE_LABEL[visit.serviceType]}</Pill>
        <Pill>{visit.scheduledWindow}</Pill>
        <Pill subdued>{visit.scheduledDate}</Pill>
        {checklistCount && <Pill subdued>Checklist {checklistCount}</Pill>}
      </div>
    </Link>
  );
}

function Pill({ children, subdued }: { children: React.ReactNode; subdued?: boolean }) {
  return (
    <span
      style={{
        padding: '0.25rem 0.55rem',
        borderRadius: 2,
        border: '1px solid rgba(201,168,76,0.25)',
        color: subdued ? '#8b95a7' : '#c9a84c',
        background: subdued ? 'transparent' : 'rgba(201,168,76,0.08)',
        fontSize: '0.62rem',
      }}
    >
      {children}
    </span>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#111827',
        border: '1px solid rgba(201,168,76,0.18)',
        borderRadius: 2,
        padding: '2.5rem 1.5rem',
        textAlign: 'center',
        color: '#8b95a7',
        fontSize: '0.9rem',
      }}
    >
      {children}
    </div>
  );
}

function extractError(e: unknown): string {
  if (e instanceof Error) return e.message;
  return 'Could not load visits.';
}
