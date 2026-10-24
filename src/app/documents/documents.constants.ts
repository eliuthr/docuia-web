export const BYTES_PER_KILOBYTE = 1024;
export const BYTES_PER_MEGABYTE = BYTES_PER_KILOBYTE * 1024;

/** Copia el valor por defecto de la API; la API sigue siendo la fuente de verdad. */
export const MAX_UPLOAD_SIZE_MB = 10;

export const ALLOWED_MIME_TYPES: readonly string[] = ['application/pdf', 'image/png', 'image/jpeg'];
export const ACCEPT_ATTRIBUTE = '.pdf,.png,.jpg,.jpeg';

export const RECENT_DOCUMENTS_LIMIT = 20;

/** Cada cuánto se refresca la lista mientras un documento sigue en proceso y no hay conexión SSE. */
export const STATUS_POLL_INTERVAL_MS = 3000;

/** Agrupa ráfagas de eventos (por ejemplo `processing` y `ready` seguidos) en una sola recarga. */
export const EVENT_RELOAD_DELAY_MS = 300;
