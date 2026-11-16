export function formatNumber(value: number, locale = 'id-ID') {
  return new Intl.NumberFormat(locale).format(value);
}
