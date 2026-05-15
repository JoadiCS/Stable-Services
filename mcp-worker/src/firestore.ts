/**
 * Firestore REST API helper for Cloudflare Workers.
 *
 * Authenticates with a Google service account via a self-signed JWT,
 * exchanges it for an OAuth access token, and caches the token in
 * memory until expiry. All crypto via the Web Crypto API — no Node
 * dependencies, free-tier compatible.
 *
 * NOTE: this is a minimal implementation; if traffic grows, swap the
 * in-memory token cache for a Workers KV cache so concurrent isolates
 * share the token.
 */

import type { Env } from './index';

interface ServiceAccount {
  type: 'service_account';
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  token_uri: string;
}

export interface FirestoreClient {
  projectId: string;
  accessToken: string;
  expiresAt: number; // unix seconds
}

let cachedToken: { token: string; expiresAt: number; clientEmail: string } | null = null;

export async function makeFirestoreClient(env: Env): Promise<FirestoreClient> {
  if (!env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON secret is not set.');
  }
  const sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON) as ServiceAccount;

  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.clientEmail === sa.client_email && cachedToken.expiresAt > now + 60) {
    return {
      projectId: env.FIRESTORE_PROJECT_ID || sa.project_id,
      accessToken: cachedToken.token,
      expiresAt: cachedToken.expiresAt,
    };
  }

  const jwt = await signServiceAccountJwt(sa);
  const tokenRes = await fetch(sa.token_uri, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    throw new Error(`Token exchange failed (${tokenRes.status}): ${text}`);
  }
  const tokenJson = (await tokenRes.json()) as { access_token: string; expires_in: number };
  const expiresAt = now + tokenJson.expires_in;
  cachedToken = { token: tokenJson.access_token, expiresAt, clientEmail: sa.client_email };
  return {
    projectId: env.FIRESTORE_PROJECT_ID || sa.project_id,
    accessToken: tokenJson.access_token,
    expiresAt,
  };
}

async function signServiceAccountJwt(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT', kid: sa.private_key_id };
  const payload = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: sa.token_uri,
    iat: now,
    exp: now + 3600,
  };
  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const keyData = pemToArrayBuffer(sa.private_key);
  const key = await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signingInput),
  );
  return `${signingInput}.${base64UrlEncode(new Uint8Array(sig))}`;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');
  const binary = atob(body);
  const buf = new ArrayBuffer(binary.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i);
  return buf;
}

/* ─────────────────────────── Firestore REST helpers ─────────────────────────── */

interface FirestoreValue {
  stringValue?: string;
  integerValue?: string;
  booleanValue?: boolean;
  nullValue?: null;
  timestampValue?: string;
  mapValue?: { fields: Record<string, FirestoreValue> };
}

function toFsValue(v: unknown): FirestoreValue {
  if (v === null) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'number') return { integerValue: String(Math.round(v)) };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (typeof v === 'object') {
    const fields: Record<string, FirestoreValue> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (val === undefined) continue;
      fields[k] = toFsValue(val);
    }
    return { mapValue: { fields } };
  }
  return { nullValue: null };
}

function fromFsValue(v: FirestoreValue | undefined): unknown {
  if (!v) return undefined;
  if ('stringValue' in v && v.stringValue !== undefined) return v.stringValue;
  if ('integerValue' in v && v.integerValue !== undefined) return Number(v.integerValue);
  if ('booleanValue' in v && v.booleanValue !== undefined) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('timestampValue' in v && v.timestampValue !== undefined) return v.timestampValue;
  if ('mapValue' in v && v.mapValue) {
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v.mapValue.fields ?? {})) {
      out[k] = fromFsValue(val);
    }
    return out;
  }
  return undefined;
}

function fsBaseUrl(fs: FirestoreClient): string {
  return `https://firestore.googleapis.com/v1/projects/${fs.projectId}/databases/(default)/documents`;
}

