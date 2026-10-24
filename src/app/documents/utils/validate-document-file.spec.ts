import { BYTES_PER_MEGABYTE, MAX_UPLOAD_SIZE_MB } from '../documents.constants';
import { validateDocumentFile } from './validate-document-file';

describe('validateDocumentFile', () => {
  it.each(['application/pdf', 'image/png', 'image/jpeg'])('accepts %s', (type) => {
    expect(validateDocumentFile({ type, size: 1 })).toBeNull();
  });

  it('rejects other types', () => {
    expect(validateDocumentFile({ type: 'text/plain', size: 1 })).toContain('Only PDF');
  });

  it('accepts a file exactly at the size limit', () => {
    const size = MAX_UPLOAD_SIZE_MB * BYTES_PER_MEGABYTE;
    expect(validateDocumentFile({ type: 'application/pdf', size })).toBeNull();
  });

  it('rejects a file above the size limit', () => {
    const size = MAX_UPLOAD_SIZE_MB * BYTES_PER_MEGABYTE + 1;
    expect(validateDocumentFile({ type: 'application/pdf', size })).toContain('larger than');
  });
});
