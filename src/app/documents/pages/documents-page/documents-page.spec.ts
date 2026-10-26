import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { API_BASE_URL } from '../../../core/api-base-url';
import { EVENT_SOURCE_FACTORY } from '../../../core/event-source-factory';
import { FakeEventSource, fakeEventSourceFactory } from '../../../core/testing/fake-event-source';
import { flushConversationLists } from '../../../questions/testing/flush-conversation-lists';
import { STATUS_POLL_INTERVAL_MS } from '../../documents.constants';
import { DocumentDto, DocumentPageDto } from '../../models/document.model';
import { buildDocument } from '../../testing/build-document';
import { UploadForm } from '../../components/upload-form/upload-form';
import { DocumentsPage } from './documents-page';

const FIRST_PAGE_URL = 'http://api.test/documents?limit=10';
const SECOND_PAGE_URL = 'http://api.test/documents?limit=10&cursor=cursor-2';
const DOCUMENT_URL = 'http://api.test/documents/1';

const pendingDocument = buildDocument({
  id: '1',
  originalName: 'invoice.pdf',
  status: 'pending',
  pageCount: null,
  documentType: null,
  summary: null,
  extractedData: null,
});
const readyDocument: DocumentDto = { ...pendingDocument, status: 'ready', pageCount: 2 };

function pageOf(items: DocumentDto[], nextCursor: string | null = null): DocumentPageDto {
  return { items, nextCursor };
}

