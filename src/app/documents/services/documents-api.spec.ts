import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../core/api-base-url';
import { DocumentDto } from '../models/document.model';
import { DocumentsApi } from './documents-api';

const BASE_URL = 'http://api.test';

describe('DocumentsApi', () => {
  let api: DocumentsApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE_URL },
      ],
    });
    api = TestBed.inject(DocumentsApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('uploads the file as multipart form data', () => {
    const file = new File(['%PDF'], 'invoice.pdf', { type: 'application/pdf' });
    let uploaded: DocumentDto | undefined;

    api.upload(file).subscribe((document) => (uploaded = document));

    const request = http.expectOne(`${BASE_URL}/documents`);
    expect(request.request.method).toBe('POST');
    expect((request.request.body as FormData).get('file')).toBe(file);
    request.flush({ id: '1', status: 'pending' });
    expect(uploaded?.status).toBe('pending');
  });

  it('builds the recent documents URL with the default limit', () => {
    expect(api.recentDocumentsUrl()).toBe(`${BASE_URL}/documents?limit=20`);
  });
});
