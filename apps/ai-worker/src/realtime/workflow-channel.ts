import type { AppSyncEventsConfig } from '@monorepo/realtime';

export const appSyncConfig: AppSyncEventsConfig = {
  httpEndpoint: process.env.APPSYNC_EVENTS_HTTP_ENDPOINT ?? '',
  apiKey: process.env.APPSYNC_EVENTS_API_KEY ?? '',
};

// Namespace name must match the aws_appsync_channel_namespace Terraform
// resource exactly (it's prefixed with var.project_name there).
const CHANNEL_NAMESPACE =
  process.env.WORKFLOW_UPDATES_CHANNEL_NAMESPACE ?? 'workflow-updates';

// Each workflow gets its own channel so a client only needs to subscribe
// to the one generation it's waiting on, not a firehose of every update.
export function channelFor(workflowId: string): string {
  return `/${CHANNEL_NAMESPACE}/${workflowId}`;
}
