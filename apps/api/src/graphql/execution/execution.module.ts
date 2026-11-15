import { Module } from '@nestjs/common';
import { WorkflowModule } from '../workflow/workflow.module.js';
import { ExecutionRepository } from './execution.repository.js';
import { ExecutionResolver } from './execution.resolver.js';
import { ExecutionService } from './execution.service.js';

@Module({
  imports: [WorkflowModule],
  providers: [ExecutionResolver, ExecutionService, ExecutionRepository],
  exports: [ExecutionService, ExecutionRepository],
})
export class ExecutionModule {}
