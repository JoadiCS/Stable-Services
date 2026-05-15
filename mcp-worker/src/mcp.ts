/**
 * Minimal MCP server implementation for Cloudflare Workers.
 *
 * Implements just enough of the MCP wire protocol (JSON-RPC 2.0) to
 * answer `initialize`, `tools/list`, and `tools/call`. No SSE / no
 * notifications — every request gets a single JSON response.
 *
 * Adding new tools: register in TOOLS below and add a switch case in
 * callTool().
 */

import type { Env } from './index';
import { jsonRpcError } from './index';
import {
  completeTask,
  createTask,
  createCalendarEvent,
  listToday,
  type FirestoreClient,
  makeFirestoreClient,
} from './firestore';

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

interface ToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

const TOOLS: ToolDef[] = [
  {
    name: 'add_task',
    description: 'Create a task in the Stable Services admin task list. Used for to-dos and reminders that aren\'t tied to a specific calendar date.',
    inputSchema: {
      type: 'object',
      required: ['title'],
      properties: {
        title: { type: 'string', description: 'Short task title.' },
        notes: { type: 'string', description: 'Optional longer notes.' },
        dueDate: { type: 'string', description: 'ISO YYYY-MM-DD. Omit for no due date.' },
        priority: { type: 'string', enum: ['low', 'normal', 'high'], default: 'normal' },
      },
    },
  },
  {
    name: 'add_calendar_event',
    description: 'Add an event to the Stable Services calendar (reminders, admin blocks, follow-ups).',
    inputSchema: {
      type: 'object',
      required: ['title', 'date'],
      properties: {
        title: { type: 'string' },
        date: { type: 'string', description: 'ISO YYYY-MM-DD.' },
        startTime: { type: 'string', description: 'HH:mm, optional. If omitted the event is treated as all-day.' },
        endTime: { type: 'string', description: 'HH:mm, optional.' },
        type: { type: 'string', enum: ['reminder', 'admin', 'personal', 'followup'], default: 'reminder' },
        notes: { type: 'string' },
        relatedCustomerId: { type: 'string', description: 'Firestore customer doc id, optional.' },
      },
    },
  },
  {
    name: 'list_today',
    description: 'Return today\'s scheduled visits, calendar events, and open tasks (due today or overdue).',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'complete_task',
    description: 'Mark a task as done by id.',
    inputSchema: {
      type: 'object',
      required: ['taskId'],
      properties: { taskId: { type: 'string' } },
    },
  },
];

const SERVER_INFO = {
  name: 'stable-services-mcp',
  version: '0.1.0',
};

const PROTOCOL_VERSION = '2024-11-05';

export async function handleMcpRequest(body: unknown, env: Env): Promise<Response> {
  const req = body as JsonRpcRequest;
  if (!req || req.jsonrpc !== '2.0' || typeof req.method !== 'string') {
    return jsonRpcError(null, -32600, 'Invalid Request');
  }

  switch (req.method) {
    case 'initialize':
      return Response.json({
        jsonrpc: '2.0',
        id: req.id ?? null,
        result: {
          protocolVersion: PROTOCOL_VERSION,
          serverInfo: SERVER_INFO,
          capabilities: { tools: {} },
        },
      });

    case 'tools/list':
      return Response.json({
        jsonrpc: '2.0',
        id: req.id ?? null,
        result: { tools: TOOLS },
      });

    case 'tools/call': {
      const params = (req.params ?? {}) as { name?: string; arguments?: Record<string, unknown> };
      if (!params.name) return jsonRpcError(req.id ?? null, -32602, 'Missing tool name');
      try {
        const fs = await makeFirestoreClient(env);
        const result = await callTool(params.name, params.arguments ?? {}, fs);
        return Response.json({
          jsonrpc: '2.0',
          id: req.id ?? null,
          result: {
            content: [{ type: 'text', text: typeof result === 'string' ? result : JSON.stringify(result, null, 2) }],
          },
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : 'tool execution failed';
        return Response.json({
          jsonrpc: '2.0',
          id: req.id ?? null,
          result: {
            content: [{ type: 'text', text: `Error: ${message}` }],
            isError: true,
          },
        });
      }
    }

    case 'notifications/initialized':
      // Acknowledged. No-op for our stateless setup.
      return Response.json({ jsonrpc: '2.0', id: req.id ?? null, result: {} });

    default:
      return jsonRpcError(req.id ?? null, -32601, `Method not found: ${req.method}`);
  }
}

async function callTool(name: string, args: Record<string, unknown>, fs: FirestoreClient): Promise<unknown> {
  switch (name) {
    case 'add_task': {
      const title = String(args.title ?? '').trim();
      if (!title) throw new Error('title is required');
      const id = await createTask(fs, {
        title,
        notes: args.notes ? String(args.notes) : undefined,
        dueDate: args.dueDate ? String(args.dueDate) : null,
        priority: (args.priority as 'low' | 'normal' | 'high' | undefined) ?? 'normal',
      });
      return { ok: true, taskId: id, title };
    }

    case 'add_calendar_event': {
      const title = String(args.title ?? '').trim();
      const date = String(args.date ?? '').trim();
      if (!title || !date) throw new Error('title and date are required');
      const id = await createCalendarEvent(fs, {
        title,
        date,
        startTime: args.startTime ? String(args.startTime) : undefined,
        endTime: args.endTime ? String(args.endTime) : undefined,
        type: (args.type as 'reminder' | 'admin' | 'personal' | 'followup' | undefined) ?? 'reminder',
        notes: args.notes ? String(args.notes) : undefined,
        relatedCustomerId: args.relatedCustomerId ? String(args.relatedCustomerId) : undefined,
      });
      return { ok: true, eventId: id, title, date };
    }

    case 'list_today': {
      return listToday(fs);
    }

    case 'complete_task': {
      const taskId = String(args.taskId ?? '').trim();
      if (!taskId) throw new Error('taskId is required');
      await completeTask(fs, taskId);
      return { ok: true, taskId };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
