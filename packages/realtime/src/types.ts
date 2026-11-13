export interface AppSyncEventsConfig {
  httpEndpoint: string;
  apiKey: string;
}

export interface PublishEventInput {
  channel: string;
  events: unknown[];
}
