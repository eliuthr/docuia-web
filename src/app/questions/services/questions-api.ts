import { inject, Service } from '@angular/core';
import { API_BASE_URL } from '../../core/api-base-url';
import {
  GENERIC_MESSAGE,
  messageFromBody,
  UNREACHABLE_MESSAGE,
} from '../../core/api-error-message';
import { AGENT_STEPS, AgentStep, AnswerEvent, QuestionTarget } from '../models/answer-event.model';
import { readSseEvents } from '../utils/read-sse-events';
import { QuestionRequestError } from './question-request.error';

export interface QuestionRequest {
  question: string;
  /** Conversación que se continúa; null para empezar una nueva. */
  conversationId: string | null;
}

/**
 * Envía preguntas a la API y devuelve la respuesta a medida que llega. Usa
 * `fetch` y no HttpClient porque hay que leer el cuerpo de un POST como stream
 * (EventSource solo admite GET).
 */
@Service()
export class QuestionsApi {
  private readonly baseUrl = inject(API_BASE_URL);

  async *ask(
    target: QuestionTarget,
    request: QuestionRequest,
    signal: AbortSignal,
  ): AsyncGenerator<AnswerEvent> {
    const response = await this.post(this.urlFor(target), request, signal);
    if (!response.ok) {
      throw new QuestionRequestError(await errorMessageOf(response));
    }
    if (!response.body) {
      throw new QuestionRequestError(GENERIC_MESSAGE);
    }
    for await (const { event, data } of readSseEvents(response.body)) {
      const answerEvent = toAnswerEvent(event, data);
      if (answerEvent) {
        yield answerEvent;
      }
    }
  }

  private urlFor(target: QuestionTarget): string {
    return target.kind === 'collection'
      ? `${this.baseUrl}/ask`
      : `${this.baseUrl}/documents/${encodeURIComponent(target.documentId)}/ask`;
  }

  private async post(
    url: string,
    request: QuestionRequest,
    signal: AbortSignal,
  ): Promise<Response> {
    try {
      return await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify(toRequestBody(request)),
        signal,
      });
    } catch (error) {
      // Si el usuario canceló, se propaga tal cual; cualquier otro fallo es de red.
      if (signal.aborted) {
        throw error;
      }
      throw new QuestionRequestError(UNREACHABLE_MESSAGE);
    }
  }
}

/** Sin conversación no se envía el campo, en vez de mandarlo como null. */
function toRequestBody({ question, conversationId }: QuestionRequest): object {
  return conversationId ? { question, conversationId } : { question };
}

async function errorMessageOf(response: Response): Promise<string> {
  const body: unknown = await response.json().catch(() => null);
  return messageFromBody(body) ?? GENERIC_MESSAGE;
}

/** Traduce un evento SSE al modelo de la app; ignora los que no reconoce. */
function toAnswerEvent(event: string, data: string): AnswerEvent | null {
  const payload = parseObject(data);
  switch (event) {
    case 'conversation':
      return typeof payload['id'] === 'string' ? { type: 'conversation', id: payload['id'] } : null;
    case 'status':
      return isAgentStep(payload['step']) ? { type: 'status', step: payload['step'] } : null;
    case 'tool':
      return typeof payload['name'] === 'string' ? { type: 'tool', name: payload['name'] } : null;
    case 'delta':
      return typeof payload['text'] === 'string' ? { type: 'delta', text: payload['text'] } : null;
    case 'done':
      return { type: 'done' };
    case 'error':
      return {
        type: 'error',
        message: typeof payload['message'] === 'string' ? payload['message'] : GENERIC_MESSAGE,
      };
    default:
      return null;
  }
}

function isAgentStep(value: unknown): value is AgentStep {
  return AGENT_STEPS.includes(value as AgentStep);
}

function parseObject(data: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(data);
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
