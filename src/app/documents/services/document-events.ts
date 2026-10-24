import { inject, Service, signal } from '@angular/core';
import { Observable, share } from 'rxjs';
import { API_BASE_URL } from '../../core/api-base-url';
import { EVENT_SOURCE_FACTORY } from '../../core/event-source-factory';
import { DocumentChange } from '../models/document-change.model';
import { DocumentStatus } from '../models/document.model';

const DOCUMENT_UPDATED_EVENT = 'document.updated';
const KNOWN_STATUSES: ReadonlySet<string> = new Set<DocumentStatus>([
  'pending',
  'processing',
  'ready',
  'failed',
]);

/**
 * Cambios de estado que empuja la API por SSE. Una sola conexión compartida:
 * se abre con el primer suscriptor y se cierra cuando se va el último.
 */
@Service()
export class DocumentEvents {
  private readonly createEventSource = inject(EVENT_SOURCE_FACTORY);
  private readonly url = `${inject(API_BASE_URL)}/documents/events`;
  private readonly connected = signal(false);

  /** false mientras no hay conexión; las páginas vuelven al polling en ese caso. */
  readonly isConnected = this.connected.asReadonly();

  readonly changes: Observable<DocumentChange> = new Observable<DocumentChange>((subscriber) => {
    const source = this.createEventSource(this.url);
    let hasConnectedBefore = false;

    // EventSource se reconecta solo tras un error; aquí solo se registra el estado.
    source.onopen = () => {
      this.connected.set(true);
      if (hasConnectedBefore) {
        subscriber.next({ kind: 'resync' });
      }
      hasConnectedBefore = true;
    };
    source.onerror = () => this.connected.set(false);
    source.addEventListener(DOCUMENT_UPDATED_EVENT, (event) => {
      const change = toStatusChange((event as MessageEvent<string>).data);
      if (change) {
        subscriber.next(change);
      }
    });

    return () => {
      source.close();
      this.connected.set(false);
    };
  }).pipe(share());
}

function toStatusChange(data: string): DocumentChange | null {
  try {
    const payload: unknown = JSON.parse(data);
    if (typeof payload !== 'object' || payload === null) {
      return null;
    }
    const { documentId, status } = payload as Record<string, unknown>;
    if (typeof documentId !== 'string' || typeof status !== 'string') {
      return null;
    }
    return KNOWN_STATUSES.has(status)
      ? { kind: 'status', documentId, status: status as DocumentStatus }
      : null;
  } catch {
    return null;
  }
}
