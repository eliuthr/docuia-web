# 001 — Document upload UI: tasks

- [x] **T1** App shell: remove placeholder, header, `provideHttpClient`, lazy route, `API_BASE_URL`.
- [x] **T2** Model, constants and pure helpers (`validateDocumentFile`, `formatFileSize`) + tests.
      (AC-1.1, AC-1.2)
- [x] **T3** `DocumentsApi` (upload, list URL, error mapping) + tests. (AC-1.6, AC-2.1)
- [x] **T4** `StatusBadge` + `DocumentList` + tests. (AC-2.1, AC-2.2)
- [x] **T5** `UploadForm` (picker, drop zone, states, feedback) + tests. (AC-1.1–1.6)
- [x] **T6** `DocumentsPage` (resource, states, reload on upload) + tests. (AC-1.5, AC-2.3)
- [x] **T7** Run build and tests; manual check against the running API. (NFR-4)

## Verification log

- 2026-10-22 — 30 unit tests pass; production build OK (documents page is a lazy chunk).
  Manual check in Chrome against the API + MongoDB: drop a PDF → success message → list
  refreshes with the new `Pending` document; CORS from `localhost:4200` works.
- Not yet verified: a formal AXE scan (NFR-1). Markup follows the checklist (labels,
  `aria-live`, focus rings, text badges, AA color pairs) but no automated audit was run.
- Testing note: `fixture.whenStable()` waits for pending HTTP requests, so tests that need to
  assert before the response use `TestBed.tick()`.
