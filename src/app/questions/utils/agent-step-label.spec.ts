import { AGENT_STEPS } from '../models/answer-event.model';
import { agentStepLabel } from './agent-step-label';

describe('agentStepLabel', () => {
  it.each(AGENT_STEPS)('has a label for %s', (step) => {
    expect(agentStepLabel(step)).toMatch(/…$/);
  });

  it('tells the user the answer is being checked', () => {
    expect(agentStepLabel('verifying')).toBe('Checking the answer against your documents…');
  });
});
