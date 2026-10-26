/** Conversación guardada por la API (ver la spec 005 de la API). */
export interface ConversationSummaryDto {
  id: string;
  /** null cuando la conversación es sobre toda la colección. */
  documentId: string | null;
  /** La primera pregunta, recortada. */
  title: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessageDto {
  role: 'user' | 'assistant';
  text: string;
  createdAt: string;
}

export interface ConversationDetailDto extends ConversationSummaryDto {
  /** Preguntas y respuestas finales, de la más antigua a la más reciente. */
  messages: ConversationMessageDto[];
}
