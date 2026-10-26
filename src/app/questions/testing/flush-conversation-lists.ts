import { HttpTestingController } from '@angular/common/http/testing';

/**
 * Responde las peticiones pendientes de la lista de conversaciones del panel
 * de preguntas. Las páginas que lo muestran no prueban esa lista, solo la
 * cierran para que `http.verify()` no la cuente como pendiente.
 */
export function flushConversationLists(
  http: HttpTestingController,
  conversations: object[] = [],
): number {
  const requests = http.match(
    (request) => request.method === 'GET' && /\/conversations(\?|$)/.test(request.url),
  );
  requests.forEach((request) => request.flush(conversations));
  return requests.length;
}
