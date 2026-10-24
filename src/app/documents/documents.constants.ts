export const BYTES_PER_KILOBYTE = 1024;
export const BYTES_PER_MEGABYTE = BYTES_PER_KILOBYTE * 1024;

/** Mirrors the API default; the API remains the source of truth. */
export const MAX_UPLOAD_SIZE_MB = 10;

export const ALLOWED_MIME_TYPES: readonly string[] = ['application/pdf', 'image/png', 'image/jpeg'];
export const ACCEPT_ATTRIBUTE = '.pdf,.png,.jpg,.jpeg';

export const RECENT_DOCUMENTS_LIMIT = 20;
