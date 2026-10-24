# 003 — Document details and questions: design

## Routes

| Path             | Component            | Notes                                             |
| ---------------- | -------------------- | ------------------------------------------------- |
| `/`              | `DocumentsPage`      | + collection question panel                       |
| `/documents/:id` | `DocumentDetailPage` | lazy; `id` bound with `withComponentInputBinding` |

## Structure

```
src/app/
├── core/
│   └── refresh-while.ts                 shared polling effect (list and detail page)
├── documents/
│   ├── models/
│   │   ├── document.model.ts            + documentType, summary, extractedData
│   │   └── extracted-data.model.ts      InvoiceData, ContractData, ResumeData
│   ├── components/
│   │   ├── document-list/               name links to the detail page
│   │   ├── extracted-data/              one small component per type + formatting helpers
│   │   │   ├── invoice-details.ts
│   │   │   ├── contract-details.ts
│   │   │   └── resume-details.ts
│   │   └── field-value.ts               "—" for null values
│   ├── pages/document-detail-page/      httpResource + refreshWhile + panels
│   └── utils/format-amount.ts           Intl.NumberFormat with currency (or plain number)
└── questions/
    ├── models/answer-event.model.ts     tool | delta | done | error
    ├── utils/read-sse-events.ts         ReadableStream<Uint8Array> → AsyncGenerator<SseEvent>
    ├── services/questions-api.ts        fetch + status handling → AsyncGenerator<AnswerEvent>
    ├── utils/tool-label.ts              tool name → "Searching documents…"
    └── components/question-panel/       Signal Form + exchanges list + stop
```

## Streaming client

```ts
type AnswerEvent =
  | { type: 'tool'; name: string }
  | { type: 'delta'; text: string }
  | { type: 'done' }
  | { type: 'error'; message: string };

class QuestionsApi {
  ask(target: QuestionTarget, question: string, signal: AbortSignal): AsyncGenerator<AnswerEvent>;
}
type QuestionTarget = { kind: 'collection' } | { kind: 'document'; documentId: string };
```

- `fetch(url, { method: 'POST', body: JSON, headers, signal })`.
- Not `ok` → read the JSON body and throw `QuestionRequestError` with the API message (or a
  generic one); network failure → "Cannot reach the server…" (same texts as `apiErrorMessage`).
- `readSseEvents` decodes chunks with `TextDecoder` (stream mode), splits on blank lines and parses
  `event:` / `data:` lines. Chunk boundaries can fall anywhere, so it keeps a buffer.
- `HttpClient` is not used: it cannot expose a streamed `POST` body as incremental events without
  extra plumbing, and `fetch` is the standard way to read SSE over `POST`.

## Question panel

State (signals): `exchanges: Exchange[]` with `{ question, answer, activeTool, status:
'streaming' | 'done' | 'error' | 'stopped', error }`, and `abortController`.

- The form is a Signal Form over `{ question: string }` with `required` and `maxLength(1000)`.
  On submit: append an exchange, clear the field, iterate the stream, updating the last exchange
  with `update()` (never `mutate`).
- `tool` sets `activeTool`; `delta` appends text and clears `activeTool`; `done`/`error` set the
  final status.
- `Stop` aborts the controller → status `stopped`. `DestroyRef.onDestroy` aborts too.
- Accessibility: the exchanges list has `aria-busy` while streaming; a visually hidden
  `role="status"` element announces "Answer ready" / the error; the field keeps focus.

## Detail page

`httpResource<DocumentDto>(() => url(id()))` and `refreshWhile(resource, isInProgress)`. A `404`
from the resource shows "Document not found". The extracted data block switches on
`documentType`; each type component receives its typed data as an `input.required`.

## Decisions

- **`fetch` for questions, `HttpClient` for everything else** (see above).
- **No new dependencies**: SSE parsing is ~40 lines and fully unit tested.
- **No Markdown rendering**: the API prompt asks for plain text; answers are shown with
  `white-space: pre-line` so line breaks survive.
