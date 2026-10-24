# 002 — Processing status: design

## Changes by file

```
documents/
├── documents.constants.ts      + STATUS_POLL_INTERVAL_MS = 3000
├── models/document.model.ts    + pageCount, failureReason
├── utils/
│   └── document-status.ts      isInProgress(status): pending | processing
├── pages/documents-page/       polling effect
└── components/document-list/   "Pages" column, failure reason under the badge
```

## Polling

```ts
constructor() {
  effect((onCleanup) => {
    const documents = this.documents.hasValue() ? this.documents.value() : [];
    if (!documents.some((document) => isInProgress(document.status))) return;
    const timer = setTimeout(() => this.documents.reload(), STATUS_POLL_INTERVAL_MS);
    onCleanup(() => clearTimeout(timer));
  });
}
```

- The effect reads `documents.value()`; every response produces a new array, so the effect
  re-runs and schedules the next refresh only while something is in progress (AC-1.1, AC-1.2).
- `onCleanup` clears a pending timer when the value changes or the page is destroyed (NFR-2).
- An upload already calls `reload()`; the new `pending` document restarts the cycle (AC-1.3).
- `httpResource` keeps the previous value while reloading, and the template only shows the
  loading message when there is no value yet (AC-1.4).
- On error `hasValue()` is false, so no timer is scheduled until "Retry" succeeds (AC-1.5).

Polling instead of server push: simple, stateless and enough for a status that changes a few
times per document. SSE is introduced in phase 4, where streaming is required anyway.

## Accessibility

The table is **not** an `aria-live` region: re-announcing every row every 3 seconds would be
noise. Rows are tracked by id, so a refresh updates the status text in place without re-creating
the row or moving focus; screen-reader users hear the new status when they reach the row. The
upload form keeps its own `aria-live` message for the action the user just took. The failure
reason is plain text next to the badge.

## Testing

- `isInProgress`: pure-function test.
- `DocumentList`: renders pages ("—" for null) and the failure reason.
- `DocumentsPage`: with Vitest fake timers — schedules a refresh while a document is pending,
  stops once all are finished, no refresh after an error.
