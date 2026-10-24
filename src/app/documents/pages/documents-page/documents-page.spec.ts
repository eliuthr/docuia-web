import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { API_BASE_URL } from '../../../core/api-base-url';
import { STATUS_POLL_INTERVAL_MS } from '../../documents.constants';
import { DocumentDto } from '../../models/document.model';
import { DocumentsPage } from './documents-page';

const LIST_URL = 'http://api.test/documents?limit=20';

const pendingDocument: DocumentDto = {
  id: '1',
  originalName: 'invoice.pdf',
  mimeType: 'application/pdf',
  sizeBytes: 4,
  status: 'pending',
  pageCount: null,
  failureReason: null,
  documentType: null,
  summary: null,
  extractedData: null,
  createdAt: '2026-10-22T18:00:00.000Z',
  updatedAt: '2026-10-22T18:00:00.000Z',
};
const readyDocument: DocumentDto = { ...pendingDocument, status: 'ready', pageCount: 2 };

describe('DocumentsPage', () => {
  let fixture: ComponentFixture<DocumentsPage>;
  let element: HTMLElement;
  let http: HttpTestingController;

  beforeEach(() => {
    // Los temporizadores falsos permiten disparar el intervalo de polling al instante.
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: 'http://api.test' },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DocumentsPage);
    element = fixture.nativeElement as HTMLElement;
    // `whenStable` esperaría la petición pendiente, así que se renderiza de forma síncrona.
    TestBed.tick();
  });

  afterEach(() => {
    http.verify();
    vi.useRealTimers();
  });

  /** El resource se actualiza en una microtarea, así que se deja asentar antes de renderizar. */
  async function settle(milliseconds = 0): Promise<void> {
    await vi.advanceTimersByTimeAsync(milliseconds);
    TestBed.tick();
  }

  async function respond(body: object, init?: { status: number; statusText: string }) {
    http.expectOne(LIST_URL).flush(body, init);
    await settle();
  }

  function waitForPollInterval(): Promise<void> {
    return settle(STATUS_POLL_INTERVAL_MS);
  }

  it('shows a loading message while the list is requested', () => {
    expect(element.textContent).toContain('Loading documents');
    http.expectOne(LIST_URL);
  });

  it('lists the documents returned by the API', async () => {
    await respond([readyDocument]);

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
    await settle();

    await respond([readyDocument]);
    expect(element.textContent).toContain('invoice.pdf');
  });

  describe('polling', () => {
    it('refreshes while a document is in progress and keeps the list visible', async () => {
      await respond([pendingDocument]);

      await waitForPollInterval();

      expect(element.textContent).not.toContain('Loading documents');
      await respond([readyDocument]);
      expect(element.textContent).toContain('Ready');
    });

    it('stops refreshing once every document is finished', async () => {
      await respond([pendingDocument]);
      await waitForPollInterval();
      await respond([readyDocument]);

      await waitForPollInterval();

      http.expectNone(LIST_URL);
    });

    it('does not refresh when nothing is in progress', async () => {
      await respond([readyDocument]);

      await waitForPollInterval();

      http.expectNone(LIST_URL);
    });

    it('does not refresh after a failed request', async () => {
      await respond(
        { message: 'Internal server error' },
        { status: 500, statusText: 'Server Error' },
      );

      await waitForPollInterval();

      http.expectNone(LIST_URL);
    });
  });
});
