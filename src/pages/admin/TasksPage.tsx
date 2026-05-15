import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { format } from 'date-fns';
import { useAuthUser } from '@/lib/auth';
import { listTechs } from '@/lib/staff';
import {
  createTask,
  deleteTask,
  listenTasks,
  toggleTaskDone,
  updateTask,
  type TaskInput,
} from '@/lib/tasks';
import type { StaffMember, Task, TaskPriority } from '@/types/portal';

const PRIORITY_ORDER: Record<TaskPriority, number> = { high: 0, normal: 1, low: 2 };

const PRIORITY_COLOR: Record<TaskPriority, { fg: string; bg: string }> = {
  high: { fg: '#f0a5a5', bg: 'rgba(240,165,165,0.12)' },
  normal: { fg: '#c9a84c', bg: 'rgba(201,168,76,0.12)' },
  low: { fg: '#8b95a7', bg: 'rgba(139,149,167,0.12)' },
};

export function TasksPage() {
  const { user } = useAuthUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [techs, setTechs] = useState<StaffMember[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [showDone, setShowDone] = useState(false);

  useEffect(() => {
    const unsub = listenTasks(setTasks);
    return unsub;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const t = await listTechs();
        if (!cancelled) setTechs(t);
      } catch {
        if (!cancelled) setTechs([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const todayISO = format(new Date(), 'yyyy-MM-dd');

  const sorted = useMemo(() => {
    const open = tasks.filter((t) => t.status === 'open');
    const done = tasks.filter((t) => t.status === 'done');
    open.sort((a, b) => {
      const aOver = isOverdue(a, todayISO) ? 0 : 1;
      const bOver = isOverdue(b, todayISO) ? 0 : 1;
      if (aOver !== bOver) return aOver - bOver;
      const da = a.dueDate ?? '9999-12-31';
      const dbd = b.dueDate ?? '9999-12-31';
      if (da !== dbd) return da.localeCompare(dbd);
      return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    });
    // done already sorted by createdAt desc from the listener; that's fine
    return { open, done };
  }, [tasks, todayISO]);

  const currentUser = {
    uid: user?.uid ?? '',
    name: user?.displayName || user?.email || 'Admin',
  };

  return (
    <div>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: '1rem',
          flexWrap: 'wrap',
          marginBottom: '1.75rem',
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
            Tasks
          </div>
          <h1
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 'clamp(1.75rem, 3.4vw, 2.4rem)',
              fontWeight: 300,
            }}
          >
            Open tasks
          </h1>
        </div>
        <button onClick={() => setShowAdd(true)} className="ss-btn-primary">
          + Add task
        </button>
      </header>

      <Section title={`Open (${sorted.open.length})`}>
        {sorted.open.length === 0 ? (
          <Empty>No open tasks. Take a breath.</Empty>
        ) : (
          <ul style={listStyle}>
            {sorted.open.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                todayISO={todayISO}
                onEdit={() => setEditTask(t)}
              />
            ))}
          </ul>
        )}
      </Section>

      <Section
        title={`Done (${sorted.done.length})`}
        trailing={
          <button
            onClick={() => setShowDone((v) => !v)}
            className="ss-btn-ghost"
            style={{ padding: '0.4rem 0.7rem' }}
          >
            {showDone ? 'Hide' : 'Show'}
          </button>
        }
      >
        {showDone ? (
          sorted.done.length === 0 ? (
            <Empty>Nothing completed yet.</Empty>
          ) : (
            <ul style={listStyle}>
              {sorted.done.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  todayISO={todayISO}
                  onEdit={() => setEditTask(t)}
                />
              ))}
            </ul>
          )
        ) : null}
      </Section>

      {showAdd && (
        <TaskModal
          mode="create"
          techs={techs}
          currentUser={currentUser}
          onClose={() => setShowAdd(false)}
          onSubmitted={() => setShowAdd(false)}
        />
      )}
      {editTask && (
        <TaskModal
          mode="edit"
          task={editTask}
          techs={techs}
          currentUser={currentUser}
          onClose={() => setEditTask(null)}
          onSubmitted={() => setEditTask(null)}
        />
      )}
    </div>
  );
}

