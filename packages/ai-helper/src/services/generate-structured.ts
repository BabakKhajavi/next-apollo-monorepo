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
  // method: 'function_calling' — OpenAI's `jsonSchema` method (LangChain's
  // auto-picked default for non-gpt-3/4-base models) is OpenAI's newer
  // "Structured Outputs" feature, which requires every object node to be
  // fully closed (explicit `properties` + `required` listing every key,
  // no open-ended `additionalProperties` records) — incompatible with
  // z.record() fields like trigger/action `config`, independent of
  // `strict`. Classic tool/function-calling doesn't impose that
  // constraint and is what Anthropic's structured output effectively uses
  // too, so this keeps behavior consistent across providers.
  const structuredModel = model.withStructuredOutput(schema, {
    method: 'function_calling',
  });
  return structuredModel.invoke(prompt);
}
