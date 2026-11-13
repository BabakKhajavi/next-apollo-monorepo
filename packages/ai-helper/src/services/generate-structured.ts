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
  const structuredModel = model.withStructuredOutput(schema);
  return structuredModel.invoke(prompt);
}
