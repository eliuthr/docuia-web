import { AgentStep } from '../models/answer-event.model';

/** Texto que ve el usuario en cada paso del agente de la API. */
const AGENT_STEP_LABELS: Readonly<Record<AgentStep, string>> = {
  classifying: 'Understanding the question…',
  answering: 'Looking for the answer…',
  verifying: 'Checking the answer against your documents…',
  revising: 'Correcting the answer…',
};

export function agentStepLabel(step: AgentStep): string {
  return AGENT_STEP_LABELS[step];
}
