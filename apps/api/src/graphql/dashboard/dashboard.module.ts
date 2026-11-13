import { Module } from '@nestjs/common';
import { ExecutionModule } from '../execution/execution.module.js';
import { WorkflowModule } from '../workflow/workflow.module.js';
import { DashboardResolver } from './dashboard.resolver.js';
import { DashboardService } from './dashboard.service.js';

@Module({
  imports: [WorkflowModule, ExecutionModule],
  providers: [DashboardResolver, DashboardService],
})
export class DashboardModule {}
