// All figures default to AUD (Perth-based ops). Change currency here if needed.

export function money(n: number | string | null | undefined, currency = 'AUD'): string {
  if (n == null || isNaN(Number(n))) return '—';
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number(n));
}

export function num(n: number | string | null | undefined): string {
  if (n == null || isNaN(Number(n))) return '—';
  return new Intl.NumberFormat('en-AU').format(Number(n));
}

export function pct(n: number | string | null | undefined): string {
  if (n == null || isNaN(Number(n))) return '—';
  return `${Math.round(Number(n) * 100)}%`;
}

export function dateTime(d: Date | string | null | undefined): string {
  if (!d) return '—';
  return new Intl.DateTimeFormat('en-AU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(d as string));
}

export function dateOnly(d: Date | string | null | undefined): string {
  if (!d) return '—';
  return new Intl.DateTimeFormat('en-AU', { dateStyle: 'medium' }).format(new Date(d as string));
}

export function titleCase(s: string | null | undefined): string {
  if (!s) return '—';
  return String(s).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
