import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ulid } from 'ulid';
import { decodeCursor, encodeCursor } from '../../common/cursor.util.js';
import { WORKFLOW_EXECUTION_QUEUE_URL } from '../../sqs/queue-names.js';
import { SqsService } from '../../sqs/sqs.service.js';
import { WorkflowStatus } from '../workflow/workflow-status.enum.js';
import { WorkflowService } from '../workflow/workflow.service.js';
import { Execution } from './execution.model.js';
import { ExecutionRepository } from './execution.repository.js';
import { ExecutionStatus } from './execution-status.enum.js';

export interface ExecutionConnection {
  items: Execution[];
  nextCursor?: string;
}

@Injectable()
export class ExecutionService {
  constructor(
    private readonly repository: ExecutionRepository,
    private readonly workflowService: WorkflowService,
    private readonly sqsService: SqsService,
  ) {}

  // Returns immediately with a PENDING row; the execution worker
  // (apps/execution-worker) runs the workflow's actions asynchronously
  // and pushes status updates via AppSync Events — same async shape as
  // WorkflowService.generateFromPrompt in Phase 3.
  async execute(workflowId: string): Promise<Execution> {
    const workflow = await this.workflowService.findById(workflowId);
    if (workflow.status !== WorkflowStatus.ACTIVE) {
      throw new BadRequestException(
        `Workflow ${workflowId} is not ACTIVE (status: ${workflow.status})`,
      );
    }

    const now = new Date();
    const execution: Execution = {
      id: ulid(),
      workflowId,
      status: ExecutionStatus.PENDING,
      createdAt: now,
      updatedAt: now,
    };
    await this.repository.put(execution);
    // workflow.definition is the GraphQL JSON scalar (unknown at the type
    // level) but is written exclusively via ai-worker's WorkflowDefinitionSchema
    // (Phase 3), so `actions` is safe to assume here.
    const definition = workflow.definition as { actions?: unknown[] };
    await this.sqsService.sendMessage(WORKFLOW_EXECUTION_QUEUE_URL, {
      executionId: execution.id,
      workflowId,
      actions: definition.actions ?? [],
    });
    return execution;
  }

  async findById(id: string): Promise<Execution> {
    const execution = await this.repository.getById(id);
    if (!execution) {
      throw new NotFoundException(`Execution ${id} not found`);
    }
    return execution;
  }

  async listByWorkflowId(
    workflowId: string,
    first: number,
    after?: string,
  ): Promise<ExecutionConnection> {
    const page = await this.repository.listByWorkflowId(
      workflowId,
      first,
      decodeCursor(after),
    );
    return {
      items: page.items,
      nextCursor: encodeCursor(page.lastEvaluatedKey),
    };
  }
}
