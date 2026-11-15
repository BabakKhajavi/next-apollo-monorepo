import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { z } from 'zod';

// Generic structured-output helper: any Zod schema, any chat model. Not
// specific to workflows — reusable wherever an LLM call needs to return
// data matching a known shape instead of free text.
export async function generateStructured<Schema extends z.ZodType>(
  model: BaseChatModel,
  schema: Schema,
  prompt: string,
): Promise<z.infer<Schema>> {
  // strict: false — OpenAI's strict JSON-schema mode rejects open-ended
  // z.record() fields (used for trigger/action config); Anthropic/Gemini
  // ignore this option, so it's safe to always pass.
  const structuredModel = model.withStructuredOutput(schema, {
    strict: false,
  });
  return structuredModel.invoke(prompt);
}
