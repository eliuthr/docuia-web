import { isInProgress } from './document-status';

describe('isInProgress', () => {
  it.each(['pending', 'processing'] as const)('is true for %s', (status) => {
    expect(isInProgress(status)).toBe(true);
  });

  it.each(['ready', 'failed'] as const)('is false for %s', (status) => {
    expect(isInProgress(status)).toBe(false);
  });
});
