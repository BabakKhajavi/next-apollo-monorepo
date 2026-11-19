// Stress-test seed for the /workflows list page (heavy-DOM Web Vitals
// testing) — writes directly to DynamoDB via BatchWriteItem, bypassing
// the GraphQL mutation/SQS/ai-worker path entirely so this doesn't fire
// 1000 real OpenAI calls. Targets real AWS by default; point it at
// DynamoDB Local with DYNAMODB_ENDPOINT if needed.
//
// Usage: AWS_PROFILE=zaplite-dev WORKFLOWS_TABLE_NAME=nam-workflows \
//        node apps/api/scripts/seed-bulk.mjs [count]

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { ulid } from 'ulid';

const client = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    region: process.env.AWS_REGION ?? 'us-east-1',
    ...(process.env.DYNAMODB_ENDPOINT
      ? {
          endpoint: process.env.DYNAMODB_ENDPOINT,
          credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
        }
      : {}),
  }),
);

const WORKFLOWS_TABLE = process.env.WORKFLOWS_TABLE_NAME ?? 'Workflows';
const COUNT = Number(process.argv[2] ?? 1000);
const BATCH_SIZE = 25; // DynamoDB BatchWriteItem's hard limit

const STATUSES = ['ACTIVE', 'DRAFT', 'GENERATING', 'GENERATION_FAILED'];
const PROMPTS = [
  'Send me a daily email summary of new GitHub issues',
  'Notify the team on deploy failure',
  'Post weekly digest to Slack',
  'Sync new leads to the CRM every hour',
  'Alert on-call when error rate exceeds threshold',
];

const now = Date.now();
const isoMinutesAgo = (minutes) => new Date(now - minutes * 60_000).toISOString();

function makeWorkflow(i) {
  const status = STATUSES[i % STATUSES.length];
  const prompt = PROMPTS[i % PROMPTS.length];
  const createdAt = isoMinutesAgo(COUNT - i);
  return {
    id: ulid(),
    name: `${prompt} (#${i})`,
    status,
    definition:
      status === 'ACTIVE' || status === 'DRAFT'
        ? {
            trigger: { type: 'schedule', config: { time: '09:00' } },
            actions: [{ type: 'sendEmail', config: { to: 'team@example.com' } }],
          }
        : {},
    createdAt,
    updatedAt: createdAt,
  };
}

async function main() {
  const items = Array.from({ length: COUNT }, (_, i) => makeWorkflow(i));

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    let requestItems = {
      [WORKFLOWS_TABLE]: batch.map((Item) => ({ PutRequest: { Item } })),
    };

    // PAY_PER_REQUEST can still throttle under a 1000-item burst —
    // BatchWriteItem reports throttled writes as UnprocessedItems instead
    // of throwing, so retry those rather than silently losing rows.
    while (requestItems[WORKFLOWS_TABLE]?.length) {
      const result = await client.send(new BatchWriteCommand({ RequestItems: requestItems }));
      requestItems = result.UnprocessedItems ?? {};
    }
    process.stdout.write(`\rSeeded ${Math.min(i + BATCH_SIZE, items.length)}/${items.length}`);
  }

  console.log(`\nDone — ${items.length} workflows written to ${WORKFLOWS_TABLE}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
