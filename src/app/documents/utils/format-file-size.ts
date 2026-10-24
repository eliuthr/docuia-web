import { BYTES_PER_KILOBYTE, BYTES_PER_MEGABYTE } from '../documents.constants';

export function formatFileSize(sizeBytes: number): string {
  if (sizeBytes < BYTES_PER_KILOBYTE) {
    return `${sizeBytes} B`;
  }
  if (sizeBytes < BYTES_PER_MEGABYTE) {
    return `${(sizeBytes / BYTES_PER_KILOBYTE).toFixed(1)} KB`;
  }
  return `${(sizeBytes / BYTES_PER_MEGABYTE).toFixed(1)} MB`;
}
