import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  addDays,
  addWeeks,
  endOfWeek,
  format,
  startOfWeek,
  subDays,
  subWeeks,
} from 'date-fns';
import { useAuthUser } from '@/lib/auth';
import { listCustomers } from '@/lib/customers';
import { listVisitsForWeek } from '@/lib/visits';
import {
  createCalendarEvent,
  deleteCalendarEvent,
  listenEventsInRange,
  type CalendarEventInput,
} from '@/lib/calendarEvents';
import { listenTasks } from '@/lib/tasks';
import type {
  CalendarEvent,
  CalendarEventType,
  Customer,
  Task,
  Visit,
} from '@/types/portal';

type CalView = 'week' | 'day';

const TYPE_LABEL: Record<CalendarEventType, string> = {
  reminder: 'Reminder',
  admin: 'Admin',
  personal: 'Personal',
  followup: 'Follow-up',
};

const TYPE_COLOR: Record<CalendarEventType, { fg: string; bg: string; border: string }> = {
  reminder: { fg: '#e8c97a', bg: 'rgba(232,201,122,0.14)', border: 'rgba(232,201,122,0.5)' },
  admin: { fg: '#c9a84c', bg: 'rgba(201,168,76,0.14)', border: 'rgba(201,168,76,0.5)' },
  personal: { fg: '#7fcb8a', bg: 'rgba(127,203,138,0.14)', border: 'rgba(127,203,138,0.5)' },
  followup: { fg: '#f0a5a5', bg: 'rgba(240,165,165,0.14)', border: 'rgba(240,165,165,0.5)' },
};

