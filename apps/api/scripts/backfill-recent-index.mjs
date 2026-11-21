// Run after the byRecent GSI exists. Defaults to DynamoDB Local.
// For AWS, set DYNAMODB_ENDPOINT= (empty), AWS_REGION and AWS credentials.
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const endpoint = process.env.DYNAMODB_ENDPOINT === '' ? undefined : process.env.DYNAMODB_ENDPOINT ?? 'http://localhost:8000';
const client = DynamoDBDocumentClient.from(new DynamoDBClient({
  region: process.env.AWS_REGION ?? 'us-east-1',
  endpoint,
  ...(endpoint ? { credentials: { accessKeyId: 'local', secretAccessKey: 'local' } } : {}),
}));
const TableName = process.env.EXECUTIONS_TABLE_NAME ?? 'Executions';
let key;
let updated = 0;
do {
  const page = await client.send(new ScanCommand({ TableName, ProjectionExpression: 'id, activityType', ExclusiveStartKey: key }));
  for (const item of page.Items ?? []) {
    if (item.activityType) continue;
    await client.send(new UpdateCommand({
      TableName,
      Key: { id: item.id },
      UpdateExpression: 'SET activityType = :type',
      ConditionExpression: 'attribute_not_exists(activityType)',
      ExpressionAttributeValues: { ':type': 'EXECUTION' },
    }));
    updated++;
  }
  key = page.LastEvaluatedKey;
} while (key);
console.log(`Backfilled ${updated} execution records in ${TableName}.`);
