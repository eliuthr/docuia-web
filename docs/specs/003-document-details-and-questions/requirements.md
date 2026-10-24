# 003 — Document details and questions: requirements

> Phases 3 and 4 of the DocuIA roadmap, web side. Consumes the API from
> `docuia-api/docs/specs/003-llm-extraction` and `docuia-api/docs/specs/004-questions-and-tools`.

## Context

The API now classifies documents, writes a summary, extracts structured data and answers
questions with a streamed response. The web client only shows the processing status. This spec
adds a detail page per document and a question panel, so the demo shows the AI features.

## Scope

In scope:

- A detail page per document: summary, type and extracted data (invoice, contract, résumé).
- Ask questions about one document (detail page) and about all documents (main page), with the
  answer appearing as it is streamed.

Out of scope: conversation history across page loads (API spec 005), editing extracted data,
authentication (spec 007).

## User stories and acceptance criteria

### US-1 — Open a document

- **AC-1.1** THE UI SHALL link each document name in the list to `/documents/:id`.
- **AC-1.2** WHEN the detail page opens, THE UI SHALL show the name, status, type, page count,
  upload date and summary.
- **AC-1.3** WHILE the document is `pending` or `processing`, THE UI SHALL refresh it every
  3 seconds, as the list does.
- **AC-1.4** WHEN the document does not exist, THE UI SHALL show "Document not found" with a link
  back to the list.
- **AC-1.5** WHEN the document is `failed`, THE UI SHALL show its failure reason.

### US-2 — See the extracted data

- **AC-2.1** WHEN the document is an invoice, THE UI SHALL show vendor, tax id, customer, number,
  dates, totals and a table of line items.
- **AC-2.2** WHEN the document is a contract, THE UI SHALL show title, parties with roles, dates,
  value and governing law.
- **AC-2.3** WHEN the document is a résumé, THE UI SHALL show contact details, profile, skills,
  experience and education.
- **AC-2.4** THE UI SHALL show "—" for fields that are `null`, and format amounts with their
  currency.
- **AC-2.5** WHEN the document is `other` or has no extracted data, THE UI SHALL show only the
  summary.

### US-3 — Ask questions

- **AC-3.1** THE detail page of a `ready` document SHALL offer a question box that asks about
  that document; the main page SHALL offer one that asks about all documents.
- **AC-3.2** WHILE an answer streams, THE UI SHALL show the text as it arrives and which tool the
  assistant is using (for example, "Searching documents…").
- **AC-3.3** THE UI SHALL keep the questions and answers of the current visit, newest last.
- **AC-3.4** WHILE an answer streams, THE UI SHALL disable sending and offer "Stop", which aborts
  the request.
- **AC-3.5** WHEN the request fails before streaming (400, 404, 409, network), THE UI SHALL show
  the API message; WHEN it fails during streaming, THE UI SHALL show the `error` event message
  and keep the partial answer.
- **AC-3.6** THE UI SHALL not send empty questions or questions longer than 1000 characters.

## Non-functional requirements

- **NFR-1** Accessibility (WCAG AA, AXE): the question field has a label; the answer area is not
  re-announced on every streamed piece — a status message announces when the answer is ready or
  failed; focus stays in the question field after sending.
- **NFR-2** Streaming uses `fetch` and the response body stream (the endpoints are `POST`, so
  `EventSource` cannot be used). Requests are aborted when the component is destroyed.
- **NFR-3** Unit tests for the SSE parser, the questions client, the question panel, the detail
  page and the extracted data views. No new dependencies.
