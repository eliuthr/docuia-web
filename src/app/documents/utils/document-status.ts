import { DocumentStatus } from '../models/document.model';

const IN_PROGRESS_STATUSES: ReadonlySet<DocumentStatus> = new Set(['pending', 'processing']);

/** true mientras la API sigue trabajando en el documento. */
export function isInProgress(status: DocumentStatus): boolean {
  return IN_PROGRESS_STATUSES.has(status);
}
