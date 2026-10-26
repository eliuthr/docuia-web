import { DatePipe } from '@angular/common';
import { HttpErrorResponse, HttpStatusCode, httpResource } from '@angular/common/http';
import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { apiErrorMessage } from '../../../core/api-error-message';
import { refreshWhile } from '../../../core/refresh-while';
import { ExtractedDataView } from '../../components/extracted-data/extracted-data-view';
import { StatusBadge } from '../../components/status-badge/status-badge';
import { STATUS_POLL_INTERVAL_MS } from '../../documents.constants';
import { DocumentDto } from '../../models/document.model';
import { DocumentEvents } from '../../services/document-events';
import { DocumentsApi } from '../../services/documents-api';
import { syncDocumentWithChanges } from '../../services/sync-document-with-changes';
import { isInProgress } from '../../utils/document-status';
import { documentTypeLabel } from '../../utils/document-type-label';
import { pageCountLabel } from '../../utils/page-count-label';
import { QuestionPanel } from '../../../questions/components/question-panel/question-panel';
import { QuestionTarget } from '../../../questions/models/answer-event.model';

@Component({
  selector: 'app-document-detail-page',
  imports: [DatePipe, ExtractedDataView, QuestionPanel, RouterLink, StatusBadge],
  template: `
    <div class="space-y-8">
      <a
        routerLink="/"
        class="text-sm font-medium text-blue-800 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800"
      >
        ← All documents
      </a>

      @if (isNotFound()) {
        <div class="rounded-lg border border-slate-200 bg-white p-6">
          <h1 class="text-xl font-semibold text-slate-900">Document not found</h1>
          <p class="mt-2 text-slate-600">It may have been deleted, or the link is wrong.</p>
        </div>
      } @else if (document.error(); as error) {
        <div class="flex items-center gap-4 rounded-md bg-red-100 px-4 py-3 text-red-900">
          <p>{{ errorMessage(error) }}</p>
          <button
            type="button"
            class="rounded-md border border-red-900 px-3 py-1 text-sm font-semibold hover:bg-red-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-900"
            (click)="document.reload()"
          >
            Retry
          </button>
        </div>
      } @else if (document.hasValue()) {
        @let current = document.value();
        <section class="space-y-3 rounded-lg border border-slate-200 bg-white p-6">
          <div class="flex flex-wrap items-center gap-3">
            <h1 class="break-all text-xl font-semibold text-slate-900">
              {{ current.originalName }}
            </h1>
            <app-status-badge [status]="current.status" />
          </div>
          <p class="text-sm text-slate-600">
            {{ typeLabel(current.documentType) }} · {{ pageLabel(current.pageCount) }} · Uploaded
            {{ current.createdAt | date: 'medium' }}
          </p>
          @if (current.failureReason) {
            <p class="rounded-md bg-red-100 px-3 py-2 text-sm text-red-900">
              {{ current.failureReason }}
            </p>
          }
        </section>

        <section aria-labelledby="summary-heading" class="space-y-2">
          <h2 id="summary-heading" class="text-lg font-semibold text-slate-900">Summary</h2>
          <p class="text-slate-900">
            {{ current.summary ?? 'No summary yet.' }}
          </p>
        </section>

        @if (current.extractedData) {
          <section aria-labelledby="data-heading" class="space-y-4">
            <h2 id="data-heading" class="text-lg font-semibold text-slate-900">Extracted data</h2>
            <div class="rounded-lg border border-slate-200 bg-white p-6">
              <app-extracted-data-view [document]="current" />
            </div>
          </section>
        }

        @if (current.status === 'ready') {
          <app-question-panel
            heading="Ask about this document"
            placeholder="What is the due date?"
            [target]="questionTarget()"
          />
        }
      } @else {
        <p class="text-slate-600" role="status">Loading document…</p>
      }
    </div>
  `,
})
export class DocumentDetailPage {
  /** Viene del parámetro `:id` de la ruta (withComponentInputBinding). */
  readonly id = input.required<string>();

  private readonly api = inject(DocumentsApi);
  private readonly events = inject(DocumentEvents);

  protected readonly document = httpResource<DocumentDto>(() => this.api.documentUrl(this.id()));

  protected readonly isNotFound = computed(() => {
    const error = this.document.error();
    return error instanceof HttpErrorResponse && error.status === HttpStatusCode.NotFound;
  });

  protected readonly errorMessage = apiErrorMessage;
  protected readonly typeLabel = documentTypeLabel;
  protected readonly pageLabel = pageCountLabel;
  protected readonly questionTarget = computed<QuestionTarget>(() => ({
    kind: 'document',
    documentId: this.id(),
  }));

  constructor() {
    syncDocumentWithChanges(this.document, () => this.id());
    // Respaldo: solo se consulta periódicamente mientras la conexión SSE está caída.
    refreshWhile(
      this.document,
      (document) => !this.events.isConnected() && isInProgress(document.status),
      STATUS_POLL_INTERVAL_MS,
    );
  }
}
