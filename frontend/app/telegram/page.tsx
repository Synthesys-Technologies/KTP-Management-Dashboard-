import { getLatestRun } from '@/lib/db';
import { PageHeader, StatCard, Card, Badge, EmptyState } from '@/components/ui';
import { money, num, dateTime, titleCase } from '@/lib/format';

export const dynamic = 'force-dynamic';

interface TelegramSummary {
  records_collected?: number;
  by_type?: { invoice?: number; expense?: number };
  latest_at?: string;
}

interface TelegramRecord {
  captured_at?: string;
  type?: string;
  amount?: number;
  vendor?: string;
  reference?: string;
  raw_text?: string;
}

export default async function TelegramPage() {
  let run = null;
  try {
    run = await getLatestRun('telegram_collection');
  } catch {}

  if (!run) {
    return (
      <>
        <PageHeader eyebrow="02 · Telegram Capture" title="Telegram Capture" />
        <EmptyState
          title="No captured records yet."
          hint="Data collected by the Telegram bot appears here once Hermes posts a telegram_collection result."
        />
      </>
    );
  }

  const s = (run.summary ?? {}) as TelegramSummary;
  const byType = s.by_type ?? {};
  const records: TelegramRecord[] =
    ((run.result as { records?: TelegramRecord[] })?.records) ?? [];

  return (
    <>
      <PageHeader
        eyebrow="02 · Telegram Capture"
        title="Telegram Capture"
        meta={`last sync ${dateTime(s.latest_at ?? run.created_at)}`}
      />

      <div className="stat-grid">
        <StatCard label="Records collected" value={num(s.records_collected)} />
        <StatCard label="Invoices" value={num(byType.invoice)} />
        <StatCard label="Expenses" value={num(byType.expense)} />
        <StatCard label="Latest capture" value={dateTime(s.latest_at)} />
      </div>

      <Card title="Captured records" count={records.length}>
        {records.length === 0 ? (
          <EmptyState title="Nothing captured in this run." />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Captured</th>
                <th>Type</th>
                <th className="num">Amount</th>
                <th>Vendor</th>
                <th>Reference</th>
                <th>Raw text</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <tr key={i}>
                  <td>{dateTime(r.captured_at)}</td>
                  <td>
                    <Badge tone="neutral">{titleCase(r.type)}</Badge>
                  </td>
                  <td className="num">{money(r.amount)}</td>
                  <td>{r.vendor ?? '—'}</td>
                  <td>{r.reference ?? '—'}</td>
                  <td className="raw">{r.raw_text ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
