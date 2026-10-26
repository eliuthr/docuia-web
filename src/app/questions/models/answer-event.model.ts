/** Paso del agente de la API mientras prepara la respuesta. */
export type AgentStep = 'classifying' | 'answering' | 'verifying' | 'revising';

export const AGENT_STEPS: readonly AgentStep[] = [
  'classifying',
  'answering',
  'verifying',
  'revising',
];

/** Eventos que envía la API mientras responde (ver las specs 004 y 005 de la API). */
export type AnswerEvent =
  | { type: 'conversation'; id: string }
  | { type: 'status'; step: AgentStep }
  | { type: 'tool'; name: string }
  | { type: 'delta'; text: string }
  | { type: 'done' }
  | { type: 'error'; message: string };

/** Sobre qué se pregunta: un documento o toda la colección. */
export type QuestionTarget = { kind: 'collection' } | { kind: 'document'; documentId: string };

/** Límite de la API para la longitud de una pregunta. */
export const MAX_QUESTION_LENGTH = 1000;