describe('DocumentsPage', () => {
  let fixture: ComponentFixture<DocumentsPage>;
  let element: HTMLElement;
  let http: HttpTestingController;

  beforeEach(() => {
    // Los temporizadores falsos permiten disparar el intervalo de polling al instante.
    vi.useFakeTimers();
    FakeEventSource.reset();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: 'http://api.test' },
        { provide: EVENT_SOURCE_FACTORY, useValue: fakeEventSourceFactory },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DocumentsPage);
    element = fixture.nativeElement as HTMLElement;
    // `whenStable` esperaría la petición pendiente, así que se renderiza de forma síncrona.
    TestBed.tick();
  });

  afterEach(() => {
    flushConversationLists(http);
    http.verify();
    vi.useRealTimers();
  });

  /** El resource se actualiza en una microtarea, así que se deja asentar antes de renderizar. */
  async function settle(milliseconds = 0): Promise<void> {
    await vi.advanceTimersByTimeAsync(milliseconds);
    TestBed.tick();
  }

  async function respond(
    body: object,
    url = FIRST_PAGE_URL,
    init?: { status: number; statusText: string },
  ): Promise<void> {
    http.expectOne(url).flush(body, init);
    await settle();
  }

  function waitForPollInterval(): Promise<void> {
    return settle(STATUS_POLL_INTERVAL_MS);
  }

  function button(label: string): HTMLButtonElement {
    const found = [...element.querySelectorAll('button')].find((candidate) =>
      candidate.textContent?.includes(label),
    );
    if (!found) {
      throw new Error(`Button "${label}" not found`);
    }
    return found;
  }

  it('shows a loading message while the list is requested', () => {
    expect(element.textContent).toContain('Loading documents');
    http.expectOne(FIRST_PAGE_URL);
  });

  it('lists the documents of the first page', async () => {
    await respond(pageOf([readyDocument]));

    expect(element.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(element.textContent).toContain('invoice.pdf');
  });

  it('shows an empty state when there are no documents', async () => {
    await respond(pageOf([]));

    expect(element.textContent).toContain('No documents yet');
    expect(element.querySelector('nav')).toBeNull();
  });

  it('shows the error and retries on demand', async () => {
    await respond({ message: 'Internal server error' }, FIRST_PAGE_URL, {
      status: 500,
      statusText: 'Server Error',
    });
    expect(element.textContent).toContain('Internal server error');

    button('Retry').click();
    await settle();

    await respond(pageOf([readyDocument]));
    expect(element.textContent).toContain('invoice.pdf');
  });

  describe('after an upload', () => {
    const uploadedDocument = buildDocument({ id: 'new', originalName: 'new.pdf', status: 'pending' });

    function emitUploaded(): void {
      fixture.debugElement
        .query(By.directive(UploadForm))
        .componentInstance.uploaded.emit(uploadedDocument);
      TestBed.tick();
    }

    it('adds the uploaded document to the first page without requesting the list', async () => {
      await respond(pageOf([readyDocument]));

      emitUploaded();

      const rows = element.querySelectorAll('tbody tr');
      expect(rows).toHaveLength(2);
      expect(rows[0].textContent).toContain('new.pdf');
      http.expectNone(FIRST_PAGE_URL);
    });

    it('goes back to the first page when another page is shown', async () => {
      await respond(pageOf([readyDocument], 'cursor-2'));
      button('Next').click();
      await settle();
      await respond(pageOf([buildDocument({ id: '2' })]), SECOND_PAGE_URL);

      emitUploaded();
      await settle();

      await respond(pageOf([uploadedDocument, readyDocument]));
      expect(element.querySelectorAll('tbody tr')[0].textContent).toContain('new.pdf');
    });
  });

  describe('pagination', () => {
    it('moves to the next page with its cursor and back to the first one', async () => {
      await respond(pageOf([readyDocument], 'cursor-2'));
      expect(button('Previous').disabled).toBe(true);
      expect(element.textContent).toContain('Page 1');

      button('Next').click();
      await settle();
      await respond(
        pageOf([buildDocument({ id: '2', originalName: 'older.pdf' })]),
        SECOND_PAGE_URL,
      );
      expect(element.textContent).toContain('older.pdf');
      expect(element.textContent).toContain('Page 2');
      expect(button('Next').disabled).toBe(true);

      button('Previous').click();
      await settle();
      await respond(pageOf([readyDocument], 'cursor-2'));
      expect(element.textContent).toContain('invoice.pdf');
    });

    it('hides the page controls when everything fits in one page', async () => {
      await respond(pageOf([readyDocument]));

      expect(element.querySelector('nav')).toBeNull();
    });
  });

  describe('status events', () => {
    beforeEach(async () => {
      await respond(pageOf([pendingDocument]));
      FakeEventSource.latest().open();
    });

    it('updates the label of a processing document without any request', async () => {
      FakeEventSource.latest().emit('document.updated', '{"documentId":"1","status":"processing"}');
      await settle();

      expect(element.textContent).toContain('Processing');
      http.expectNone(FIRST_PAGE_URL);
      http.expectNone(DOCUMENT_URL);
    });

    it('fetches only the finished document and replaces its row', async () => {
      FakeEventSource.latest().emit('document.updated', '{"documentId":"1","status":"ready"}');
      await settle();

      await respond(readyDocument, DOCUMENT_URL);
      expect(element.textContent).toContain('Ready');
      expect(
        element.querySelectorAll<HTMLTableRowElement>('tbody tr')[0].cells[2].textContent?.trim(),
      ).toBe('2');
      http.expectNone(FIRST_PAGE_URL);
    });

    it('reloads the first page for a new document that is not listed', async () => {
      FakeEventSource.latest().emit(
        'document.updated',
        '{"documentId":"uploaded-elsewhere","status":"processing"}',
      );
      await settle();

      await respond(pageOf([readyDocument]));
    });

    it('reloads after the event stream reconnects', async () => {
      const events = FakeEventSource.latest();
      events.fail();

      events.open();
      await settle();

      await respond(pageOf([pendingDocument]));
    });

    it('does not poll while the event stream is connected', async () => {
      await waitForPollInterval();

      http.expectNone(FIRST_PAGE_URL);
    });
  });

  it('ignores events for documents of other pages', async () => {
    await respond(pageOf([readyDocument], 'cursor-2'));
    button('Next').click();
    await settle();
    await respond(pageOf([buildDocument({ id: '2' })]), SECOND_PAGE_URL);
    FakeEventSource.latest().open();

    FakeEventSource.latest().emit('document.updated', '{"documentId":"new","status":"ready"}');
    await settle();

    http.expectNone(SECOND_PAGE_URL);
    http.expectNone(FIRST_PAGE_URL);
  });

  describe('polling while the event stream is down', () => {
    it('refreshes while a document is in progress and keeps the list visible', async () => {
      await respond(pageOf([pendingDocument]));

      await waitForPollInterval();

      expect(element.textContent).not.toContain('Loading documents');
      await respond(pageOf([readyDocument]));
      expect(element.textContent).toContain('Ready');
    });

    it('stops refreshing once every document is finished', async () => {
      await respond(pageOf([pendingDocument]));
      await waitForPollInterval();
      await respond(pageOf([readyDocument]));

      await waitForPollInterval();

      http.expectNone(FIRST_PAGE_URL);
    });

    it('does not refresh after a failed request', async () => {
      await respond({ message: 'Internal server error' }, FIRST_PAGE_URL, {
        status: 500,
        statusText: 'Server Error',
      });

      await waitForPollInterval();

      http.expectNone(FIRST_PAGE_URL);
    });
  });
});
