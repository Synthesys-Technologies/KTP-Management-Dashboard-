import { getLatestRun } from '@/lib/db';
import { PageHeader, StatCard, Card, Badge, EmptyState } from '@/components/ui';
import { money, num, pct, dateTime, titleCase } from '@/lib/format';

export const dynamic = 'force-dynamic';

const STATUS_TONE = {
  missing_from_erp: 'crit',
  not_in_bank: 'warn',
  unmatched: 'warn',
  no_expense_line: 'warn',
  matched: 'good',
};

export default async function ReconciliationPage() {
  let run = null;
  try {
    run = await getLatestRun('reconciliation_run');
  } catch {}

  if (!run) {
    return (
      <>
        <PageHeader eyebrow="01 · Bank Reconciliation" title="Bank Reconciliation" />
        <EmptyState
          title="No reconciliation runs yet."
          hint="When Hermes posts a reconciliation_run result, the summary and exceptions land here."
        />
      </>
    );
  }

  const s = run.summary || {};
  const exceptions = (run.result && run.result.exceptions) || [];

  return (
    <>
      <PageHeader
        eyebrow="01 · Bank Reconciliation"
        title="Bank Reconciliation"
        meta={`${run.client_id || 'all clients'} · last run ${dateTime(run.run_at || run.created_at)}`}
      />

      <div className="stat-grid">
        <StatCard label="Transactions processed" value={num(s.transactions_processed)} />
        <StatCard label="Matched" value={num(s.matched_count)} tone="good" />
        <StatCard label="Unmatched" value={num(s.unmatched_count)} tone="warn" />
        <StatCard label="Total amount" value={money(s.total_amount)} />
      </div>

      <Card title="Exceptions" count={exceptions.length}>
        {exceptions.length === 0 ? (
          <EmptyState title="Nothing flagged." hint="Every transaction reconciled cleanly." />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th className="num">Amount</th>
                <th>Counterparty</th>
                <th>Category</th>
                <th>Reason</th>
                <th className="num">Conf.</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {exceptions.map((e, i) => (
                <tr key={i}>
                  <td>{e.date || '—'}</td>
                  <td className="num">{money(e.amount)}</td>
                  <td>{e.counterparty || '—'}</td>
                  <td>{titleCase(e.category)}</td>
                  <td className="reason">{e.reason || '—'}</td>
                  <td className="num">{e.confidence != null ? pct(e.confidence) : '—'}</td>
                  <td>
                    <Badge tone={STATUS_TONE[e.status] || 'neutral'}>
                      {titleCase(e.status)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
