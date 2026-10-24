import { pageCountLabel } from './page-count-label';

describe('pageCountLabel', () => {
  it('uses the singular for one page', () => {
    expect(pageCountLabel(1)).toBe('1 page');
  });

  it('uses the plural for several pages', () => {
    expect(pageCountLabel(3)).toBe('3 pages');
  });

  it('shows a dash when the count is unknown', () => {
    expect(pageCountLabel(null)).toBe('— pages');
  });
});
