import { HttpResourceRef } from '@angular/common/http';
import { inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, mergeMap, Observable, tap } from 'rxjs';
import { DocumentChange } from '../models/document-change.model';
import { DocumentPageDto } from '../models/document.model';
import {
  isLabelOnlyChange,
  isListed,
  withDocument,
  withStatus,
} from '../utils/document-page-updates';
import { DocumentEvents } from './document-events';
import { DocumentsApi } from './documents-api';

/**
 * Mantiene la página visible al día con los eventos del servidor, tocando
 * solo el documento que cambió:
 * - `pending`/`processing`: se cambia la etiqueta en memoria, sin pedir nada.
 * - `ready`/`failed`: se pide solo ese documento (cambian resumen, páginas, error).
 * - Un documento que no está en la página: solo importa en la primera página
 *   (es uno nuevo, por ejemplo subido desde otra pestaña), así que se recarga.
 * Debe llamarse en un contexto de inyección.
 */
export function syncPageWithDocumentChanges(
  page: HttpResourceRef<DocumentPageDto | undefined>,
  isFirstPage: () => boolean,
): void {
  const api = inject(DocumentsApi);

  const applyChange = (change: DocumentChange): Observable<unknown> => {
    if (change.kind === 'resync') {
      page.reload();
      return EMPTY;
    }
    const current = page.hasValue() ? page.value() : undefined;
    if (!current) {
      // La página se está cargando y ya traerá el estado nuevo.
      return EMPTY;
    }
    if (!isListed(current, change.documentId)) {
      if (isFirstPage()) {
        page.reload();
      }
      return EMPTY;
    }
    if (isLabelOnlyChange(change.status)) {
      page.update((value) => value && withStatus(value, change.documentId, change.status));
      return EMPTY;
    }
    return api.getDocument(change.documentId).pipe(
      tap((document) => page.update((value) => value && withDocument(value, document))),
      // Si falla, la fila queda como estaba; el siguiente evento o recarga la corrige.
      catchError(() => EMPTY),
    );
  };

  inject(DocumentEvents).changes.pipe(mergeMap(applyChange), takeUntilDestroyed()).subscribe();
}
