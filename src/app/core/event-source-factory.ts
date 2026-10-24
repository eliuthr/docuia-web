import { InjectionToken } from '@angular/core';

/** Crea la conexión SSE; es un token para que los tests usen una versión falsa. */
export type EventSourceFactory = (url: string) => EventSource;

export const EVENT_SOURCE_FACTORY = new InjectionToken<EventSourceFactory>('EVENT_SOURCE_FACTORY', {
  providedIn: 'root',
  factory: () => (url) => new EventSource(url),
});
