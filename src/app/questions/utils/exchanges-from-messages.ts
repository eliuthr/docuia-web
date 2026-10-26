import { ConversationMessageDto } from '../models/conversation.model';

/** Una pregunta guardada con su respuesta. */
export interface StoredExchange {
  question: string;
  answer: string;
}

/**
 * Agrupa los mensajes guardados en pares pregunta/respuesta. La API guarda
 * siempre los dos juntos, pero una pregunta sin respuesta queda con texto vacío.
 */
export function exchangesFromMessages(messages: ConversationMessageDto[]): StoredExchange[] {
  const exchanges: StoredExchange[] = [];
  for (const message of messages) {
    if (message.role === 'user') {
      exchanges.push({ question: message.text, answer: '' });
      continue;
    }
    const last = exchanges.at(-1);
    if (last && !last.answer) {
      last.answer = message.text;
    }
  }
  return exchanges;
}
