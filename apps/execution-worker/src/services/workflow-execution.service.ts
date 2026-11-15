import { publishEvent } from '@monorepo/realtime';
import { updateExecutionStatus } from '../repositories/execution.repository.js';
import { appSyncConfig, channelFor } from '../realtime/execution-channel.js';
import { runAction } from './run-action.js';
import type { WorkflowExecutionMessage } from '../types/index.js';

export async function processMessage(
  message: WorkflowExecutionMessage,
): Promise<void> {
  await updateExecutionStatus(message.executionId, { status: 'RUNNING' });
  await publishEvent(appSyncConfig, {
    channel: channelFor(message.executionId),
    events: [{ executionId: message.executionId, status: 'RUNNING' }],
  });

  try {
    for (const action of message.actions) {
      await runAction(action);
    }

    await updateExecutionStatus(message.executionId, { status: 'SUCCEEDED' });
    await publishEvent(appSyncConfig, {
      channel: channelFor(message.executionId),
      events: [{ executionId: message.executionId, status: 'SUCCEEDED' }],
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await updateExecutionStatus(message.executionId, {
      status: 'FAILED',
      error: errorMessage,
    });
    await publishEvent(appSyncConfig, {
      channel: channelFor(message.executionId),
      events: [
        { executionId: message.executionId, status: 'FAILED', error: errorMessage },
      ],
    });
    throw error; // rethrow so SQS retries, then routes to the DLQ after maxReceiveCount
  }
}
