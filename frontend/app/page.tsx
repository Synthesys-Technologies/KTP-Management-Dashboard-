import Link from 'next/link';
import { getLatestRun, getRecentRuns, TaskRun } from '@/lib/db';
import { PageHeader, Card, EmptyState } from '@/components/ui';
import { money, num, dateTime, titleCase } from '@/lib/format';

export const dynamic = 'force-dynamic';

interface Tile {
  href: string;
  code: string;
  title: string;
  type: string;
  line: (s: Record<string, unknown>) => string;
}

const TILES: Tile[] = [
  {
    href: '/reconciliation',
    code: '01',
    title: 'Bank Reconciliation',
    type: 'reconciliation_run',
    line: (s) =>
      `${num(s.matched_count as number)} matched · ${num(s.unmatched_count as number)} unmatched`,
  },
  {
    href: '/telegram',
    code: '02',
    title: 'Telegram Capture',
    type: 'telegram_collection',
    line: (s) => `${num(s.records_collected as number)} records collected`,
  },
  {
    href: '/cashflow',
    code: '03',
    title: 'Cash Flow & Risk',
    type: 'cashflow_analysis',
    line: (s) =>
      `${money(s.total_receivable as number)} receivable · ${num(s.high_risk_customers as number)} high risk`,
  },
];

export default async function OverviewPage() {
  let latest: Record<string, TaskRun | null> = {};
  let recent: TaskRun[] = [];
  try {
    const [recon, tg, cash, recentRuns] = await Promise.all([
      getLatestRun('reconciliation_run'),
      getLatestRun('telegram_collection'),
      getLatestRun('cashflow_analysis'),
      getRecentRuns(10),
    ]);
    latest = {
      reconciliation_run: recon,
      telegram_collection: tg,
      cashflow_analysis: cash,
    };
    recent = recentRuns;
  } catch {
    // DB not reachable yet — render empty states rather than crash.
  }

  return (
    <>
      <PageHeader
        eyebrow="00 · Overview"
        title="Operations Overview"
        meta="Latest result from each Hermes task"
      />

      <div className="overview-grid">
        {TILES.map((t) => {
          const run = latest[t.type];
          return (
            <Link key={t.href} href={t.href} className="tile">
              <span className="tile-code">{t.code}</span>
              <span className="tile-title">{t.title}</span>
              {run ? (
                <>
                  <span className="tile-line">{t.line(run.summary ?? {})}</span>
                  <span className="tile-line">
                    last run {dateTime(run.run_at ?? run.created_at)}
                  </span>
                </>
              ) : (
                <span className="tile-empty">No runs yet</span>
              )}
            </Link>
          );
        })}
      </div>

      <Card title="Recent activity" count={recent.length || null}>
        {recent.length === 0 ? (
          <EmptyState
            title="No task results yet."
            hint="Results appear here the moment Hermes posts to /api/task-result."
          />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Stored</th>
                <th>Task</th>
                <th>Client</th>
                <th>Run at</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.id}>
                  <td>{dateTime(r.created_at)}</td>
                  <td>
                    <span className="feed-type">{titleCase(r.task_type)}</span>
                  </td>
                  <td>{r.client_id ?? '—'}</td>
                  <td>{dateTime(r.run_at ?? r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
