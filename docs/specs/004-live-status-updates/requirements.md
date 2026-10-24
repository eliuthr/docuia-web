# 004 — Live status updates: requirements

> Web side of `docuia-api/docs/specs/004b-document-status-events`, plus two fixes found while
> using spec 003.

## Context

The list and the detail page poll every 3 seconds while a document is processing. The API now
pushes status changes over Server-Sent Events, so the client can refresh only when something
changed. Using the question panel also showed that a long conversation pushed the document list
down the page, and that the model sometimes answers with Markdown bold markers.

## User stories and acceptance criteria

### US-1 — Refresh on events instead of polling

- **AC-1.1** WHILE a page is open, THE UI SHALL keep one connection to `GET /documents/events`,
  shared by every component that needs it.
- **AC-1.2** WHEN a `document.updated` event arrives, THE list SHALL reload, and THE detail page
  SHALL reload when the event is about its document.
- **AC-1.3** WHEN the connection is re-established after an interruption, THE UI SHALL reload
  once, since events sent meanwhile were lost.
- **AC-1.4** WHILE the connection is down, THE UI SHALL fall back to polling as in spec 002.
- **AC-1.5** WHEN no component uses the connection, THE UI SHALL close it.

### US-2 — Layout and answer text

- **AC-2.1** THE document list SHALL appear before the question panel on the main page.
- **AC-2.2** THE conversation SHALL have a maximum height with its own scroll, keyboard
  accessible, and SHALL scroll to the newest message unless the user scrolled up to read.
- **AC-2.3** THE UI SHALL remove Markdown bold and italic markers from answers.

## Non-functional requirements

- **NFR-1** `EventSource` is created through an injectable factory so tests use a fake.
- **NFR-2** Bursts of events (for example `processing` and `ready` within milliseconds) cause at
  most one reload per 300 ms.
- **NFR-3** No new dependencies.
