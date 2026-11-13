import type { AppSyncEventsConfig, PublishEventInput } from './types.js';

// AppSync Events' HTTP publish API: POST {httpEndpoint}/event with the
// channel and a batch of JSON-stringified event payloads. API_KEY auth
// here (matches the channel namespace's auth mode) — no SigV4 signing.
export async function publishEvent(
  config: AppSyncEventsConfig,
  input: PublishEventInput,
): Promise<void> {
  const response = await fetch(`${config.httpEndpoint}/event`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': config.apiKey,
    },
    body: JSON.stringify({
      channel: input.channel,
      events: input.events.map((event) => JSON.stringify(event)),
    }),
  });

  if (!response.ok) {
    throw new Error(
      `AppSync Events publish failed: ${response.status} ${await response.text()}`,
    );
  }
}
