import { httpResource } from '@angular/common/http';
import { Component, effect, inject } from '@angular/core';
import { apiErrorMessage } from '../../../core/api-error-message';
import { DocumentList } from '../../components/document-list/document-list';
import { UploadForm } from '../../components/upload-form/upload-form';
import { STATUS_POLL_INTERVAL_MS } from '../../documents.constants';
import { DocumentDto } from '../../models/document.model';
import { DocumentsApi } from '../../services/documents-api';
import { isInProgress } from '../../utils/document-status';

@Component({
  selector: 'app-documents-page',
  imports: [DocumentList, UploadForm],
  template: `
    <div class="space-y-10">
      <section class="rounded-lg border border-slate-200 bg-white p-6">
        <app-upload-form (uploaded)="documents.reload()" />
      </section>

      <section aria-labelledby="recent-heading" class="space-y-4">
        <h2 id="recent-heading" class="text-lg font-semibold text-slate-900">Recent documents</h2>

        @if (documents.error(); as error) {
          <div class="flex items-center gap-4 rounded-md bg-red-100 px-4 py-3 text-red-900">
            <p>{{ errorMessage(error) }}</p>
            <button
              type="button"
              class="rounded-md border border-red-900 px-3 py-1 text-sm font-semibold hover:bg-red-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-900"
              (click)="documents.reload()"
            >
              Retry
            </button>
          </div>
        } @else if (documents.hasValue()) {
          @if (documents.value().length === 0) {
            <p class="text-slate-600">No documents yet. Upload your first one above.</p>
          } @else {
            <app-document-list [documents]="documents.value()" />
          }
        } @else {
          <p class="text-slate-600" role="status">Loading documents…</p>
        }
      </section>
    </div>
  `,
})
export class DocumentsPage {
  private readonly api = inject(DocumentsApi);

  protected readonly documents = httpResource<DocumentDto[]>(() => this.api.recentDocumentsUrl());

  protected readonly errorMessage = apiErrorMessage;

  constructor() {
    this.refreshWhileInProgress();
  }

  /**
   * Cada respuesta es un arreglo nuevo, así que este effect se vuelve a ejecutar
   * tras cada refresco y programa el siguiente solo mientras haya documentos en proceso.
   */
  private refreshWhileInProgress(): void {
    effect((onCleanup) => {
      const documents = this.documents.hasValue() ? this.documents.value() : [];
      if (!documents.some((document) => isInProgress(document.status))) {
        return;
      }
      const timer = setTimeout(() => this.documents.reload(), STATUS_POLL_INTERVAL_MS);
      onCleanup(() => clearTimeout(timer));
    });
  }
}
