import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnswerEvent, MAX_QUESTION_LENGTH } from '../../models/answer-event.model';
import { QuestionRequestError } from '../../services/question-request.error';
import { QuestionsApi } from '../../services/questions-api';
import { QuestionPanel } from './question-panel';

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

  beforeEach(async () => {
    stream = new ControlledStream();
    ask = vi.fn((_target, _question, signal: AbortSignal) => stream.events(signal));
    TestBed.configureTestingModule({
      providers: [{ provide: QuestionsApi, useValue: { ask } }],
    });
    fixture = TestBed.createComponent(QuestionPanel);
    fixture.componentRef.setInput('target', { kind: 'collection' });
    fixture.componentRef.setInput('heading', 'Ask your documents');
    element = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

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

  /** Deja que el generador procese lo que haya en la cola y re-renderiza. */
  async function settle(): Promise<void> {
    for (let round = 0; round < 5; round++) {
      await Promise.resolve();
    }
    await fixture.whenStable();
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
      '¿Cuánto suman?',
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
