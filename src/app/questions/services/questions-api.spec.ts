import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../core/api-base-url';
import { GENERIC_MESSAGE, UNREACHABLE_MESSAGE } from '../../core/api-error-message';
import { AnswerEvent, QuestionTarget } from '../models/answer-event.model';
import { QuestionRequestError } from './question-request.error';
import { QuestionsApi } from './questions-api';

const BASE_URL = 'http://api.test';
const COLLECTION: QuestionTarget = { kind: 'collection' };

function sseResponse(body: string): Response {
  return new Response(body, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
}

function jsonResponse(status: number, body: object): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('QuestionsApi', () => {
  let api: QuestionsApi;
  let fetchMock: ReturnType<typeof vi.fn>;
  const signal = new AbortController().signal;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    TestBed.configureTestingModule({ providers: [{ provide: API_BASE_URL, useValue: BASE_URL }] });
    api = TestBed.inject(QuestionsApi);
  });

  afterEach(() => vi.unstubAllGlobals());

  async function collect(target: QuestionTarget = COLLECTION): Promise<AnswerEvent[]> {
    const events: AnswerEvent[] = [];
    for await (const event of api.ask(target, '¿Cuánto suman?', signal)) {
      events.push(event);
    }
    return events;
  }

  it('posts the question and yields the streamed events', async () => {
    fetchMock.mockResolvedValue(
      sseResponse(
        'event: tool\ndata: {"name":"find_documents"}\n\n' +
          'event: delta\ndata: {"text":"Suman 10."}\n\n' +
          'event: done\ndata: {}\n\n',
      ),
    );

    await expect(collect()).resolves.toEqual([
      { type: 'tool', name: 'find_documents' },
      { type: 'delta', text: 'Suman 10.' },
      { type: 'done' },
    ]);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/ask`);
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ question: '¿Cuánto suman?' }));
    expect(init.signal).toBe(signal);
  });

  it('asks about one document on its own endpoint', async () => {
    fetchMock.mockResolvedValue(sseResponse('event: done\ndata: {}\n\n'));

    await collect({ kind: 'document', documentId: 'doc-1' });

    expect(fetchMock.mock.calls[0][0]).toBe(`${BASE_URL}/documents/doc-1/ask`);
  });

  it('yields the error event sent during the stream', async () => {
    fetchMock.mockResolvedValue(
      sseResponse('event: error\ndata: {"message":"The answer could not be completed."}\n\n'),
    );

    await expect(collect()).resolves.toEqual([
      { type: 'error', message: 'The answer could not be completed.' },
    ]);
  });

  it('ignores unknown or malformed events', async () => {
    fetchMock.mockResolvedValue(
      sseResponse('event: ping\ndata: {}\n\nevent: delta\ndata: oops\n\nevent: done\ndata: {}\n\n'),
    );

    await expect(collect()).resolves.toEqual([{ type: 'done' }]);
  });

  it('throws the API message when the request is rejected', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(409, { message: 'The document is still being processed.' }),
    );

    await expect(collect()).rejects.toEqual(
      new QuestionRequestError('The document is still being processed.'),
    );
  });

  it('uses a generic message when the error body has no message', async () => {
    fetchMock.mockResolvedValue(new Response('Bad gateway', { status: 502 }));

    await expect(collect()).rejects.toEqual(new QuestionRequestError(GENERIC_MESSAGE));
  });

  it('reports a network failure as unreachable', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(collect()).rejects.toEqual(new QuestionRequestError(UNREACHABLE_MESSAGE));
  });

  it('rethrows the abort when the user cancelled', async () => {
    const controller = new AbortController();
    controller.abort();
    const abortError = new DOMException('Aborted', 'AbortError');
    fetchMock.mockRejectedValue(abortError);

    const events = api.ask(COLLECTION, 'Hola', controller.signal);

    await expect(events.next()).rejects.toBe(abortError);
  });
});
