import { HttpResourceRef } from '@angular/common/http';
import { inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { DocumentDto } from '../models/document.model';
import { isLabelOnlyChange } from '../utils/document-page-updates';
import { DocumentEvents } from './document-events';

/**
 * Mantiene un documento al día con los eventos del servidor: si solo cambió a
 * `pending`/`processing` se actualiza la etiqueta en memoria; si terminó
 * (`ready`/`failed`) o hay que resincronizar, se vuelve a pedir ese documento.
 * Debe llamarse en un contexto de inyección.
 */
export function syncDocumentWithChanges(
  document: HttpResourceRef<DocumentDto | undefined>,
  documentId: () => string,
): void {
  inject(DocumentEvents)
    .changes.pipe(
      filter((change) => change.kind === 'resync' || change.documentId === documentId()),
      takeUntilDestroyed(),
    )
    .subscribe((change) => {
      if (change.kind === 'status' && isLabelOnlyChange(change.status)) {
        document.update((value) => value && { ...value, status: change.status });
        return;
      }
      document.reload();
    });
}
