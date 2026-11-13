export type AiProvider = 'anthropic' | 'openai' | 'gemini';

export interface ChatModelOptions {
  model?: string;
  temperature?: number;
}
