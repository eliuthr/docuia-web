# 001 — Document upload UI: requirements

> Phase 1 of the DocuIA roadmap, web side. Consumes the API built in
> `docuia-api/docs/specs/001-project-foundation`.

## Scope

In scope: a single page to upload a document and see the most recent documents with their
status. Out of scope: authentication (phase 7), live status updates (phase 2), extracted data and
chat (phases 3–5).

## User stories and acceptance criteria

### US-1 — Upload a document

As a user, I want to pick a file and upload it so that DocuIA can process it.

- **AC-1.1** WHEN the user selects a PDF, PNG or JPEG of at most 10 MB, THE UI SHALL enable the
  "Upload" button and show the file name and size.
- **AC-1.2** WHEN the user selects any other type, or a file over 10 MB, THE UI SHALL show an
  inline error and keep the button disabled. (Client checks are for UX; the API stays the
  authority.)
- **AC-1.3** WHEN the user drops a file on the drop zone, THE UI SHALL treat it as a selection.
- **AC-1.4** WHILE the upload is in progress, THE UI SHALL disable the form and show
  "Uploading…".
- **AC-1.5** WHEN the upload succeeds, THE UI SHALL announce success, clear the selection and
  refresh the document list.
- **AC-1.6** WHEN the upload fails, THE UI SHALL show the API error message (or a generic one if
  the API is unreachable) and keep the selection so the user can retry.

### US-2 — See recent documents

As a user, I want to see my recent documents so that I know their status.

- **AC-2.1** WHEN the page loads, THE UI SHALL request `GET /documents?limit=20` and show name,
  size, status and upload date for each document, newest first.
- **AC-2.2** THE UI SHALL show the status as a badge with text (`Pending`, `Processing`, `Ready`,
  `Failed`), never color alone.
- **AC-2.3** WHILE the list is loading, THE UI SHALL show a loading message; WHEN it is empty, an
  empty-state message; WHEN it fails, an error message with a "Retry" button.

## Non-functional requirements

- **NFR-1** Accessibility: passes AXE checks and WCAG AA (labels, focus visible, contrast,
  `aria-live` for upload feedback, keyboard-operable drop zone).
- **NFR-2** Responsive down to 320 px wide.
- **NFR-3** Unit tests (Vitest) for the API client, the file validation and every component.
- **NFR-4** `npm run build` and `npm test` pass; no new dependencies.