async function fsRequest(fs: FirestoreClient, path: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(`${fsBaseUrl(fs)}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${fs.accessToken}`,
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firestore ${res.status}: ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

/* ─────────────────────────── Tool implementations ─────────────────────────── */

export async function createTask(
  fs: FirestoreClient,
  input: {
    title: string;
    notes?: string;
    dueDate?: string | null;
    priority?: 'low' | 'normal' | 'high';
  },
): Promise<string> {
  const fields: Record<string, FirestoreValue> = {
    title: toFsValue(input.title),
    status: toFsValue('open'),
    priority: toFsValue(input.priority ?? 'normal'),
    source: toFsValue('claude'),
    createdByUid: toFsValue('mcp-worker'),
    createdByName: toFsValue('Claude (MCP)'),
    createdAt: toFsValue(new Date()),
  };
  if (input.notes) fields.notes = toFsValue(input.notes);
  if (input.dueDate !== undefined) fields.dueDate = toFsValue(input.dueDate);

  const result = (await fsRequest(fs, `/tasks`, {
    method: 'POST',
    body: JSON.stringify({ fields }),
  })) as { name: string };
  return result.name.split('/').pop() ?? '';
}

export async function createCalendarEvent(
  fs: FirestoreClient,
  input: {
    title: string;
    date: string;
    startTime?: string;
    endTime?: string;
    type?: 'reminder' | 'admin' | 'personal' | 'followup';
    notes?: string;
    relatedCustomerId?: string;
  },
): Promise<string> {
  const allDay = !input.startTime;
  const fields: Record<string, FirestoreValue> = {
    title: toFsValue(input.title),
    date: toFsValue(input.date),
    allDay: toFsValue(allDay),
    type: toFsValue(input.type ?? 'reminder'),
    source: toFsValue('claude'),
    createdByUid: toFsValue('mcp-worker'),
    createdByName: toFsValue('Claude (MCP)'),
    createdAt: toFsValue(new Date()),
  };
  if (input.startTime) fields.startTime = toFsValue(input.startTime);
  if (input.endTime) fields.endTime = toFsValue(input.endTime);
  if (input.notes) fields.notes = toFsValue(input.notes);
  if (input.relatedCustomerId) fields.relatedCustomerId = toFsValue(input.relatedCustomerId);

  const result = (await fsRequest(fs, `/calendarEvents`, {
    method: 'POST',
    body: JSON.stringify({ fields }),
  })) as { name: string };
  return result.name.split('/').pop() ?? '';
}

export async function completeTask(fs: FirestoreClient, taskId: string): Promise<void> {
  const path = `/tasks/${encodeURIComponent(taskId)}`;
  const updateMaskParams = '?updateMask.fieldPaths=status&updateMask.fieldPaths=completedAt';
  await fsRequest(fs, `${path}${updateMaskParams}`, {
    method: 'PATCH',
    body: JSON.stringify({
      fields: {
        status: toFsValue('done'),
        completedAt: toFsValue(new Date()),
      },
    }),
  });
}

export async function listToday(fs: FirestoreClient): Promise<unknown> {
  const todayISO = new Date().toISOString().slice(0, 10);
  const [visits, events, tasks] = await Promise.all([
    runQuery(fs, 'visits', [
      { fieldFilter: { field: { fieldPath: 'scheduledDate' }, op: 'EQUAL', value: { stringValue: todayISO } } },
    ]),
    runQuery(fs, 'calendarEvents', [
      { fieldFilter: { field: { fieldPath: 'date' }, op: 'EQUAL', value: { stringValue: todayISO } } },
    ]),
    runQuery(fs, 'tasks', [
      { fieldFilter: { field: { fieldPath: 'status' }, op: 'EQUAL', value: { stringValue: 'open' } } },
    ]),
  ]);
  return {
    date: todayISO,
    visits: visits.map(summarizeDoc),
    events: events.map(summarizeDoc),
    tasksDueOrOverdue: tasks
      .map(summarizeDoc)
      .filter((t) => {
        const d = (t as { dueDate?: string }).dueDate;
        return typeof d === 'string' && d <= todayISO;
      }),
  };
}

interface FieldFilter {
  fieldFilter: {
    field: { fieldPath: string };
    op: 'EQUAL';
    value: FirestoreValue;
  };
}

async function runQuery(
  fs: FirestoreClient,
  collectionId: string,
  filters: FieldFilter[],
): Promise<Array<{ name: string; fields: Record<string, FirestoreValue> }>> {
  const body = {
    structuredQuery: {
      from: [{ collectionId }],
      where:
        filters.length === 1
          ? filters[0]
          : { compositeFilter: { op: 'AND', filters } },
    },
  };
  const res = (await fsRequest(fs, ':runQuery', {
    method: 'POST',
    body: JSON.stringify(body),
  })) as Array<{ document?: { name: string; fields: Record<string, FirestoreValue> } }>;
  return res
    .filter((r): r is { document: { name: string; fields: Record<string, FirestoreValue> } } => !!r.document)
    .map((r) => r.document);
}

function summarizeDoc(d: { name: string; fields: Record<string, FirestoreValue> }): Record<string, unknown> {
  const id = d.name.split('/').pop();
  const out: Record<string, unknown> = { id };
  for (const [k, v] of Object.entries(d.fields ?? {})) {
    out[k] = fromFsValue(v);
  }
  return out;
}
