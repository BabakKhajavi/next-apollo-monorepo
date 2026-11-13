import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { Inject, Injectable } from '@nestjs/common';
import { DYNAMODB_DOCUMENT_CLIENT } from '../../dynamodb/dynamodb.module.js';
import {
  EXECUTIONS_BY_STATUS_INDEX,
  EXECUTIONS_BY_WORKFLOW_INDEX,
  EXECUTIONS_TABLE,
} from '../../dynamodb/table-names.js';
import { ExecutionStatus } from './execution-status.enum.js';
import { Execution } from './execution.model.js';

export interface ExecutionPage {
  items: Execution[];
  lastEvaluatedKey?: Record<string, unknown>;
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

@Injectable()
export class ExecutionRepository {
  constructor(
    @Inject(DYNAMODB_DOCUMENT_CLIENT)
    private readonly client: DynamoDBDocumentClient,
  ) {}

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
    const result = await this.client.send(
      new QueryCommand({
        TableName: EXECUTIONS_TABLE,
        IndexName: EXECUTIONS_BY_STATUS_INDEX,
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':status': status },
        Select: 'COUNT',
      }),
    );
    return result.Count ?? 0;
  }
}
