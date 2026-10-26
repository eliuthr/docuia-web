import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../../core/api-base-url';
import { AnswerEvent, MAX_QUESTION_LENGTH } from '../../models/answer-event.model';
import { ConversationDetailDto } from '../../models/conversation.model';
import { flushConversationLists } from '../../testing/flush-conversation-lists';
import { QuestionRequestError } from '../../services/question-request.error';
import { QuestionsApi } from '../../services/questions-api';
import { QuestionPanel } from './question-panel';

const BASE_URL = 'http://api.test';
const LIST_URL = `${BASE_URL}/conversations`;
const SETTLE_PASSES = 3;

const STORED_CONVERSATION: ConversationDetailDto = {
  id: 'conv-7',
  documentId: null,
  title: '¿Proveedor?',
  messageCount: 2,
  createdAt: '2026-10-26T18:14:11.687Z',
  updatedAt: '2026-10-26T18:14:47.134Z',
  messages: [
    { role: 'user', text: '¿Proveedor?', createdAt: '2026-10-26T18:14:11.687Z' },
    { role: 'assistant', text: 'Tecnosuministros.', createdAt: '2026-10-26T18:14:47.134Z' },
  ],
};

/**
 * Stream controlado por el test: cada `push` entrega un evento y `end`/`fail`
 * terminan la respuesta, para revisar la vista en cada paso.
 */
class ControlledStream {
  private readonly queue: AnswerEvent[] = [];
  private wake: (() => void) | null = null;
  private isEnded = false;
  private failure: unknown = null;

  push(event: AnswerEvent): void {
    this.queue.push(event);
    this.notify();
  }

  end(): void {
    this.isEnded = true;
    this.notify();
  }

  fail(error: unknown): void {
    this.failure = error;
    this.notify();
  }

  async *events(signal: AbortSignal): AsyncGenerator<AnswerEvent> {
    signal.addEventListener('abort', () => this.fail(new DOMException('Aborted', 'AbortError')));
    while (true) {
      const event = this.queue.shift();
      if (event) {
        yield event;
        continue;
      }
      if (this.failure) {
        throw this.failure;
      }
      if (this.isEnded) {
        return;
      }
      await new Promise<void>((resolve) => (this.wake = resolve));
    }
  }

  private notify(): void {
    this.wake?.();
    this.wake = null;
  }
}

