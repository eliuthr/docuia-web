import { EventSourceFactory } from '../event-source-factory';

/** EventSource falso para los tests: el test decide cuándo abre, falla o llega un evento. */
export class FakeEventSource {
  static instances: FakeEventSource[] = [];

  onopen: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  isClosed = false;
  private readonly listeners = new Map<string, ((event: MessageEvent<string>) => void)[]>();

  constructor(readonly url: string) {
    FakeEventSource.instances.push(this);
  }

  static latest(): FakeEventSource {
    const instance = FakeEventSource.instances.at(-1);
    if (!instance) {
      throw new Error('No EventSource was created.');
    }
    return instance;
  }

  static reset(): void {
    FakeEventSource.instances = [];
  }

  addEventListener(type: string, listener: (event: MessageEvent<string>) => void): void {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }

  close(): void {
    this.isClosed = true;
  }

  open(): void {
    this.onopen?.(new Event('open'));
  }

  fail(): void {
    this.onerror?.(new Event('error'));
  }

  emit(type: string, data: string): void {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(new MessageEvent(type, { data }));
    }
  }
}

export const fakeEventSourceFactory: EventSourceFactory = (url) =>
  new FakeEventSource(url) as unknown as EventSource;
