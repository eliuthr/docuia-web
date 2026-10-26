import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api-base-url';
import { QuestionTarget } from '../models/answer-event.model';
import { ConversationDetailDto } from '../models/conversation.model';

@Service()
export class ConversationsApi {
  private readonly http = inject(HttpClient);
  private readonly conversationsUrlBase = `${inject(API_BASE_URL)}/conversations`;

  /** URL de las conversaciones recientes de un documento o de la colección. */
  conversationsUrl(target: QuestionTarget): string {
    if (target.kind === 'collection') {
      return this.conversationsUrlBase;
    }
    const params = new URLSearchParams({ documentId: target.documentId });
    return `${this.conversationsUrlBase}?${params.toString()}`;
  }

  getConversation(id: string): Observable<ConversationDetailDto> {
    return this.http.get<ConversationDetailDto>(
      `${this.conversationsUrlBase}/${encodeURIComponent(id)}`,
    );
  }
}
