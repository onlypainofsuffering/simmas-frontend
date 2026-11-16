export function toInputDate(value: unknown) {
  if (typeof value !== 'string') return '';
  return value.slice(0, 10);
}

export function formatDate(value: unknown, options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }) {
  if (!value) return value;
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('id-ID', options);
}

export function formatTime(value: unknown) {
  if (!value) return '-';
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export function formatFullDate(date = new Date()) {
  return date.toLocaleDateString('id-ID', { dateStyle: 'full' });
}
