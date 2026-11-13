// One-off ops script, not part of the Nest build — run against
// DynamoDB Local for dev (`docker compose up -d dynamodb-local` first).
// Real deployments provision these tables via Terraform (Phase 6).
import {
  CreateTableCommand,
  DynamoDBClient,
  ResourceInUseException,
} from '@aws-sdk/client-dynamodb';

const endpoint = process.env.DYNAMODB_ENDPOINT ?? 'http://localhost:8000';
const client = new DynamoDBClient({
  region: process.env.AWS_REGION ?? 'us-east-1',
  endpoint,
  // DynamoDB Local ignores credentials but the SDK still requires some.
  credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
});

async function createTable(input) {
  try {
    await client.send(new CreateTableCommand(input));
    console.log(`Created table: ${input.TableName}`);
  } catch (error) {
    if (error instanceof ResourceInUseException) {
      console.log(`Table already exists: ${input.TableName}`);
      return;
    }
    throw error;
  }
}

await createTable({
  TableName: process.env.WORKFLOWS_TABLE_NAME ?? 'Workflows',
  BillingMode: 'PAY_PER_REQUEST',
  AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
  KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
});

await createTable({
  TableName: process.env.EXECUTIONS_TABLE_NAME ?? 'Executions',
  BillingMode: 'PAY_PER_REQUEST',
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: 'S' },
    { AttributeName: 'workflowId', AttributeType: 'S' },
    { AttributeName: 'status', AttributeType: 'S' },
    { AttributeName: 'createdAt', AttributeType: 'S' },
  ],
  KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'byWorkflowId',
      KeySchema: [
        { AttributeName: 'workflowId', KeyType: 'HASH' },
        { AttributeName: 'createdAt', KeyType: 'RANGE' },
      ],
      Projection: { ProjectionType: 'ALL' },
    },
    {
      IndexName: 'byStatus',
      KeySchema: [
        { AttributeName: 'status', KeyType: 'HASH' },
        { AttributeName: 'createdAt', KeyType: 'RANGE' },
      ],
      Projection: { ProjectionType: 'ALL' },
    },
  ],
});
