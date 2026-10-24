# 002 — Processing status: tasks

- [x] **T1** Model fields, `STATUS_POLL_INTERVAL_MS`, `isInProgress` + tests.
- [x] **T2** `DocumentList`: pages column and failure reason + tests. (AC-2.1, AC-2.2)
- [x] **T3** `DocumentsPage`: polling effect + tests. (AC-1.1–1.5, NFR-2)
- [x] **T4** Build and tests; manual check against API + worker.

## Verification log

- 2026-10-23 — 40 unit tests pass; production build OK.
- Manual check in Chrome with API + worker running: an uploaded PDF shows `Pending` with "—"
  pages, then switches to `Ready` with 2 pages after one refresh, without reloading the page.
  Failed documents show their reason under the badge.
- Polling stops when nothing is in progress (0 requests in 7 s). During the check it first kept
  running because two documents uploaded in phase 1 were never enqueued and stayed `pending`;
  they were enqueued once by hand (local data only). See the follow-up in the API spec 002.
- Testing note: with Vitest fake timers, `fixture.whenStable()` cannot be used (Angular schedules
  work with timers too) and `httpResource` updates in a microtask, so the tests use
  `vi.advanceTimersByTimeAsync()` followed by `TestBed.tick()`.
