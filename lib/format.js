// All figures default to AUD (Perth-based ops). Change currency here if needed.

export function money(n, currency = 'AUD') {
  if (n == null || isNaN(Number(n))) return '—';
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number(n));
}

export function num(n) {
  if (n == null || isNaN(Number(n))) return '—';
  return new Intl.NumberFormat('en-AU').format(Number(n));
}

export function pct(n) {
  if (n == null || isNaN(Number(n))) return '—';
  return `${Math.round(Number(n) * 100)}%`;
}

export function dateTime(d) {
  if (!d) return '—';
  return new Intl.DateTimeFormat('en-AU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(d));
}

export function dateOnly(d) {
  if (!d) return '—';
  return new Intl.DateTimeFormat('en-AU', { dateStyle: 'medium' }).format(new Date(d));
}

export function titleCase(s) {
  if (!s) return '—';
  return String(s).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
