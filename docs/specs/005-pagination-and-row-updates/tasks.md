# 005 — Pagination and row updates: tasks

- [x] **T1** `DocumentPageDto`, `DocumentsApi.documentsPageUrl` and `getDocument`, `CursorPager` + tests. (AC-1, AC-2)
- [x] **T2** Page update helpers, `syncPageWithDocumentChanges`, `syncDocumentWithChanges` +
      tests. (AC-4–AC-8)
- [x] **T3** List page: page controls, first page after upload, external template + tests. (AC-1–3)
- [x] **T4** Build and tests; manual check against API + worker.

## Verification log

- 2026-10-24 — 113 unit tests pass; production build OK.
- Manual check in Chrome with the API (spec 004c) and the worker:
  - Page 1 showed 10 documents and "Next"; "Next" requested `?limit=10&cursor=…` and showed
    "Page 2"; "Previous" returned to page 1.
  - With page 1 open, a résumé uploaded from outside the page caused exactly two requests: one
    reload of page 1 (new document, not listed) and, on `ready`, one `GET /documents/:id`. The
    `processing` event changed the label with no request.
- Implementation notes:
  - `reload-on-document-changes.ts` was replaced by the two sync helpers; the 300 ms grouping is
    no longer needed because label-only changes make no request.
  - The list page template moved to `documents-page.html` as it grew with the page controls.
