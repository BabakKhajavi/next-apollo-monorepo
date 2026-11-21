import { vi } from 'vitest';
import type { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { ExecutionRepository } from './execution.repository.js';
import { ExecutionStatus } from './execution-status.enum.js';

it('counts every DynamoDB result page', async () => {
  const send = vi.fn().mockResolvedValueOnce({ Count: 900, LastEvaluatedKey: { id: 'a' } }).mockResolvedValueOnce({ Count: 150 });
  const repository = new ExecutionRepository({ send } as unknown as DynamoDBDocumentClient);
  await expect(repository.countByStatus(ExecutionStatus.SUCCEEDED)).resolves.toBe(1050);
  expect(send).toHaveBeenCalledTimes(2);
});
