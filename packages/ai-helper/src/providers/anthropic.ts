import { ChatAnthropic } from '@langchain/anthropic';
import type { ChatModelOptions } from '../types.js';

export function createAnthropicModel(options: ChatModelOptions = {}): ChatAnthropic {
  return new ChatAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: options.model ?? 'claude-sonnet-5-5',
    temperature: options.temperature ?? 0,
  });
}
