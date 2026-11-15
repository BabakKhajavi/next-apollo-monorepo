import type { Action } from '@monorepo/ai-helper';

// httpRequest is the only action type that's genuinely executed — it's
// the one that's actually demoable without extra infra (SES, a sandboxed
// script runtime). sendEmail/runScript are structural stubs: they log and
// succeed, proving the pipeline's shape without needing that extra infra.
export async function runAction(action: Action): Promise<void> {
  switch (action.type) {
    case 'httpRequest': {
      const config = action.config as {
        url?: string;
        method?: string;
        headers?: Record<string, string>;
        body?: unknown;
      };
      if (!config.url) {
        throw new Error('httpRequest action is missing config.url');
      }
      const response = await fetch(config.url, {
        method: config.method ?? 'GET',
        headers: config.headers,
        body: config.body !== undefined ? JSON.stringify(config.body) : undefined,
      });
      if (!response.ok) {
        throw new Error(`httpRequest action failed: ${response.status} ${response.statusText}`);
      }
      return;
    }
    case 'sendEmail':
      console.log('[stub] sendEmail action', action.config);
      return;
    case 'runScript':
      console.log('[stub] runScript action', action.config);
      return;
  }
}
