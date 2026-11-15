import { z } from 'zod';

// z.unknown()/z.any() convert to an untyped `{}` JSON Schema node, which
// OpenAI's Structured Outputs schema validator rejects outright (every
// node needs an explicit `type`, independent of strict mode). Config
// values are constrained to JSON primitives instead — covers cron
// expressions, URLs, HTTP methods, header maps flattened to strings, etc.
const ConfigValueSchema = z.union([z.string(), z.number(), z.boolean()]);

export const TriggerSchema = z.object({
  type: z.enum(['schedule', 'webhook', 'event']),
  config: z.record(z.string(), ConfigValueSchema),
});

export const ActionSchema = z.object({
  type: z.enum(['sendEmail', 'httpRequest', 'runScript']),
  config: z.record(z.string(), ConfigValueSchema),
});

export const WorkflowDefinitionSchema = z.object({
  trigger: TriggerSchema,
  actions: z.array(ActionSchema).min(1),
});

export type WorkflowDefinition = z.infer<typeof WorkflowDefinitionSchema>;
export type Action = z.infer<typeof ActionSchema>;
