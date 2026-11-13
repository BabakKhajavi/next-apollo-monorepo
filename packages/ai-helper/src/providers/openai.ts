import { ChatOpenAI } from '@langchain/openai';
import type { ChatModelOptions } from '../types.js';

export function createOpenAiModel(options: ChatModelOptions = {}): ChatOpenAI {
  return new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model: options.model ?? 'gpt-4o',
    temperature: options.temperature ?? 0,
  });
}
