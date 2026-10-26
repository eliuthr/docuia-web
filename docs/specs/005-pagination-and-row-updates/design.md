# 005 — Pagination and row updates: design

## Pagination

`CursorPager` (signals) keeps the cursors of the visited pages: `[null, c2, c3, …]`. The current
cursor is the last one; "Next" pushes the `nextCursor` of the current page and "Previous" pops.
The list `httpResource` reads `pager.currentCursor()`, so changing page triggers the request.
The API only moves forward, which is why the client remembers the way back.

## Row updates

```
DocumentEvents.changes ──► syncPageWithDocumentChanges(page, isFirstPage)
  resync                        → page.reload()
  page still loading            → ignore (the response will be fresh)
  not listed                    → first page ? page.reload() : ignore
  pending | processing          → page.update(withStatus(…))          no request
  ready | failed                → GET /documents/:id → page.update(withDocument(…))
```

`httpResource` is writable: `update()` replaces the value in memory until the next reload. The
pure helpers (`withStatus`, `withDocument`, `isListed`, `isLabelOnlyChange`) live in
`utils/document-page-updates.ts`. The detail page uses `syncDocumentWithChanges`, which applies
the same label-only rule to its single document.

Requests run in parallel with `mergeMap`; a failed `GET` leaves the row as it was (the next event,
a resync or a reload corrects it).
