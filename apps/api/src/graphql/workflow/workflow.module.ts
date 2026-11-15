import { Module } from '@nestjs/common';
import { WorkflowRepository } from './workflow.repository.js';
import { WorkflowResolver } from './workflow.resolver.js';
import { WorkflowService } from './workflow.service.js';

@Module({
  providers: [WorkflowResolver, WorkflowService, WorkflowRepository],
  exports: [WorkflowService, WorkflowRepository],
})
export class WorkflowModule {}
