import {
  afterRenderEffect,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import { form, FormField, maxLength, required } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { apiErrorMessage, GENERIC_MESSAGE } from '../../../core/api-error-message';
import { AnswerEvent, MAX_QUESTION_LENGTH, QuestionTarget } from '../../models/answer-event.model';
import { ConversationsApi } from '../../services/conversations-api';
import { QuestionRequestError } from '../../services/question-request.error';
import { QuestionsApi } from '../../services/questions-api';
import { agentStepLabel } from '../../utils/agent-step-label';
import { exchangesFromMessages, StoredExchange } from '../../utils/exchanges-from-messages';
import { stripMarkdownEmphasis } from '../../utils/strip-markdown-emphasis';
import { toolLabel } from '../../utils/tool-label';
import { ConversationHistory } from '../conversation-history/conversation-history';

type ExchangeStatus = 'streaming' | 'done' | 'error' | 'stopped';

/** Una pregunta y su respuesta, que se va completando mientras llega el stream. */
interface Exchange {
  id: number;
  question: string;
  answer: string;
  /** Qué está haciendo el agente (un paso o una herramienta) hasta que llega el texto. */
  progress: string | null;
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
  imports: [FormField, ConversationHistory],
  templateUrl: './question-panel.html',
})
export class QuestionPanel {
  readonly target = input.required<QuestionTarget>();
  readonly heading = input.required<string>();
  readonly placeholder = input('');

  private readonly api = inject(QuestionsApi);
  private readonly conversationsApi = inject(ConversationsApi);
  private readonly questionField = viewChild.required<ElementRef<HTMLTextAreaElement>>('field');
  private readonly history = viewChild(ConversationHistory);

  protected readonly panelId = `question-panel-${nextPanelId++}`;
  protected readonly maxLength = MAX_QUESTION_LENGTH;
  protected readonly model = signal({ question: '' });
  protected readonly questionForm = form(this.model, (path) => {
    required(path.question);
    maxLength(path.question, MAX_QUESTION_LENGTH);
  });

  // Si cambia el documento, la conversación vuelve a empezar.
  protected readonly exchanges = linkedSignal<QuestionTarget, Exchange[]>({
    source: this.target,
    computation: () => [],
  });
  /** Id de la conversación abierta; llega en el primer evento del stream. */
  protected readonly conversationId = linkedSignal<QuestionTarget, string | null>({
    source: this.target,
    computation: () => null,
  });
  protected readonly isLoadingConversation = signal(false);
  protected readonly conversationError = signal<string | null>(null);
  /** Lo anuncia el lector de pantalla al terminar, en vez de leer cada trozo del stream. */
  protected readonly announcement = signal('');
  protected readonly isStreaming = computed(() => this.exchanges().at(-1)?.status === 'streaming');
  protected readonly isBusy = computed(() => this.isStreaming() || this.isLoadingConversation());
  protected readonly isTooLong = computed(() => this.model().question.length > MAX_QUESTION_LENGTH);
  protected readonly canSend = computed(
    () => !this.isBusy() && this.model().question.trim() !== '' && !this.isTooLong(),
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

  protected startNewConversation(): void {
    this.exchanges.set([]);
    this.conversationId.set(null);
    this.conversationError.set(null);
    this.announcement.set('New conversation started.');
    this.questionField().nativeElement.focus();
  }

  /** Muestra una conversación guardada y la deja lista para seguirla. */
  protected async openConversation(id: string): Promise<void> {
    this.isLoadingConversation.set(true);
    this.conversationError.set(null);
    try {
      const conversation = await firstValueFrom(this.conversationsApi.getConversation(id));
      const stored = exchangesFromMessages(conversation.messages);
      this.exchanges.set(stored.map((exchange) => this.toFinishedExchange(exchange)));
      this.conversationId.set(conversation.id);
      this.isFollowing = true;
      this.announcement.set('Conversation loaded.');
    } catch (error) {
      this.conversationError.set(apiErrorMessage(error));
    } finally {
      this.isLoadingConversation.set(false);
    }
  }

  private toFinishedExchange(stored: StoredExchange): Exchange {
    return { id: this.nextExchangeId++, ...stored, progress: null, status: 'done', error: null };
  }

  private async streamAnswer(question: string): Promise<void> {
    const controller = new AbortController();
    this.abortController = controller;
    this.startExchange(question);
    try {
      const request = { question, conversationId: this.conversationId() };
      for await (const event of this.api.ask(this.target(), request, controller.signal)) {
        this.apply(event);
      }
      this.finishIfStreaming('done');
      this.reloadHistoryIfAnswered();
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
      progress: null,
      status: 'streaming',
      error: null,
    };
    this.exchanges.update((exchanges) => [...exchanges, exchange]);
    this.conversationError.set(null);
    this.announcement.set('');
  }

  private apply(event: AnswerEvent): void {
    switch (event.type) {
      case 'conversation':
        this.conversationId.set(event.id);
        return;
      case 'status':
        this.updateLast(() => ({ progress: agentStepLabel(event.step) }));
        return;
      case 'tool':
        this.updateLast(() => ({ progress: toolLabel(event.name) }));
        return;
      case 'delta':
        this.updateLast((exchange) => ({ answer: exchange.answer + event.text, progress: null }));
        return;
      case 'done':
        this.finishIfStreaming('done');
        return;
      case 'error':
        this.finish('error', event.message);
        return;
    }
  }

  /** Una respuesta completa crea la conversación en la lista o la sube al primer lugar. */
  private reloadHistoryIfAnswered(): void {
    if (this.exchanges().at(-1)?.status === 'done') {
      this.history()?.reload();
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
    this.updateLast(() => ({ status, error, progress: null }));
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
