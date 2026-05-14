import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  addDays,
  addWeeks,
  endOfWeek,
  format,
  startOfWeek,
  subWeeks,
} from 'date-fns';
import { listCustomers } from '@/lib/customers';
import { listTechs } from '@/lib/staff';
import { createVisit, listVisitsForWeek, type VisitInput } from '@/lib/visits';
import { getChecklistFor } from '@/data/checklists';
import type { StaffMember, Visit } from '@/types/portal';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface DayBucket {
  dateISO: string;
  label: string;
  fullDate: Date;
  visits: Visit[];
}

export function SchedulePage() {
  const [anchor, setAnchor] = useState(() => new Date());
  const [days, setDays] = useState<DayBucket[]>([]);
  const [techs, setTechs] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(anchor, { weekStartsOn: 1 });

  async function reload() {
    setLoading(true);
    setErr(null);
    try {
      const startISO = format(weekStart, 'yyyy-MM-dd');
      const endISO = format(weekEnd, 'yyyy-MM-dd');
      const [visits, t] = await Promise.all([
        listVisitsForWeek(startISO, endISO),
        safeListTechs(),
      ]);
      setTechs(t);
      const buckets: DayBucket[] = [];
      for (let i = 0; i < 7; i++) {
        const d = addDays(weekStart, i);
        const iso = format(d, 'yyyy-MM-dd');
        buckets.push({
          dateISO: iso,
          fullDate: d,
          label: DAY_LABELS[i],
          visits: visits.filter((v) => v.scheduledDate === iso),
        });
      }
      setDays(buckets);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load schedule.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchor]);

  async function generateNextWeek() {
    setGenerating(true);
    setToast(null);
    setErr(null);
    try {
      const nextStart = startOfWeek(addWeeks(anchor, 1), { weekStartsOn: 1 });
      const nextEnd = endOfWeek(nextStart, { weekStartsOn: 1 });
      const customers = await listCustomers({ status: 'active' });
      const startISO = format(nextStart, 'yyyy-MM-dd');
      const endISO = format(nextEnd, 'yyyy-MM-dd');
      const existing = await listVisitsForWeek(startISO, endISO);
      const existingByCustomer = new Set(existing.map((v) => v.customerId));

      const techsList = await safeListTechs();
      const techById = new Map(techsList.map((t) => [t.uid, t]));

      let created = 0;
      for (const c of customers) {
        if (existingByCustomer.has(c.customerId)) continue;
        const visitDate = dateForDayOfWeek(nextStart, c.serviceDayOfWeek);
        const dateISO = format(visitDate, 'yyyy-MM-dd');
        const tech = c.assignedTechId ? techById.get(c.assignedTechId) : null;
        const input: VisitInput = {
          customerId: c.customerId,
          customerName: `${c.firstName} ${c.lastName}`.trim(),
          customerAddress: [c.address, c.city].filter(Boolean).join(', '),
          techId: c.assignedTechId ?? '',
          techName: tech ? `${tech.firstName} ${tech.lastName}`.trim() : '',
          serviceType: c.serviceType,
          scheduledDate: dateISO,
          scheduledWindow: c.serviceTimeWindow,
          status: 'scheduled',
          checklist: getChecklistFor(c.serviceType),
          photos: [],
          reportGenerated: false,
        };
        await createVisit(input);
        created++;
      }
      setToast(`Created ${created} visits for ${format(nextStart, 'MMM d')} – ${format(nextEnd, 'MMM d')}.`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not generate visits.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: '1rem',
          flexWrap: 'wrap',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.65rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#c9a84c',
              marginBottom: '0.5rem',
            }}
          >
            Schedule
          </div>
          <h1
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 'clamp(1.75rem, 3.4vw, 2.4rem)',
              fontWeight: 300,
            }}
          >
            Week of {format(weekStart, 'MMM d')}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => setAnchor(subWeeks(anchor, 1))} className="ss-btn-ghost">← Previous</button>
          <button onClick={() => setAnchor(new Date())} className="ss-btn-ghost">This week</button>
          <button onClick={() => setAnchor(addWeeks(anchor, 1))} className="ss-btn-ghost">Next →</button>
          <button
            onClick={() => void generateNextWeek()}
            disabled={generating}
            className="ss-btn-primary"
            style={{ opacity: generating ? 0.6 : 1 }}
          >
            {generating ? 'Generating…' : 'Generate next week'}
          </button>
        </div>
      </header>

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

      {toast && (
        <div
          style={{
            background: 'rgba(127,203,138,0.08)',
            border: '1px solid rgba(127,203,138,0.35)',
            color: '#7fcb8a',
            fontSize: '0.85rem',
            padding: '0.6rem 0.9rem',
            marginBottom: '1rem',
            borderRadius: 2,
          }}
        >
          {toast}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(140px, 1fr))',
          gap: '0.5rem',
          overflowX: 'auto',
        }}
      >
        {days.map((d) => (
          <DayColumn key={d.dateISO} bucket={d} techs={techs} loading={loading} />
        ))}
      </div>
    </div>
  );
}

function DayColumn({ bucket, techs, loading }: { bucket: DayBucket; techs: StaffMember[]; loading: boolean }) {
  const techById = new Map(techs.map((t) => [t.uid, t]));
  return (
    <div
      style={{
        background: '#0a0f1e',
        border: '1px solid rgba(201,168,76,0.18)',
        borderRadius: 2,
        padding: '0.6rem 0.55rem',
        minHeight: 240,
      }}
    >
      <div
        style={{
          fontSize: '0.62rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#c9a84c',
          marginBottom: '0.5rem',
        }}
      >
        {bucket.label} · {format(bucket.fullDate, 'M/d')}
      </div>
      {loading ? (
        <div style={{ color: '#8b95a7', fontSize: '0.75rem' }}>Loading…</div>
      ) : bucket.visits.length === 0 ? (
        <div style={{ color: '#5a6373', fontSize: '0.75rem' }}>No visits</div>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {bucket.visits.map((v) => {
            const tech = v.techId ? techById.get(v.techId) : null;
            return (
              <li key={v.visitId}>
                <Link
                  to={`/tech/visit/${v.visitId}`}
                  style={{
                    display: 'block',
                    padding: '0.45rem 0.55rem',
                    background: '#111827',
                    border: '1px solid rgba(201,168,76,0.18)',
                    borderRadius: 2,
                    textDecoration: 'none',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                  }}
                >
                  <div style={{ fontWeight: 500, marginBottom: '0.15rem' }}>{v.customerName}</div>
                  <div style={{ color: '#8b95a7', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {v.scheduledWindow} · {v.serviceType}
                    {tech && ` · ${tech.firstName}`}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function dateForDayOfWeek(weekStartMonday: Date, dayOfWeek: number): Date {
  // dayOfWeek follows JS Date.getDay() (0 = Sunday). Convert to Mon-start offset.
  const offset = (dayOfWeek + 6) % 7;
  return addDays(weekStartMonday, offset);
}

async function safeListTechs(): Promise<StaffMember[]> {
  try {
    return await listTechs();
  } catch {
    return [];
  }
}
