export interface SseEvent {
  event: string;
  data: string;
}

const EVENT_SEPARATOR = '\n\n';
const DEFAULT_EVENT = 'message';

/**
 * Lee un stream de Server-Sent Events y emite un evento por cada bloque
 * `event:` / `data:`. Los trozos de la red pueden cortar un evento en cualquier
 * punto, así que se acumulan en un buffer hasta encontrar una línea en blanco.
 */
export async function* readSseEvents(stream: ReadableStream<Uint8Array>): AsyncGenerator<SseEvent> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        return;
      }
      // `stream: true` conserva los bytes de un carácter cortado entre dos trozos.
      buffer += decoder.decode(value, { stream: true }).replaceAll('\r\n', '\n');
      const { events, rest } = takeCompleteEvents(buffer);
      buffer = rest;
      yield* events;
    }
  } finally {
    reader.releaseLock();
  }
}

/** Separa los eventos completos del texto que todavía no termina en línea en blanco. */
function takeCompleteEvents(buffer: string): { events: SseEvent[]; rest: string } {
  const blocks = buffer.split(EVENT_SEPARATOR);
  const rest = blocks.pop() ?? '';
  const events = blocks.map(parseBlock).filter((event) => event !== null);
  return { events, rest };
}

function parseBlock(block: string): SseEvent | null {
  let event = DEFAULT_EVENT;
  const dataLines: string[] = [];
  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) {
      event = line.slice('event:'.length).trim();
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).trimStart());
    }
  }
  return dataLines.length > 0 ? { event, data: dataLines.join('\n') } : null;
}
