# 005 — Pagination and row updates: requirements

> Consumes `docuia-api/docs/specs/004c-document-list-pagination` and refines spec 004 (live
> status updates).

## Context

The list showed the 20 newest documents only, and every status event reloaded the whole list.

## Acceptance criteria

### Pagination

- **AC-1** THE list SHALL show 10 documents per page with "Previous" and "Next" buttons and the
  current page number; the buttons are disabled when there is no page in that direction, and the
  controls are hidden when everything fits in one page.
- **AC-2** "Next" SHALL request the page after the current one with the API cursor; "Previous"
  SHALL return to the page before it.
- **AC-3** WHEN a document is uploaded, THE list SHALL show the first page, where it appears.

### Updating only what changed

- **AC-4** WHEN a listed document changes to `pending` or `processing`, THE UI SHALL update its
  status label without any request.
- **AC-5** WHEN a listed document changes to `ready` or `failed`, THE UI SHALL request only that
  document and replace its row.
- **AC-6** WHEN the event is about a document that is not listed, THE UI SHALL reload the page
  only if it is the first page (a new document); otherwise it SHALL ignore it.
- **AC-7** THE detail page SHALL follow the same rules for its document.
- **AC-8** A resync (stream reconnected) and the polling fallback still reload the current page.
