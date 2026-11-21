// Opt-in local load fixture. Deterministic IDs make repeated runs idempotent.
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { BatchWriteCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const endpoint = process.env.DYNAMODB_ENDPOINT ?? 'http://localhost:8000';
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(endpoint)) throw new Error('Performance seed only supports local DynamoDB');
const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1', endpoint, credentials: { accessKeyId: 'local', secretAccessKey: 'local' } }));
const workflowTable = process.env.WORKFLOWS_TABLE_NAME ?? 'Workflows';
const executionTable = process.env.EXECUTIONS_TABLE_NAME ?? 'Executions';
const workflowCount = Number(process.env.PERF_WORKFLOWS ?? 1000);
const executionCount = Number(process.env.PERF_EXECUTIONS ?? 10000);
if (!Number.isInteger(workflowCount) || workflowCount < 1 || workflowCount > 5000 || !Number.isInteger(executionCount) || executionCount < 1 || executionCount > 100000) throw new Error('Invalid performance fixture size');
const names = ['Sync GitHub Issues', 'Process Leads', 'Send Daily Summary', 'Generate Report (AI)', 'Sync to CRM', 'Notify Incident Team', 'Import Customer Data'];
const now = Date.now();

async function write(table, items) {
  for (let offset = 0; offset < items.length; offset += 25) {
    let pending = { [table]: items.slice(offset, offset + 25).map((Item) => ({ PutRequest: { Item } })) };
    for (let attempt = 0; attempt < 7; attempt++) {
      const result = await client.send(new BatchWriteCommand({ RequestItems: pending }));
      pending = result.UnprocessedItems ?? {};
      if (!pending[table]?.length) break;
      await new Promise((resolve) => setTimeout(resolve, 50 * 2 ** attempt));
    }
    if (pending[table]?.length) throw new Error(`Unprocessed writes in ${table}`);
  }
}

const workflows = Array.from({ length: workflowCount }, (_, index) => {
  const date = new Date(now - ((index * 37) % 45) * 86_400_000).toISOString();
  return { id: `PERF-WF-${String(index + 1).padStart(5, '0')}`, name: `${names[index % names.length]} ${Math.floor(index / names.length) + 1}`, status: 'ACTIVE', definition: { trigger: 'SCHEDULE', actions: ['NOTIFY'] }, createdAt: date, updatedAt: date };
});
await write(workflowTable, workflows);
console.log(`Seeded ${workflowCount} workflows.`);

const statuses = ['SUCCEEDED', 'SUCCEEDED', 'SUCCEEDED', 'SUCCEEDED', 'FAILED', 'RUNNING', 'PENDING'];
const executions = Array.from({ length: executionCount }, (_, index) => {
  const start = now - ((index * 7_919_231) % (30 * 86_400_000));
  const end = start + (1000 + ((index * 7919) % 25000));
  const workflowIndex = index % 2 === 0 ? (Math.floor(index / 2) % Math.min(5, workflowCount)) : (5 + ((index * 37) % Math.max(1, workflowCount - 5))) % workflowCount;
  return { id: `PERF-EX-${String(index + 1).padStart(7, '0')}`, activityType: 'EXECUTION', workflowId: workflows[workflowIndex].id, status: statuses[index % statuses.length], createdAt: new Date(start).toISOString(), updatedAt: new Date(end).toISOString() };
});
await write(executionTable, executions);
console.log(`Seeded ${executionCount} executions.`);
