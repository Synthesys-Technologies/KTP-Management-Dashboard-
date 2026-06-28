import { getLatestRun } from '@/lib/db';
import { PageHeader, StatCard, Card, Badge, EmptyState, AgingBar } from '@/components/ui';
import { money, num, dateTime, titleCase } from '@/lib/format';

export const dynamic = 'force-dynamic';

const RISK_TONE = { high: 'crit', medium: 'warn', low: 'good' };

export default async function CashflowPage() {
  let run = null;
  try {
    run = await getLatestRun('cashflow_analysis');
  } catch {}

  if (!run) {
    return (
      <>
        <PageHeader eyebrow="03 · Cash Flow & Risk" title="Cash Flow & Risk" />
        <EmptyState
          title="No cash flow analysis yet."
          hint="The scheduled cashflow_analysis task posts aging, bottlenecks, forecast and customer risk here."
        />
      </>
    );
  }

  const s = run.summary || {};
  const r = run.result || {};
  const aging = r.aging || {};
  const bottlenecks = r.bottlenecks || [];
  const forecast = r.forecast || {};
  const byWeek = forecast.by_week || [];
  const customers = r.customers || {};
  const top10 = customers.top_10 || [];
  const alerts = customers.alerts || [];

  return (
    <>
      <PageHeader
        eyebrow="03 · Cash Flow & Risk"
        title="Cash Flow & Risk"
        meta={`last run ${dateTime(run.run_at || run.created_at)}`}
      />

      <div className="stat-grid">
        <StatCard label="Total receivable" value={money(s.total_receivable)} />
        <StatCard label="Overdue" value={money(s.overdue_total)} tone="warn" />
        <StatCard label="Forecast next month" value={money(s.forecast_next_month)} />
        <StatCard label="High-risk customers" value={num(s.high_risk_customers)} tone="crit" />
      </div>

      {alerts.length > 0 && (
        <Card title="Alerts" count={alerts.length}>
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Issue</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a, i) => (
                <tr key={i}>
                  <td>{a.name || '—'}</td>
                  <td>
                    <Badge tone="crit">{a.issue || 'flagged'}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Card title="Receivables aging">
        <AgingBar aging={aging} />
      </Card>

      <Card title="Bottlenecks" count={bottlenecks.length}>
        {bottlenecks.length === 0 ? (
          <EmptyState title="No payment bottlenecks detected." />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th className="num">Amount</th>
                <th className="num">Days overdue</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {bottlenecks.map((b, i) => (
                <tr key={i}>
                  <td>{b.customer || '—'}</td>
                  <td className="num">{money(b.amount)}</td>
                  <td className="num">{num(b.days_overdue)}</td>
                  <td className="reason">{b.reason || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card title="Forecast by week">
        {byWeek.length === 0 ? (
          <EmptyState
            title="No weekly forecast in this run."
            hint={forecast.basis ? `Basis: ${forecast.basis}` : undefined}
          />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Week</th>
                <th className="num">Expected inflow</th>
              </tr>
            </thead>
            <tbody>
              {byWeek.map((w, i) => (
                <tr key={i}>
                  <td>{w.week || '—'}</td>
                  <td className="num">{money(w.expected_inflow)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card title="Top 10 customers" count={top10.length}>
        {top10.length === 0 ? (
          <EmptyState title="No customer ranking in this run." />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Customer</th>
                <th className="num">Revenue</th>
                <th className="num">Avg days to pay</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {top10.map((c, i) => (
                <tr key={i}>
                  <td className="num">{i + 1}</td>
                  <td>
                    {c.name || '—'}
                    {c.flagged ? '  ' : ''}
                    {c.flagged && <Badge tone="crit">flagged</Badge>}
                  </td>
                  <td className="num">{money(c.revenue)}</td>
                  <td className="num">{num(c.avg_days_to_pay)}</td>
                  <td>
                    <Badge tone={RISK_TONE[c.risk_level] || 'neutral'}>
                      {titleCase(c.risk_level)}
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
