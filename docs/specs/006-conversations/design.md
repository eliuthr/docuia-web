# 006 — Conversations and agent progress: design

## Data flow

```
QuestionPanel ── ask(target, question, conversationId) ──► QuestionsApi (fetch + SSE)
     │  conversation { id } → conversationId signal
     │  status { step }     → progress = agentStepLabel(step)
     │  tool { name }       → progress = toolLabel(name)
     │  delta { text }      → answer += text, progress = null
     │  done                → history.reload()
     │
     ├── <app-conversation-history [target] [currentId] (opened)="open($event)" [disabled]>
     │        httpResource GET /conversations?documentId=…  (collection: no query)
     │
     └── open(id) → ConversationsApi.getConversation(id) → exchanges from the messages
```

## Files

```
src/app/questions/
├── models/answer-event.model.ts      + conversation, status (AgentStep)
├── models/conversation.model.ts      ConversationSummaryDto, ConversationDetailDto
├── services/questions-api.ts         + conversationId in the body; parses the new events
├── services/conversations-api.ts     conversationsUrl(target), getConversation(id)
├── utils/agent-step-label.ts         status step → label
├── utils/exchanges-from-messages.ts  pairs user/assistant messages into finished exchanges
├── components/conversation-history/  collapsible list of previous conversations
└── components/question-panel/        conversationId, progress, "New conversation", open()
```

`Exchange.activeTool` becomes `progress`, since it now shows a tool or an agent step.

## Decisions

- **The history lives in its own component** with `httpResource`; the panel only reloads it
  (through `viewChild`) after an answer completes, and turns an opened conversation into
  exchanges. This keeps the panel focused on asking.
- **A native `<details>` element** for the collapsible list: keyboard and screen reader support
  come for free.
- **No conversation id in the URL** for now: a reload starts a new conversation, and previous
  ones are one click away in the list.
