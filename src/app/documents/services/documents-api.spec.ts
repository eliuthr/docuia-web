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

  it('builds the first page URL with the default page size', () => {
    expect(api.documentsPageUrl(null)).toBe(`${BASE_URL}/documents?limit=10`);
  });

  it('adds the cursor for the following pages', () => {
    expect(api.documentsPageUrl('abc_-1')).toBe(`${BASE_URL}/documents?limit=10&cursor=abc_-1`);
  });

  it('gets one document', () => {
    let received: DocumentDto | undefined;

    api.getDocument('doc-1').subscribe((document) => (received = document));

    http.expectOne(`${BASE_URL}/documents/doc-1`).flush({ id: 'doc-1', status: 'ready' });
    expect(received?.id).toBe('doc-1');
  });
});
