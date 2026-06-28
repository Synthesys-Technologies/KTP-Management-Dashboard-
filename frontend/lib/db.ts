import { Pool } from 'pg';

export interface TaskRun {
  id: number;
  task_type: string;
  client_id: string | null;
  run_at: Date | null;
  summary: Record<string, unknown>;
  result?: Record<string, unknown>;
  created_at: Date;
}

interface InsertRunParams {
  task_type: string;
  client_id?: string | null;
  run_at?: string | null;
  summary?: Record<string, unknown>;
  result?: Record<string, unknown>;
}

interface InsertRunResult {
  id: number;
  created_at: Date;
}

// One shared pool, created lazily so `next build` never needs a live DB.
let pool: Pool | undefined;
function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
    });
  }
  return pool;
}

// Create the table once per process. All task types live in one table;
// `summary` and `result` are JSONB so each task type can carry its own shape.
let schemaReady: Promise<void> | undefined;
function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    const p = getPool();
    schemaReady = (async () => {
      await p.query(`
        CREATE TABLE IF NOT EXISTS task_runs (
          id          SERIAL PRIMARY KEY,
          task_type   TEXT NOT NULL,
          client_id   TEXT,
          run_at      TIMESTAMPTZ,
          summary     JSONB NOT NULL DEFAULT '{}'::jsonb,
          result      JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      await p.query(`
        CREATE INDEX IF NOT EXISTS idx_task_runs_type_created
          ON task_runs (task_type, created_at DESC);
      `);
    })().catch((err) => {
      // Reset so a later request can retry schema creation.
      schemaReady = undefined;
      throw err;
    });
  }
  return schemaReady;
}

export async function insertRun({
  task_type,
  client_id,
  run_at,
  summary,
  result,
}: InsertRunParams): Promise<InsertRunResult> {
  await ensureSchema();
  const { rows } = await getPool().query<InsertRunResult>(
    `INSERT INTO task_runs (task_type, client_id, run_at, summary, result)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, created_at`,
    [
      task_type,
      client_id ?? null,
      run_at ?? null,
      JSON.stringify(summary ?? {}),
      JSON.stringify(result ?? {}),
    ]
  );
  return rows[0];
}

export async function getLatestRun(taskType: string): Promise<TaskRun | null> {
  await ensureSchema();
  const { rows } = await getPool().query<TaskRun>(
    `SELECT * FROM task_runs WHERE task_type = $1 ORDER BY created_at DESC LIMIT 1`,
    [taskType]
  );
  return rows[0] ?? null;
}

export async function getRecentRuns(limit = 12): Promise<TaskRun[]> {
  await ensureSchema();
  const { rows } = await getPool().query<TaskRun>(
    `SELECT id, task_type, client_id, run_at, summary, created_at
     FROM task_runs ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  return rows;
}
