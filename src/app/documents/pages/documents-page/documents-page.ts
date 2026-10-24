import { httpResource } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { apiErrorMessage } from '../../../core/api-error-message';
import { DocumentDto } from '../../models/document.model';
import { DocumentList } from '../../components/document-list/document-list';
import { DocumentsApi } from '../../services/documents-api';
import { UploadForm } from '../../components/upload-form/upload-form';

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
}
