import type { SQSHandler } from 'aws-lambda';
import { processMessage } from './services/workflow-generation.service.js';

export const handler: SQSHandler = async (event) => {
  for (const record of event.Records) {
    await processMessage(JSON.parse(record.body));
  }
};
