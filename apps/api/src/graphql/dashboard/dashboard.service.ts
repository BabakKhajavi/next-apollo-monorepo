import { BadRequestException, Injectable } from '@nestjs/common';
import { decodeCursor, encodeCursor } from '../../common/cursor.util.js';
import { ExecutionStatus } from '../execution/execution-status.enum.js';
import { ExecutionRepository } from '../execution/execution.repository.js';
import { WorkflowRepository } from '../workflow/workflow.repository.js';
import {
  DashboardAnalytics,
  ExecutionTrendPoint,
  WorkflowPerformanceRow,
} from './dashboard-analytics.model.js';
import { DashboardStats } from './dashboard-stats.model.js';

function sinceDate(days: number): string {
  if (!Number.isInteger(days) || days < 1 || days > 90)
    throw new BadRequestException('days must be between 1 and 90');
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - days + 1);
  return date.toISOString();
}

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

  async getAnalytics(days: number): Promise<DashboardAnalytics> {
    const since = sinceDate(days);
    const rows = await this.executionRepository.summarizeSince(since);
    const daily = new Map<string, ExecutionTrendPoint>();
    for (let index = 0; index < days; index++) {
      const day = new Date(since);
      day.setUTCDate(day.getUTCDate() + index);
      const date = day.toISOString().slice(0, 10);
      daily.set(date, { date, total: 0, succeeded: 0, failed: 0 });
    }
    const byWorkflow = new Map<string, number>();
    for (const row of rows) {
      const point = daily.get(row.createdAt.slice(0, 10));
      if (point) {
        point.total++;
        if (row.status === ExecutionStatus.SUCCEEDED) point.succeeded++;
        if (row.status === ExecutionStatus.FAILED) point.failed++;
      }
      byWorkflow.set(row.workflowId, (byWorkflow.get(row.workflowId) ?? 0) + 1);
    }
    const top = [...byWorkflow.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const names = await this.workflowRepository.getNames(top.map(([id]) => id));
    const topWorkflows: WorkflowPerformanceRow[] = top.map(([workflowId, executions]) => ({
      workflowId,
      name: names.get(workflowId) ?? `Workflow ${workflowId.slice(0, 8)}`,
      executions,
    }));
    return { trend: [...daily.values()], topWorkflows };
  }

  async getRecentExecutions(
    first: number,
    days: number,
    after?: string,
    status?: ExecutionStatus,
    workflowId?: string,
  ) {
    if (!Number.isInteger(first) || first < 1 || first > 50)
      throw new BadRequestException('first must be between 1 and 50');
    const page = await this.executionRepository.listRecent(
      first,
      sinceDate(days),
      status,
      workflowId,
      decodeCursor(after),
    );
    const names = await this.workflowRepository.getNames(page.items.map((item) => item.workflowId));
    return {
      items: page.items.map((item) => ({
        id: item.id,
        workflowId: item.workflowId,
        workflowName: names.get(item.workflowId) ?? `Workflow ${item.workflowId.slice(0, 8)}`,
        status: item.status,
        error: item.error,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      nextCursor: encodeCursor(page.lastEvaluatedKey),
    };
  }
}
