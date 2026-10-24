import { formatFileSize } from './format-file-size';

describe('formatFileSize', () => {
  it.each([
    [512, '512 B'],
    [1536, '1.5 KB'],
    [5 * 1024 * 1024, '5.0 MB'],
  ])('formats %i bytes as %s', (sizeBytes, expected) => {
    expect(formatFileSize(sizeBytes)).toBe(expected);
  });
});
