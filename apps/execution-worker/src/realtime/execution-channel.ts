import type { AppSyncEventsConfig } from '@monorepo/realtime';

export const appSyncConfig: AppSyncEventsConfig = {
  httpEndpoint: process.env.APPSYNC_EVENTS_HTTP_ENDPOINT ?? '',
  apiKey: process.env.APPSYNC_EVENTS_API_KEY ?? '',
};

// Each execution gets its own channel so a client only needs to subscribe
// to the one run it's watching, not a firehose of every execution.
export function channelFor(executionId: string): string {
  return `/execution-updates/${executionId}`;
}
