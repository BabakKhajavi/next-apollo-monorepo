// AWS-only dashboard fixture. Run with --write after reviewing the dry run.
// Fixed IDs keep repeated runs at the same record count. No SQS or AI calls.
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { BatchWriteCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const count = Number(process.argv[2] ?? 500);
const write = process.argv[3] === '--write';
if (!Number.isInteger(count) || count < 1 || count > 5000 || (process.argv[3] && !write)) {
  throw new Error('Usage: node scripts/seed-staging-executions.mjs [1..5000] [--write]');
}
if (process.env.DYNAMODB_ENDPOINT !== undefined) {
  throw new Error('Unset DYNAMODB_ENDPOINT: this script is for AWS DynamoDB only.');
}

const region = process.env.AWS_REGION ?? 'us-east-1';
const profile = process.env.AWS_PROFILE;
const workflowTable = process.env.WORKFLOWS_TABLE_NAME;
const executionTable = process.env.EXECUTIONS_TABLE_NAME;
if (!profile || !workflowTable || !executionTable) {
  throw new Error('Set AWS_PROFILE, WORKFLOWS_TABLE_NAME and EXECUTIONS_TABLE_NAME explicitly.');
}

const workflowCount = Math.min(25, count);
console.log(`Target: AWS profile ${profile}, ${region}, tables ${workflowTable} and ${executionTable}`);
console.log(`Fixture: ${workflowCount} workflows and ${count} executions; fixed IDs are overwritten on repeat runs.`);
if (!write) {
  console.log('Dry run only. Add --write to send records to AWS.');
  process.exit(0);
}

const client = new DynamoDBClient({ region });
for (const [name, indexes] of [
  [workflowTable, []],
  [executionTable, ['byRecent', 'byStatus', 'byWorkflowId']],
]) {
  const result = await client.send(new DescribeTableCommand({ TableName: name }));
  const active = new Set((result.Table?.GlobalSecondaryIndexes ?? [])
    .filter((index) => index.IndexStatus === 'ACTIVE')
    .map((index) => index.IndexName));
  for (const index of indexes) {
    if (!active.has(index)) throw new Error(`${name}: ${index} index is not ACTIVE`);
  }
}

const documentClient = DynamoDBDocumentClient.from(client);
async function batchWrite(table, items) {
  for (let offset = 0; offset < items.length; offset += 25) {
    let pending = { [table]: items.slice(offset, offset + 25).map((Item) => ({ PutRequest: { Item } })) };
    for (let attempt = 0; attempt < 8; attempt++) {
      const result = await documentClient.send(new BatchWriteCommand({ RequestItems: pending }));
      pending = result.UnprocessedItems ?? {};
      if (!pending[table]?.length) break;
      await new Promise((resolve) => setTimeout(resolve, 100 * 2 ** attempt));
    }
    if (pending[table]?.length) throw new Error(`Unprocessed writes remain in ${table}`);
  }
}

const now = Date.now();
const names = ['Sync GitHub Issues', 'Process Leads', 'Send Daily Summary', 'Generate Report', 'Sync to CRM'];
const workflows = Array.from({ length: workflowCount }, (_, index) => {
  const createdAt = new Date(now - index * 60_000).toISOString();
  return {
    id: `STAGING-FIXTURE-WF-${String(index + 1).padStart(3, '0')}`,
    name: `${names[index % names.length]} ${Math.floor(index / names.length) + 1}`,
    status: 'ACTIVE',
    definition: { trigger: 'SCHEDULE', actions: ['NOTIFY'] },
    createdAt,
    updatedAt: createdAt,
  };
});
await batchWrite(workflowTable, workflows);
console.log(`Wrote ${workflowCount} workflows.`);

const statuses = ['SUCCEEDED', 'SUCCEEDED', 'SUCCEEDED', 'SUCCEEDED', 'FAILED', 'RUNNING', 'PENDING'];
const executions = Array.from({ length: count }, (_, index) => {
  const started = now - ((index * 7919) % (29 * 86_400_000));
  const createdAt = new Date(started).toISOString();
  const status = statuses[index % statuses.length];
  return {
    id: `STAGING-FIXTURE-EX-${String(index + 1).padStart(5, '0')}`,
    activityType: 'EXECUTION',
    workflowId: workflows[index % workflowCount].id,
    status,
    createdAt,
    updatedAt: new Date(started + (status === 'PENDING' ? 0 : 1000 + index % 20_000)).toISOString(),
  };
});
await batchWrite(executionTable, executions);
console.log(`Wrote ${count} executions. Refresh the staging dashboard.`);
