# 003 — Document details and questions: tasks

- [x] **T1** Models (`documentType`, `summary`, `extractedData`), `formatAmount`, `refreshWhile`
      (extracted from `DocumentsPage`) + tests.
- [x] **T2** Extracted data components (invoice, contract, résumé) + tests. (US-2)
- [x] **T3** Detail page, route with input binding, list links + tests. (US-1)
- [x] **T4** `readSseEvents`, `QuestionsApi`, tool labels + tests. (NFR-2)
- [x] **T5** `QuestionPanel` + tests; add it to both pages. (US-3, NFR-1)
- [x] **T6** Build and tests; manual check against API + worker.

## Verification log

- 2026-10-24 — 82 unit tests pass; production build OK.
- Manual check in Chrome against the API (phase 4) and the worker, with the sample documents:
  - Main page, "Ask your documents": "What contracts do I have and how much are they worth?"
    streamed an answer listing both contracts with their parties and values; the field kept
    focus after sending with Enter.
  - Detail page of the invoice: summary, the nine invoice fields and the four line items with
    COP amounts; no console errors.
  - "Ask about this document": "What are the CUFE and the DIAN resolution?" answered from the
    document text (not in the extracted data).
- Fixed during the check:
  - Long unbroken strings in answers (the 64-character CUFE) overflowed the bubble and caused
    horizontal scrolling; question and answer bubbles now use `wrap-anywhere`.
  - "1 pages" → `pageCountLabel` handles singular, plural and unknown counts.
- Implementation notes:
  - `refreshWhile` was extracted to `core/` and is shared by the list and the detail page.
  - Questions use `fetch` instead of `HttpClient` (streamed `POST` body); tests stub the global
    `fetch`, and the panel tests drive a controlled async generator step by step.
  - `Intl.NumberFormat` shows COP without decimals (its ISO 4217 minor unit), so amounts read
    "COP 2,638,825".
