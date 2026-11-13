import { Injectable, NotFoundException } from '@nestjs/common';
import { decodeCursor, encodeCursor } from '../../common/cursor.util.js';
import { Execution } from './execution.model.js';
import { ExecutionRepository } from './execution.repository.js';

export interface ExecutionConnection {
  items: Execution[];
  nextCursor?: string;
}

@Injectable()
export class ExecutionService {
  constructor(private readonly repository: ExecutionRepository) {}

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
