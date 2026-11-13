import { Injectable, NotFoundException } from '@nestjs/common';
import { ulid } from 'ulid';
import { decodeCursor, encodeCursor } from '../../common/cursor.util.js';
import { WORKFLOW_GENERATION_QUEUE_URL } from '../../sqs/queue-names.js';
import { SqsService } from '../../sqs/sqs.service.js';
import { CreateWorkflowInput } from './create-workflow.input.js';
import { WorkflowStatus } from './workflow-status.enum.js';
import { Workflow } from './workflow.model.js';
import { WorkflowRepository } from './workflow.repository.js';

export interface WorkflowConnection {
  items: Workflow[];
  nextCursor?: string;
}

@Injectable()
export class WorkflowService {
  constructor(
    private readonly repository: WorkflowRepository,
    private readonly sqsService: SqsService,
  ) {}

  // Returns immediately with a GENERATING placeholder; the AI worker (SQS
  // consumer, apps/ai-worker) fills in the real definition asynchronously
  // and the client picks up the result via an AppSync Events subscription
  // rather than polling this mutation's response.
  async generateFromPrompt(prompt: string): Promise<Workflow> {
    const now = new Date();
    const workflow: Workflow = {
      id: ulid(),
      name: prompt.slice(0, 80),
      definition: {},
      status: WorkflowStatus.GENERATING,
      createdAt: now,
      updatedAt: now,
    };
    await this.repository.put(workflow);
    await this.sqsService.sendMessage(WORKFLOW_GENERATION_QUEUE_URL, {
      workflowId: workflow.id,
      prompt,
    });
    return workflow;
  }

  async create(input: CreateWorkflowInput): Promise<Workflow> {
    const now = new Date();
    const workflow: Workflow = {
      id: ulid(),
      name: input.name,
      definition: input.definition,
      status: WorkflowStatus.DRAFT,
      createdAt: now,
      updatedAt: now,
    };
    await this.repository.put(workflow);
    return workflow;
  }

  async findById(id: string): Promise<Workflow> {
    const workflow = await this.repository.getById(id);
    if (!workflow) {
      throw new NotFoundException(`Workflow ${id} not found`);
    }
    return workflow;
  }

  async list(first: number, after?: string): Promise<WorkflowConnection> {
    const page = await this.repository.list(first, decodeCursor(after));
    return {
      items: page.items,
      nextCursor: encodeCursor(page.lastEvaluatedKey),
    };
  }

  async updateStatus(id: string, status: WorkflowStatus): Promise<Workflow> {
    await this.findById(id); // 404s if missing before attempting the update
    return this.repository.update(id, { status }, new Date());
  }

  async delete(id: string): Promise<boolean> {
    await this.findById(id);
    await this.repository.delete(id);
    return true;
  }
}
