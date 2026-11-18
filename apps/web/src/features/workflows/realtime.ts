import { AppSyncEventsClient } from "@monorepo/apollo-client/realtime";

// One socket for the whole app (module-scope singleton, same lifetime as
// the browser tab) — every live workflow/execution subscription shares it
// rather than opening a connection each.
export const appSyncEventsClient = new AppSyncEventsClient({
  httpEndpoint: process.env.NEXT_PUBLIC_APPSYNC_EVENTS_HTTP_ENDPOINT ?? "",
  apiKey: process.env.NEXT_PUBLIC_APPSYNC_EVENTS_API_KEY ?? "",
});

// Channel namespace names must match the deployed
// aws_appsync_channel_namespace Terraform resources exactly (prefixed
// with var.project_name there) — not hardcoded here, so a renamed
// deployment doesn't silently stop receiving events.
const WORKFLOW_UPDATES_CHANNEL_NAMESPACE =
  process.env.NEXT_PUBLIC_WORKFLOW_UPDATES_CHANNEL_NAMESPACE ?? "workflow-updates";
const EXECUTION_UPDATES_CHANNEL_NAMESPACE =
  process.env.NEXT_PUBLIC_EXECUTION_UPDATES_CHANNEL_NAMESPACE ?? "execution-updates";

export function workflowChannel(workflowId: string): string {
  return `/${WORKFLOW_UPDATES_CHANNEL_NAMESPACE}/${workflowId}`;
}

export function executionChannel(executionId: string): string {
  return `/${EXECUTION_UPDATES_CHANNEL_NAMESPACE}/${executionId}`;
}

// Mirrors exactly what ai-worker publishes (apps/ai-worker/src/services/
// workflow-generation.service.ts) and execution-worker publishes
// (apps/execution-worker/src/services/workflow-execution.service.ts).
export interface WorkflowUpdateEvent {
  workflowId: string;
  status: "DRAFT" | "GENERATION_FAILED";
  definition?: unknown;
  error?: string;
}

export interface ExecutionUpdateEvent {
  executionId: string;
  status: "RUNNING" | "SUCCEEDED" | "FAILED";
  error?: string;
}
