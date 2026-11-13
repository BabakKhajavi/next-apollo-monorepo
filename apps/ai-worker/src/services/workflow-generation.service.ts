import { createChatModel, generateStructured, WorkflowDefinitionSchema } from '@monorepo/ai-helper';
import { publishEvent } from '@monorepo/realtime';
import { updateWorkflowResult } from '../repositories/workflow.repository.js';
import { appSyncConfig, channelFor } from '../realtime/workflow-channel.js';
import type { WorkflowGenerationMessage } from '../types/index.js';

export async function processMessage(
  message: WorkflowGenerationMessage,
): Promise<void> {
  try {
    const model = createChatModel('anthropic');
    const definition = await generateStructured(
      model,
      WorkflowDefinitionSchema,
      `Design an automation workflow for this request: ${message.prompt}\n` +
        'Produce exactly one trigger and at least one action.',
    );

    await updateWorkflowResult(message.workflowId, {
      status: 'DRAFT',
      definition,
    });
    await publishEvent(appSyncConfig, {
      channel: channelFor(message.workflowId),
      events: [{ workflowId: message.workflowId, status: 'DRAFT', definition }],
    });
  } catch (error) {
    await updateWorkflowResult(message.workflowId, {
      status: 'GENERATION_FAILED',
    });
    await publishEvent(appSyncConfig, {
      channel: channelFor(message.workflowId),
      events: [
        {
          workflowId: message.workflowId,
          status: 'GENERATION_FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      ],
    });
    throw error; // rethrow so SQS retries, then routes to the DLQ after maxReceiveCount
  }
}
