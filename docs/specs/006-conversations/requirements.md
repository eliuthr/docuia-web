# 006 — Conversations and agent progress: requirements

> Consumes `docuia-api/docs/specs/005-langgraph-agent`.

## Context

The API now answers with a LangGraph agent (classify → tools → verify → revise) and stores each
conversation. The question panel still sends every question on its own, loses the conversation
on reload and only shows which tool is running.

## Acceptance criteria

### Follow-up questions

- **AC-1** WHEN the stream sends a `conversation` event, THE panel SHALL keep its id and send it
  as `conversationId` with the next questions, so follow-ups use the history.
- **AC-2** A "New conversation" button SHALL clear the panel and the kept id; it is shown when
  the panel has messages and hidden while an answer streams. Focus moves to the question field.
- **AC-3** WHEN the API rejects a question because the conversation is full (`409`) or missing
  (`404`), THE panel SHALL show the API message, as for other rejected questions.

### Agent progress

- **AC-4** WHEN the stream sends a `status` event, THE answer SHALL show a short label for the
  step (understanding the question, looking for the answer, checking it against the documents,
  correcting it); a `tool` event replaces it with the tool label, and answer text removes it.

### Previous conversations

- **AC-5** THE panel SHALL list the recent conversations of its target (the document, or the
  collection) with their title and date, newest first, in a collapsible section; the section is
  hidden when there are none.
- **AC-6** WHEN the user opens a previous conversation, THE panel SHALL show its questions and
  answers and continue that conversation; opening is disabled while an answer streams. The open
  conversation is marked as current.
- **AC-7** WHEN an answer completes, THE list SHALL be reloaded so the conversation appears or
  moves to the top.
- **AC-8** WHEN a conversation cannot be loaded, THE panel SHALL show an error message and keep
  the current conversation.
- **AC-9** Everything new passes AXE checks and WCAG AA (labels, focus, contrast, live region
  announcements).
