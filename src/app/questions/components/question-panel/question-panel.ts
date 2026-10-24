import {
  afterRenderEffect,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { form, FormField, maxLength, required } from '@angular/forms/signals';
import { GENERIC_MESSAGE } from '../../../core/api-error-message';
import { AnswerEvent, MAX_QUESTION_LENGTH, QuestionTarget } from '../../models/answer-event.model';
import { QuestionRequestError } from '../../services/question-request.error';
import { QuestionsApi } from '../../services/questions-api';
import { stripMarkdownEmphasis } from '../../utils/strip-markdown-emphasis';
import { toolLabel } from '../../utils/tool-label';

type ExchangeStatus = 'streaming' | 'done' | 'error' | 'stopped';

/** Una pregunta y su respuesta, que se va completando mientras llega el stream. */
interface Exchange {
  id: number;
  question: string;
  answer: string;
  activeTool: string | null;
  status: ExchangeStatus;
  error: string | null;
}

const ANNOUNCEMENTS: Record<Exclude<ExchangeStatus, 'streaming'>, string> = {
  done: 'Answer ready.',
  error: 'The answer failed.',
  stopped: 'Answer stopped.',
};

/** Margen para considerar que el usuario sigue "al final" de la conversación. */
const FOLLOW_THRESHOLD_PX = 48;

let nextPanelId = 0;

@Component({
  selector: 'app-question-panel',
  imports: [FormField],
  templateUrl: './question-panel.html',
})
export class QuestionPanel {
  readonly target = input.required<QuestionTarget>();
  readonly heading = input.required<string>();
  readonly placeholder = input('');

  private readonly api = inject(QuestionsApi);
  private readonly questionField = viewChild.required<ElementRef<HTMLTextAreaElement>>('field');

  protected readonly panelId = `question-panel-${nextPanelId++}`;
  protected readonly maxLength = MAX_QUESTION_LENGTH;
  protected readonly model = signal({ question: '' });
  protected readonly questionForm = form(this.model, (path) => {
    required(path.question);
    maxLength(path.question, MAX_QUESTION_LENGTH);
  });

  protected readonly exchanges = signal<Exchange[]>([]);
  /** Lo anuncia el lector de pantalla al terminar, en vez de leer cada trozo del stream. */
  protected readonly announcement = signal('');
  protected readonly isStreaming = computed(() => this.exchanges().at(-1)?.status === 'streaming');
  protected readonly isTooLong = computed(() => this.model().question.length > MAX_QUESTION_LENGTH);
  protected readonly canSend = computed(
    () => !this.isStreaming() && this.model().question.trim() !== '' && !this.isTooLong(),
  );

  protected readonly displayAnswer = stripMarkdownEmphasis;

  private readonly conversation = viewChild<ElementRef<HTMLElement>>('conversation');
  private abortController: AbortController | null = null;
  private nextExchangeId = 0;
  /** true mientras el usuario está al final de la conversación; si sube a leer, no se le mueve. */
  private isFollowing = true;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.abortController?.abort());
    this.scrollToLatestAfterRender();
  }

  protected onConversationScroll(): void {
    const element = this.conversation()?.nativeElement;
    if (element) {
      const distanceToBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
      this.isFollowing = distanceToBottom <= FOLLOW_THRESHOLD_PX;
    }
  }

  /** Tras cada render con contenido nuevo, baja al último mensaje si el usuario lo estaba siguiendo. */
  private scrollToLatestAfterRender(): void {
    afterRenderEffect(() => {
      this.exchanges();
      const element = this.conversation()?.nativeElement;
      if (element && this.isFollowing) {
        element.scrollTop = element.scrollHeight;
      }
    });
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    if (!this.canSend()) {
      return;
    }
    const question = this.model().question.trim();
    this.model.set({ question: '' });
    this.isFollowing = true;
    this.questionField().nativeElement.focus();
    void this.streamAnswer(question);
  }

  /** Enter envía; Shift+Enter agrega un salto de línea. */
  protected onEnter(event: Event): void {
    const isNewLine = event instanceof KeyboardEvent && event.shiftKey;
    if (!isNewLine) {
      this.onSubmit(event);
    }
  }

  protected stop(): void {
    this.abortController?.abort();
  }

  private async streamAnswer(question: string): Promise<void> {
    const controller = new AbortController();
    this.abortController = controller;
    this.startExchange(question);
    try {
      for await (const event of this.api.ask(this.target(), question, controller.signal)) {
        this.apply(event);
      }
      this.finishIfStreaming('done');
    } catch (error) {
      this.handleFailure(error, controller.signal);
    } finally {
      this.abortController = null;
    }
  }

  private startExchange(question: string): void {
    const exchange: Exchange = {
      id: this.nextExchangeId++,
      question,
      answer: '',
      activeTool: null,
      status: 'streaming',
      error: null,
    };
    this.exchanges.update((exchanges) => [...exchanges, exchange]);
    this.announcement.set('');
  }

  private apply(event: AnswerEvent): void {
    switch (event.type) {
      case 'tool':
        this.updateLast(() => ({ activeTool: toolLabel(event.name) }));
        return;
      case 'delta':
        this.updateLast((exchange) => ({ answer: exchange.answer + event.text, activeTool: null }));
        return;
      case 'done':
        this.finishIfStreaming('done');
        return;
      case 'error':
        this.finish('error', event.message);
        return;
    }
  }

  private handleFailure(error: unknown, signal: AbortSignal): void {
    if (signal.aborted) {
      this.finish('stopped');
      return;
    }
    this.finish('error', error instanceof QuestionRequestError ? error.message : GENERIC_MESSAGE);
  }

  private finishIfStreaming(status: 'done'): void {
    if (this.isStreaming()) {
      this.finish(status);
    }
  }

  private finish(status: Exclude<ExchangeStatus, 'streaming'>, error: string | null = null): void {
    this.updateLast(() => ({ status, error, activeTool: null }));
    this.announcement.set(error ?? ANNOUNCEMENTS[status]);
  }

  private updateLast(changes: (exchange: Exchange) => Partial<Exchange>): void {
    this.exchanges.update((exchanges) =>
      exchanges.map((exchange, index) =>
        index === exchanges.length - 1 ? { ...exchange, ...changes(exchange) } : exchange,
      ),
    );
  }
}
