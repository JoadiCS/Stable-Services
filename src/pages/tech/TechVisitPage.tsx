import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  addVisitPhoto,
  completeVisit,
  getVisit,
  startVisit,
  updateVisitChecklist,
  updateVisitChemicals,
  updateVisitNotes,
} from '@/lib/visits';
import { uploadPhotoToCloudinary } from '@/lib/cloudinary';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { RANGE_COLORS, statusFor, type RangeKey } from '@/data/poolRanges';
import { usePoolRanges } from '@/lib/usePoolRanges';
import { useDebouncedSave, type SaveStatus } from '@/lib/useDebouncedSave';
import type {
  ChecklistItem,
  ChemicalAddition,
  ChemicalReadings,
  PhotoType,
  Visit,
  VisitPhoto,
} from '@/types/portal';
import { TechShell } from './TechShell';

const PHOTO_TYPES: PhotoType[] = ['before', 'after', 'issue', 'other'];

const READINGS_KEYS: RangeKey[] = [
  'ph',
  'chlorineFree',
  'chlorineTotal',
  'alkalinity',
  'calciumHardness',
  'cyanuricAcid',
  'salt',
  'tds',
];

export function TechVisitPage() {
  const { visitId } = useParams<{ visitId: string }>();
  const navigate = useNavigate();

  const [visit, setVisit] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<'start' | 'complete' | null>(null);

  const reload = useCallback(async () => {
    if (!visitId) return;
    const v = await getVisit(visitId);
    setVisit(v);
  }, [visitId]);

  useEffect(() => {
    if (!visitId) return;
    let cancelled = false;
    setLoading(true);
    setErr(null);
    (async () => {
      try {
        const v = await getVisit(visitId);
        if (!cancelled) setVisit(v);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Could not load visit.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visitId]);

  async function onStart() {
    if (!visit) return;
    setBusyAction('start');
    try {
      await startVisit(visit.visitId);
      await reload();
    } finally {
      setBusyAction(null);
    }
  }

  async function onComplete() {
    if (!visit) return;
    setBusyAction('complete');
    try {
      await completeVisit(visit.visitId);
      await reload();
      navigate('/tech/route');
    } finally {
      setBusyAction(null);
    }
  }

  if (loading) {
    return (
      <TechShell>
        <CenterNote>Loading visit…</CenterNote>
      </TechShell>
    );
  }

  if (err) {
    return (
      <TechShell>
        <CenterNote>{err}</CenterNote>
      </TechShell>
    );
  }

  if (!visit) {
    return (
      <TechShell>
        <CenterNote>
          Visit not found.{' '}
          <Link to="/tech/route" style={{ color: '#c9a84c' }}>
            Back to route →
          </Link>
        </CenterNote>
      </TechShell>
    );
  }

  return (
    <TechShell>
      <VisitHeader visit={visit} />
      <StatusActions
        visit={visit}
        onStart={onStart}
        onComplete={onComplete}
        busyAction={busyAction}
      />
      <ChecklistSection visit={visit} onUpdate={setVisit} />
      {visit.serviceType === 'pool' && (
        <>
          <ChemicalsSection visit={visit} onUpdate={setVisit} />
          <ChemicalsAddedSection visit={visit} onUpdate={setVisit} />
        </>
      )}
      <PhotosSection visit={visit} onUpdate={setVisit} />
      <NotesSection visit={visit} onUpdate={setVisit} />
      <StickyCompleteBar
        visit={visit}
        onComplete={onComplete}
        busy={busyAction === 'complete'}
      />
    </TechShell>
  );
}

/* ─────────────────────────── Header ─────────────────────────── */
function VisitHeader({ visit }: { visit: Visit }) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(visit.customerAddress)}`;
  return (
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
        {visit.scheduledDate} · {visit.scheduledWindow}
      </div>
      <h1
        style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(1.6rem, 4.5vw, 2.1rem)',
          fontWeight: 300,
          lineHeight: 1.1,
          marginBottom: '0.4rem',
        }}
      >
        {visit.customerName}
      </h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
        <div style={{ fontSize: '0.85rem', color: '#8b95a7' }}>{visit.customerAddress}</div>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: '0.7rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#c9a84c',
            textDecoration: 'none',
            border: '1px solid rgba(201,168,76,0.4)',
            padding: '0.3rem 0.6rem',
            borderRadius: 2,
          }}
        >
          Open in Maps →
        </a>
      </div>
    </header>
  );
}

/* ─────────────────────────── Status pills + actions ─────────────────────────── */
function StatusActions({
  visit,
  onStart,
  onComplete,
  busyAction,
}: {
  visit: Visit;
  onStart: () => void;
  onComplete: () => void;
  busyAction: 'start' | 'complete' | null;
}) {
  return (
    <Section>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        {(['scheduled', 'in_progress', 'completed'] as const).map((s) => (
          <span
            key={s}
            style={{
              padding: '0.3rem 0.7rem',
              borderRadius: 2,
              fontSize: '0.7rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              border: '1px solid rgba(201,168,76,0.25)',
              background: visit.status === s ? '#c9a84c' : 'transparent',
              color: visit.status === s ? '#0a0f1e' : '#8b95a7',
              fontWeight: visit.status === s ? 500 : 400,
            }}
          >
            {s === 'in_progress' ? 'In progress' : s.charAt(0).toUpperCase() + s.slice(1)}
          </span>
        ))}
        <div style={{ flex: 1 }} />
        {visit.status === 'scheduled' && (
          <button
            onClick={onStart}
            disabled={busyAction === 'start'}
            className="ss-btn-primary"
            style={{ opacity: busyAction === 'start' ? 0.6 : 1 }}
          >
            {busyAction === 'start' ? 'Starting…' : 'Start Visit'}
          </button>
        )}
        {visit.status === 'in_progress' && (
          <button
            onClick={onComplete}
            disabled={busyAction === 'complete'}
            className="ss-btn-primary"
            style={{ opacity: busyAction === 'complete' ? 0.6 : 1 }}
          >
            {busyAction === 'complete' ? 'Completing…' : 'Complete Visit'}
          </button>
        )}
      </div>
    </Section>
  );
}

/* ─────────────────────────── Checklist ─────────────────────────── */
function ChecklistSection({
  visit,
  onUpdate,
}: {
  visit: Visit;
  onUpdate: (v: Visit) => void;
}) {
  const items = visit.checklist ?? [];
  const done = items.filter((i) => i.completed).length;
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggle(item: ChecklistItem) {
    setBusyId(item.id);
    const next = items.map((i) =>
      i.id === item.id ? { ...i, completed: !i.completed, completedAt: null } : i,
    );
    onUpdate({ ...visit, checklist: next });
    try {
      await updateVisitChecklist(visit.visitId, next);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Section title="Checklist" trailing={`${done} of ${items.length} complete`}>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {items.map((item) => (
          <li key={item.id} style={{ marginBottom: '0.25rem' }}>
            <button
              onClick={() => void toggle(item)}
              disabled={busyId === item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.7rem',
                width: '100%',
                padding: '0.65rem 0.5rem',
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 2,
                  border: '1px solid rgba(201,168,76,0.5)',
                  background: item.completed ? '#c9a84c' : 'transparent',
                  color: '#0a0f1e',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  flexShrink: 0,
                }}
              >
                {item.completed ? '✓' : ''}
              </span>
              <span
                style={{
                  fontSize: '0.92rem',
                  color: item.completed ? '#8b95a7' : '#ffffff',
                  textDecoration: item.completed ? 'line-through' : 'none',
                }}
              >
                {item.label}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ─────────────────────────── Chemical readings (pool) ─────────────────────────── */
function ChemicalsSection({
  visit,
  onUpdate,
}: {
  visit: Visit;
  onUpdate: (v: Visit) => void;
}) {
  const [readings, setReadings] = useState<ChemicalReadings>(visit.chemicalReadings ?? {});
  const additionsRef = useRef<ChemicalAddition[]>(visit.chemicalsAdded ?? []);
  const { status, schedule } = useDebouncedSave();
  const ranges = usePoolRanges();

  // Keep ref in sync if visit changes externally
  useEffect(() => {
    additionsRef.current = visit.chemicalsAdded ?? [];
  }, [visit.chemicalsAdded]);

  function onField(key: RangeKey, raw: string) {
    const value = raw === '' ? undefined : Number(raw);
    const next = { ...readings, [key]: value };
    setReadings(next);
    schedule(async () => {
      await updateVisitChemicals(visit.visitId, next, additionsRef.current);
      onUpdate({ ...visit, chemicalReadings: next });
    });
  }

  return (
    <Section title="Chemical Readings" trailing={<SaveBadge status={status} />}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem',
        }}
      >
        {READINGS_KEYS.map((key) => {
          const spec = ranges[key];
          const value = readings[key];
          const st = statusFor(key, value);
          const color = RANGE_COLORS[st];
          return (
            <label key={key} style={{ display: 'block' }}>
              <div
                style={{
                  fontSize: '0.65rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: '#c9a84c',
                  marginBottom: '0.35rem',
                }}
              >
                {spec.label}
              </div>
              <input
                type="number"
                inputMode="decimal"
                step={key === 'ph' ? 0.1 : 1}
                value={value === undefined || Number.isNaN(value) ? '' : value}
                onChange={(e) => onField(key, e.target.value)}
                style={{
                  width: '100%',
                  background: '#0a0f1e',
                  border: '1px solid rgba(201,168,76,0.25)',
                  color: '#ffffff',
                  padding: '0.65rem 0.7rem',
                  fontSize: '0.92rem',
                  borderRadius: 2,
                  outline: 'none',
                }}
              />
              <div
                style={{
                  marginTop: '0.3rem',
                  fontSize: '0.65rem',
                  color: color.fg,
                  background: color.bg,
                  padding: '0.25rem 0.4rem',
                  borderRadius: 2,
                  letterSpacing: '0.06em',
                }}
              >
                {spec.hint} {value !== undefined && st !== 'unknown' ? `· ${st.replace('-', ' ')}` : ''}
              </div>
            </label>
          );
        })}
      </div>
    </Section>
  );
}

/* ─────────────────────────── Chemicals added (pool) ─────────────────────────── */
function ChemicalsAddedSection({
  visit,
  onUpdate,
}: {
  visit: Visit;
  onUpdate: (v: Visit) => void;
}) {
  const [rows, setRows] = useState<ChemicalAddition[]>(visit.chemicalsAdded ?? []);
  const readingsRef = useRef<ChemicalReadings>(visit.chemicalReadings ?? {});
  const { status, schedule } = useDebouncedSave();

  useEffect(() => {
    readingsRef.current = visit.chemicalReadings ?? {};
  }, [visit.chemicalReadings]);

  function commit(next: ChemicalAddition[]) {
    setRows(next);
    schedule(async () => {
      await updateVisitChemicals(visit.visitId, readingsRef.current, next);
      onUpdate({ ...visit, chemicalsAdded: next });
    });
  }

  function updateRow(i: number, patch: Partial<ChemicalAddition>) {
    commit(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function addRow() {
    commit([...rows, { name: '', amount: '', reason: '' }]);
  }
  function removeRow(i: number) {
    commit(rows.filter((_, idx) => idx !== i));
  }

  return (
    <Section title="Chemicals Added" trailing={<SaveBadge status={status} />}>
      {rows.length === 0 ? (
        <p style={{ color: '#8b95a7', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
          No chemicals added yet.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', margin: '0 0 0.75rem', padding: 0 }}>
          {rows.map((r, i) => (
            <li
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1.5fr auto',
                gap: '0.5rem',
                marginBottom: '0.5rem',
                alignItems: 'center',
              }}
            >
              <input
                placeholder="Name (e.g. Chlorine)"
                value={r.name}
                onChange={(e) => updateRow(i, { name: e.target.value })}
                style={smallField}
              />
              <input
                placeholder="Amount"
                value={r.amount}
                onChange={(e) => updateRow(i, { amount: e.target.value })}
                style={smallField}
              />
              <input
                placeholder="Reason"
                value={r.reason}
                onChange={(e) => updateRow(i, { reason: e.target.value })}
                style={smallField}
              />
              <button
                onClick={() => removeRow(i)}
                aria-label="Remove row"
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(240,165,165,0.35)',
                  color: '#f0a5a5',
                  padding: '0.45rem 0.6rem',
                  borderRadius: 2,
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                }}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      <button onClick={addRow} className="ss-btn-ghost">
        + Add chemical
      </button>
    </Section>
  );
}

/* ─────────────────────────── Photos ─────────────────────────── */
function PhotosSection({
  visit,
  onUpdate,
}: {
  visit: Visit;
  onUpdate: (v: Visit) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setUploadError(null);
    try {
      for (const file of Array.from(files)) {
        const uploaded = await uploadPhotoToCloudinary(file, visit.visitId);
        const photo: VisitPhoto = {
          publicId: uploaded.publicId,
          secureUrl: uploaded.secureUrl,
          type: 'other',
        };
        await addVisitPhoto(visit.visitId, photo);
        onUpdate({ ...visit, photos: [...(visit.photos ?? []), photo] });
      }
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  const photos = visit.photos ?? [];

  return (
    <Section title="Photos">
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          className="ss-btn-primary"
          style={{ opacity: busy ? 0.6 : 1 }}
        >
          {busy ? 'Uploading…' : '+ Take photo / Upload'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={(e) => void onFiles(e.target.files)}
          style={{ display: 'none' }}
        />
      </div>

      {uploadError && (
        <div
          style={{
            background: 'rgba(220,80,80,0.08)',
            border: '1px solid rgba(220,80,80,0.35)',
            color: '#f0a5a5',
            fontSize: '0.82rem',
            padding: '0.55rem 0.75rem',
            marginBottom: '0.75rem',
            borderRadius: 2,
          }}
        >
          {uploadError}
        </div>
      )}

      {photos.length === 0 ? (
        <p style={{ color: '#8b95a7', fontSize: '0.85rem' }}>No photos yet.</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '0.6rem',
          }}
        >
          {photos.map((p) => (
            <PhotoTile key={p.publicId} visit={visit} photo={p} onUpdate={onUpdate} />
          ))}
        </div>
      )}
    </Section>
  );
}

function PhotoTile({
  visit,
  photo,
  onUpdate,
}: {
  visit: Visit;
  photo: VisitPhoto;
  onUpdate: (v: Visit) => void;
}) {
  const { status, schedule } = useDebouncedSave({ delayMs: 600 });

  function applyPatch(patch: Partial<VisitPhoto>) {
    const next = (visit.photos ?? []).map((p) =>
      p.publicId === photo.publicId ? { ...p, ...patch } : p,
    );
    onUpdate({ ...visit, photos: next });
    schedule(async () => {
      await updateDoc(doc(db, 'visits', visit.visitId), { photos: next });
    });
  }

  return (
    <div
      style={{
        background: '#0a0f1e',
        border: '1px solid rgba(201,168,76,0.18)',
        borderRadius: 2,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <img
        src={photo.secureUrl}
        alt={photo.caption || photo.type}
        style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover' }}
      />
      <div style={{ padding: '0.5rem' }}>
        <select
          value={photo.type}
          onChange={(e) => applyPatch({ type: e.target.value as PhotoType })}
          style={tinyField}
        >
          {PHOTO_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          placeholder="Caption (optional)"
          value={photo.caption ?? ''}
          onChange={(e) => applyPatch({ caption: e.target.value })}
          style={{ ...tinyField, marginTop: 4 }}
        />
        <div
          style={{
            marginTop: 4,
            fontSize: '0.6rem',
            color: status === 'saved' ? '#7fcb8a' : '#8b95a7',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            minHeight: 12,
          }}
        >
          {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : status === 'error' ? 'Error' : ''}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Notes ─────────────────────────── */
function NotesSection({
  visit,
  onUpdate,
}: {
  visit: Visit;
  onUpdate: (v: Visit) => void;
}) {
  const [customerNotes, setCustomerNotes] = useState(visit.customerNotes ?? '');
  const [techNotes, setTechNotes] = useState(visit.techNotes ?? '');
  const { status: cStatus, schedule: scheduleC } = useDebouncedSave();
  const { status: tStatus, schedule: scheduleT } = useDebouncedSave();

  function onCustomer(text: string) {
    setCustomerNotes(text);
    scheduleC(async () => {
      await updateVisitNotes(visit.visitId, text, techNotes);
      onUpdate({ ...visit, customerNotes: text });
    });
  }
  function onTech(text: string) {
    setTechNotes(text);
    scheduleT(async () => {
      await updateVisitNotes(visit.visitId, customerNotes, text);
      onUpdate({ ...visit, techNotes: text });
    });
  }

  return (
    <Section title="Notes">
      <div style={{ marginBottom: '0.9rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.35rem',
          }}
        >
          <label
            style={{
              fontSize: '0.65rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#c9a84c',
            }}
          >
            Customer-facing notes
          </label>
          <SaveBadge status={cStatus} />
        </div>
        <textarea
          rows={3}
          value={customerNotes}
          onChange={(e) => onCustomer(e.target.value)}
          placeholder="Visible on the Stable Report."
          style={{ ...noteField, border: '1px solid rgba(201,168,76,0.55)' }}
        />
      </div>
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.35rem',
          }}
        >
          <label
            style={{
              fontSize: '0.65rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#f0a5a5',
            }}
          >
            Internal notes (never shown to customer)
          </label>
          <SaveBadge status={tStatus} />
        </div>
        <textarea
          rows={3}
          value={techNotes}
          onChange={(e) => onTech(e.target.value)}
          placeholder="Internal only."
          style={{ ...noteField, border: '1px solid rgba(240,165,165,0.55)' }}
        />
      </div>
    </Section>
  );
}

/* ─────────────────────────── Sticky bottom bar ─────────────────────────── */
function StickyCompleteBar({
  visit,
  onComplete,
  busy,
}: {
  visit: Visit;
  onComplete: () => void;
  busy: boolean;
}) {
  const allChecked = (visit.checklist ?? []).every((i) => i.completed);
  const poolReady =
    visit.serviceType !== 'pool' ||
    (visit.chemicalReadings?.ph !== undefined &&
      visit.chemicalReadings?.chlorineFree !== undefined);
  const disabled = !allChecked || !poolReady || visit.status === 'completed' || busy;

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        padding: '0.75rem 1rem',
        background: 'rgba(10,15,30,0.95)',
        borderTop: '0.5px solid rgba(201,168,76,0.25)',
        backdropFilter: 'blur(6px)',
        zIndex: 30,
      }}
    >
      <div
        style={{
          maxWidth: 720,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <div style={{ flex: 1, fontSize: '0.72rem', color: '#8b95a7' }}>
          {visit.status === 'completed'
            ? 'Visit completed.'
            : disabled
              ? !allChecked
                ? 'Finish the checklist to enable.'
                : !poolReady
                  ? 'Record pH + Free Chlorine to enable.'
                  : ''
              : 'Ready to complete.'}
        </div>
        <button
          onClick={onComplete}
          disabled={disabled}
          className="ss-btn-primary"
          style={{ opacity: disabled ? 0.45 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
        >
          {busy ? 'Completing…' : 'Complete Visit'}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────── Shared bits ─────────────────────────── */
function Section({
  title,
  trailing,
  children,
}: {
  title?: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: '#111827',
        border: '1px solid rgba(201,168,76,0.18)',
        borderRadius: 2,
        padding: '1.1rem 1.1rem',
        marginBottom: '0.9rem',
      }}
    >
      {(title || trailing) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.8rem',
            gap: '0.75rem',
          }}
        >
          {title && (
            <div
              style={{
                fontSize: '0.65rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#c9a84c',
              }}
            >
              {title}
            </div>
          )}
          {trailing}
        </div>
      )}
      {children}
    </section>
  );
}

function SaveBadge({ status }: { status: SaveStatus }) {
  if (status === 'idle') return <span style={{ minWidth: 50 }} />;
  const color =
    status === 'saved' ? '#7fcb8a' : status === 'error' ? '#f0a5a5' : '#8b95a7';
  const label =
    status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : status === 'error' ? 'Error' : '';
  return (
    <span
      style={{
        fontSize: '0.62rem',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color,
      }}
    >
      {label}
    </span>
  );
}

function CenterNote({ children }: { children: React.ReactNode }) {
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

const smallField: React.CSSProperties = {
  background: '#0a0f1e',
  border: '1px solid rgba(201,168,76,0.25)',
  color: '#ffffff',
  padding: '0.55rem 0.6rem',
  fontSize: '0.85rem',
  borderRadius: 2,
  outline: 'none',
};

const tinyField: React.CSSProperties = {
  width: '100%',
  background: '#0a0f1e',
  border: '1px solid rgba(201,168,76,0.25)',
  color: '#ffffff',
  padding: '0.35rem 0.45rem',
  fontSize: '0.75rem',
  borderRadius: 2,
  outline: 'none',
};

const noteField: React.CSSProperties = {
  width: '100%',
  background: '#0a0f1e',
  color: '#ffffff',
  padding: '0.75rem 0.85rem',
  fontSize: '0.9rem',
  fontFamily: 'inherit',
  borderRadius: 2,
  outline: 'none',
  resize: 'vertical',
};
