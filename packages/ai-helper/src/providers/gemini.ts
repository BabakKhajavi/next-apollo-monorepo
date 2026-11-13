import type { ChatModelOptions } from '../types.js';

// Not wired up: would need the @langchain/google-genai package added as a
// dependency here. Left as the extension point for this provider.
export function createGeminiModel(_options: ChatModelOptions = {}): never {
  throw new Error(
    'Gemini provider not implemented — add @langchain/google-genai and implement createGeminiModel.',
  );
}
