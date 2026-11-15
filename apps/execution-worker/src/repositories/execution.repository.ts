import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

// Deliberately not shared with apps/api's ExecutionRepository — apps can't
// depend on each other in this Nx workspace, and this worker only ever
// needs one narrow write, not the full repository surface.
const client = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION ?? 'us-east-1' }),
);

const EXECUTIONS_TABLE = process.env.EXECUTIONS_TABLE_NAME ?? 'Executions';

export async function updateExecutionStatus(
  executionId: string,
  patch: { status: string; error?: string },
): Promise<void> {
  const names: Record<string, string> = {
    '#status': 'status',
    '#updatedAt': 'updatedAt',
  };
  const values: Record<string, unknown> = {
    ':status': patch.status,
    ':updatedAt': new Date().toISOString(),
  };
  const sets = ['#status = :status', '#updatedAt = :updatedAt'];

  if (patch.error !== undefined) {
    names['#error'] = 'error';
    values[':error'] = patch.error;
    sets.push('#error = :error');
  }

  await client.send(
    new UpdateCommand({
      TableName: EXECUTIONS_TABLE,
      Key: { id: executionId },
      UpdateExpression: `SET ${sets.join(', ')}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
    }),
  );
}
