# 006 — Conversations and agent progress: tasks

- [x] **T1** Models, `QuestionsApi` (conversationId, new events), `ConversationsApi`,
      `agentStepLabel`, `exchangesFromMessages` + tests. (AC-1, AC-4)
- [x] **T2** `ConversationHistory` component + tests. (AC-5, AC-6, AC-9)
- [x] **T3** Question panel: conversation id, progress, "New conversation", open a previous
      conversation, reload the list + tests. (AC-1–AC-8)
- [x] **T4** Build and tests; manual check against the API.

## Verification log

- 2026-10-26 — 142 unit tests pass; production build OK.
- Manual check in Chrome against the API (spec 005) with the real model:
  - The detail page listed the document's previous conversations (title, date, message count)
    in the collapsible section, newest first, with the open one marked "current".
  - "New conversation" cleared the panel; the next question created a new conversation, which
    appeared at the top of the list after the answer.
  - A collection conversation reopened from the list showed its questions and answers; a
    follow-up ("And how much of that is from Tecnosuministros?") was answered with the history,
    and "thanks" got a conversational reply.
- Covered by unit tests only: the agent step labels (`status` events), the error shown when a
  conversation cannot be opened, and opening disabled while an answer streams.
- Implementation notes:
  - The running `ng serve` did not pick up the new folders (`conversation-history/`, `testing/`)
    and served the old bundle until it was restarted.
  - `whenStable` waits for pending `httpResource` requests, so the panel tests answer the
    conversation list request before waiting, and the page tests close it before
    `http.verify()` (`flushConversationLists`).
