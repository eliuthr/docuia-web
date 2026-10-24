import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { API_BASE_URL } from '../../../core/api-base-url';
import { EVENT_SOURCE_FACTORY } from '../../../core/event-source-factory';
import { FakeEventSource, fakeEventSourceFactory } from '../../../core/testing/fake-event-source';
import { EVENT_RELOAD_DELAY_MS, STATUS_POLL_INTERVAL_MS } from '../../documents.constants';
import { buildDocument } from '../../testing/build-document';
import { DocumentDetailPage } from './document-detail-page';

const DOCUMENT_ID = '3a2465c7-fce3-45f9-ab39-d23b3b407e4f';
const DOCUMENT_URL = `http://api.test/documents/${DOCUMENT_ID}`;

describe('DocumentDetailPage', () => {
  let fixture: ComponentFixture<DocumentDetailPage>;
  let element: HTMLElement;
  let http: HttpTestingController;

  beforeEach(() => {
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
    fixture = TestBed.createComponent(DocumentDetailPage);
    fixture.componentRef.setInput('id', DOCUMENT_ID);
    element = fixture.nativeElement as HTMLElement;
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
    http.expectOne(DOCUMENT_URL).flush(body, init);
    await settle();
  }

  it('shows the document header, summary and extracted data', async () => {
    await respond(buildDocument());

    expect(element.querySelector('h1')?.textContent).toContain('1-factura-electronica.pdf');
    expect(element.textContent).toContain('Invoice');
    expect(element.textContent).toContain('Ready');
    expect(element.textContent).toContain('Factura de Tecnosuministros por 2.638.825 COP.');
    expect(element.textContent).toContain('Extracted data');
    expect(element.textContent).toContain('Tecnosuministros del Caribe S.A.S.');
    expect(element.textContent).toContain('Ask about this document');
  });

  it('shows only the summary for documents without extracted data', async () => {
    await respond(buildDocument({ documentType: 'other', extractedData: null }));

    expect(element.textContent).toContain('Other');
    expect(element.textContent).not.toContain('Extracted data');
  });

  it('shows "Document not found" for a 404', async () => {
    await respond({ message: 'Document not found' }, { status: 404, statusText: 'Not Found' });

    expect(element.querySelector('h1')?.textContent).toContain('Document not found');
    expect(element.querySelector('a[href="/"]')).not.toBeNull();
  });

  it('shows the failure reason of a failed document', async () => {
    await respond(
      buildDocument({
        status: 'failed',
        failureReason: 'The PDF file is corrupt or cannot be read.',
        documentType: null,
        extractedData: null,
      }),
    );

    expect(element.textContent).toContain('The PDF file is corrupt or cannot be read.');
    expect(element.textContent).toContain('Not classified');
    expect(element.textContent).not.toContain('Ask about this document');
  });

  it('reloads when an event about this document arrives, not for other documents', async () => {
    await respond(buildDocument({ status: 'processing' }));
    const events = FakeEventSource.latest();
    events.open();

    events.emit('document.updated', '{"documentId":"another-id","status":"ready"}');
    await settle(EVENT_RELOAD_DELAY_MS);
    http.expectNone(DOCUMENT_URL);

    events.emit('document.updated', `{"documentId":"${DOCUMENT_ID}","status":"ready"}`);
    await settle(EVENT_RELOAD_DELAY_MS);
    await respond(buildDocument());
    expect(element.textContent).toContain('Ready');
  });

  it('does not poll while the event stream is connected', async () => {
    FakeEventSource.latest().open();
    await respond(buildDocument({ status: 'processing' }));

    await settle(STATUS_POLL_INTERVAL_MS);

    http.expectNone(DOCUMENT_URL);
  });

  it('polls while the event stream is down and stops when ready', async () => {
    await respond(
      buildDocument({
        status: 'processing',
        documentType: null,
        summary: null,
        extractedData: null,
      }),
    );

    await settle(STATUS_POLL_INTERVAL_MS);
    await respond(buildDocument());
    expect(element.textContent).toContain('Ready');

    await settle(STATUS_POLL_INTERVAL_MS * 2);
    http.expectNone(DOCUMENT_URL);
  });
});
