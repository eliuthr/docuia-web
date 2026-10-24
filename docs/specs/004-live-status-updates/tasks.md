# 004 — Live status updates: tasks

- [x] **T1** Question panel: bounded scrollable conversation, follow newest message, strip
      Markdown markers + tests; list before the panel. (US-2)
- [x] **T2** `EVENT_SOURCE_FACTORY`, `DocumentEvents` service + tests. (AC-1.1, AC-1.3, AC-1.5)
- [x] **T3** List and detail page reload on events, polling only while disconnected + tests.
      (AC-1.2, AC-1.4, NFR-2)
- [x] **T4** Build and tests; manual check against API + worker.

## Verification log

- 2026-10-24 — 98 unit tests pass; production build OK.
- Manual check in Chrome with the API (spec 004b) and the worker: with the list page open, a
  document uploaded from outside the page appeared and turned `Ready` with 2 list requests (one
  per status event) and no polling in between.
- Implementation notes:
  - Reloads go through `reloadOnDocumentChanges` (shared by both pages) with `auditTime(300)`.
  - `refreshWhile` reads `isConnected()` inside its predicate, so polling resumes by itself when
    the stream drops and stops when it comes back.
  - The answer text is bound with `[textContent]`: with `white-space: pre-line`, the line break
    Prettier adds before an interpolation would show as an empty first line.
