import { Injectable } from '@nestjs/common';
import { ExecutionStatus } from '../execution/execution-status.enum.js';
import { ExecutionRepository } from '../execution/execution.repository.js';
import { WorkflowRepository } from '../workflow/workflow.repository.js';
import { DashboardStats } from './dashboard-stats.model.js';

@Injectable()
export class DashboardService {
  constructor(
    private readonly workflowRepository: WorkflowRepository,
    private readonly executionRepository: ExecutionRepository,
  ) {}

  async getStats(): Promise<DashboardStats> {
    const [totalWorkflows, executionsByStatus] = await Promise.all([
      this.workflowRepository.count(),
      Promise.all(
        Object.values(ExecutionStatus).map(async (status) => ({
          status,
          count: await this.executionRepository.countByStatus(status),
        })),
      ),
    ]);

    return {
      totalWorkflows,
      totalExecutions: executionsByStatus.reduce(
        (sum, entry) => sum + entry.count,
        0,
      ),
      executionsByStatus,
    };
  }
}