function TaskRow({
  task,
  todayISO,
  onEdit,
}: {
  task: Task;
  todayISO: string;
  onEdit: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const overdue = task.status === 'open' && isOverdue(task, todayISO);

  async function onToggle() {
    setBusy(true);
    try {
      await toggleTaskDone(task.id, task.status);
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!confirm(`Delete task "${task.title}"?`)) return;
    await deleteTask(task.id);
  }

  const priColor = PRIORITY_COLOR[task.priority];

  return (
    <li
      style={{
        background: '#0a0f1e',
        border: '1px solid rgba(201,168,76,0.18)',
        borderRadius: 2,
        padding: '0.85rem 1rem',
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto auto',
        gap: '0.85rem',
        alignItems: 'center',
      }}
    >
      <button
        onClick={() => void onToggle()}
        disabled={busy}
        aria-label={task.status === 'done' ? 'Mark open' : 'Mark done'}
        style={{
          width: 22,
          height: 22,
          borderRadius: 2,
          border: '1px solid rgba(201,168,76,0.5)',
          background: task.status === 'done' ? '#c9a84c' : 'transparent',
          color: '#0a0f1e',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.85rem',
        }}
      >
        {task.status === 'done' ? '✓' : ''}
      </button>

      <div>
        <div
          style={{
            fontSize: '0.95rem',
            color: task.status === 'done' ? '#8b95a7' : '#ffffff',
            textDecoration: task.status === 'done' ? 'line-through' : 'none',
            cursor: 'pointer',
          }}
          onClick={onEdit}
        >
          {task.title}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
          <Pill bg={priColor.bg} fg={priColor.fg}>{task.priority}</Pill>
          {task.dueDate && (
            <Pill
              bg={overdue ? 'rgba(240,165,165,0.12)' : 'rgba(139,149,167,0.12)'}
              fg={overdue ? '#f0a5a5' : '#8b95a7'}
            >
              {overdue ? 'Overdue · ' : ''}{formatDueDate(task.dueDate)}
            </Pill>
          )}
          <Pill bg="rgba(201,168,76,0.08)" fg="#a8a08e">
            {task.assignedToName || 'Anyone'}
          </Pill>
          {task.source === 'claude' && (
            <Pill bg="rgba(127,203,138,0.12)" fg="#7fcb8a">via Claude</Pill>
          )}
        </div>
      </div>

      <button onClick={onEdit} className="ss-btn-ghost" style={{ padding: '0.4rem 0.7rem' }}>
        Edit
      </button>
      <button
        onClick={() => void onDelete()}
        aria-label="Delete"
        style={{
          background: 'transparent',
          border: '1px solid rgba(240,165,165,0.35)',
          color: '#f0a5a5',
          padding: '0.4rem 0.6rem',
          borderRadius: 2,
          cursor: 'pointer',
          fontSize: '0.78rem',
        }}
      >
        ✕
      </button>
    </li>
  );
}

function TaskModal({
  mode,
  task,
  techs,
  currentUser,
  onClose,
  onSubmitted,
}: {
  mode: 'create' | 'edit';
  task?: Task;
  techs: StaffMember[];
  currentUser: { uid: string; name: string };
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [notes, setNotes] = useState(task?.notes ?? '');
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'normal');
  const [assignee, setAssignee] = useState<string>(task?.assignedToUid ?? '');
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
      const tech = techs.find((t) => t.uid === assignee);
      if (mode === 'create') {
        const input: TaskInput = {
          title: title.trim(),
          notes: notes.trim() || undefined,
          dueDate: dueDate || null,
          priority,
          assignedToUid: assignee || null,
          assignedToName: tech ? `${tech.firstName} ${tech.lastName}`.trim() : undefined,
          source: 'admin',
          createdByUid: currentUser.uid,
          createdByName: currentUser.name,
        };
        await createTask(input);
      } else if (task) {
        const patch: Partial<TaskInput> = {
          title: title.trim(),
          notes: notes.trim() || undefined,
          dueDate: dueDate || null,
          priority,
          assignedToUid: assignee || null,
          assignedToName: tech ? `${tech.firstName} ${tech.lastName}`.trim() : undefined,
        };
        await updateTask(task.id, patch);
      }
      onSubmitted();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save task.');
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
              {mode === 'create' ? 'New Task' : 'Edit Task'}
            </div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.5rem', fontWeight: 300 }}>
              {mode === 'create' ? 'Add to the list' : 'Update task'}
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
            <Field label="Due date">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={textField}
              />
            </Field>
            <Field label="Priority">
              <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} style={textField}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </Field>
            <Field label="Assign to">
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                style={textField}
              >
                <option value="">Anyone</option>
                {techs.map((t) => (
                  <option key={t.uid} value={t.uid}>{t.firstName} {t.lastName}</option>
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
              {busy ? 'Saving…' : mode === 'create' ? 'Add Task' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Section({
  title,
  trailing,
  children,
}: {
  title: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: '1.5rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: '0.6rem',
        }}
      >
        <div
          style={{
            fontSize: '0.62rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#c9a84c',
          }}
        >
          {title}
        </div>
        {trailing}
      </div>
      {children}
    </section>
  );
}

function Pill({
  children,
  bg,
  fg,
}: {
  children: React.ReactNode;
  bg: string;
  fg: string;
}) {
  return (
    <span
      style={{
        padding: '0.2rem 0.5rem',
        fontSize: '0.62rem',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        borderRadius: 2,
        background: bg,
        color: fg,
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
        background: '#0a0f1e',
        border: '1px solid rgba(201,168,76,0.18)',
        borderRadius: 2,
        padding: '2rem 1.5rem',
        textAlign: 'center',
        color: '#8b95a7',
        fontSize: '0.9rem',
      }}
    >
      {children}
    </div>
  );
}

function isOverdue(task: Task, todayISO: string): boolean {
  if (task.status !== 'open' || !task.dueDate) return false;
  return task.dueDate < todayISO;
}

function formatDueDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return format(new Date(y, m - 1, d), 'MMM d');
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

const listStyle: React.CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'grid',
  gap: '0.5rem',
};

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
  maxWidth: 640,
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
