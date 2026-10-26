import { httpResource } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { apiErrorMessage } from '../../../core/api-error-message';
import { refreshWhile } from '../../../core/refresh-while';
import { QuestionPanel } from '../../../questions/components/question-panel/question-panel';
import { QuestionTarget } from '../../../questions/models/answer-event.model';
import { DocumentList } from '../../components/document-list/document-list';
import { UploadForm } from '../../components/upload-form/upload-form';
import { STATUS_POLL_INTERVAL_MS } from '../../documents.constants';
import { DocumentDto, DocumentPageDto } from '../../models/document.model';
import { DocumentEvents } from '../../services/document-events';
import { DocumentsApi } from '../../services/documents-api';
import { syncPageWithDocumentChanges } from '../../services/sync-page-with-document-changes';
import { CursorPager } from '../../utils/cursor-pager';
import { withNewDocument } from '../../utils/document-page-updates';
import { isInProgress } from '../../utils/document-status';

const COLLECTION_TARGET: QuestionTarget = { kind: 'collection' };

@Component({
  selector: 'app-documents-page',
  imports: [DocumentList, QuestionPanel, UploadForm],
  templateUrl: './documents-page.html',
})
export class DocumentsPage {
  private readonly api = inject(DocumentsApi);
  private readonly events = inject(DocumentEvents);

  protected readonly pager = new CursorPager();
  protected readonly documents = httpResource<DocumentPageDto>(() =>
    this.api.documentsPageUrl(this.pager.currentCursor()),
  );

  protected readonly errorMessage = apiErrorMessage;
  protected readonly collectionTarget = COLLECTION_TARGET;

  constructor() {
    syncPageWithDocumentChanges(this.documents, () => this.pager.isFirstPage());
    // Respaldo: solo se consulta periódicamente mientras la conexión SSE está caída.
    refreshWhile(
      this.documents,
      (page) => !this.events.isConnected() && page.items.some((item) => isInProgress(item.status)),
      STATUS_POLL_INTERVAL_MS,
    );
  }

  /**
   * Tras subir un archivo se muestra en la primera página. Si ya está cargada,
   * se añade en memoria con el documento que devolvió la API, sin pedir la lista.
   */
  protected showUploaded(document: DocumentDto): void {
    if (!this.pager.isFirstPage()) {
      this.pager.reset();
      return;
    }
    if (this.documents.hasValue()) {
      this.documents.update((page) => page && withNewDocument(page, document));
      return;
    }
    // Si la primera página aún no cargó o falló, se pide de nuevo.
    this.documents.reload();
  }

  protected goToNextPage(nextCursor: string | null): void {
    if (nextCursor) {
      this.pager.next(nextCursor);
    }
  }
}
