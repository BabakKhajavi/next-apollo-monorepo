import type { SQSHandler } from 'aws-lambda';
import { processMessage } from './services/workflow-execution.service.js';

export const handler: SQSHandler = async (event) => {
  for (const record of event.Records) {
    await processMessage(JSON.parse(record.body));
  }
};
