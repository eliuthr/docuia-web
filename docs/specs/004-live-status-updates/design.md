# 004 — Live status updates: design

## Status events

```
core/event-source-factory.ts      EVENT_SOURCE_FACTORY token: (url) => EventSource
documents/services/document-events.ts
  changes: Observable<DocumentChange>      shared (share()); opens on first subscriber,
                                           closes when the last one leaves
  isConnected: Signal<boolean>             true between `open` and `error`

type DocumentChange =
  | { kind: 'status'; documentId; status }   from `document.updated`
  | { kind: 'resync' }                       on `open` after an interruption
```

`EventSource` reconnects by itself after an error; the service only tracks the state. `ping`
events are ignored (they exist to keep proxies from closing the connection).

Pages:

- `DocumentsPage`: `changes` → `auditTime(300)` → `documents.reload()`.
  `refreshWhile` keeps polling only while `!isConnected()` and something is in progress; the
  effect reads the signal, so polling starts or stops when the connection changes.
- `DocumentDetailPage`: same, filtering `status` changes by its id.

## Layout and answer text

- `DocumentsPage`: upload → recent documents → question panel.
- `QuestionPanel`: the conversation is a `role="region"` with `tabindex="0"` (AXE requires
  scrollable regions to be keyboard reachable), `max-h-[28rem]` and `overflow-y-auto`. An
  `afterRenderEffect` scrolls to the bottom after each change while the user is following
  (within 48 px of the bottom); sending a question resumes following.
- `stripMarkdownEmphasis` removes `**x**`, `__x__` and `*x*` from the whole answer on every
  render; markers split across stream chunks are removed once complete. Single `_x_` is kept so
  file names like `mi_factura.pdf` survive. The API prompt also forbids Markdown.
