import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

// Deliberately not shared with apps/api's WorkflowRepository — apps can't
// depend on each other in this Nx workspace, and this worker only ever
// needs one narrow write, not the full repository surface.
const client = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION ?? 'us-east-1' }),
);

const WORKFLOWS_TABLE = process.env.WORKFLOWS_TABLE_NAME ?? 'Workflows';

export async function updateWorkflowResult(
  workflowId: string,
  patch: { status: string; definition?: unknown },
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

  if (patch.definition !== undefined) {
    names['#definition'] = 'definition';
    values[':definition'] = patch.definition;
    sets.push('#definition = :definition');
  }

  await client.send(
    new UpdateCommand({
      TableName: WORKFLOWS_TABLE,
      Key: { id: workflowId },
      UpdateExpression: `SET ${sets.join(', ')}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
    }),
  );
}
