/** Formats a numeric string/number as Indian-locale currency, e.g. ₹12,34,567. */
export function formatInr(value: string | number): string {
  const numeric = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(numeric)) return String(value);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(numeric);
}

export function formatDate(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

export function formatDateTime(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

/** Converts SCREAMING_SNAKE status enums into human-readable labels, e.g. PENDING_REVIEW -> "Pending review". */
export function humanizeStatus(value: string): string {
  const lower = value.toLowerCase().replaceAll('_', ' ');
  return lower.charAt(0).toUpperCase() + lower.slice(1);
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
