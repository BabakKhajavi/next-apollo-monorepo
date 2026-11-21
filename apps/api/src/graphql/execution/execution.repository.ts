import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { Inject, Injectable } from '@nestjs/common';
import { DYNAMODB_DOCUMENT_CLIENT } from '../../dynamodb/dynamodb.module.js';
import {
  EXECUTIONS_BY_STATUS_INDEX,
  EXECUTIONS_BY_RECENT_INDEX,
  EXECUTIONS_BY_WORKFLOW_INDEX,
  EXECUTIONS_TABLE,
} from '../../dynamodb/table-names.js';
import { ExecutionStatus } from './execution-status.enum.js';
import { Execution } from './execution.model.js';

export interface ExecutionPage {
  items: Execution[];
  lastEvaluatedKey?: Record<string, unknown>;
}

export interface ExecutionSummaryRow {
  workflowId: string;
  status: ExecutionStatus;
  createdAt: string;
}

// DynamoDB stores dates as ISO strings; the GraphQL model holds them as
// Date instances (GraphQLISODateTime's serializer expects a real Date).
function fromItem(item: Record<string, unknown>): Execution {
  return {
    ...item,
    createdAt: new Date(item.createdAt as string),
    updatedAt: new Date(item.updatedAt as string),
  } as Execution;
}

function toItem(execution: Execution): Record<string, unknown> {
  return {
    ...execution,
    createdAt: execution.createdAt.toISOString(),
    updatedAt: execution.updatedAt.toISOString(),
  };
}

@Injectable()
export class ExecutionRepository {
  constructor(
    @Inject(DYNAMODB_DOCUMENT_CLIENT)
    private readonly client: DynamoDBDocumentClient,
  ) {}

  // Only a write path for the initial PENDING row — the execution worker
  // (apps/execution-worker) owns status transitions via its own
  // self-contained repository, same as apps/ai-worker does for Workflows.
  async put(execution: Execution): Promise<void> {
    await this.client.send(
      new PutCommand({ TableName: EXECUTIONS_TABLE, Item: toItem(execution) }),
    );
  }

  async getById(id: string): Promise<Execution | undefined> {
    const result = await this.client.send(
      new GetCommand({ TableName: EXECUTIONS_TABLE, Key: { id } }),
    );
    return result.Item ? fromItem(result.Item) : undefined;
  }

  // GSI1 (byWorkflowId): PK workflowId, SK createdAt — the real access
  // pattern ("executions for this workflow, newest first"), no Scan.
  async listByWorkflowId(
    workflowId: string,
    limit: number,
    exclusiveStartKey?: Record<string, unknown>,
  ): Promise<ExecutionPage> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: EXECUTIONS_TABLE,
        IndexName: EXECUTIONS_BY_WORKFLOW_INDEX,
        KeyConditionExpression: 'workflowId = :workflowId',
        ExpressionAttributeValues: { ':workflowId': workflowId },
        ScanIndexForward: false,
        Limit: limit,
        ExclusiveStartKey: exclusiveStartKey,
      }),
    );
    return {
      items: (result.Items ?? []).map(fromItem),
      lastEvaluatedKey: result.LastEvaluatedKey,
    };
  }

  // GSI2 (byStatus): PK status, SK createdAt — lets the dashboard count
  // executions per status without scanning the whole table.
  async countByStatus(status: ExecutionStatus): Promise<number> {
    let total = 0;
    let key: Record<string, unknown> | undefined;
    do {
      const result = await this.client.send(
        new QueryCommand({
          TableName: EXECUTIONS_TABLE,
          IndexName: EXECUTIONS_BY_STATUS_INDEX,
          KeyConditionExpression: '#status = :status',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: { ':status': status },
          Select: 'COUNT',
          ExclusiveStartKey: key,
        }),
      );
      total += result.Count ?? 0;
      key = result.LastEvaluatedKey;
    } while (key);
    return total;
  }

  async listRecent(
    limit: number,
    since: string,
    status?: ExecutionStatus,
    workflowId?: string,
    exclusiveStartKey?: Record<string, unknown>,
  ): Promise<ExecutionPage> {
    const indexName = workflowId
      ? EXECUTIONS_BY_WORKFLOW_INDEX
      : status
        ? EXECUTIONS_BY_STATUS_INDEX
        : EXECUTIONS_BY_RECENT_INDEX;
    const partitionName = workflowId
      ? 'workflowId'
      : status
        ? 'status'
        : 'activityType';
    const partitionValue = workflowId ?? status ?? 'EXECUTION';
    const result = await this.client.send(
      new QueryCommand({
        TableName: EXECUTIONS_TABLE,
        IndexName: indexName,
        KeyConditionExpression:
          '#partition = :partition AND createdAt >= :since',
        ExpressionAttributeNames: { '#partition': partitionName },
        ExpressionAttributeValues: {
          ':partition': partitionValue,
          ':since': since,
        },
        ...(workflowId && status
          ? {
              FilterExpression: '#status = :status',
              ExpressionAttributeNames: {
                '#partition': partitionName,
                '#status': 'status',
              },
              ExpressionAttributeValues: {
                ':partition': partitionValue,
                ':since': since,
                ':status': status,
              },
            }
          : {}),
        ScanIndexForward: false,
        Limit: limit,
        ExclusiveStartKey: exclusiveStartKey,
      }),
    );
    return {
      items: (result.Items ?? []).map(fromItem),
      lastEvaluatedKey: result.LastEvaluatedKey,
    };
  }

  async summarizeSince(since: string): Promise<ExecutionSummaryRow[]> {
    const results = await Promise.all(
      Object.values(ExecutionStatus).map(async (status) => {
        const rows: ExecutionSummaryRow[] = [];
        let key: Record<string, unknown> | undefined;
        do {
          const result = await this.client.send(
            new QueryCommand({
              TableName: EXECUTIONS_TABLE,
              IndexName: EXECUTIONS_BY_STATUS_INDEX,
              KeyConditionExpression:
                '#status = :status AND createdAt >= :since',
              ExpressionAttributeNames: { '#status': 'status' },
              ExpressionAttributeValues: { ':status': status, ':since': since },
              ProjectionExpression: 'workflowId, createdAt',
              ExclusiveStartKey: key,
            }),
          );
          for (const item of result.Items ?? [])
            rows.push({
              workflowId: item.workflowId as string,
              createdAt: item.createdAt as string,
              status,
            });
          key = result.LastEvaluatedKey;
        } while (key);
        return rows;
      }),
    );
    return results.flat();
  }
}
