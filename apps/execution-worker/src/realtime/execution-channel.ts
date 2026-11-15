import type { AppSyncEventsConfig } from '@monorepo/realtime';

export const appSyncConfig: AppSyncEventsConfig = {
  httpEndpoint: process.env.APPSYNC_EVENTS_HTTP_ENDPOINT ?? '',
  apiKey: process.env.APPSYNC_EVENTS_API_KEY ?? '',
};

// Namespace name must match the aws_appsync_channel_namespace Terraform
// resource exactly (it's prefixed with var.project_name there).
const CHANNEL_NAMESPACE =
  process.env.EXECUTION_UPDATES_CHANNEL_NAMESPACE ?? 'execution-updates';

// Each execution gets its own channel so a client only needs to subscribe
// to the one run it's watching, not a firehose of every execution.
export function channelFor(executionId: string): string {
  return `/${CHANNEL_NAMESPACE}/${executionId}`;
}
