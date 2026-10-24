/** La pregunta no se pudo enviar (validación, documento no listo, red); el mensaje se muestra tal cual. */
export class QuestionRequestError extends Error {
  override readonly name = 'QuestionRequestError';
}
