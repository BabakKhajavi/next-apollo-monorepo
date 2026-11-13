import { Query, Resolver } from '@nestjs/graphql';
import { DashboardStats } from './dashboard-stats.model.js';
import { DashboardService } from './dashboard.service.js';

@Resolver()
export class DashboardResolver {
  constructor(private readonly dashboardService: DashboardService) {}

  @Query(() => DashboardStats)
  dashboardStats(): Promise<DashboardStats> {
    return this.dashboardService.getStats();
  }
}
