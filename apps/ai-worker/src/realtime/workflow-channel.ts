import type { AppSyncEventsConfig } from '@monorepo/realtime';

export const appSyncConfig: AppSyncEventsConfig = {
  httpEndpoint: process.env.APPSYNC_EVENTS_HTTP_ENDPOINT ?? '',
  apiKey: process.env.APPSYNC_EVENTS_API_KEY ?? '',
};

// Each workflow gets its own channel so a client only needs to subscribe
// to the one generation it's waiting on, not a firehose of every update.
export function channelFor(workflowId: string): string {
  return `/workflow-updates/${workflowId}`;
}
