import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { ExecutionPage } from '../execution/execution.resolver.js';
import { ExecutionStatus } from '../execution/execution-status.enum.js';
import { DashboardAnalytics } from './dashboard-analytics.model.js';
import { DashboardStats } from './dashboard-stats.model.js';
import { DashboardService } from './dashboard.service.js';

@Resolver()
export class DashboardResolver {
  constructor(private readonly dashboardService: DashboardService) {}

  @Query(() => DashboardStats)
  dashboardStats(): Promise<DashboardStats> {
    return this.dashboardService.getStats();
  }

  @Query(() => DashboardAnalytics)
  dashboardAnalytics(
    @Args('days', { type: () => Int, defaultValue: 30 }) days: number,
  ): Promise<DashboardAnalytics> {
    return this.dashboardService.getAnalytics(days);
  }

  @Query(() => ExecutionPage)
  recentExecutions(
    @Args('first', { type: () => Int, defaultValue: 20 }) first: number,
    @Args('days', { type: () => Int, defaultValue: 30 }) days: number,
    @Args('after', { type: () => String, nullable: true }) after?: string,
    @Args('status', { type: () => ExecutionStatus, nullable: true })
    status?: ExecutionStatus,
    @Args('workflowId', { type: () => String, nullable: true })
    workflowId?: string,
  ) {
    return this.dashboardService.getRecentExecutions(
      first,
      days,
      after,
      status,
      workflowId,
    );
  }
}
