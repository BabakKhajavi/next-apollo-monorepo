import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { ulid } from 'ulid';

const client = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    region: process.env.AWS_REGION ?? 'us-east-1',
    endpoint: process.env.DYNAMODB_ENDPOINT ?? 'http://localhost:8000',
    credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
  }),
);

const WORKFLOWS_TABLE = process.env.WORKFLOWS_TABLE_NAME ?? 'Workflows';
const EXECUTIONS_TABLE = process.env.EXECUTIONS_TABLE_NAME ?? 'Executions';

const now = Date.now();
const isoMinutesAgo = (minutes) =>
  new Date(now - minutes * 60_000).toISOString();

const workflows = [
  {
    id: ulid(),
    name: 'Summarize new support tickets',
    status: 'ACTIVE',
    definition: { trigger: 'NEW_TICKET', actions: ['AI_SUMMARIZE'] },
    createdAt: isoMinutesAgo(120),
    updatedAt: isoMinutesAgo(90),
  },
  {
    id: ulid(),
    name: 'Notify team on deploy failure',
    status: 'ACTIVE',
    definition: { trigger: 'DEPLOY_FAILED', actions: ['NOTIFY_TEAM'] },
    createdAt: isoMinutesAgo(60),
    updatedAt: isoMinutesAgo(60),
  },
  {
    id: ulid(),
    name: 'Weekly digest draft',
    status: 'DRAFT',
    definition: { trigger: 'SCHEDULE_WEEKLY', actions: ['AI_SUMMARIZE'] },
    createdAt: isoMinutesAgo(10),
    updatedAt: isoMinutesAgo(10),
  },
];

for (const workflow of workflows) {
  await client.send(
    new PutCommand({ TableName: WORKFLOWS_TABLE, Item: workflow }),
  );
}

const executions = [
  {
    id: ulid(),
    workflowId: workflows[0].id,
    status: 'SUCCEEDED',
    createdAt: isoMinutesAgo(85),
    updatedAt: isoMinutesAgo(84),
  },
  {
    id: ulid(),
    workflowId: workflows[0].id,
    status: 'FAILED',
    error: 'Upstream AI provider timeout',
    createdAt: isoMinutesAgo(40),
    updatedAt: isoMinutesAgo(40),
  },
  {
    id: ulid(),
    workflowId: workflows[1].id,
    status: 'RUNNING',
    createdAt: isoMinutesAgo(2),
    updatedAt: isoMinutesAgo(2),
  },
];

for (const execution of executions) {
  await client.send(
    new PutCommand({ TableName: EXECUTIONS_TABLE, Item: execution }),
  );
}

console.log(
  `Seeded ${workflows.length} workflows and ${executions.length} executions.`,
);
