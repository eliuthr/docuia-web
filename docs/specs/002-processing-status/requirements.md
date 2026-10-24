# 002 — Processing status: requirements

> Phase 2 of the DocuIA roadmap, web side. Consumes the API from
> `docuia-api/docs/specs/002-background-processing`.

## Context

Documents are now processed in the background, so their status changes after the upload. The
page must reflect those changes without a manual refresh and explain failures.

## Scope

In scope: automatic refresh while documents are being processed, page count, failure reason.
Out of scope: server push (SSE arrives with streaming in phase 4), document detail page.

## User stories and acceptance criteria

### US-1 — See status changes without refreshing

- **AC-1.1** WHILE at least one listed document is `pending` or `processing`, THE UI SHALL
  refresh the list every 3 seconds.
- **AC-1.2** WHEN every listed document is `ready` or `failed`, THE UI SHALL stop refreshing.
- **AC-1.3** WHEN a new document is uploaded, THE UI SHALL refresh immediately and resume
  automatic refreshing.
- **AC-1.4** WHILE refreshing, THE UI SHALL keep showing the current list (no loading flicker).
- **AC-1.5** WHEN a refresh fails, THE UI SHALL show the error with "Retry" and stop refreshing
  until the user retries.

### US-2 — Understand the result

- **AC-2.1** THE UI SHALL show the page count for each document, or "—" when it is unknown
  (images, or not processed yet).
- **AC-2.2** WHEN a document is `failed`, THE UI SHALL show its `failureReason` next to the status.

## Non-functional requirements

- **NFR-1** Refreshes update rows in place: focus does not move and the whole table is not
  re-announced to screen readers. Status keeps a text label.
- **NFR-2** Timers are cleaned up when the page is destroyed.
- **NFR-3** Unit tests cover polling start, stop, and the new columns. No new dependencies.
