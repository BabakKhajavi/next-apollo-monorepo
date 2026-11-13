import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { createAnthropicModel } from '../providers/anthropic.js';
import { createGeminiModel } from '../providers/gemini.js';
import { createOpenAiModel } from '../providers/openai.js';
import type { AiProvider, ChatModelOptions } from '../types.js';

// Single entry point for getting a chat model, regardless of provider.
// Any feature that needs an LLM call (workflow generation today, anything
// else tomorrow) goes through this instead of constructing a LangChain
// client directly.
export function createChatModel(
  provider: AiProvider,
  options: ChatModelOptions = {},
): BaseChatModel {
  switch (provider) {
    case 'anthropic':
      return createAnthropicModel(options);
    case 'openai':
      return createOpenAiModel(options);
    case 'gemini':
      return createGeminiModel(options);
  }
}
