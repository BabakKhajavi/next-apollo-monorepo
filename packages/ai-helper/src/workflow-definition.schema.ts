import { z } from 'zod';

export const TriggerSchema = z.object({
  type: z.enum(['schedule', 'webhook', 'event']),
  config: z.record(z.string(), z.unknown()),
});

export const ActionSchema = z.object({
  type: z.enum(['sendEmail', 'httpRequest', 'runScript']),
  config: z.record(z.string(), z.unknown()),
});

export const WorkflowDefinitionSchema = z.object({
  trigger: TriggerSchema,
  actions: z.array(ActionSchema).min(1),
});

export type WorkflowDefinition = z.infer<typeof WorkflowDefinitionSchema>;
