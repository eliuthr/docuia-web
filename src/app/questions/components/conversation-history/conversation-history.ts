import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component, computed, inject, input, output } from '@angular/core';
import { QuestionTarget } from '../../models/answer-event.model';
import { ConversationSummaryDto } from '../../models/conversation.model';
import { ConversationsApi } from '../../services/conversations-api';

/**
 * Lista plegable de las conversaciones recientes de un documento o de la
 * colección. Si la lista no carga, simplemente no se muestra: no impide preguntar.
 */
@Component({
  selector: 'app-conversation-history',
  imports: [DatePipe],
  template: `
    @if (conversations().length > 0) {
      <details class="rounded-lg border border-slate-200 bg-white">
        <summary
          class="cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800"
        >
          Previous conversations ({{ conversations().length }})
        </summary>
        <ul class="space-y-1 px-2 pb-2">
          @for (conversation of conversations(); track conversation.id) {
            <li>
              <button
                type="button"
                [disabled]="disabled()"
                [attr.aria-current]="conversation.id === currentId() ? 'true' : null"
                class="block w-full rounded-md px-3 py-2 text-left hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-800 disabled:cursor-not-allowed disabled:opacity-60 aria-[current=true]:bg-blue-50"
                (click)="opened.emit(conversation.id)"
              >
                <span class="block truncate text-sm font-medium text-slate-900">
                  {{ conversation.title }}
                </span>
                <span class="block text-xs text-slate-600">
                  {{ conversation.updatedAt | date: 'medium' }} ·
                  {{ conversation.messageCount }} messages
                  @if (conversation.id === currentId()) {
                    · current
                  }
                </span>
              </button>
            </li>
          }
        </ul>
      </details>
    }
  `,
})
export class ConversationHistory {
  readonly target = input.required<QuestionTarget>();
  /** La conversación que está abierta en el panel, para marcarla. */
  readonly currentId = input<string | null>(null);
  readonly disabled = input(false);
  readonly opened = output<string>();

  private readonly api = inject(ConversationsApi);
  private readonly list = httpResource<ConversationSummaryDto[]>(() =>
    this.api.conversationsUrl(this.target()),
  );

  protected readonly conversations = computed(() =>
    this.list.hasValue() ? this.list.value() : [],
  );

  /** Vuelve a pedir la lista, por ejemplo cuando termina una respuesta. */
  reload(): void {
    this.list.reload();
  }
}