export function CalendarPage() {
  const { user } = useAuthUser();
  const [view, setView] = useState<CalView>('week');
  const [anchor, setAnchor] = useState(() => new Date());
  const [visits, setVisits] = useState<Visit[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addInitialDate, setAddInitialDate] = useState<string | null>(null);

  const { rangeStart, rangeEnd } = useMemo(() => {
    if (view === 'day') {
      return { rangeStart: anchor, rangeEnd: anchor };
    }
    return {
      rangeStart: startOfWeek(anchor, { weekStartsOn: 1 }),
      rangeEnd: endOfWeek(anchor, { weekStartsOn: 1 }),
    };
  }, [view, anchor]);

  const startISO = format(rangeStart, 'yyyy-MM-dd');
  const endISO = format(rangeEnd, 'yyyy-MM-dd');

  // Visits — fetched per range change (no real-time, manual refresh on nav).
  useEffect(() => {
    let cancelled = false;
    setErr(null);
    (async () => {
      try {
        const v = await listVisitsForWeek(startISO, endISO);
        if (!cancelled) setVisits(v);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Could not load visits.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [startISO, endISO]);

  // Calendar events — real-time.
  useEffect(() => {
    const unsub = listenEventsInRange(startISO, endISO, setEvents);
    return unsub;
  }, [startISO, endISO]);

  // Tasks — real-time, filter to ones whose dueDate falls in range.
  useEffect(() => {
    const unsub = listenTasks(setTasks);
    return unsub;
  }, []);

  // Customer list (for the add-event dropdown).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const c = await listCustomers();
        if (!cancelled) setCustomers(c);
      } catch {
        if (!cancelled) setCustomers([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const daysInView: Date[] = useMemo(() => {
    if (view === 'day') return [anchor];
    return Array.from({ length: 7 }, (_, i) => addDays(rangeStart, i));
  }, [view, anchor, rangeStart]);

  const tasksInRange = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.status === 'open' &&
          typeof t.dueDate === 'string' &&
          t.dueDate >= startISO &&
          t.dueDate <= endISO,
      ),
    [tasks, startISO, endISO],
  );

  function openAddFor(date: Date) {
    setAddInitialDate(format(date, 'yyyy-MM-dd'));
    setShowAdd(true);
  }

  function nav(direction: -1 | 1) {
    setAnchor((d) => (view === 'day' ? (direction === 1 ? addDays(d, 1) : subDays(d, 1)) : direction === 1 ? addWeeks(d, 1) : subWeeks(d, 1)));
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
            Calendar
          </div>
          <h1
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 'clamp(1.75rem, 3.4vw, 2.4rem)',
              fontWeight: 300,
            }}
          >
            {view === 'day' ? format(anchor, 'EEEE, MMM d') : `Week of ${format(rangeStart, 'MMM d')}`}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setView('week')}
            className={view === 'week' ? 'ss-btn-primary' : 'ss-btn-ghost'}
            style={view === 'week' ? undefined : { padding: '0.55rem 0.9rem' }}
          >
            Week
          </button>
          <button
            onClick={() => setView('day')}
            className={view === 'day' ? 'ss-btn-primary' : 'ss-btn-ghost'}
            style={view === 'day' ? undefined : { padding: '0.55rem 0.9rem' }}
          >
            Day
          </button>
          <button onClick={() => nav(-1)} className="ss-btn-ghost">← Prev</button>
          <button onClick={() => setAnchor(new Date())} className="ss-btn-ghost">Today</button>
          <button onClick={() => nav(1)} className="ss-btn-ghost">Next →</button>
          <button onClick={() => openAddFor(anchor)} className="ss-btn-primary">+ Add event</button>
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

      <Legend />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: view === 'day' ? '1fr' : 'repeat(7, minmax(150px, 1fr))',
          gap: '0.5rem',
          overflowX: 'auto',
        }}
      >
        {daysInView.map((d) => (
          <DayColumn
            key={format(d, 'yyyy-MM-dd')}
            date={d}
            visits={visits}
            events={events}
            tasks={tasksInRange}
            onAdd={() => openAddFor(d)}
          />
        ))}
      </div>

      {showAdd && (
        <AddEventModal
          customers={customers}
          initialDate={addInitialDate ?? format(anchor, 'yyyy-MM-dd')}
          currentUser={{
            uid: user?.uid ?? '',
            name: user?.displayName || user?.email || 'Admin',
          }}
          onClose={() => setShowAdd(false)}
          onCreated={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}

function Legend() {
  const items: { label: string; color: string }[] = [
    { label: 'Customer visit', color: '#c9a84c' },
    { label: 'Reminder', color: TYPE_COLOR.reminder.fg },
    { label: 'Admin', color: TYPE_COLOR.admin.fg },
    { label: 'Personal', color: TYPE_COLOR.personal.fg },
    { label: 'Follow-up', color: TYPE_COLOR.followup.fg },
    { label: 'Task due', color: '#8b95a7' },
  ];
  return (
    <div
      style={{
        display: 'flex',
        gap: '0.75rem',
        flexWrap: 'wrap',
        marginBottom: '0.85rem',
        fontSize: '0.7rem',
        color: '#8b95a7',
      }}
    >
      {items.map((it) => (
        <span key={it.label} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <span
            aria-hidden
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background: it.color,
              display: 'inline-block',
            }}
          />
          {it.label}
        </span>
      ))}
    </div>
  );
}

function DayColumn({
  date,
  visits,
  events,
  tasks,
  onAdd,
}: {
  date: Date;
  visits: Visit[];
  events: CalendarEvent[];
  tasks: Task[];
  onAdd: () => void;
}) {
  const dateISO = format(date, 'yyyy-MM-dd');
  const dayVisits = visits.filter((v) => v.scheduledDate === dateISO);
  const dayEvents = events.filter((e) => e.date === dateISO);
  const dayTasks = tasks.filter((t) => t.dueDate === dateISO);

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
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: '0.5rem',
        }}
      >
        <div
          style={{
            fontSize: '0.62rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#c9a84c',
          }}
        >
          {format(date, 'EEE · M/d')}
        </div>
        <button
          onClick={onAdd}
          aria-label="Add event"
          style={{
            background: 'transparent',
            border: '1px solid rgba(201,168,76,0.25)',
            color: '#c9a84c',
            padding: '0.05rem 0.4rem',
            borderRadius: 2,
            cursor: 'pointer',
            fontSize: '0.7rem',
          }}
        >
          +
        </button>
      </div>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.3rem' }}>
        {dayVisits.map((v) => (
          <li key={`v-${v.visitId}`}>
            <Link
              to={`/tech/visit/${v.visitId}`}
              style={{
                display: 'block',
                padding: '0.4rem 0.5rem',
                background: '#111827',
                border: '1px solid rgba(201,168,76,0.4)',
                borderLeft: '3px solid #c9a84c',
                borderRadius: 2,
                textDecoration: 'none',
                color: '#ffffff',
                fontSize: '0.74rem',
              }}
            >
              <div style={{ fontWeight: 500 }}>{v.customerName}</div>
              <div style={{ color: '#8b95a7', fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {v.scheduledWindow} · {v.serviceType}
              </div>
            </Link>
          </li>
        ))}
        {dayEvents.map((e) => {
          const color = TYPE_COLOR[e.type];
          return (
            <li key={`e-${e.id}`}>
              <EventChip event={e} color={color} />
            </li>
          );
        })}
        {dayTasks.map((t) => (
          <li key={`t-${t.id}`}>
            <Link
              to="/admin/tasks"
              style={{
                display: 'block',
                padding: '0.3rem 0.45rem',
                background: 'transparent',
                border: '1px dashed rgba(139,149,167,0.4)',
                borderRadius: 2,
                color: '#8b95a7',
                fontSize: '0.72rem',
                textDecoration: 'none',
              }}
            >
              ▢ {t.title}
            </Link>
          </li>
        ))}
        {dayVisits.length === 0 && dayEvents.length === 0 && dayTasks.length === 0 && (
          <li style={{ color: '#5a6373', fontSize: '0.72rem', padding: '0.2rem 0' }}>—</li>
        )}
      </ul>
    </div>
  );
}