describe('QuestionPanel', () => {
  let fixture: ComponentFixture<QuestionPanel>;
  let element: HTMLElement;
  let stream: ControlledStream;
  let ask: ReturnType<typeof vi.fn>;
  let http: HttpTestingController;
  /** Lo que devuelve la API cada vez que el panel pide la lista de conversaciones. */
  let storedConversations: object[];
  let historyRequestCount: number;

  beforeEach(async () => {
    stream = new ControlledStream();
    ask = vi.fn((_target, _request, signal: AbortSignal) => stream.events(signal));
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE_URL },
        { provide: QuestionsApi, useValue: { ask } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    storedConversations = [];
    historyRequestCount = 0;
    await createPanel();
  });

  async function createPanel(): Promise<void> {
    fixture = TestBed.createComponent(QuestionPanel);
    fixture.componentRef.setInput('target', { kind: 'collection' });
    fixture.componentRef.setInput('heading', 'Ask your documents');
    element = fixture.nativeElement as HTMLElement;
    await settle();
  }

  function field(): HTMLTextAreaElement {
    return element.querySelector('textarea') as HTMLTextAreaElement;
  }

  function sendButton(): HTMLButtonElement {
    return element.querySelector('button[type="submit"]') as HTMLButtonElement;
  }

  async function type(text: string): Promise<void> {
    field().value = text;
    field().dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  async function send(text: string): Promise<void> {
    await type(text);
    sendButton().click();
    await settle();
  }

  /**
   * Deja que el generador procese lo que haya en la cola y re-renderiza. Antes
   * responde la lista de conversaciones, porque `whenStable` esperaría esa petición.
   */
  async function settle(): Promise<void> {
    // Varias pasadas: la recarga de la lista se pide unas microtareas después del `done`.
    for (let pass = 0; pass < SETTLE_PASSES; pass++) {
      for (let round = 0; round < 5; round++) {
        await Promise.resolve();
      }
      TestBed.tick();
      historyRequestCount += flushConversationLists(http, storedConversations);
    }
    await fixture.whenStable();
  }

  /** Vuelve a crear el panel para que muestre estas conversaciones guardadas. */
  async function createPanelWithHistory(conversations: object[]): Promise<void> {
    storedConversations = conversations;
    fixture.destroy();
    await createPanel();
  }

  function buttonNamed(name: string): HTMLButtonElement | undefined {
    return Array.from(element.querySelectorAll('button')).find((button) =>
      button.textContent?.trim().startsWith(name),
    );
  }

  async function answerFully(text: string): Promise<void> {
    stream.push({ type: 'delta', text });
    stream.push({ type: 'done' });
    stream.end();
    await settle();
  }

  function answerText(): string {
    return element.querySelector('ol li:last-child div')?.textContent ?? '';
  }

  function status(): string {
    return element.querySelector('[role="status"]')?.textContent?.trim() ?? '';
  }

  it('sends the question and clears the field', async () => {
    await send('  ¿Cuánto suman?  ');

    expect(ask).toHaveBeenCalledWith(
      { kind: 'collection' },
      { question: '¿Cuánto suman?', conversationId: null },
      expect.any(AbortSignal),
    );
    expect(field().value).toBe('');
    expect(element.querySelector('ol')?.textContent).toContain('¿Cuánto suman?');
  });

  it('shows the active tool and then the streamed text', async () => {
    await send('¿Cuánto suman?');

    stream.push({ type: 'tool', name: 'find_documents' });
    await settle();
    expect(answerText()).toContain('Searching documents…');

    stream.push({ type: 'delta', text: 'Suman ' });
    stream.push({ type: 'delta', text: '10 COP.' });
    await settle();
    expect(answerText()).toContain('Suman 10 COP.');
    expect(answerText()).not.toContain('Searching documents…');
  });

  it('shows each agent step until a tool or the text replaces it', async () => {
    await send('¿Cuánto suman?');

    stream.push({ type: 'status', step: 'classifying' });
    await settle();
    expect(answerText()).toContain('Understanding the question…');

    stream.push({ type: 'tool', name: 'find_documents' });
    await settle();
    expect(answerText()).toContain('Searching documents…');
    expect(answerText()).not.toContain('Understanding the question…');

    stream.push({ type: 'status', step: 'verifying' });
    await settle();
    expect(answerText()).toContain('Checking the answer against your documents…');
  });

  it('continues the conversation with the id sent by the API', async () => {
    await send('¿Proveedor?');
    stream.push({ type: 'conversation', id: 'conv-1' });
    await answerFully('Tecnosuministros.');

    stream = new ControlledStream();
    await send('¿Y el total?');

    expect(ask.mock.calls[1][1]).toEqual({ question: '¿Y el total?', conversationId: 'conv-1' });
  });

  it('reloads the previous conversations after a complete answer', async () => {
    const requestsBefore = historyRequestCount;
    await send('¿Proveedor?');

    await answerFully('Tecnosuministros.');

    expect(historyRequestCount).toBe(requestsBefore + 1);
  });

  it('starts a new conversation on demand', async () => {
    await send('¿Proveedor?');
    stream.push({ type: 'conversation', id: 'conv-1' });
    await answerFully('Tecnosuministros.');

    buttonNamed('New conversation')?.click();
    await fixture.whenStable();

    expect(element.querySelector('ol')).toBeNull();
    expect(status()).toBe('New conversation started.');
    expect(document.activeElement).toBe(field());
    stream = new ControlledStream();
    await send('Hola');
    expect(ask.mock.calls[1][1]).toEqual({ question: 'Hola', conversationId: null });
  });

  it('hides the new conversation button while an answer streams', async () => {
    await send('¿Proveedor?');

    expect(buttonNamed('New conversation')).toBeUndefined();
  });

  it('opens a previous conversation and continues it', async () => {
    await createPanelWithHistory([STORED_CONVERSATION]);

    buttonNamed('¿Proveedor?')?.click();
    http.expectOne(`${LIST_URL}/conv-7`).flush(STORED_CONVERSATION);
    await settle();

    expect(element.querySelector('ol')?.textContent).toContain('Tecnosuministros.');
    expect(status()).toBe('Conversation loaded.');
    await send('¿Y el total?');
    expect(ask.mock.calls[0][1]).toEqual({ question: '¿Y el total?', conversationId: 'conv-7' });
  });

  it('shows an error when a previous conversation cannot be opened', async () => {
    await createPanelWithHistory([STORED_CONVERSATION]);

    buttonNamed('¿Proveedor?')?.click();
    http
      .expectOne(`${LIST_URL}/conv-7`)
      .flush(
        { message: 'Conversation conv-7 not found' },
        { status: 404, statusText: 'Not Found' },
      );
    await settle();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Conversation conv-7 not found',
    );
  });

  it('shows the answer without Markdown bold markers', async () => {
    await send('¿Cuánto pagué?');

    stream.push({ type: 'delta', text: 'Pagaste **43.' });
    stream.push({ type: 'delta', text: '000 COP**.' });
    await settle();

    expect(answerText()).toContain('Pagaste 43.000 COP.');
    expect(answerText()).not.toContain('**');
  });

  it('announces when the answer is ready and enables sending again', async () => {
    await send('¿Cuánto suman?');
    expect(element.querySelector('ol')?.getAttribute('aria-busy')).toBe('true');

    stream.push({ type: 'delta', text: 'Listo.' });
    stream.push({ type: 'done' });
    stream.end();
    await settle();

    expect(status()).toBe('Answer ready.');
    expect(element.querySelector('ol')?.getAttribute('aria-busy')).toBe('false');
    await type('Otra pregunta');
    expect(sendButton().disabled).toBe(false);
  });

  it('keeps the partial answer and shows the error event message', async () => {
    await send('¿Cuánto suman?');

    stream.push({ type: 'delta', text: 'Las facturas' });
    stream.push({ type: 'error', message: 'The answer could not be completed. Try again.' });
    stream.end();
    await settle();

    expect(answerText()).toContain('Las facturas');
    expect(answerText()).toContain('The answer could not be completed. Try again.');
    expect(status()).toBe('The answer could not be completed. Try again.');
  });

  it('shows the API message when the request is rejected', async () => {
    await send('¿Cuánto suman?');

    stream.fail(new QuestionRequestError('The document is still being processed.'));
    await settle();

    expect(answerText()).toContain('The document is still being processed.');
  });

  it('stops the answer on demand', async () => {
    await send('¿Cuánto suman?');
    const stopButton = Array.from(element.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Stop',
    );

    stopButton?.click();
    await settle();

    expect(answerText()).toContain('Stopped.');
    expect(status()).toBe('Answer stopped.');
    expect((ask.mock.calls[0][2] as AbortSignal).aborted).toBe(true);
  });

  it('does not send while an answer is streaming', async () => {
    await send('Primera');
    await type('Segunda');

    expect(sendButton().disabled).toBe(true);
  });

  it('does not send an empty or too long question', async () => {
    await type('   ');
    expect(sendButton().disabled).toBe(true);

    await type('x'.repeat(MAX_QUESTION_LENGTH + 1));
    expect(sendButton().disabled).toBe(true);
    expect(element.textContent).toContain('The question is too long');
  });

  it('aborts the request when the panel is destroyed', async () => {
    await send('¿Cuánto suman?');

    fixture.destroy();

    expect((ask.mock.calls[0][2] as AbortSignal).aborted).toBe(true);
  });
});
