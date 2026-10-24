export const MISSING_VALUE = '—';

const LOCALE = 'en-US';
const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;

/** "COP 2,638,825.00"; sin moneda conocida, solo el número. */
export function formatAmount(amount: number | null, currency: string | null): string {
  if (amount === null) {
    return MISSING_VALUE;
  }
  if (!currency || !CURRENCY_CODE_PATTERN.test(currency)) {
    return new Intl.NumberFormat(LOCALE).format(amount);
  }
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency,
    currencyDisplay: 'code',
  }).format(amount);
}
