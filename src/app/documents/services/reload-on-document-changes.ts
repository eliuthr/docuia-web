import { HttpResourceRef } from '@angular/common/http';
import { inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { auditTime, filter } from 'rxjs';
import { EVENT_RELOAD_DELAY_MS } from '../documents.constants';
import { DocumentChange } from '../models/document-change.model';
import { DocumentEvents } from './document-events';

/**
 * Recarga el recurso cuando el servidor avisa un cambio relevante (o pide
 * resincronizar). Debe llamarse en un contexto de inyección; se desuscribe
 * sola cuando se destruye el componente.
 */
export function reloadOnDocumentChanges(
  resource: HttpResourceRef<unknown>,
  isRelevant: (change: DocumentChange) => boolean = () => true,
): void {
  inject(DocumentEvents)
    .changes.pipe(
      filter((change) => change.kind === 'resync' || isRelevant(change)),
      auditTime(EVENT_RELOAD_DELAY_MS),
      takeUntilDestroyed(),
    )
    .subscribe(() => resource.reload());
}
