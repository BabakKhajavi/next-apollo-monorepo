import { vi } from 'vitest';
import { DashboardService } from './dashboard.service.js';
import { ExecutionStatus } from '../execution/execution-status.enum.js';
import type { ExecutionRepository } from '../execution/execution.repository.js';
import type { WorkflowRepository } from '../workflow/workflow.repository.js';

function makeService() {
  const workflows = {
    count: vi.fn().mockResolvedValue(1000),
    getById: vi
      .fn()
      .mockImplementation(async (id: string) => ({ id, name: `Name ${id}` })),
    getNames: vi.fn().mockImplementation(async (ids: string[]) => new Map(ids.map((id) => [id, `Name ${id}`]))),
  };
  const executions = {
    countByStatus: vi
      .fn()
      .mockImplementation(async (status: ExecutionStatus) =>
        status === ExecutionStatus.SUCCEEDED ? 8000 : 500,
      ),
    summarizeSince: vi.fn(),
    listRecent: vi.fn(),
  };
  return {
    service: new DashboardService(
      workflows as unknown as WorkflowRepository,
      executions as unknown as ExecutionRepository,
    ),
    workflows,
    executions,
  };
}

describe('DashboardService', () => {
  it('aggregates all status counts into accurate totals', async () => {
    const { service } = makeService();
    const result = await service.getStats();
    expect(result.totalWorkflows).toBe(1000);
    expect(result.totalExecutions).toBe(9500);
    expect(result.executionsByStatus).toHaveLength(4);
  });

  it('builds daily trend and top workflow from execution rows', async () => {
    const { service, executions } = makeService();
    const today = new Date().toISOString();
    executions.summarizeSince.mockResolvedValue([
      { workflowId: 'a', status: ExecutionStatus.SUCCEEDED, createdAt: today },
      { workflowId: 'a', status: ExecutionStatus.FAILED, createdAt: today },
      { workflowId: 'b', status: ExecutionStatus.SUCCEEDED, createdAt: today },
    ]);
    const result = await service.getAnalytics(7);
    expect(result.trend).toHaveLength(7);
    expect(result.trend.at(-1)).toMatchObject({
      total: 3,
      succeeded: 2,
      failed: 1,
    });
    expect(result.topWorkflows[0]).toMatchObject({
      workflowId: 'a',
      executions: 2,
    });
  });

  it('rejects unbounded dashboard requests', async () => {
    const { service } = makeService();
    await expect(service.getAnalytics(365)).rejects.toThrow(
      'days must be between 1 and 90',
    );
    await expect(service.getRecentExecutions(1000, 30)).rejects.toThrow(
      'first must be between 1 and 50',
    );
  });
});
