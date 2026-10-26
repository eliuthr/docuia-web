import { DocumentDto, DocumentPageDto, DocumentStatus } from '../models/document.model';

/** Estados que solo cambian la etiqueta; con los demás cambian también los datos. */
const LABEL_ONLY_STATUSES: ReadonlySet<DocumentStatus> = new Set(['pending', 'processing']);

/** true si el cambio de estado se puede mostrar sin volver a pedir el documento. */
export function isLabelOnlyChange(status: DocumentStatus): boolean {
  return LABEL_ONLY_STATUSES.has(status);
}

export function isListed(page: DocumentPageDto, documentId: string): boolean {
  return page.items.some((document) => document.id === documentId);
}

/** Copia de la página con el estado de un documento cambiado. */
export function withStatus(
  page: DocumentPageDto,
  documentId: string,
  status: DocumentStatus,
): DocumentPageDto {
  return replaceItem(page, documentId, (document) => ({ ...document, status }));
}

/** Copia de la página con un documento reemplazado por su versión más reciente. */
export function withDocument(page: DocumentPageDto, updated: DocumentDto): DocumentPageDto {
  return replaceItem(page, updated.id, () => updated);
}

/**
 * Copia de la página con un documento recién subido al principio. No se quita
 * el último: el `nextCursor` sigue apuntando tras él, así no se salta ninguno.
 * Si ya está (por ejemplo, porque un evento recargó la página antes), se reemplaza.
 */
export function withNewDocument(page: DocumentPageDto, created: DocumentDto): DocumentPageDto {
  if (isListed(page, created.id)) {
    return withDocument(page, created);
  }
  return { ...page, items: [created, ...page.items] };
}

function replaceItem(
  page: DocumentPageDto,
  documentId: string,
  change: (document: DocumentDto) => DocumentDto,
): DocumentPageDto {
  return {
    ...page,
    items: page.items.map((document) => (document.id === documentId ? change(document) : document)),
  };
}
