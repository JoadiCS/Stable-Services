# Stable Services — Remote MCP Worker

A Cloudflare Worker that hosts a remote [Model Context Protocol](https://modelcontextprotocol.io/) server. It exposes four tools that let Claude write to the Stable Services Firestore (`/tasks` and `/calendarEvents`) and read today's schedule.

Free tier compatible — the Worker uses only the built-in Web Crypto API and the Firestore REST API. No Cloud Functions, no Firebase Blaze plan required.

## Tools

| Tool                  | What it does                                                     |
| --------------------- | ---------------------------------------------------------------- |
| `add_task`            | Creates a doc in `/tasks` (source: `claude`).                    |
| `add_calendar_event`  | Creates a doc in `/calendarEvents` (source: `claude`).           |
| `list_today`          | Returns today's visits + events + open/overdue tasks.            |
| `complete_task`       | Sets a task to `status: 'done'` with `completedAt` server time.  |

## Deploy

1. **Install wrangler and dependencies** (only `wrangler` + Cloudflare types — both free):
   ```sh
   cd mcp-worker
   npm install
   npx wrangler login
   ```

2. **Create a Google service account** with the **Cloud Datastore User** role
   on the `stable-services` Firebase project. Download the JSON key file.

3. **Push the secrets** to the Worker:
   ```sh
   wrangler secret put FIREBASE_SERVICE_ACCOUNT_JSON
   # Paste the entire JSON file content when prompted.

   wrangler secret put MCP_BEARER_TOKEN
   # Type any long opaque string (e.g. `openssl rand -hex 32`).
   # This is what Claude will send in the Authorization header.
   ```

4. **Deploy**:
   ```sh
   npx wrangler deploy
   ```
   Wrangler prints a `https://stable-services-mcp.<your-subdomain>.workers.dev`
   URL — that's the MCP endpoint.

5. **Connect Claude**:
   - In claude.ai → Settings → Connectors → Custom MCP server.
   - URL: `https://<the URL>/mcp`
   - Auth: Bearer token = the value you set for `MCP_BEARER_TOKEN`.

## Local dev

```sh
npx wrangler dev
# Worker hot-reloads on http://localhost:8787
```

Smoke test:
```sh
curl -i -X POST http://localhost:8787/mcp \
  -H "Authorization: Bearer $MCP_BEARER_TOKEN" \
  -H "content-type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## Security

- Every request must carry `Authorization: Bearer <MCP_BEARER_TOKEN>`.
- The service account JSON only lives in Workers secrets storage — never in source.
- The Worker has **only** Cloud Datastore User scope. It can read/write Firestore but nothing else (no Auth admin, no Storage admin).
- Auth-token cache lives in memory per isolate; tokens expire in 1h.

## Cost

- Workers free plan: 100k requests/day, 10ms CPU per request. A single user's MCP traffic is trivially under this.
- Firestore: stays on Spark (free) plan. The REST API call counts as one read/write each.

## What's NOT done yet (intentional)

- No Workers KV cache for the OAuth token. Each isolate signs its own JWT on first request, which is fine for low traffic but wastes a few ms.
- No structured logging — `console.log` shows up in `wrangler tail`.
- No tool for *editing* a calendar event after creation; just create/list/complete.

Future-proofing notes (left for the deploy session):
- If we move beyond free tier, swap in `@modelcontextprotocol/sdk` for the wire protocol — currently a minimal hand-rolled JSON-RPC handler.
- If we add streaming responses, switch to the SSE transport rather than the synchronous POST path.
