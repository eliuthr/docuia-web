import { CursorPager } from './cursor-pager';

describe('CursorPager', () => {
  let pager: CursorPager;

  beforeEach(() => {
    pager = new CursorPager();
  });

  it('starts on the first page without a cursor', () => {
    expect(pager.currentCursor()).toBeNull();
    expect(pager.pageNumber()).toBe(1);
    expect(pager.isFirstPage()).toBe(true);
  });

  it('moves forward with the next cursor and back to the previous one', () => {
    pager.next('page-2');
    pager.next('page-3');
    expect(pager.currentCursor()).toBe('page-3');
    expect(pager.pageNumber()).toBe(3);

    pager.previous();
    expect(pager.currentCursor()).toBe('page-2');
    expect(pager.isFirstPage()).toBe(false);
  });

  it('stays on the first page when going back from it', () => {
    pager.previous();

    expect(pager.pageNumber()).toBe(1);
  });

  it('returns to the first page on reset', () => {
    pager.next('page-2');

    pager.reset();

    expect(pager.currentCursor()).toBeNull();
  });
});
