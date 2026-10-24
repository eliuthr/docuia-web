import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api-base-url';
import { DocumentDto } from '../models/document.model';
import { RECENT_DOCUMENTS_LIMIT } from '../documents.constants';

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

  recentDocumentsUrl(limit = RECENT_DOCUMENTS_LIMIT): string {
    return `${this.documentsUrl}?limit=${limit}`;
  }

  documentUrl(id: string): string {
    return `${this.documentsUrl}/${encodeURIComponent(id)}`;
  }
}
