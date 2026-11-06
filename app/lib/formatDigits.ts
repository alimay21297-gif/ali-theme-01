/** A whole number in the page language: Arabic-Indic digits in Arabic, Latin otherwise. */
export function formatDigits(n: number, locale: string): string {
  const tag = locale.toLowerCase().startsWith('ar') ? 'ar-u-nu-arab' : 'en-u-nu-latn';
  return new Intl.NumberFormat(tag, { useGrouping: false }).format(n);
}
