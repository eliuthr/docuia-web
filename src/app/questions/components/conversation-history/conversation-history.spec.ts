import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../../core/api-base-url';
import { ConversationSummaryDto } from '../../models/conversation.model';
import { ConversationHistory } from './conversation-history';

const BASE_URL = 'http://api.test';

function buildSummary(overrides: Partial<ConversationSummaryDto> = {}): ConversationSummaryDto {
  return {
    id: 'conv-1',
    documentId: 'doc-1',
    title: '¿Cuál es el total?',
    messageCount: 2,
    createdAt: '2026-10-26T18:14:11.687Z',
    updatedAt: '2026-10-26T18:14:47.134Z',
    ...overrides,
  };
}

describe('ConversationHistory', () => {
  let fixture: ComponentFixture<ConversationHistory>;
  let element: HTMLElement;
  let http: HttpTestingController;
  const listUrl = `${BASE_URL}/conversations?documentId=doc-1`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE_URL },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ConversationHistory);
    fixture.componentRef.setInput('target', { kind: 'document', documentId: 'doc-1' });
    element = fixture.nativeElement as HTMLElement;
    // `whenStable` esperaría la petición pendiente, así que se renderiza de forma síncrona.
    TestBed.tick();
  });

  afterEach(() => http.verify());

  async function respond(conversations: ConversationSummaryDto[]): Promise<void> {
    http.expectOne(listUrl).flush(conversations);
    await fixture.whenStable();
  }

  function buttons(): HTMLButtonElement[] {
    return Array.from(element.querySelectorAll('button'));
  }

  it('lists the conversations of the target', async () => {
    await respond([buildSummary(), buildSummary({ id: 'conv-2', title: '¿Proveedor?' })]);

    expect(element.querySelector('summary')?.textContent).toContain('Previous conversations (2)');
    expect(buttons().map((button) => button.textContent)).toEqual([
      expect.stringContaining('¿Cuál es el total?'),
      expect.stringContaining('¿Proveedor?'),
    ]);
  });

  it('shows nothing when there are no conversations', async () => {
    await respond([]);

    expect(element.querySelector('details')).toBeNull();
  });

  it('emits the id of the conversation to open', async () => {
    const opened = vi.fn();
    fixture.componentInstance.opened.subscribe(opened);
    await respond([buildSummary()]);

    buttons()[0].click();

    expect(opened).toHaveBeenCalledWith('conv-1');
  });

  it('marks the current conversation and disables opening while asking', async () => {
    fixture.componentRef.setInput('currentId', 'conv-1');
    fixture.componentRef.setInput('disabled', true);
    await respond([buildSummary()]);

    expect(buttons()[0].getAttribute('aria-current')).toBe('true');
    expect(buttons()[0].disabled).toBe(true);
  });

  it('requests the list again on reload', async () => {
    await respond([]);

    fixture.componentInstance.reload();
    TestBed.tick();

    await respond([buildSummary()]);
    expect(buttons()).toHaveLength(1);
  });
});
