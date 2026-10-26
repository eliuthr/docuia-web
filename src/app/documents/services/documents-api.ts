import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api-base-url';
import { DocumentDto } from '../models/document.model';
import { DOCUMENTS_PAGE_SIZE } from '../documents.constants';

const UPLOAD_FIELD_NAME = 'file';

@Service()
export class DocumentsApi {
  private readonly http = inject(HttpClient);
  private readonly documentsUrl = `${inject(API_BASE_URL)}/documents`;

  upload(file: File): Observable<DocumentDto> {
    const body = new FormData();
    body.append(UPLOAD_FIELD_NAME, file);
    return this.http.post<DocumentDto>(this.documentsUrl, body);
  }

  getDocument(id: string): Observable<DocumentDto> {
    return this.http.get<DocumentDto>(this.documentUrl(id));
  }

  /** URL de una página de la lista; `cursor` es el `nextCursor` de la página anterior. */
  documentsPageUrl(cursor: string | null, limit = DOCUMENTS_PAGE_SIZE): string {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) {
      params.set('cursor', cursor);
    }
    return `${this.documentsUrl}?${params.toString()}`;
  }

  documentUrl(id: string): string {
    return `${this.documentsUrl}/${encodeURIComponent(id)}`;
  }
}
