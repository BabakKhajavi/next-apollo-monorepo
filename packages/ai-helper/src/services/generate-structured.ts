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
  // strict: false — relaxes OpenAI's structured-output validation where
  // possible; Anthropic/Gemini ignore the option, so it's safe to always
  // pass. (The actual fix for the record-field crash was the schema
  // itself — see workflow-definition.schema.ts — this is just a sane
  // default on top of that.)
  const structuredModel = model.withStructuredOutput(schema, {
    strict: false,
  });
  return structuredModel.invoke(prompt);
}
