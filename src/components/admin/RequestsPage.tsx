import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
  listServiceRequests,
  SERVICE_REQUEST_STATUSES,
  updateServiceRequestStatus,
} from '@/lib/serviceRequests';
import type { ServiceRequest, ServiceRequestStatus } from '@/types/portal';

const STATUS_LABEL: Record<ServiceRequestStatus, string> = {
  new: 'New',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

const STATUS_COLOR: Record<ServiceRequestStatus, { fg: string; bg: string }> = {
  new: { fg: '#e8c97a', bg: 'rgba(232,201,122,0.12)' },
  in_progress: { fg: '#7fcb8a', bg: 'rgba(127,203,138,0.12)' },
  resolved: { fg: '#8b95a7', bg: 'rgba(139,149,167,0.12)' },
  closed: { fg: '#5a6373', bg: 'rgba(139,149,167,0.08)' },
};

export function AdminRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function reload() {
    setErr(null);
    try {
      const list = await listServiceRequests({ max: 100 });
      setRequests(list);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load service requests.');
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function onStatusChange(id: string, next: ServiceRequestStatus) {
    setRequests((curr) =>
      curr ? curr.map((r) => (r.requestId === id ? { ...r, status: next } : r)) : curr,
    );
    try {
      await updateServiceRequestStatus(id, next);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not update status.');
      await reload();
    }
  }

  return (
    <div>
      <header style={{ marginBottom: '1.75rem' }}>
        <div
          style={{
            fontSize: '0.65rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#c9a84c',
            marginBottom: '0.5rem',
          }}
        >
          Service Requests
        </div>
        <h1
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(1.75rem, 3.4vw, 2.4rem)',
            fontWeight: 300,
          }}
        >
          All customer requests
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
            marginBottom: '1rem',
            borderRadius: 2,
          }}
        >
          {err}
        </div>
      )}

      {requests === null ? (
        <Empty>Loading…</Empty>
      ) : requests.length === 0 ? (
        <Empty>No service requests yet.</Empty>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.6rem' }}>
          {requests.map((r) => (
            <RequestRow
              key={r.requestId}
              request={r}
              expanded={expandedId === r.requestId}
              onToggle={() => setExpandedId((curr) => (curr === r.requestId ? null : r.requestId))}
              onStatusChange={(next) => void onStatusChange(r.requestId, next)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function RequestRow({
  request,
  expanded,
  onToggle,
  onStatusChange,
}: {
  request: ServiceRequest;
  expanded: boolean;
  onToggle: () => void;
  onStatusChange: (next: ServiceRequestStatus) => void;
}) {
  const color = STATUS_COLOR[request.status];
  const customerLabel = request.customerName?.trim()
    ? request.customerName
    : request.customerEmail || (request.customerId ? `Customer ${request.customerId.slice(0, 6)}…` : 'Unknown customer');

  const titleLine = request.title?.trim()
    ? request.title
    : truncate(request.body ?? '', 80) || 'No description';

  return (
    <li
      style={{
        background: '#0a0f1e',
        border: '1px solid rgba(201,168,76,0.18)',
        borderRadius: 2,
      }}
    >
      <button
        onClick={onToggle}
        style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 2fr 0.9fr 0.9fr auto',
          gap: '0.75rem',
          width: '100%',
          padding: '0.85rem 1.1rem',
          background: 'transparent',
          border: 'none',
          color: '#ffffff',
          textAlign: 'left',
          cursor: 'pointer',
          alignItems: 'center',
          fontFamily: 'inherit',
        }}
      >
        <div>
          <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.05rem', fontWeight: 300 }}>
            {customerLabel}
          </div>
          {request.customerEmail && (
            <div style={{ color: '#8b95a7', fontSize: '0.75rem' }}>{request.customerEmail}</div>
          )}
        </div>
        <div style={{ fontSize: '0.85rem', color: '#d6d2c4' }}>{titleLine}</div>
        <div>
          <span
            style={{
              padding: '0.25rem 0.55rem',
              fontSize: '0.62rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              borderRadius: 2,
              background: color.bg,
              color: color.fg,
            }}
          >
            {STATUS_LABEL[request.status]}
          </span>
        </div>
        <div style={{ color: '#8b95a7', fontSize: '0.78rem' }}>{formatCreatedAt(request)}</div>
        <span style={{ color: '#c9a84c', fontSize: '0.78rem' }}>{expanded ? '−' : '+'}</span>
      </button>

      {expanded && (
        <div style={{ padding: '0 1.1rem 1.1rem' }}>
          <div
            style={{
              borderTop: '0.5px solid rgba(201,168,76,0.15)',
              paddingTop: '1rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '0.75rem 1.25rem',
            }}
          >
            <Detail label="Status">
              <select
                value={request.status}
                onChange={(e) => onStatusChange(e.target.value as ServiceRequestStatus)}
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: '#0a0f1e',
                  border: '1px solid rgba(201,168,76,0.25)',
                  color: '#ffffff',
                  padding: '0.45rem 0.55rem',
                  fontSize: '0.85rem',
                  borderRadius: 2,
                  outline: 'none',
                }}
              >
                {SERVICE_REQUEST_STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                ))}
              </select>
            </Detail>
            {request.category && <Detail label="Category">{request.category}</Detail>}
            {request.urgency && <Detail label="Urgency">{request.urgency}</Detail>}
            {request.customerId && <Detail label="Customer ID">{request.customerId}</Detail>}
            {request.body && (
              <div style={{ gridColumn: '1 / -1' }}>
                <Detail label="Description">
                  <p style={{ color: '#ffffff', fontSize: '0.92rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {request.body}
                  </p>
                </Detail>
              </div>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: '0.62rem',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: '#c9a84c',
          marginBottom: '0.3rem',
        }}
      >
        {label}
      </div>
      <div style={{ color: '#d6d2c4', fontSize: '0.88rem' }}>{children}</div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#0a0f1e',
        border: '1px solid rgba(201,168,76,0.18)',
        borderRadius: 2,
        padding: '3rem 1.5rem',
        textAlign: 'center',
        color: '#8b95a7',
        fontSize: '0.95rem',
        lineHeight: 1.7,
      }}
    >
      {children}
    </div>
  );
}

function truncate(text: string, n: number): string {
  if (text.length <= n) return text;
  return text.slice(0, n - 1).trimEnd() + '…';
}

function formatCreatedAt(r: ServiceRequest): string {
  const t = r.createdAt;
  if (t && typeof t.toDate === 'function') {
    return format(t.toDate(), 'MMM d · h:mma');
  }
  return '—';
}
