import { NextResponse } from 'next/server';
import { insertRun } from '@/lib/db';

export const dynamic = 'force-dynamic';

const ALLOWED_TASK_TYPES = new Set([
  'reconciliation_run',
  'telegram_collection',
  'cashflow_analysis',
]);

// POST https://<your-dashboard>/api/task-result
// Headers: Authorization: Bearer <HERMES_API_KEY>, Content-Type: application/json
export async function POST(req) {
  const auth = req.headers.get('authorization') || '';
  const expected = `Bearer ${process.env.HERMES_API_KEY || ''}`;

  if (!process.env.HERMES_API_KEY || auth !== expected) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Body must be valid JSON' }, { status: 400 });
  }

  const { task_type, client_id, run_at, summary, result } = body || {};

  if (!task_type || !ALLOWED_TASK_TYPES.has(task_type)) {
    return NextResponse.json(
      { ok: false, error: `Missing or unknown task_type. Allowed: ${[...ALLOWED_TASK_TYPES].join(', ')}` },
      { status: 400 }
    );
  }

  const isObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
  if (!isObject(summary) || !isObject(result)) {
    return NextResponse.json(
      { ok: false, error: 'summary and result must be JSON objects' },
      { status: 400 }
    );
  }

  try {
    const saved = await insertRun({ task_type, client_id, run_at, summary, result });
    return NextResponse.json({ ok: true, id: saved.id, stored_at: saved.created_at });
  } catch (err) {
    console.error('Failed to store task result:', err);
    return NextResponse.json({ ok: false, error: 'Could not store result' }, { status: 500 });
  }
}

// Simple health check so you can confirm the route is live in a browser.
export async function GET() {
  return NextResponse.json({ ok: true, service: 'task-result', method: 'POST to submit' });
}
