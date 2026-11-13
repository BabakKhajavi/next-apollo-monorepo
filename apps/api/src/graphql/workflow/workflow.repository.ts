import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { Inject, Injectable } from '@nestjs/common';
import { DYNAMODB_DOCUMENT_CLIENT } from '../../dynamodb/dynamodb.module.js';
import { WORKFLOWS_TABLE } from '../../dynamodb/table-names.js';
import { Workflow } from './workflow.model.js';

export interface WorkflowPage {
  items: Workflow[];
  lastEvaluatedKey?: Record<string, unknown>;
}

// DynamoDB stores dates as ISO strings; the GraphQL model holds them as
// Date instances (GraphQLISODateTime's serializer expects a real Date).
function fromItem(item: Record<string, unknown>): Workflow {
  return {
    ...item,
    createdAt: new Date(item.createdAt as string),
    updatedAt: new Date(item.updatedAt as string),
  } as Workflow;
}

function toItem(workflow: Workflow): Record<string, unknown> {
  return {
    ...workflow,
    createdAt: workflow.createdAt.toISOString(),
    updatedAt: workflow.updatedAt.toISOString(),
  };
}

@Injectable()
export class WorkflowRepository {
  constructor(
    @Inject(DYNAMODB_DOCUMENT_CLIENT)
    private readonly client: DynamoDBDocumentClient,
  ) {}

  async put(workflow: Workflow): Promise<void> {
    await this.client.send(
      new PutCommand({ TableName: WORKFLOWS_TABLE, Item: toItem(workflow) }),
    );
  }

  async getById(id: string): Promise<Workflow | undefined> {
    const result = await this.client.send(
      new GetCommand({ TableName: WORKFLOWS_TABLE, Key: { id } }),
    );
    return result.Item ? fromItem(result.Item) : undefined;
  }

  // No GSI for "list all workflows": at single-tenant demo scale a Scan
  // with a page Limit is the pragmatic choice. Once auth/multi-tenancy
  // lands, add a GSI keyed on ownerId and query that instead.
  async list(
    limit: number,
    exclusiveStartKey?: Record<string, unknown>,
  ): Promise<WorkflowPage> {
    const result = await this.client.send(
      new ScanCommand({
        TableName: WORKFLOWS_TABLE,
        Limit: limit,
        ExclusiveStartKey: exclusiveStartKey,
      }),
    );
    return {
      items: (result.Items ?? []).map(fromItem),
      lastEvaluatedKey: result.LastEvaluatedKey,
    };
  }

  async update(
    id: string,
    patch: Partial<Pick<Workflow, 'name' | 'status' | 'definition'>>,
    updatedAt: Date,
  ): Promise<Workflow> {
    const names: Record<string, string> = { '#updatedAt': 'updatedAt' };
    const values: Record<string, unknown> = {
      ':updatedAt': updatedAt.toISOString(),
    };
    const sets = ['#updatedAt = :updatedAt'];

    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) continue;
      names[`#${key}`] = key;
      values[`:${key}`] = value;
      sets.push(`#${key} = :${key}`);
    }

    const result = await this.client.send(
      new UpdateCommand({
        TableName: WORKFLOWS_TABLE,
        Key: { id },
        UpdateExpression: `SET ${sets.join(', ')}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ReturnValues: 'ALL_NEW',
      }),
    );
    return fromItem(result.Attributes as Record<string, unknown>);
  }

  async delete(id: string): Promise<void> {
    await this.client.send(
      new DeleteCommand({ TableName: WORKFLOWS_TABLE, Key: { id } }),
    );
  }

  async count(): Promise<number> {
    const result = await this.client.send(
      new ScanCommand({ TableName: WORKFLOWS_TABLE, Select: 'COUNT' }),
    );
    return result.Count ?? 0;
  }
}
