import type { Action } from '@monorepo/ai-helper';

export interface WorkflowExecutionMessage {
  executionId: string;
  workflowId: string;
  actions: Action[];
}
