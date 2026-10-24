import { HttpErrorResponse } from '@angular/common/http';

const UNREACHABLE_MESSAGE = 'Cannot reach the server. Check your connection and try again.';
const GENERIC_MESSAGE = 'Something went wrong. Please try again.';

/** Convierte un fallo HTTP en un mensaje que se puede mostrar al usuario. */
export function apiErrorMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return GENERIC_MESSAGE;
  }
  if (error.status === 0) {
    return UNREACHABLE_MESSAGE;
  }
  return messageFromBody(error.error) ?? GENERIC_MESSAGE;
}

function messageFromBody(body: unknown): string | null {
  if (typeof body !== 'object' || body === null || !('message' in body)) {
    return null;
  }
  const { message } = body;
  if (Array.isArray(message)) {
    return message.join(' ');
  }
  return typeof message === 'string' ? message : null;
}
