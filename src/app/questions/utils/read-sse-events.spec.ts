import { readSseEvents, SseEvent } from './read-sse-events';

/** Stream que entrega el texto en los trozos indicados, como lo haría la red. */
function streamOf(...chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
}

async function collect(stream: ReadableStream<Uint8Array>): Promise<SseEvent[]> {
  const events: SseEvent[] = [];
  for await (const event of readSseEvents(stream)) {
    events.push(event);
  }
  return events;
}

describe('readSseEvents', () => {
  it('parses events separated by blank lines', async () => {
    const events = await collect(
      streamOf('event: tool\ndata: {"name":"find_documents"}\n\nevent: done\ndata: {}\n\n'),
    );

    expect(events).toEqual([
      { event: 'tool', data: '{"name":"find_documents"}' },
      { event: 'done', data: '{}' },
    ]);
  });

  it('joins an event split across chunks', async () => {
    const events = await collect(streamOf('event: del', 'ta\ndata: {"text":"Ho', 'la"}\n', '\n'));

    expect(events).toEqual([{ event: 'delta', data: '{"text":"Hola"}' }]);
  });

  it('decodes multi-byte characters split across chunks', async () => {
    const bytes = new TextEncoder().encode('event: delta\ndata: {"text":"ñ"}\n\n');
    const splitAt = bytes.indexOf(0xc3) + 1;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes.slice(0, splitAt));
        controller.enqueue(bytes.slice(splitAt));
        controller.close();
      },
    });

    expect(await collect(stream)).toEqual([{ event: 'delta', data: '{"text":"ñ"}' }]);
  });

  it('accepts CRLF line endings', async () => {
    expect(await collect(streamOf('event: done\r\ndata: {}\r\n\r\n'))).toEqual([
      { event: 'done', data: '{}' },
    ]);
  });

  it('ignores an incomplete event at the end of the stream', async () => {
    expect(await collect(streamOf('event: done\ndata: {}'))).toEqual([]);
  });
});
