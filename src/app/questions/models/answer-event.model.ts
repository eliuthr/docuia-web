/** Eventos que envía la API mientras responde (ver la spec 004 de la API). */
export type AnswerEvent =
  | { type: 'tool'; name: string }
  | { type: 'delta'; text: string }
  | { type: 'done' }
  | { type: 'error'; message: string };

/** Sobre qué se pregunta: un documento o toda la colección. */
export type QuestionTarget = { kind: 'collection' } | { kind: 'document'; documentId: string };

/** Límite de la API para la longitud de una pregunta. */
export const MAX_QUESTION_LENGTH = 1000;