function EventChip({ event, color }: { event: CalendarEvent; color: typeof TYPE_COLOR[CalendarEventType] }) {
  const [showDelete, setShowDelete] = useState(false);

  async function onDelete() {
    if (!confirm(`Delete event "${event.title}"?`)) return;
    await deleteCalendarEvent(event.id);
  }

  const timeLabel = event.allDay
    ? 'All day'
    : [event.startTime, event.endTime].filter(Boolean).join(' – ');

  return (
    <div
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
      style={{
        position: 'relative',
        padding: '0.4rem 0.5rem',
        background: color.bg,
        border: `1px solid ${color.border}`,
        borderRadius: 2,
        color: '#ffffff',
        fontSize: '0.74rem',
      }}
    >
      <div style={{ fontWeight: 500 }}>{event.title}</div>
      <div style={{ color: color.fg, fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {TYPE_LABEL[event.type]} · {timeLabel || 'unscheduled'}
      </div>
      {showDelete && (
        <button
          onClick={() => void onDelete()}
          aria-label="Delete event"
          style={{
            position: 'absolute',
            top: 2,
            right: 2,
            background: 'rgba(10,15,30,0.65)',
            border: '1px solid rgba(240,165,165,0.4)',
            color: '#f0a5a5',
            cursor: 'pointer',
            fontSize: '0.6rem',
            padding: '0 0.3rem',
            borderRadius: 2,
            lineHeight: 1.4,
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

function AddEventModal({
  customers,
  initialDate,
  currentUser,
  onClose,
  onCreated,
}: {
  customers: Customer[];
  initialDate: string;
  currentUser: { uid: string; name: string };
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(initialDate);
  const [allDay, setAllDay] = useState(true);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [type, setType] = useState<CalendarEventType>('admin');
  const [notes, setNotes] = useState('');
  const [relatedCustomerId, setRelatedCustomerId] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setErr('Title is required.');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const input: CalendarEventInput = {
        title: title.trim(),
        notes: notes.trim() || undefined,
        date,
        allDay,
        startTime: allDay ? undefined : startTime,
        endTime: allDay ? undefined : endTime,
        type,
        relatedCustomerId: relatedCustomerId || undefined,
        source: 'admin',
        createdByUid: currentUser.uid,
        createdByName: currentUser.name,
      };
      await createCalendarEvent(input);
      onCreated();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not create event.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modalCard} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeader}>
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
              New Event
            </div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.5rem', fontWeight: 300 }}>
              Add to calendar
            </h2>
          </div>
          <button onClick={onClose} aria-label="Close" style={closeButton}>✕</button>
        </div>

        {err && (
          <div
            style={{
              background: 'rgba(220,80,80,0.08)',
              border: '1px solid rgba(220,80,80,0.35)',
              color: '#f0a5a5',
              fontSize: '0.82rem',
              padding: '0.6rem 0.8rem',
              marginBottom: '1rem',
              borderRadius: 2,
            }}
          >
            {err}
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
            <Field label="Title" full>
              <input value={title} onChange={(e) => setTitle(e.target.value)} style={textField} autoFocus />
            </Field>
            <Field label="Date">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={textField} />
            </Field>
            <Field label="Type">
              <select value={type} onChange={(e) => setType(e.target.value as CalendarEventType)} style={textField}>
                {(Object.keys(TYPE_LABEL) as CalendarEventType[]).map((t) => (
                  <option key={t} value={t}>{TYPE_LABEL[t]}</option>
                ))}
              </select>
            </Field>
            <Field label="All-day">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d6d2c4', fontSize: '0.9rem', padding: '0.6rem 0' }}>
                <input
                  type="checkbox"
                  checked={allDay}
                  onChange={(e) => setAllDay(e.target.checked)}
                />
                {allDay ? 'All day' : 'Timed'}
              </label>
            </Field>
            {!allDay && (
              <>
                <Field label="Start time">
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={textField} />
                </Field>
                <Field label="End time">
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={textField} />
                </Field>
              </>
            )}
            <Field label="Related customer (optional)" full>
              <select
                value={relatedCustomerId}
                onChange={(e) => setRelatedCustomerId(e.target.value)}
                style={textField}
              >
                <option value="">— None —</option>
                {customers.map((c) => (
                  <option key={c.customerId} value={c.customerId}>
                    {c.firstName} {c.lastName}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Notes" full>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ ...textField, resize: 'vertical', fontFamily: 'inherit' }}
              />
            </Field>
          </div>

          <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="ss-btn-ghost">Cancel</button>
            <button type="submit" disabled={busy} className="ss-btn-primary" style={{ opacity: busy ? 0.6 : 1 }}>
              {busy ? 'Saving…' : 'Add Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label style={{ display: 'block', gridColumn: full ? '1 / -1' : undefined }}>
      <div
        style={{
          fontSize: '0.62rem',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#c9a84c',
          marginBottom: '0.3rem',
        }}
      >
        {label}
      </div>
      {children}
    </label>
  );
}

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.65)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100,
  padding: '1.5rem',
};

const modalCard: React.CSSProperties = {
  background: '#0a0f1e',
  border: '1px solid rgba(201,168,76,0.25)',
  borderRadius: 2,
  padding: '1.5rem',
  width: '100%',
  maxWidth: 720,
  maxHeight: '90vh',
  overflowY: 'auto',
};

const modalHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '1rem',
  marginBottom: '1.25rem',
};

const closeButton: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(201,168,76,0.4)',
  color: '#c9a84c',
  padding: '0.4rem 0.6rem',
  borderRadius: 2,
  cursor: 'pointer',
};

const textField: React.CSSProperties = {
  width: '100%',
  background: '#0a0f1e',
  border: '1px solid rgba(201,168,76,0.25)',
  color: '#ffffff',
  padding: '0.6rem 0.7rem',
  fontSize: '0.88rem',
  borderRadius: 2,
  outline: 'none',
};
