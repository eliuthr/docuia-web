import { formatAmount, MISSING_VALUE } from './format-amount';

/** Intl usa un espacio duro entre el código y el número; se normaliza para comparar. */
function normalizeSpaces(text: string): string {
  return text.replace(/\s/g, ' ');
}

describe('formatAmount', () => {
  it('formats an amount with its currency code', () => {
    expect(normalizeSpaces(formatAmount(2638825, 'COP'))).toBe('COP 2,638,825');
  });

  it('formats a plain number when the currency is unknown', () => {
    expect(formatAmount(1500.5, null)).toBe('1,500.5');
  });

  it('ignores a currency that is not an ISO code', () => {
    expect(formatAmount(10, '$')).toBe('10');
  });

  it('shows a dash for a missing amount', () => {
    expect(formatAmount(null, 'COP')).toBe(MISSING_VALUE);
  });
});
