import { useEffect, useState, type ReactNode } from 'react';
import { endOfWeek, format, startOfWeek, subDays, subWeeks } from 'date-fns';
import { Link } from 'react-router-dom';
import { listCustomers } from '@/lib/customers';
import {
  listVisitsByStatusInRange,
  listVisitsForCustomer,
  listVisitsForWeek,
} from '@/lib/visits';
import { loadPricingConfig, monthlyRevenueFor } from '@/lib/planPricing';
import { countServiceRequestsSince } from '@/lib/serviceRequests';
import { loadPoolRangesConfig, statusFor, type RangeKey } from '@/data/poolRanges';
import { listenEventsInRange } from '@/lib/calendarEvents';
import { listenTasks } from '@/lib/tasks';
import type { CalendarEvent, Customer, Task, Visit } from '@/types/portal';

interface Metrics {
  activeCustomers: number;
  customersDelta: number;
  mrr: number;
  visitsCompleted: number;
  visitsScheduled: number;
  onTimeRate: number | null;
  newLeads: number;
  outOfRangeCustomers: Customer[];
  weeklyCompletedCounts: { weekStart: string; count: number }[];
}

const RANGE_KEYS: RangeKey[] = ['ph', 'chlorineFree', 'alkalinity'];

export function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await loadMetrics();
        if (!cancelled) setMetrics(result);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Could not load metrics.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <header style={{ marginBottom: '2.5rem' }}>
        <div
          style={{
            fontSize: '0.65rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#c9a84c',
            marginBottom: '0.5rem',
          }}
        >
          Overview
        </div>
        <h1
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(2rem, 4vw, 2.6rem)',
            fontWeight: 300,
            lineHeight: 1.1,
          }}
        >
          Operations at a glance
        </h1>
      </header>

      {err && (
        <div
          style={{
            background: 'rgba(220,80,80,0.08)',
            border: '1px solid rgba(220,80,80,0.35)',
            color: '#f0a5a5',
            fontSize: '0.85rem',
            padding: '0.75rem 1rem',
            marginBottom: '1.5rem',
            borderRadius: 2,
          }}
        >
          {err}
        </div>
      )}

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        <Metric
          label="Active Customers"
          value={fmtNumber(metrics?.activeCustomers)}
          sub={
            metrics
              ? `${metrics.customersDelta >= 0 ? '+' : ''}${metrics.customersDelta} this week`
              : '—'
          }
        />
        <Metric
          label="MRR Estimate"
          value={metrics ? `$${metrics.mrr.toFixed(0)}` : '—'}
          sub="Sum of plan prices for active customers"
        />
        <Metric
          label="Visits This Week"
          value={
            metrics
              ? `${metrics.visitsCompleted} / ${metrics.visitsScheduled}`
              : '—'
          }
          sub="Completed / scheduled"
        />
        <Metric
          label="On-Time Rate"
          value={
            metrics?.onTimeRate === null
              ? '—'
              : metrics
                ? `${Math.round((metrics.onTimeRate ?? 0) * 100)}%`
                : '—'
          }
          sub="Completed visits this week"
        />
        <Metric
          label="New Leads"
          value={fmtNumber(metrics?.newLeads)}
          sub="Service requests + customers · last 7 days"
        />
        <Metric
          label="Pool · Out-of-Range"
          value={fmtNumber(metrics?.outOfRangeCustomers.length)}
          sub="Last 3 visits"
        />
      </section>

      {metrics && metrics.outOfRangeCustomers.length > 0 && (
        <section
          style={{
            background: '#0a0f1e',
            border: '1px solid rgba(201,168,76,0.18)',
            borderRadius: 2,
            padding: '1.25rem 1.5rem',
            marginBottom: '2rem',
          }}
        >
          <div
            style={{
              fontSize: '0.62rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#c9a84c',
              marginBottom: '0.75rem',
            }}
          >
            Pool customers with out-of-range readings
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.4rem' }}>
            {metrics.outOfRangeCustomers.slice(0, 10).map((c) => (
              <li key={c.customerId}>
                <Link
                  to={`/admin/customers/${c.customerId}`}
                  style={{ color: '#e8c97a', textDecoration: 'none', fontSize: '0.9rem' }}
                >
                  {c.firstName} {c.lastName} <span style={{ color: '#8b95a7' }}>· {c.city}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <TodayPanel />

      <section
        style={{
          background: '#0a0f1e',
          border: '1px solid rgba(201,168,76,0.18)',
          borderRadius: 2,
          padding: '1.5rem',
          marginTop: '2rem',
        }}
      >
        <div
          style={{
            fontSize: '0.62rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#c9a84c',
            marginBottom: '1rem',
          }}
        >
          Completed visits · last 8 weeks
        </div>
        {metrics ? (
          <WeeklyChart data={metrics.weeklyCompletedCounts} />
        ) : (
          <div style={{ color: '#8b95a7', fontSize: '0.85rem' }}>Loading…</div>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: ReactNode; sub: string }) {
  return (
    <article
      style={{
        background: '#0a0f1e',
        border: '1px solid rgba(201,168,76,0.18)',
        borderRadius: 2,
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          fontSize: '0.62rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: '#c9a84c',
          marginBottom: '0.65rem',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: '2.4rem',
          fontWeight: 300,
          lineHeight: 1,
          color: '#e8c97a',
        }}
      >
        {value}
      </div>
      <div style={{ marginTop: '0.6rem', fontSize: '0.78rem', color: '#8b95a7' }}>{sub}</div>
    </article>
  );
}

function TodayPanel() {
  const todayISO = format(new Date(), 'yyyy-MM-dd');
  const [visits, setVisits] = useState<Visit[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const all = await listVisitsForWeek(todayISO, todayISO);
        if (!cancelled) setVisits(all);
      } catch {
        if (!cancelled) setVisits([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [todayISO]);

  useEffect(() => {
    const unsub = listenEventsInRange(todayISO, todayISO, setEvents);
    return unsub;
  }, [todayISO]);

  useEffect(() => {
    const unsub = listenTasks(setTasks);
    return unsub;
  }, []);

  const dueOrOverdue = tasks
    .filter((t) => t.status === 'open' && typeof t.dueDate === 'string' && t.dueDate <= todayISO)
    .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''));

  return (
    <section
      style={{
        background: '#0a0f1e',
        border: '1px solid rgba(201,168,76,0.18)',
        borderRadius: 2,
        padding: '1.5rem',
        marginTop: '0.5rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: '0.75rem',
          marginBottom: '0.9rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.62rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#c9a84c',
              marginBottom: '0.3rem',
            }}
          >
            Today
          </div>
          <div
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: '1.4rem',
              fontWeight: 300,
            }}
          >
            {format(new Date(), 'EEEE, MMM d')}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <Link to="/admin/calendar" className="ss-btn-ghost" style={{ padding: '0.4rem 0.8rem' }}>
            Open Calendar →
          </Link>
          <Link to="/admin/tasks" className="ss-btn-ghost" style={{ padding: '0.4rem 0.8rem' }}>
            Open Tasks →
          </Link>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '0.85rem',
        }}
      >
        <TodayColumn title={`Visits (${visits.length})`} empty="No visits scheduled today.">
          {visits.map((v) => (
            <Link
              key={v.visitId}
              to={`/tech/visit/${v.visitId}`}
              style={todayItemStyle}
            >
              <div style={{ fontWeight: 500, fontSize: '0.88rem' }}>{v.customerName}</div>
              <div style={{ color: '#8b95a7', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {v.scheduledWindow} · {v.serviceType}
              </div>
            </Link>
          ))}
        </TodayColumn>

        <TodayColumn title={`Events (${events.length})`} empty="No calendar events today.">
          {events.map((e) => (
            <Link
              key={e.id}
              to="/admin/calendar"
              style={todayItemStyle}
            >
              <div style={{ fontWeight: 500, fontSize: '0.88rem' }}>{e.title}</div>
              <div style={{ color: '#8b95a7', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {e.allDay
                  ? 'All day'
                  : [e.startTime, e.endTime].filter(Boolean).join(' – ') || 'Timed'}
                {' · '}{e.type}
              </div>
            </Link>
          ))}
        </TodayColumn>

        <TodayColumn title={`Tasks (${dueOrOverdue.length})`} empty="Nothing due today.">
          {dueOrOverdue.map((t) => {
            const overdue = (t.dueDate ?? '') < todayISO;
            return (
              <Link key={t.id} to="/admin/tasks" style={todayItemStyle}>
                <div style={{ fontWeight: 500, fontSize: '0.88rem' }}>{t.title}</div>
                <div
                  style={{
                    color: overdue ? '#f0a5a5' : '#8b95a7',
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {overdue ? 'Overdue · ' : 'Due today · '}{t.priority}
                  {t.assignedToName ? ` · ${t.assignedToName}` : ''}
                </div>
              </Link>
            );
          })}
        </TodayColumn>
      </div>
    </section>
  );
}

function TodayColumn({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const hasContent = Array.isArray(children) ? children.length > 0 : !!children;
  return (
    <div
      style={{
        background: '#111827',
        border: '1px solid rgba(201,168,76,0.18)',
        borderRadius: 2,
        padding: '0.85rem 0.95rem',
      }}
    >
      <div
        style={{
          fontSize: '0.6rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#c9a84c',
          marginBottom: '0.55rem',
        }}
      >
        {title}
      </div>
      {hasContent ? (
        <div style={{ display: 'grid', gap: '0.4rem' }}>{children}</div>
      ) : (
        <div style={{ color: '#5a6373', fontSize: '0.78rem' }}>{empty}</div>
      )}
    </div>
  );
}

const todayItemStyle: React.CSSProperties = {
  display: 'block',
  padding: '0.5rem 0.6rem',
  background: '#0a0f1e',
  border: '1px solid rgba(201,168,76,0.18)',
  borderRadius: 2,
  textDecoration: 'none',
  color: '#ffffff',
};

function WeeklyChart({ data }: { data: Metrics['weeklyCompletedCounts'] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const barWidth = 100 / Math.max(data.length, 1);

  return (
    <div>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ width: '100%', height: 160 }}>
        {data.map((d, i) => {
          const h = (d.count / max) * 35;
          const x = i * barWidth + 1;
          const y = 38 - h;
          return (
            <g key={d.weekStart}>
              <rect x={x} y={y} width={barWidth - 2} height={h} fill="#c9a84c" opacity={0.85} />
              <text
                x={x + (barWidth - 2) / 2}
                y={y - 0.8}
                textAnchor="middle"
                fontSize="2.2"
                fill="#e8c97a"
              >
                {d.count}
              </text>
            </g>
          );
        })}
      </svg>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '0.4rem',
          fontSize: '0.62rem',
          color: '#8b95a7',
          letterSpacing: '0.05em',
        }}
      >
        {data.map((d) => (
          <span key={d.weekStart} style={{ flex: 1, textAlign: 'center' }}>
            {d.weekStart.slice(5)}
          </span>
        ))}
      </div>
    </div>
  );
}

function fmtNumber(n: number | undefined): string {
  if (n === undefined) return '—';
  return n.toString();
}

async function loadMetrics(): Promise<Metrics> {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const weekStartISO = format(weekStart, 'yyyy-MM-dd');
  const weekEndISO = format(weekEnd, 'yyyy-MM-dd');
  const sevenDaysAgo = subDays(now, 7);

  const [allCustomers, weekVisits, pricing] = await Promise.all([
    safeList(() => listCustomers()),
    safeList(() => listVisitsForWeek(weekStartISO, weekEndISO)),
    loadPricingConfig(),
  ]);

  const active = allCustomers.filter((c) => c.status === 'active');
  const mrr = active.reduce((sum, c) => sum + monthlyRevenueFor(c, pricing), 0);

  const customersThisWeek = active.filter((c) => {
    const t = c.createdAt;
    return t && typeof t.toDate === 'function' && t.toDate() >= weekStart;
  }).length;
  const customersLastWeek = active.filter((c) => {
    const t = c.createdAt;
    if (!t || typeof t.toDate !== 'function') return false;
    const d = t.toDate();
    return d >= subWeeks(weekStart, 1) && d < weekStart;
  }).length;
  const customersDelta = customersThisWeek - customersLastWeek;

  const completed = weekVisits.filter((v) => v.status === 'completed').length;
  const scheduled = weekVisits.length;

  const onTimeRate = computeOnTimeRate(weekVisits);

  const customersInLast7 = active.filter((c) => {
    const t = c.createdAt;
    return t && typeof t.toDate === 'function' && t.toDate() >= sevenDaysAgo;
  }).length;
  const newLeadsFromRequests = await countServiceRequestsSince(sevenDaysAgo);
  const newLeads = customersInLast7 + newLeadsFromRequests;

  // Ensure pool-range config is loaded before we compute statuses so
  // statusFor() reads the admin-tuned values rather than defaults.
  await loadPoolRangesConfig();
  const outOfRangeCustomers = await findPoolOutOfRange(active);
  const weeklyCompletedCounts = await loadEightWeekHistory();

  return {
    activeCustomers: active.length,
    customersDelta,
    mrr,
    visitsCompleted: completed,
    visitsScheduled: scheduled,
    onTimeRate,
    newLeads,
    outOfRangeCustomers,
    weeklyCompletedCounts,
  };
}

function computeOnTimeRate(visits: Visit[]): number | null {
  const finished = visits.filter((v) => v.status === 'completed' && v.completedAt);
  if (finished.length === 0) return null;
  const onTime = finished.filter((v) => isOnTime(v)).length;
  return onTime / finished.length;
}

function isOnTime(v: Visit): boolean {
  const t = v.completedAt;
  if (!t || typeof t.toDate !== 'function') return true;
  const completed = t.toDate();
  const [y, m, d] = v.scheduledDate.split('-').map(Number);
  if (!y || !m || !d) return true;
  const cutoff = v.scheduledWindow === 'AM'
    ? new Date(y, m - 1, d, 12, 0, 0)
    : new Date(y, m - 1, d, 18, 0, 0);
  return completed <= cutoff;
}

async function findPoolOutOfRange(active: Customer[]): Promise<Customer[]> {
  const pool = active.filter((c) => c.serviceType === 'pool');
  const flagged: Customer[] = [];
  for (const c of pool) {
    try {
      const visits = await listVisitsForCustomer(c.customerId);
      const lastThree = visits.filter((v) => v.status === 'completed').slice(0, 3);
      const hasOut = lastThree.some((v) =>
        RANGE_KEYS.some((k) => {
          const val = v.chemicalReadings?.[k];
          if (val === undefined) return false;
          const s = statusFor(k, val);
          return s === 'low' || s === 'high';
        }),
      );
      if (hasOut) flagged.push(c);
    } catch {
      // skip on read failure
    }
  }
  return flagged;
}

async function loadEightWeekHistory(): Promise<{ weekStart: string; count: number }[]> {
  const now = new Date();
  const buckets: { weekStart: string; count: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const ws = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
    const we = endOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
    const startISO = format(ws, 'yyyy-MM-dd');
    const endISO = format(we, 'yyyy-MM-dd');
    let count = 0;
    try {
      const visits = await listVisitsByStatusInRange('completed', startISO, endISO);
      count = visits.length;
    } catch {
      count = 0;
    }
    buckets.push({ weekStart: startISO, count });
  }
  return buckets;
}

async function safeList<T>(fn: () => Promise<T[]>): Promise<T[]> {
  try {
    return await fn();
  } catch {
    return [];
  }
}

