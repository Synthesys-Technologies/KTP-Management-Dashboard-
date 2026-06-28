import { money } from '@/lib/format';

type Tone = 'good' | 'warn' | 'crit' | 'neutral';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  meta?: string;
}

interface StatCardProps {
  label: string;
  value: string;
  tone?: 'good' | 'warn' | 'crit';
}

interface CardProps {
  title?: string;
  count?: number | null;
  children: React.ReactNode;
}

interface BadgeProps {
  tone?: Tone;
  children: React.ReactNode;
}

interface EmptyStateProps {
  title: string;
  hint?: string;
}

export interface AgingData {
  current?: number;
  days_30?: number;
  days_60?: number;
  days_90_plus?: number;
}

interface AgingBarProps {
  aging: AgingData;
}

interface Segment {
  key: keyof AgingData;
  label: string;
  tone: string;
}

export function PageHeader({ eyebrow, title, meta }: PageHeaderProps) {
  return (
    <header className="page-head">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h1 className="page-title">{title}</h1>
      {meta && <p className="page-meta">{meta}</p>}
    </header>
  );
}

export function StatCard({ label, value, tone }: StatCardProps) {
  return (
    <div className={`stat${tone ? ` stat--${tone}` : ''}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

export function Card({ title, count, children }: CardProps) {
  return (
    <section className="card">
      {title && (
        <div className="card-head">
          <h2 className="card-title">{title}</h2>
          {count != null && <span className="card-count">{count}</span>}
        </div>
      )}
      <div className="card-body">{children}</div>
    </section>
  );
}

export function Badge({ tone = 'neutral', children }: BadgeProps) {
  return (
    <span className={`badge badge--${tone}`}>
      <i className="dot" />
      {children}
    </span>
  );
}

export function EmptyState({ title, hint }: EmptyStateProps) {
  return (
    <div className="empty">
      <p className="empty-title">{title}</p>
      {hint && <p className="empty-hint">{hint}</p>}
    </div>
  );
}

// Stacked aging bar for the cash flow view.
export function AgingBar({ aging }: AgingBarProps) {
  const segments: Segment[] = [
    { key: 'current', label: 'Current', tone: 'good' },
    { key: 'days_30', label: '1–30 days', tone: 'neutral' },
    { key: 'days_60', label: '31–60 days', tone: 'warn' },
    { key: 'days_90_plus', label: '60+ days', tone: 'crit' },
  ];
  const total =
    segments.reduce((sum, s) => sum + (Number(aging?.[s.key]) || 0), 0) || 1;

  return (
    <div className="aging">
      <div className="aging-track">
        {segments.map((s) => {
          const v = Number(aging?.[s.key]) || 0;
          const w = (v / total) * 100;
          if (w <= 0) return null;
          return (
            <span
              key={s.key}
              className={`aging-seg aging-seg--${s.tone}`}
              style={{ width: `${w}%` }}
              title={`${s.label}: ${money(v)}`}
            />
          );
        })}
      </div>
      <div className="aging-legend">
        {segments.map((s) => (
          <div key={s.key} className="aging-item">
            <span className={`dot dot--${s.tone}`} />
            <span className="aging-item-label">{s.label}</span>
            <span className="aging-item-value">{money(aging?.[s.key])}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
