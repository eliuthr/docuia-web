import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../../core/api-base-url';
import { DocumentDto } from '../../models/document.model';
import { DocumentsPage } from './documents-page';

const LIST_URL = 'http://api.test/documents?limit=20';

const pendingDocument: DocumentDto = {
  id: '1',
  originalName: 'invoice.pdf',
  mimeType: 'application/pdf',
  sizeBytes: 4,
  status: 'pending',
  createdAt: '2026-10-22T18:00:00.000Z',
  updatedAt: '2026-10-22T18:00:00.000Z',
};

describe('DocumentsPage', () => {
  let fixture: ComponentFixture<DocumentsPage>;
  let element: HTMLElement;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://api.test' },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DocumentsPage);
    element = fixture.nativeElement as HTMLElement;
    // `whenStable` would wait for the pending request, so render synchronously.
    TestBed.tick();
  });

  afterEach(() => http.verify());

  async function respond(body: object, init?: { status: number; statusText: string }) {
    http.expectOne(LIST_URL).flush(body, init);
    await fixture.whenStable();
  }

  it('shows a loading message while the list is requested', () => {
    expect(element.textContent).toContain('Loading documents');
    http.expectOne(LIST_URL);
  });

  it('lists the documents returned by the API', async () => {
    await respond([pendingDocument]);

    expect(element.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(element.textContent).toContain('invoice.pdf');
  });

  it('shows an empty state when there are no documents', async () => {
    await respond([]);

    expect(element.textContent).toContain('No documents yet');
  });

  it('shows the error and retries on demand', async () => {
    await respond(
      { message: 'Internal server error' },
      { status: 500, statusText: 'Server Error' },
    );
    expect(element.textContent).toContain('Internal server error');

    const retry = [...element.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Retry',
    );
    retry!.click();
    TestBed.tick();

    await respond([pendingDocument]);
    expect(element.textContent).toContain('invoice.pdf');
  });
});
