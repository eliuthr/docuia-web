import { DocumentStatus } from './document.model';

/**
 * Lo que avisa el servidor: un documento cambió de estado, o la conexión se
 * recuperó tras un corte (se pudieron perder eventos, así que hay que recargar).
 */
export type DocumentChange =
  { kind: 'status'; documentId: string; status: DocumentStatus } | { kind: 'resync' };
