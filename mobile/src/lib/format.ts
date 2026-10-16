export function formatInr(value: string | number): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n)) return String(value);
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

export function formatInrShort(value: string | number): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n)) return String(value);
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(0)}K`;
  return `₹${n}`;
}

export function formatDate(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}

const RELATIVE_UNITS: { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
  { unit: 'year', ms: 365 * 24 * 60 * 60 * 1000 },
  { unit: 'month', ms: 30 * 24 * 60 * 60 * 1000 },
  { unit: 'week', ms: 7 * 24 * 60 * 60 * 1000 },
  { unit: 'day', ms: 24 * 60 * 60 * 1000 },
  { unit: 'hour', ms: 60 * 60 * 1000 },
  { unit: 'minute', ms: 60 * 1000 },
];

/** Locale-aware "3 days ago" / "2 weeks ago" phrasing via Intl.RelativeTimeFormat — pass the
    active i18n language mapped to a locale tag (e.g. 'ta' -> 'ta-IN') so the phrase itself
    localizes, independent of any surrounding translated sentence template. */
export function formatRelativeDate(value: string | Date, locale = 'en-IN'): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const diffMs = date.getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  for (const { unit, ms } of RELATIVE_UNITS) {
    if (Math.abs(diffMs) >= ms) {
      return rtf.format(Math.round(diffMs / ms), unit);
    }
  }
  return rtf.format(0, 'minute');
}

/** Renders a catalog spec field's label (with unit, if any) and its stored value for read-only display. */
export function formatSpecField(
  field: { fieldLabel: string; fieldType: string; unit: string | null },
  rawValue: unknown,
): { label: string; value: string } {
  const label = field.unit ? `${field.fieldLabel} (${field.unit})` : field.fieldLabel;
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return { label, value: 'Not available' };
  }
  if (field.fieldType === 'boolean') {
    return { label, value: rawValue === true || rawValue === 'true' ? 'Yes' : 'No' };
  }
  if (field.fieldType === 'number') {
    const n = Number(rawValue);
    return { label, value: Number.isNaN(n) ? String(rawValue) : n.toLocaleString('en-IN') };
  }
  return { label, value: String(rawValue) };
}
