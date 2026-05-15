/**
 * Stable Services — remote MCP server, hosted as a Cloudflare Worker.
 *
 * Exposes four tools to a connecting MCP client (e.g. claude.ai):
 *   - add_task              → create a task in Firestore /tasks
 *   - add_calendar_event    → create an event in Firestore /calendarEvents
 *   - list_today            → today's visits + tasks + events
 *   - complete_task         → flip a task to status:'done'
 *
 * Transport: streamable HTTP (single endpoint). We accept POST with a
 * JSON-RPC body and respond synchronously. No SSE — keeps the Worker
 * stateless and free-tier friendly.
 *
 * Auth: every request must include `Authorization: Bearer <MCP_BEARER_TOKEN>`.
 * Configure it via `wrangler secret put MCP_BEARER_TOKEN`.
 */

import { handleMcpRequest } from './mcp';

export interface Env {
  FIRESTORE_PROJECT_ID: string;
  FIREBASE_SERVICE_ACCOUNT_JSON: string; // secret
  MCP_BEARER_TOKEN: string; // secret
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (req.method === 'GET' && url.pathname === '/') {
      return new Response('Stable Services MCP — POST JSON-RPC to /mcp', {
        status: 200,
        headers: { 'content-type': 'text/plain' },
      });
    }

    if (req.method === 'GET' && url.pathname === '/health') {
      return Response.json({ ok: true });
    }

    if (url.pathname !== '/mcp') {
      return new Response('Not found', { status: 404 });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', {
        status: 405,
        headers: { allow: 'POST' },
      });
    }

    // Bearer auth — fail closed.
    const auth = req.headers.get('authorization') ?? '';
    if (!env.MCP_BEARER_TOKEN || auth !== `Bearer ${env.MCP_BEARER_TOKEN}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return jsonRpcError(null, -32700, 'Parse error');
    }

    return handleMcpRequest(body, env);
  },
};

export function jsonRpcError(id: string | number | null, code: number, message: string): Response {
  return Response.json({ jsonrpc: '2.0', id, error: { code, message } }, { status: 200 });
}
