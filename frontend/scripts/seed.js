// Inserts one sample run per task type so you can see the dashboard populated
// before Hermes is wired up.
//
// Run with:  DATABASE_URL=... PGSSL=true npm run seed
// (Or set them in .env.local — this script will read that file if present.)

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Minimal .env.local loader (no extra dependency).
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Set it in .env.local or inline.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
});

const now = new Date().toISOString();

const samples = [
  {
    task_type: 'reconciliation_run',
    client_id: 'pascom',
    run_at: now,
    summary: {
      transactions_processed: 142,
      matched_count: 128,
      unmatched_count: 14,
      total_amount: 58420.5,
    },
    result: {
      exceptions: [
        {
          date: '2026-06-12',
          amount: 142.5,
          counterparty: 'AMZN MKTP AU',
          category: 'card_expense',
          reason: 'On bank statement, no matching line in ERP',
          confidence: 0.82,
          status: 'missing_from_erp',
        },
        {
          date: '2026-06-14',
          amount: 1290.0,
          counterparty: 'Officeworks',
          category: 'card_expense',
          reason: 'Card spend with no matching expense report line',
          confidence: 0.74,
          status: 'no_expense_line',
        },
        {
          date: '2026-06-15',
          amount: 4500.0,
          counterparty: 'Supplier Pty Ltd',
          category: 'payment',
          reason: 'ERP entry exists but no matching bank payment',
          confidence: 0.6,
          status: 'not_in_bank',
        },
      ],
    },
  },
  {
    task_type: 'telegram_collection',
    client_id: 'pascom',
    run_at: now,
    summary: {
      records_collected: 24,
      by_type: { invoice: 18, expense: 6 },
      latest_at: now,
    },
    result: {
      records: [
        {
          captured_at: now,
          type: 'invoice',
          amount: 3200.0,
          vendor: 'Baker Hughes',
          reference: 'INV-20451',
          raw_text: 'Invoice 20451 — MEG supply — $3,200',
        },
        {
          captured_at: now,
          type: 'expense',
          amount: 86.4,
          vendor: 'BP Welshpool',
          reference: '',
          raw_text: 'Fuel receipt $86.40',
        },
      ],
    },
  },
  {
    task_type: 'cashflow_analysis',
    client_id: 'pascom',
    run_at: now,
    summary: {
      total_receivable: 284500.0,
      overdue_total: 61200.0,
      forecast_next_month: 198000.0,
      high_risk_customers: 2,
    },
    result: {
      aging: { current: 223300, days_30: 38400, days_60: 14800, days_90_plus: 8000 },
      bottlenecks: [
        {
          customer: 'Tronox',
          amount: 28400,
          days_overdue: 67,
          reason: 'Consistently pays 30+ days past terms',
        },
        {
          customer: 'Northam Trading',
          amount: 12800,
          days_overdue: 41,
          reason: 'Two invoices past 30-day terms',
        },
      ],
      forecast: {
        next_month_expected: 198000,
        basis: 'Open invoices weighted by each customer historical pay-lateness',
        by_week: [
          { week: 'Wk 1', expected_inflow: 42000 },
          { week: 'Wk 2', expected_inflow: 51000 },
          { week: 'Wk 3', expected_inflow: 48000 },
          { week: 'Wk 4', expected_inflow: 57000 },
        ],
      },
      customers: {
        top_10: [
          { name: 'Water Corporation', revenue: 412000, avg_days_to_pay: 22, risk_level: 'low', flagged: false },
          { name: 'Tronox', revenue: 388000, avg_days_to_pay: 58, risk_level: 'high', flagged: true },
          { name: 'Arkema', revenue: 305000, avg_days_to_pay: 28, risk_level: 'low', flagged: false },
          { name: 'PLS / Pilbara Minerals', revenue: 271000, avg_days_to_pay: 31, risk_level: 'medium', flagged: false },
          { name: 'Baker Hughes', revenue: 240000, avg_days_to_pay: 26, risk_level: 'low', flagged: false },
        ],
        alerts: [
          { name: 'Tronox', issue: 'High-risk payer sitting in top 10 by revenue' },
        ],
      },
    },
  },
];

(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS task_runs (
        id SERIAL PRIMARY KEY,
        task_type TEXT NOT NULL,
        client_id TEXT,
        run_at TIMESTAMPTZ,
        summary JSONB NOT NULL DEFAULT '{}'::jsonb,
        result JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    for (const s of samples) {
      await pool.query(
        `INSERT INTO task_runs (task_type, client_id, run_at, summary, result)
         VALUES ($1, $2, $3, $4, $5)`,
        [s.task_type, s.client_id, s.run_at, JSON.stringify(s.summary), JSON.stringify(s.result)]
      );
      console.log(`seeded ${s.task_type}`);
    }
    console.log('Done.');
  } catch (e) {
    console.error('Seed failed:', e.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
