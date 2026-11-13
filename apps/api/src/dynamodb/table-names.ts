export const WORKFLOWS_TABLE = process.env.WORKFLOWS_TABLE_NAME ?? 'Workflows';
export const EXECUTIONS_TABLE =
  process.env.EXECUTIONS_TABLE_NAME ?? 'Executions';

export const EXECUTIONS_BY_WORKFLOW_INDEX = 'byWorkflowId';
export const EXECUTIONS_BY_STATUS_INDEX = 'byStatus';
