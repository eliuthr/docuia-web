import { ALLOWED_MIME_TYPES, BYTES_PER_MEGABYTE, MAX_UPLOAD_SIZE_MB } from '../documents.constants';

/** Returns a user-facing error, or null when the file can be uploaded. */
export function validateDocumentFile(file: Pick<File, 'type' | 'size'>): string | null {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return 'Only PDF, PNG and JPEG files are allowed.';
  }
  if (file.size > MAX_UPLOAD_SIZE_MB * BYTES_PER_MEGABYTE) {
    return `The file is larger than ${MAX_UPLOAD_SIZE_MB} MB.`;
  }
  return null;
}
